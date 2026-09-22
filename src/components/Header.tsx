import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  Upload,
  UserCircle,
  Globe
} from 'lucide-react';
import { ERPNotification, ModuleType, UserRole, ROLE_PERMISSIONS } from '../types';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { ZukaitEmblem } from './ZukaitBrand';

interface HeaderProps {
  notifications: ERPNotification[];
  currentUserRole?: UserRole;
  onChangeRole?: (role: UserRole) => void;
  onMarkNotificationRead: (id: string) => void;
  onOpenGlobalSearch: () => void;
  onOpenNewModal: (type: 'sale' | 'purchase' | 'inventory' | 'expense') => void;
  onOpenBulkImport?: (type?: 'products' | 'customers' | 'employees') => void;
  onNavigateModule: (module: ModuleType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  notifications,
  currentUserRole = 'Admin',
  onChangeRole,
  onMarkNotificationRead,
  onOpenGlobalSearch,
  onOpenNewModal,
  onOpenBulkImport,
  onNavigateModule,
}) => {
  const { t, language, setLanguage, currentLangInfo, availableLanguages, isRtl } = useLanguage();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header id="erp-header" className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-20 shrink-0">
      {/* Brand Identity & Search trigger */}
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        <button
          onClick={() => onNavigateModule('public_portal')}
          className="hidden sm:flex items-center gap-2.5 shrink-0 text-left hover:opacity-85 transition-opacity cursor-pointer group pr-3 border-r border-slate-200"
          title="Zukait Auto Services International L.L.C. (Click for Public Portal)"
        >
          <ZukaitEmblem size={34} useImage={true} className="ring-1 ring-orange-500/30" />
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors leading-none">
              <span className="text-orange-600">ZUKAIT</span> AUTO SERVICES
            </span>
            <span className="text-[10px] text-slate-500 font-mono leading-tight mt-0.5">
              C.R. 1194220 • BARKA
            </span>
          </div>
        </button>

        <button
          onClick={onOpenGlobalSearch}
          id="btn-global-search-trigger"
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-500 rounded-lg text-sm transition-colors border border-transparent hover:border-slate-300 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 text-xs sm:text-sm truncate">
              {t('search_placeholder')}
            </span>
          </div>
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono bg-white border border-slate-200 rounded text-slate-400 shrink-0">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Language Switcher Dropdown (ENG, ML, AR, BN, URD) */}
        <div className="relative">
          <button
            id="btn-language-switch"
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-xs font-semibold text-slate-800 transition-colors border border-slate-200 cursor-pointer shadow-2xs"
            title="Switch Language (ENG, Maleyalam, AR, BN, URD)"
          >
            <span className="text-base leading-none">{currentLangInfo.flag}</span>
            <span className="font-bold text-slate-800 hidden xs:inline">{currentLangInfo.shortCode}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showLangMenu && (
            <div
              className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in`}
              onMouseLeave={() => setShowLangMenu(false)}
            >
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                <span>{t('select_language')}</span>
                <Globe className="w-3 h-3 text-slate-400" />
              </div>
              {availableLanguages.map((langOpt) => (
                <button
                  key={langOpt.code}
                  onClick={() => {
                    setLanguage(langOpt.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                    language === langOpt.code
                      ? 'bg-indigo-50 font-bold text-indigo-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{langOpt.flag}</span>
                    <span className="font-semibold">{langOpt.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">({langOpt.shortCode})</span>
                    {language === langOpt.code && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Technology Stack Pill (Hidden for Visitor) */}
        {currentUserRole !== 'Visitor' && (
          <>
            <button
              onClick={() => onNavigateModule('php_source')}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-mono font-bold text-emerald-800 transition-colors cursor-pointer"
              title="Inspect and download pure PHP, SQL, HTML & CSS source code"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>PHP 8 + MySQL</span>
            </button>

            <button
              onClick={() => onNavigateModule('sql_console')}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer border border-slate-200"
              title="Open interactive SQL query terminal"
            >
              <span>⚡ SQL</span>
            </button>
          </>
        )}

        {/* Quick "+ New" Dropdown (Hidden for Visitor) */}
        {currentUserRole !== 'Visitor' && (
          <div className="relative">
            <button
              id="btn-quick-new"
              onClick={() => setShowNewMenu(!showNewMenu)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('new_action')}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
            </button>

            {showNewMenu && (
              <div
                className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40 text-sm`}
                onMouseLeave={() => setShowNewMenu(false)}
              >
                {ROLE_PERMISSIONS[currentUserRole].includes('sales') && (
                  <button
                    onClick={() => {
                      onOpenNewModal('sale');
                      setShowNewMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    <span>{t('btn_new_sales_order')}</span>
                    <span className="text-xs text-slate-400">SO</span>
                  </button>
                )}
                {ROLE_PERMISSIONS[currentUserRole].includes('inventory') && (
                  <button
                    onClick={() => {
                      onOpenNewModal('inventory');
                      setShowNewMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    <span>{t('btn_add_product')}</span>
                    <span className="text-xs text-slate-400">SKU</span>
                  </button>
                )}
                {ROLE_PERMISSIONS[currentUserRole].includes('purchasing') && (
                  <button
                    onClick={() => {
                      onOpenNewModal('purchase');
                      setShowNewMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    <span>{t('btn_new_purchase_order')}</span>
                    <span className="text-xs text-slate-400">PO</span>
                  </button>
                )}
                
                {ROLE_PERMISSIONS[currentUserRole].includes('finance') && (
                  <>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => {
                        onOpenNewModal('expense');
                        setShowNewMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <span>{t('btn_record_expense')}</span>
                      <span className="text-xs text-slate-400">GL</span>
                    </button>
                  </>
                )}
                {onOpenBulkImport && ['Admin', 'Inventory Clerk', 'HR Manager', 'Owner'].includes(currentUserRole) && (
                  <>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => {
                        onOpenBulkImport('products');
                        setShowNewMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-indigo-50 flex items-center justify-between text-indigo-700 font-medium cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Bulk Import (CSV)</span>
                      </span>
                      <span className="text-xs text-indigo-400">CSV</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notifications Tray */}
        <div className="relative">
          <button
            id="btn-notifications-toggle"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title={t('notifications')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-40`}
              onMouseLeave={() => setShowNotifications(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-sm">{t('notifications')}</span>
                <span className="text-xs text-slate-400">{unreadCount} unread</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">{t('no_notifications')}</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        onMarkNotificationRead(notif.id);
                        if (notif.linkModule) onNavigateModule(notif.linkModule);
                        setShowNotifications(false);
                      }}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer flex gap-3 items-start transition-colors ${
                        !notif.read ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {notif.type === 'alert' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                        {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {notif.type === 'info' && <Info className="w-4 h-4 text-sky-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                          <span className="truncate">{notif.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal ml-2 shrink-0">{notif.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role Switcher */}
        <div className={`relative ${isRtl ? 'border-r pr-3 mr-2' : 'border-l pl-3 ml-2'} border-slate-200`}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 text-left hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              currentUserRole === 'Visitor' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-600'
            }`}>
              <UserCircle className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] uppercase font-bold tracking-wider text-orange-600">
                {currentUserRole === 'Owner' ? 'Hi ANSHAD' : currentUserRole === 'Visitor' ? t('restricted_guest') : t('current_role')}
              </div>
              <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                <span className={currentUserRole === 'Visitor' ? 'text-amber-700 font-bold' : currentUserRole === 'Owner' ? 'text-slate-900 font-bold' : ''}>
                  {currentUserRole === 'Owner' ? 'ANSHAD (CEO)' : currentUserRole}
                </span>
                {currentUserRole === 'Visitor' && (
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-300">
                    VISITOR
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </button>

          {showRoleMenu && onChangeRole && (
            <div
              className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-40`}
              onMouseLeave={() => setShowRoleMenu(false)}
            >
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('simulate_role')}</span>
              </div>
              {([
                'Owner',
                'Manager',
                'Operator',
                'Admin',
                'Workshop Supervisor',
                'Accountant',
                'Inventory Clerk',
                'Sales Rep',
                'HR Manager',
                'User',
                'Visitor'
              ] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    onChangeRole(role);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    currentUserRole === role
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>
                      {role === 'Owner' ? 'Owner (Anshad - CEO)' :
                       role === 'Manager' ? 'Manager (Delegated)' :
                       role === 'Operator' ? 'Operator (Entry Desk)' :
                       role === 'Visitor' ? 'Visitor (Car Tracking)' : role}
                    </span>
                  </div>
                  {currentUserRole === role && <CheckCircle2 className="w-3 h-3 text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
