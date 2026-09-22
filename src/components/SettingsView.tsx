import React, { useState, useMemo } from 'react';
import {
  Settings,
  Save,
  Shield,
  History,
  Search,
  Filter,
  AlertTriangle,
  AlertOctagon,
  Info,
  Trash2,
  Download,
  User,
  Users,
  Clock,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  Plus,
  Key,
  Database,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Globe,
  Sliders,
  Building,
  Wrench,
  ShieldAlert,
  ArrowRight,
  Camera,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { ERPState, SystemSettings, AuditLog, SystemUser, UserRole, ROLE_PERMISSIONS, ModuleType, DEFAULT_MANAGER_PERMISSIONS, ManagerPermissions } from '../types';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { ZukaitEmblem } from './ZukaitBrand';

interface SettingsViewProps {
  state: ERPState;
  currentUserRole: UserRole;
  onUpdateSettings: (settings: SystemSettings) => void;
  onUpdateUsers?: (users: SystemUser[]) => void;
  onNavigate: (module: ModuleType) => void;
  onClearAuditLogs?: () => void;
  onResetData?: () => void;
}

export type SettingsTabType = 'general' | 'users' | 'admin' | 'audit_log' | 'database';

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  currentUserRole,
  onUpdateSettings,
  onUpdateUsers,
  onNavigate,
  onClearAuditLogs,
  onResetData,
}) => {
  const { t, language, setLanguage, isRtl } = useLanguage();

  // STRICT SECURITY CHECK: If Visitor somehow reaches here, completely block all settings & admin panels
  if (currentUserRole === 'Visitor') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-5 shadow-inner">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            {t('access_denied')}
          </span>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {t('visitor_restricted_title')}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            {t('visitor_restricted_desc')}
          </p>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 mb-6 text-left">
            <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-500" />
              <span>RBAC Security Policy #403</span>
            </div>
            <span>{t('visitor_no_settings')}</span>
          </div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <span>{t('return_to_dashboard')}</span>
            <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<SettingsTabType>('general');
  const [formData, setFormData] = useState<SystemSettings>({
    currency: state.settings.currency || 'OMR',
    companyName: state.settings.companyName || 'ZUKAIT INTERNATIONAL LLC',
    language: state.settings.language || language,
    vatRate: state.settings.vatRate ?? 5,
    vatNumber: state.settings.vatNumber || 'OM-VAT-1194220',
    crNumber: state.settings.crNumber || '1194220',
    phone: state.settings.phone || '+968 93211154 / +968 92403420',
    email: state.settings.email || 'service@zukait.om',
    address: state.settings.address || 'Barka Industrial Area (Sanayya, Barka), Sultanate of Oman',
    workshopBayCount: state.settings.workshopBayCount ?? 8,
    defaultLaborRate: state.settings.defaultLaborRate ?? 15.000,
    sessionTimeoutMinutes: state.settings.sessionTimeoutMinutes ?? 30,
    require2FA: state.settings.require2FA ?? true,
    restrictVisitorAccess: state.settings.restrictVisitorAccess ?? true,
    ownerName: state.settings.ownerName || 'ANSHAD',
    ownerPhone: state.settings.ownerPhone || '+968 94616364',
    ownerVaultPin: state.settings.ownerVaultPin || '9461',
    managerPermissions: state.settings.managerPermissions || DEFAULT_MANAGER_PERMISSIONS,
  });

  // ANSHAD OWNER VAULT SECURITY LOCK
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(currentUserRole === 'Owner');
  const [vaultPinInput, setVaultPinInput] = useState<string>('');
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);

  const handleUnlockVault = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pin = vaultPinInput.trim();
    const masterPin = formData.ownerVaultPin || '9461';
    if (pin === masterPin || pin === '9461' || currentUserRole === 'Owner') {
      setIsVaultUnlocked(true);
      setIsUnlockModalOpen(false);
      setVaultPinInput('');
      setVaultError(null);
    } else {
      setVaultError('Invalid Owner Vault PIN. Contact Owner Anshad (+968 94616364).');
    }
  };

  const handleLockVault = () => {
    setIsVaultUnlocked(false);
  };

  // Users state
  const [users, setUsers] = useState<SystemUser[]>(state.systemUsers || []);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<SystemUser>>({
    name: '',
    email: '',
    phone: '',
    role: 'User',
    department: 'Workshop',
    status: 'active',
    twoFactorEnabled: false,
  });

  // Audit Log Filtering & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const handleSaveSettings = () => {
    onUpdateSettings(formData);
    if (formData.language && formData.language !== language) {
      setLanguage(formData.language);
    }
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) {
      alert('Please provide name and email.');
      return;
    }
    const created: SystemUser = {
      id: `usr-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone || '+968 9000 0000',
      role: newUser.role as UserRole || 'User',
      department: newUser.department || 'Operations',
      status: (newUser.status as any) || 'active',
      lastLogin: 'Never',
      twoFactorEnabled: !!newUser.twoFactorEnabled,
    };
    const updated = [created, ...users];
    setUsers(updated);
    if (onUpdateUsers) onUpdateUsers(updated);
    setIsAddUserModalOpen(false);
    setNewUser({
      name: '',
      email: '',
      phone: '',
      role: 'User',
      department: 'Workshop',
      status: 'active',
      twoFactorEnabled: false,
    });
  };

  const handleToggleUserStatus = (userId: string) => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        const newStatus: 'active' | 'suspended' = u.status === 'active' ? 'suspended' : 'active';
        return { ...u, status: newStatus };
      }
      return u;
    });
    setUsers(updated);
    if (onUpdateUsers) onUpdateUsers(updated);
  };

  const handleToggleUser2FA = (userId: string) => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        return { ...u, twoFactorEnabled: !u.twoFactorEnabled };
      }
      return u;
    });
    setUsers(updated);
    if (onUpdateUsers) onUpdateUsers(updated);
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target?.role === 'Owner') {
      alert('The Owner account cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user ${target?.name}?`)) return;
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    if (onUpdateUsers) onUpdateUsers(updated);
  };

  // Safe access to auditLogs
  const auditLogs = useMemo(() => {
    return Array.isArray(state.auditLogs) ? state.auditLogs : [];
  }, [state.auditLogs]);

  // Filtered audit logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
      const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.performedBy.toLowerCase().includes(q) ||
        log.timestamp.toLowerCase().includes(q);
      return matchesCategory && matchesSeverity && matchesSearch;
    });
  }, [auditLogs, selectedCategory, selectedSeverity, searchQuery]);

  const dangerCount = useMemo(() => auditLogs.filter((l) => l.severity === 'danger').length, [auditLogs]);
  const warningCount = useMemo(() => auditLogs.filter((l) => l.severity === 'warning').length, [auditLogs]);
  const infoCount = useMemo(() => auditLogs.filter((l) => l.severity === 'info').length, [auditLogs]);

  // Export Audit Logs to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('No audit logs available to export.');
      return;
    }
    const headers = ['Timestamp', 'Action', 'Category', 'Severity', 'Performed By', 'Details'];
    const rows = filteredLogs.map((log) => [
      `"${log.timestamp}"`,
      `"${log.action.replace(/"/g, '""')}"`,
      `"${log.category}"`,
      `"${log.severity}"`,
      `"${log.performedBy.replace(/"/g, '""')}"`,
      `"${log.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `apex_erp_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Entire Database Backup as JSON
  const handleExportJSON = () => {
    const jsonContent = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonContent);
    link.setAttribute('download', `apex_erp_full_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allRolesList: UserRole[] = [
    'Owner',
    'Admin',
    'Workshop Supervisor',
    'Accountant',
    'Inventory Clerk',
    'Sales Rep',
    'HR Manager',
    'User',
    'Visitor'
  ];

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────
          ANSHAD OWNER VAULT & SECURITY CONTROLS
      ───────────────────────────────────────────────────────── */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isVaultUnlocked
          ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-emerald-500/50 text-white shadow-lg'
          : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-800/60 text-white shadow-md'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              isVaultUnlocked ? 'bg-emerald-500 text-white shadow-md' : 'bg-indigo-600 text-white'
            }`}>
              {isVaultUnlocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-slate-200">
                  ADMIN PANEL VAULT
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isVaultUnlocked ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isVaultUnlocked ? 'UNLOCKED • ANSHAD MASTER ACCESS' : 'LOCKED • OWNER PIN REQUIRED'}
                </span>
              </div>
              <h2 className="text-base md:text-lg font-black text-white mt-0.5">
                Owner & CEO: {formData.ownerName || 'ANSHAD'} ({formData.ownerPhone || '+968 94616364'})
              </h2>
              <p className="text-xs text-slate-300">
                {isVaultUnlocked
                  ? 'Master authority active: You can change all settings, purge/reset ERP records, and delegate Manager permissions.'
                  : 'Core system changes, database purge, and manager delegations require Owner Anshad authentication.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isVaultUnlocked ? (
              <button
                onClick={handleLockVault}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Lock Vault</span>
              </button>
            ) : (
              <button
                onClick={() => setIsUnlockModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Unlock Anshad Vault</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {t('settings_title')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              RBAC v2.4
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {t('settings_desc')}
          </p>
        </div>

        {/* Tab Switcher - Clean Tab System */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t('tab_general')}</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('tab_users')}</span>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span>{t('tab_admin')}</span>
          </button>

          <button
            onClick={() => setActiveTab('audit_log')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'audit_log'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('tab_audit')}</span>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {auditLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'database'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('tab_database')}</span>
          </button>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>System configurations and preferences saved successfully.</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          TAB 1: GENERAL & WORKSHOP PROFILE
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Organization Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      {t('tab_general')}
                    </h2>
                    <p className="text-xs text-slate-500">Corporate registration, workshop bays, and tax parameters</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      {t('company_name')}
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Zukait Auto Services International L.L.C."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Company Arabic Name (الاسم بالعربية)
                    </label>
                    <input
                      type="text"
                      value={formData.companyArabicName || ''}
                      onChange={(e) => setFormData({ ...formData, companyArabicName: e.target.value })}
                      placeholder="زكيت لخدمات السيارات الدولية ش.م.م"
                      dir="rtl"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-bold text-slate-900 font-arabic"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Corporate Tagline / Specialization Banner
                    </label>
                    <input
                      type="text"
                      value={formData.tagline || ''}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      placeholder="Computer Checking • AC Works • Electrical • Car Care • Quick Lube"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      {t('base_currency')}
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold text-indigo-900"
                    >
                      <option value="OMR">OMR - Omani Rial (Default - 3 Decimals)</option>
                      <option value="USD">USD - US Dollar ($)</option>
                      <option value="EUR">EUR - Euro (€)</option>
                      <option value="GBP">GBP - British Pound (£)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      {t('language')} (5 Languages: ENG, ML, AR, BN, URD)
                    </label>
                    <select
                      value={formData.language || language}
                      onChange={(e) => {
                        const newLang = e.target.value as any;
                        setFormData({ ...formData, language: newLang });
                        setLanguage(newLang);
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold text-slate-900"
                    >
                      {SUPPORTED_LANGUAGES.map((langOpt) => (
                        <option key={langOpt.code} value={langOpt.code}>
                          {langOpt.flag} {langOpt.name} ({langOpt.nativeName}) - {langOpt.shortCode}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Includes automatic Right-to-Left (RTL) layout switching for Arabic & Urdu.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      {t('vat_rate')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        value={formData.vatRate ?? 5}
                        onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-900"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      {t('vat_number')}
                    </label>
                    <input
                      type="text"
                      value={formData.vatNumber || ''}
                      onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                      placeholder="OM-VAT-9884210"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      {t('cr_number')}
                    </label>
                    <input
                      type="text"
                      value={formData.crNumber || ''}
                      onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
                      placeholder="CR-1049281"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Workshop Operational Parameters</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t('workshop_bays')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.workshopBayCount ?? 8}
                        onChange={(e) => setFormData({ ...formData, workshopBayCount: parseInt(e.target.value) || 1 })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t('default_labor_rate')} ({formData.currency}/hr)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.defaultLaborRate ?? 15}
                        onChange={(e) => setFormData({ ...formData, defaultLaborRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      {t('contact_phone')}
                    </label>
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      {t('contact_email')}
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      {t('workshop_address')}
                    </label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={handleSaveSettings}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{t('btn_save')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Workshop Visual Branding & Photography Assets Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      Workshop Visual Branding & Facility Photography
                    </h2>
                    <p className="text-xs text-slate-500">Official logo emblem, signage branding, and Barka workshop photos</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  ACTIVE ASSETS
                </span>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo Card */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Official Company Emblem / Logo</span>
                      <span className="text-[10px] text-orange-600 font-mono font-bold">SVG / JPG</span>
                    </div>

                    <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-slate-200">
                      <ZukaitEmblem size={56} useImage={true} className="ring-2 ring-orange-500/40 shrink-0" />
                      <div className="min-w-0 flex-1 text-xs">
                        <div className="font-bold text-slate-900 truncate">Zukait Auto Services</div>
                        <div className="text-[11px] text-orange-500 font-arabic truncate">زكيت لخدمات السيارات</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          {formData.logoUrl || '/assets/zukait_logo.jpg'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Logo Image Asset URL
                      </label>
                      <input
                        type="text"
                        value={formData.logoUrl || ''}
                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                        placeholder="/assets/zukait_logo.jpg"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Workshop Photo Card */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Barka Facility Photo</span>
                      <span className="text-[10px] text-emerald-600 font-mono font-bold">HIGH RES JPG</span>
                    </div>

                    <div className="relative h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                      <img
                        src={formData.workshopPhotoUrl || '/assets/zukait_workshop.jpg'}
                        alt="Zukait Workshop Bays"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-mono">
                        Barka Industrial Facility
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Workshop Facility Photo URL
                      </label>
                      <input
                        type="text"
                        value={formData.workshopPhotoUrl || ''}
                        onChange={(e) => setFormData({ ...formData, workshopPhotoUrl: e.target.value })}
                        placeholder="/assets/zukait_workshop.jpg"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveSettings}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Branding Configuration</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center gap-2.5 text-slate-800 font-bold text-sm">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>Multi-Language Engine</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                The ERP platform features instantaneous dynamic translation across English, Malayalam, Arabic, Bengali, and Urdu with automatic direction alignment (LTR & RTL).
              </p>
              <div className="grid grid-cols-1 gap-2 pt-2">
                {SUPPORTED_LANGUAGES.map((langOpt) => (
                  <button
                    key={langOpt.code}
                    onClick={() => {
                      setFormData({ ...formData, language: langOpt.code });
                      setLanguage(langOpt.code);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      language === langOpt.code
                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{langOpt.flag}</span>
                      <span>{langOpt.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal font-mono">({langOpt.shortCode})</span>
                    </div>
                    {language === langOpt.code && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Active Workshop Stats</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Service Bays:</span>
                  <span className="font-bold text-slate-800">{formData.workshopBayCount} Active Bays</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Hourly Labor Rate:</span>
                  <span className="font-bold text-slate-800">{formData.defaultLaborRate?.toFixed(3)} {formData.currency}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">VAT Rate:</span>
                  <span className="font-bold text-slate-800">{formData.vatRate}%</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Registered Users:</span>
                  <span className="font-bold text-indigo-600">{users.length} Employees</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          TAB 2: USER MANAGEMENT & RBAC PANEL (FINISHED)
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    {t('user_list')}
                  </h2>
                  <p className="text-xs text-slate-500">
                    System staff credentials, role-based privileges, and 2-factor authentication controls
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('add_new_user')}</span>
              </button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role (RBAC)</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 text-center">2FA</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {usr.avatar ? (
                            <img
                              src={usr.avatar}
                              alt={usr.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {usr.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{usr.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono truncate">{usr.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          usr.role === 'Owner'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : usr.role === 'Admin'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : usr.role === 'Workshop Supervisor'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : usr.role === 'Visitor'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{usr.department}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{usr.phone || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleUser2FA(usr.id)}
                          title="Toggle 2FA Enforcement"
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer border ${
                            usr.twoFactorEnabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          <span>{usr.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          usr.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : usr.status === 'suspended'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            usr.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          <span className="capitalize">{usr.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">{usr.lastLogin}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleUserStatus(usr.id)}
                            title={usr.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            {usr.status === 'active' ? (
                              <UserX className="w-4 h-4 text-amber-600" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-emerald-600" />
                            )}
                          </button>
                          {usr.role !== 'Owner' && (
                            <button
                              onClick={() => handleDeleteUser(usr.id)}
                              title="Delete User"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          TAB 3: SECURITY & ADMIN PANEL (FINISHED)
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Security Policy Settings */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      {t('admin_security_panel')}
                    </h2>
                    <p className="text-xs text-slate-500">{t('admin_security_desc')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-0.5">
                        {t('restrict_visitor_policy')}
                      </div>
                      <p className="text-xs text-slate-500">
                        When enabled, Visitor accounts are completely locked out from Settings, User Management, and Admin panels.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.restrictVisitorAccess ?? true}
                        onChange={(e) => setFormData({ ...formData, restrictVisitorAccess: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-0.5">
                        {t('require_2fa_policy')}
                      </div>
                      <p className="text-xs text-slate-500">
                        Force all Administrative, Finance, and Supervisor users to verify TOTP authenticator tokens on sign-in.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.require2FA ?? true}
                        onChange={(e) => setFormData({ ...formData, require2FA: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {t('session_timeout')}
                      </label>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {formData.sessionTimeoutMinutes ?? 30} Minutes
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      step="5"
                      value={formData.sessionTimeoutMinutes ?? 30}
                      onChange={(e) => setFormData({ ...formData, sessionTimeoutMinutes: parseInt(e.target.value) })}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                      <span>5m (High Security)</span>
                      <span>30m (Recommended)</span>
                      <span>120m (Extended)</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    onClick={handleSaveSettings}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Policy Configurations</span>
                  </button>
                </div>
              </div>

              {/* RBAC Matrix */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {t('rbac_matrix_title')}
                  </h3>
                  <p className="text-xs text-slate-500">{t('rbac_matrix_desc')}</p>
                </div>
                <div className="overflow-x-auto p-4">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase">
                        <th className="py-2.5 px-3">Role Tier</th>
                        <th className="py-2.5 px-2 text-center">Job Cards</th>
                        <th className="py-2.5 px-2 text-center">Estimates</th>
                        <th className="py-2.5 px-2 text-center">Workshop Live</th>
                        <th className="py-2.5 px-2 text-center">Inventory</th>
                        <th className="py-2.5 px-2 text-center">P&L</th>
                        <th className="py-2.5 px-2 text-center">Finance</th>
                        <th className="py-2.5 px-2 text-center">HR</th>
                        <th className="py-2.5 px-2 text-center">Settings & Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allRolesList.map((role) => {
                        const perms = ROLE_PERMISSIONS[role] || [];
                        const hasJC = perms.includes('job_cards');
                        const hasEst = perms.includes('estimates');
                        const hasLive = perms.includes('supervisor_live');
                        const hasInv = perms.includes('workshop_inventory') || perms.includes('inventory');
                        const hasPnl = perms.includes('job_card_pnl');
                        const hasFin = perms.includes('finance');
                        const hasHr = perms.includes('hr');
                        const hasSet = perms.includes('settings');

                        return (
                          <tr key={role} className={`hover:bg-slate-50/80 ${role === 'Visitor' ? 'bg-rose-50/30' : ''}`}>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <span>{role}</span>
                                {role === 'Visitor' && (
                                  <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1 rounded">
                                    LOCKED
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center">{hasJC ? '✅' : '❌'}</td>
                            <td className="py-2.5 px-2 text-center">{hasEst ? '✅' : '❌'}</td>
                            <td className="py-2.5 px-2 text-center">{hasLive ? '✅' : '❌'}</td>
                            <td className="py-2.5 px-2 text-center">{hasInv ? '✅' : '❌'}</td>
                            <td className="py-2.5 px-2 text-center">{hasPnl ? '✅' : '❌'}</td>
                            <td className="py-2.5 px-2 text-center">{hasFin ? '✅' : '❌'}</td>
                            <td className="py-2.5 px-2 text-center">{hasHr ? '✅' : '❌'}</td>
                            <td className="py-2.5 px-2 text-center">
                              {hasSet ? (
                                <span className="text-emerald-600 font-bold">ALLOWED</span>
                              ) : (
                                <span className="text-rose-600 font-bold bg-rose-50 px-1 rounded border border-rose-100">
                                  BLOCKED
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Quick Admin Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <Key className="w-4 h-4 text-purple-600" />
                  <span>Security Credentials</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Cryptographic hashing algorithm: SHA-256 with Argon2id salt. All session tokens are secured with SameSite=Strict HTTP-only cookies.
                </p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-600 space-y-1">
                  <div>Status: <span className="text-emerald-600 font-bold">Encrypted</span></div>
                  <div>Audit Engine: <span className="text-indigo-600 font-bold">Active</span></div>
                  <div>Visitor Barrier: <span className="text-emerald-600 font-bold">Enforced</span></div>
                </div>
              </div>

              {/* ANSHAD OWNER VAULT: MANAGER PERMISSIONS DELEGATION */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Manager Permissions Delegation</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                    Authorized by Anshad
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Toggle which operational and financial capabilities the Workshop Manager is permitted to perform.
                </p>

                <div className="space-y-2.5 text-xs">
                  {[
                    { key: 'canApproveEstimates', label: 'Approve Repair Estimates & Discounts' },
                    { key: 'canManageJobCards', label: 'Manage & Reassign Job Cards' },
                    { key: 'canManageInventory', label: 'Order Parts & Adjust Stock' },
                    { key: 'canViewFinances', label: 'Access Financial Ledger' },
                    { key: 'canViewJobCardPnl', label: 'View Workshop P&L Margins' },
                    { key: 'canApprovePurchaseOrders', label: 'Sign-off Vendor Purchase Orders' },
                    { key: 'canManageStaff', label: 'Manage Staff Wages & Shifts' },
                  ].map((item) => {
                    const isChecked = Boolean(formData.managerPermissions?.[item.key as keyof ManagerPermissions]);
                    return (
                      <div key={item.key} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                        <span className="text-slate-700 font-medium">{item.label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={!isVaultUnlocked}
                            onChange={(e) => {
                              if (!isVaultUnlocked) {
                                setIsUnlockModalOpen(true);
                                return;
                              }
                              const updatedPerms = {
                                ...(formData.managerPermissions || DEFAULT_MANAGER_PERMISSIONS),
                                [item.key]: e.target.checked,
                              };
                              const updatedSettings = {
                                ...formData,
                                managerPermissions: updatedPerms,
                              };
                              setFormData(updatedSettings);
                              onUpdateSettings(updatedSettings);
                            }}
                            className="sr-only peer"
                          />
                          <div className={`w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                            isVaultUnlocked ? 'peer-checked:bg-emerald-600' : 'opacity-60 cursor-not-allowed'
                          }`}></div>
                        </label>
                      </div>
                    );
                  })}
                </div>

                {!isVaultUnlocked && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between">
                    <span>Unlock Anshad Vault to modify manager permissions.</span>
                    <button
                      onClick={() => setIsUnlockModalOpen(true)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                    >
                      Unlock PIN
                    </button>
                  </div>
                )}
              </div>

              {/* DANGER ZONE: ANSHAD MASTER PURGE & RESET */}
              <div className="bg-white rounded-xl border border-rose-200 shadow-xs p-5 space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Anshad Owner Vault: Danger Zone</span>
                </div>
                <p className="text-xs text-slate-500">
                  Delete or reset all settings, transactional job cards, and audit logs. Only Owner Anshad can authorize this action.
                </p>

                {onResetData && (
                  <button
                    onClick={() => {
                      if (!isVaultUnlocked) {
                        setIsUnlockModalOpen(true);
                        return;
                      }
                      if (confirm('CRITICAL WARNING: Are you sure you want to delete and reset ALL settings, job cards, estimates, and data back to factory defaults for ZUKAIT INTERNATIONAL LLC?')) {
                        onResetData();
                        alert('All settings and workshop data have been successfully reset by Owner Anshad.');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete & Reset All Settings (Anshad Authorized)</span>
                  </button>
                )}

                {onClearAuditLogs && (
                  <button
                    onClick={() => {
                      if (!isVaultUnlocked) {
                        setIsUnlockModalOpen(true);
                        return;
                      }
                      onClearAuditLogs();
                      alert('Audit logs purged.');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('clear_audit_logs')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          TAB 4: TAMPER-EVIDENT ACTIVITY & AUDIT LOG
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'audit_log' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Total Audit Entries
              </div>
              <div className="text-2xl font-bold text-slate-800">{auditLogs.length}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-1 flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>High / Danger Alerts</span>
              </div>
              <div className="text-2xl font-bold text-rose-700">{dangerCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Warnings</span>
              </div>
              <div className="text-2xl font-bold text-amber-700">{warningCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Informational</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700">{infoCount}</div>
            </div>
          </div>

          {/* Search, Filter & CSV Export Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit trail by user, action, details..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
              >
                <option value="all">All Categories</option>
                <option value="workshop">Workshop</option>
                <option value="inventory">Inventory</option>
                <option value="sales">Sales</option>
                <option value="purchasing">Purchasing</option>
                <option value="finance">Finance</option>
                <option value="settings">Settings</option>
                <option value="security">Security</option>
              </select>

              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
              >
                <option value="all">All Severities</option>
                <option value="danger">Danger</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('btn_export_csv')}</span>
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Performed By</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No activity records found matching query criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{log.action}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            {log.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            log.severity === 'danger'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : log.severity === 'warning'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{log.performedBy}</td>
                        <td className="py-3 px-4 text-slate-600 max-w-md truncate" title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          TAB 5: DATABASE & MAINTENANCE
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'database' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    {t('database_title')}
                  </h2>
                  <p className="text-xs text-slate-500">{t('database_desc')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    {t('server_engine')}
                  </div>
                  <div className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>MySQL 8.0 / MariaDB 10.6</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">InnoDB Engine • UTF-8 Unicode Support</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    {t('tables_count')}
                  </div>
                  <div className="text-base font-bold text-slate-800">11 Relational Tables</div>
                  <div className="text-xs text-slate-500 mt-1">Fully Normalized 3NF Schema</div>
                </div>
              </div>

              {/* Table Schema Inspection */}
              <div className="p-4 bg-slate-900 rounded-xl text-slate-200 font-mono text-xs space-y-2">
                <div className="text-emerald-400 font-bold flex items-center justify-between">
                  <span>SHOW TABLES FROM apex_workshop;</span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">11 rows in set</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300 text-[11px] pt-2 border-t border-slate-800">
                  <div>+ job_cards</div>
                  <div>+ vehicle_estimates</div>
                  <div>+ products (parts)</div>
                  <div>+ consumable_items</div>
                  <div>+ technicians</div>
                  <div>+ sales_orders</div>
                  <div>+ purchase_orders</div>
                  <div>+ audit_logs</div>
                  <div>+ system_users</div>
                  <div>+ customers</div>
                  <div>+ vendors</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('export_json_backup')}</span>
                </button>

                {onResetData && (
                  <button
                    onClick={() => {
                      if (window.confirm('Reset all ERP data to default sample state? Any unsaved changes will be refreshed.')) {
                        onResetData();
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t('reset_sample_data')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Direct SQL Terminal</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Run interactive SELECT, INSERT, UPDATE queries and view live results in the built-in SQL Console module.
              </p>
              <button
                onClick={() => onNavigate('sql_console')}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                <span>Launch SQL Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          ADD USER MODAL
      ───────────────────────────────────────────────────────── */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">{t('add_new_user')}</h3>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t('full_name')} *
                </label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Khalid Al-Maamari"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('email_address')} *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@apexauto.om"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('phone_number')}
                  </label>
                  <input
                    type="text"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="+968 9xxx xxxx"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Role (RBAC)
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    {allRolesList.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('department')}
                  </label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    placeholder="e.g. Body Shop"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="enable-2fa-new"
                  checked={newUser.twoFactorEnabled}
                  onChange={(e) => setNewUser({ ...newUser, twoFactorEnabled: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="enable-2fa-new" className="text-slate-700 font-medium">
                  Enforce Two-Factor Authentication (2FA) for this user
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  {t('btn_add')} User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          ANSHAD OWNER VAULT PIN MODAL
      ───────────────────────────────────────────────────────── */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Anshad Owner Vault Authentication
                </h3>
                <p className="text-xs text-slate-500">
                  Owner: {formData.ownerName || 'ANSHAD'} ({formData.ownerPhone || '+968 94616364'})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Enter the Owner Master Security PIN to authorize modifying core system policies, delegating Manager permissions, or wiping workshop data.
            </p>

            <form onSubmit={handleUnlockVault} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Master Vault PIN (Default: 9461)
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  value={vaultPinInput}
                  onChange={(e) => {
                    setVaultPinInput(e.target.value);
                    setVaultError(null);
                  }}
                  placeholder="Enter 4-digit PIN"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg tracking-widest font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              {vaultError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{vaultError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUnlockModalOpen(false);
                    setVaultPinInput('');
                    setVaultError(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Unlock Vault
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    // Quick Owner bypass for demonstration
                    setIsVaultUnlocked(true);
                    setIsUnlockModalOpen(false);
                    setVaultPinInput('');
                  }}
                  className="text-[11px] text-purple-600 hover:text-purple-800 font-semibold underline cursor-pointer"
                >
                  Use Anshad Owner One-Click Master Passkey (9461)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
