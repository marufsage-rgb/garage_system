import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Landmark,
  Users,
  Factory,
  RefreshCw,
  FileCode2,
  Terminal,
  Settings,
  Wrench,
  FileText,
  Activity,
  Boxes,
  TrendingUp,
  Sparkles,
  Globe,
  ShieldCheck,
  FilePlus
} from 'lucide-react';
import { ModuleType, UserRole, ROLE_PERMISSIONS } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ZukaitEmblem } from './ZukaitBrand';

interface SidebarProps {
  currentModule: ModuleType;
  currentUserRole: UserRole;
  onSelectModule: (module: ModuleType) => void;
  onResetData: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  counts: {
    lowStockCount: number;
    pendingOrdersCount: number;
    openPoCount: number;
    activeJobCardsCount?: number;
    pendingEstimatesCount?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  currentUserRole,
  onSelectModule,
  onResetData,
  collapsed,
  onToggleCollapse,
  counts
}) => {
  const { t } = useLanguage();
  const allowedModules = ROLE_PERMISSIONS[currentUserRole] || [];

  // 0. ROLE-SPECIFIC PORTALS (Public, Manager, Operator)
  const portalItems: { id: ModuleType; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'public_portal', label: 'Website & Car Tracker', icon: Globe, badge: 'PUBLIC' },
    { id: 'manager_portal', label: 'Manager Portal', icon: ShieldCheck, badge: 'ANSHAD' },
    { id: 'operator_portal', label: 'Operator Desk (Entry)', icon: FilePlus, badge: 'ENTRY' },
  ];
  const filteredPortalItems = portalItems.filter(item => allowedModules.includes(item.id));

  // 1. PRIMARY HIGHLIGHT: AUTOMOTIVE WORKSHOP SUITE
  const workshopItems: { id: ModuleType; label: string; icon: React.ElementType; badge?: number; badgeColor?: string }[] = [
    { id: 'job_cards', label: t('mod_job_cards'), icon: Wrench, badge: counts.activeJobCardsCount, badgeColor: 'bg-indigo-900 text-indigo-200' },
    { id: 'estimates', label: t('mod_estimates'), icon: FileText, badge: counts.pendingEstimatesCount, badgeColor: 'bg-emerald-900 text-emerald-200' },
    { id: 'supervisor_live', label: t('mod_supervisor_live'), icon: Activity },
    { id: 'workshop_inventory', label: t('mod_workshop_inventory'), icon: Boxes, badge: counts.lowStockCount, badgeColor: 'bg-amber-900 text-amber-200' },
    { id: 'job_card_pnl', label: t('mod_job_card_pnl'), icon: TrendingUp },
  ];
  const filteredWorkshopItems = workshopItems.filter(item => allowedModules.includes(item.id));

  // 2. GENERAL ERP & BACK OFFICE
  const allNavItems: { id: ModuleType; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: t('mod_dashboard'), icon: LayoutDashboard },
    { id: 'sales', label: t('mod_sales'), icon: ShoppingCart, badge: counts.pendingOrdersCount },
    { id: 'inventory', label: t('mod_inventory'), icon: Package, badge: counts.lowStockCount },
    { id: 'purchasing', label: t('mod_purchasing'), icon: Truck, badge: counts.openPoCount },
    { id: 'finance', label: t('mod_finance'), icon: Landmark },
    { id: 'manufacturing', label: t('mod_manufacturing'), icon: Factory },
    { id: 'hr', label: t('mod_hr'), icon: Users },
    { id: 'settings', label: t('mod_settings'), icon: Settings },
  ];
  const navItems = allNavItems.filter(item => allowedModules.includes(item.id));

  const allDevTools: { id: ModuleType; label: string; icon: React.ElementType }[] = [
    { id: 'php_source', label: t('mod_php_source'), icon: FileCode2 },
    { id: 'sql_console', label: t('mod_sql_console'), icon: Terminal },
  ];
  const devTools = allDevTools.filter(item => allowedModules.includes(item.id));

  return (
    <aside
      id="erp-sidebar"
      className={`bg-slate-900 text-slate-300 flex flex-col justify-between transition-all duration-300 shrink-0 border-r border-slate-800 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="overflow-y-auto max-h-[calc(100vh-100px)]">
        {/* Company Header / Brand */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <ZukaitEmblem size={collapsed ? 36 : 40} useImage={true} className="ring-1 ring-orange-500/40" />
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-black text-white tracking-tight truncate text-xs flex items-center gap-1">
                  <span className="text-orange-500">ZUKAIT</span> AUTO SERVICES
                </span>
                <span className="text-[9px] text-orange-400/90 font-mono font-bold tracking-wider uppercase truncate">
                  INTERNATIONAL L.L.C.
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors hidden md:block cursor-pointer"
          >
            <span className="text-xs">{collapsed ? '→' : '←'}</span>
          </button>
        </div>

        {/* ROLE PORTALS (Website / Manager / Operator) */}
        {filteredPortalItems.length > 0 && (
          <div className="p-3 pb-0">
            {!collapsed && (
              <div className="px-3 pb-2 pt-1 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  Portals & Entry
                </span>
              </div>
            )}
            <nav className="space-y-1 mb-2">
              {filteredPortalItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentModule === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => onSelectModule(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!collapsed && (
                      <div className="flex items-center justify-between w-full min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* WORKSHOP MAIN HIGHLIGHT SUITE */}
        <div className="p-3">
          {!collapsed && filteredWorkshopItems.length > 0 && (
            <div className="px-3 pb-2 pt-1 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {t('nav_workshop')}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                MAIN
              </span>
            </div>
          )}
          <nav className="space-y-1 mb-4">
            {filteredWorkshopItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentModule === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => onSelectModule(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-300' : 'text-indigo-400'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && item.badge > 0 ? (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold font-mono ${
                        item.badgeColor || 'bg-indigo-800 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Core Modules */}
          {!collapsed && navItems.length > 0 && (
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {t('nav_enterprise')}
            </div>
          )}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentModule === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => onSelectModule(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && item.badge > 0 ? (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        isActive
                          ? 'bg-indigo-800 text-white'
                          : 'bg-slate-800 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* PHP & SQL Stack Explorer Section (Hidden for Visitor) */}
          {devTools.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800">
              {!collapsed && (
                <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-400 font-mono">
                  {t('nav_system')}
                </div>
              )}
              <nav className="space-y-1">
                {devTools.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentModule === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-item-${item.id}`}
                      onClick={() => onSelectModule(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Bottom User / Quick Action */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {currentUserRole !== 'Visitor' ? (
          <button
            onClick={onResetData}
            id="btn-reset-demo-data"
            title={t('reset_db')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{t('reset_db')}</span>}
          </button>
        ) : (
          <div className="p-2 bg-amber-950/40 border border-amber-900/50 rounded-lg text-center">
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block">
              {!collapsed ? t('visitor_mode') : 'Guest'}
            </span>
            {!collapsed && (
              <span className="text-[10px] text-amber-200/60 block mt-0.5">
                Settings & Admin Hidden
              </span>
            )}
          </div>
        )}

        <div className="pt-2 flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0">
            {currentUserRole === 'Visitor' ? 'GST' : 'PHP'}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-slate-200 truncate">
                {currentUserRole === 'Visitor' ? t('restricted_guest') : 'MySQL / MariaDB'}
              </div>
              <div className={`text-[10px] font-mono truncate ${
                currentUserRole === 'Visitor' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {currentUserRole === 'Visitor' ? t('public_readonly') : t('db_status_connected')}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
