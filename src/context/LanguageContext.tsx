import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, LanguageOption } from '../types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    shortCode: 'ENG',
    nativeName: 'English',
    flag: '🇬🇧',
    dir: 'ltr',
  },
  {
    code: 'ml',
    name: 'Malayalam',
    shortCode: 'മലയാളം',
    nativeName: 'മലയാളം',
    flag: '🇮🇳',
    dir: 'ltr',
  },
  {
    code: 'ar',
    name: 'Arabic',
    shortCode: 'العربية',
    nativeName: 'العربية',
    flag: '🇴🇲',
    dir: 'rtl',
  },
  {
    code: 'bn',
    name: 'Bengali',
    shortCode: 'বাংলা',
    nativeName: 'বাংলা',
    flag: '🇧🇩',
    dir: 'ltr',
  },
  {
    code: 'ur',
    name: 'Urdu',
    shortCode: 'اردو',
    nativeName: 'اردو',
    flag: '🇵🇰',
    dir: 'rtl',
  },
];

export type TranslationKey =
  // App Bar & Global
  | 'app_title'
  | 'search_placeholder'
  | 'new_action'
  | 'notifications'
  | 'mark_all_read'
  | 'no_notifications'
  | 'current_role'
  | 'simulate_role'
  | 'visitor_mode'
  | 'restricted_guest'
  | 'reset_db'
  | 'db_status_connected'
  | 'public_readonly'
  | 'language'
  | 'select_language'
  // Navigation Modules
  | 'mod_dashboard'
  | 'mod_job_cards'
  | 'mod_estimates'
  | 'mod_supervisor_live'
  | 'mod_workshop_inventory'
  | 'mod_job_card_pnl'
  | 'mod_sales'
  | 'mod_inventory'
  | 'mod_purchasing'
  | 'mod_finance'
  | 'mod_hr'
  | 'mod_manufacturing'
  | 'mod_settings'
  | 'mod_php_source'
  | 'mod_sql_console'
  // Section Headings in Navigation
  | 'nav_workshop'
  | 'nav_enterprise'
  | 'nav_system'
  // Action Buttons
  | 'btn_save'
  | 'btn_cancel'
  | 'btn_delete'
  | 'btn_edit'
  | 'btn_add'
  | 'btn_close'
  | 'btn_export_csv'
  | 'btn_print'
  | 'btn_filter'
  | 'btn_refresh'
  | 'btn_search'
  | 'btn_apply'
  | 'btn_confirm'
  | 'btn_new_job_card'
  | 'btn_new_estimate'
  | 'btn_new_sales_order'
  | 'btn_new_purchase_order'
  | 'btn_record_expense'
  | 'btn_add_product'
  | 'btn_add_user'
  // Roles
  | 'role_owner'
  | 'role_admin'
  | 'role_workshop_supervisor'
  | 'role_accountant'
  | 'role_inventory_clerk'
  | 'role_sales_rep'
  | 'role_hr_manager'
  | 'role_user'
  | 'role_visitor'
  // Security & Visitor Barrier
  | 'access_denied'
  | 'visitor_restricted_title'
  | 'visitor_restricted_desc'
  | 'return_to_dashboard'
  | 'visitor_no_settings'
  | 'permission_restricted'
  // Settings Tabs
  | 'tab_general'
  | 'tab_users'
  | 'tab_admin'
  | 'tab_audit'
  | 'tab_database'
  | 'settings_title'
  | 'settings_desc'
  // General Settings Fields
  | 'company_name'
  | 'base_currency'
  | 'vat_rate'
  | 'vat_number'
  | 'cr_number'
  | 'contact_phone'
  | 'contact_email'
  | 'workshop_address'
  | 'workshop_bays'
  | 'default_labor_rate'
  // User Management
  | 'user_list'
  | 'add_new_user'
  | 'full_name'
  | 'email_address'
  | 'phone_number'
  | 'department'
  | 'status'
  | 'two_factor_auth'
  | 'last_login'
  | 'actions'
  | 'active'
  | 'suspended'
  | 'pending'
  // Admin & Security
  | 'admin_security_panel'
  | 'admin_security_desc'
  | 'session_timeout'
  | 'require_2fa_policy'
  | 'restrict_visitor_policy'
  | 'rbac_matrix_title'
  | 'rbac_matrix_desc'
  // Audit Logs
  | 'audit_trail_title'
  | 'audit_trail_desc'
  | 'clear_audit_logs'
  | 'severity'
  | 'category'
  | 'performed_by'
  | 'timestamp'
  | 'details'
  // Database Tab
  | 'database_title'
  | 'database_desc'
  | 'tables_count'
  | 'server_engine'
  | 'export_json_backup'
  | 'reset_sample_data';

const TRANSLATIONS: Record<SupportedLanguage, Record<TranslationKey, string>> = {
  en: {
    app_title: 'Apex ERP Suite',
    search_placeholder: 'Search orders, parts, plates, customers (Ctrl+K)...',
    new_action: 'New Action',
    notifications: 'Notifications',
    mark_all_read: 'Mark all as read',
    no_notifications: 'No notifications',
    current_role: 'Current Role',
    simulate_role: 'Simulate Role (RBAC)',
    visitor_mode: 'Visitor Mode',
    restricted_guest: 'Restricted Guest',
    reset_db: 'Reset Database',
    db_status_connected: '11 Tables • Connected',
    public_readonly: 'Public / Read-Only',
    language: 'Language',
    select_language: 'Select Language',

    mod_dashboard: 'Dashboard',
    mod_job_cards: 'Job Cards',
    mod_estimates: 'Vehicle Estimates',
    mod_supervisor_live: 'Workshop Live & Tech',
    mod_workshop_inventory: 'Parts & Consumables',
    mod_job_card_pnl: 'Job Card P&L',
    mod_sales: 'Sales Orders',
    mod_inventory: 'Central Inventory',
    mod_purchasing: 'Purchasing (PO)',
    mod_finance: 'Finance & Ledger',
    mod_hr: 'Human Resources',
    mod_manufacturing: 'Manufacturing (BOM)',
    mod_settings: 'Settings & Admin',
    mod_php_source: 'PHP 8 Source',
    mod_sql_console: 'SQL Console',

    nav_workshop: 'Workshop Operations',
    nav_enterprise: 'Enterprise Core',
    nav_system: 'System & Architecture',

    btn_save: 'Save Changes',
    btn_cancel: 'Cancel',
    btn_delete: 'Delete',
    btn_edit: 'Edit',
    btn_add: 'Add',
    btn_close: 'Close',
    btn_export_csv: 'Export CSV',
    btn_print: 'Print',
    btn_filter: 'Filter',
    btn_refresh: 'Refresh',
    btn_search: 'Search',
    btn_apply: 'Apply',
    btn_confirm: 'Confirm',
    btn_new_job_card: 'New Job Card',
    btn_new_estimate: 'New Estimate',
    btn_new_sales_order: 'New Sales Order',
    btn_new_purchase_order: 'New Purchase Order',
    btn_record_expense: 'Record Expense',
    btn_add_product: 'Add Product',
    btn_add_user: 'Add New User',

    role_owner: 'Owner',
    role_admin: 'Admin',
    role_workshop_supervisor: 'Workshop Supervisor',
    role_accountant: 'Accountant',
    role_inventory_clerk: 'Inventory Clerk',
    role_sales_rep: 'Sales Rep',
    role_hr_manager: 'HR Manager',
    role_user: 'Standard User',
    role_visitor: 'Visitor (Restricted)',

    access_denied: 'Access Denied',
    visitor_restricted_title: 'Visitor Access Restricted',
    visitor_restricted_desc: 'Visitor accounts are strictly barred from viewing or editing System Settings, User Management, or Admin panels.',
    return_to_dashboard: 'Return to Dashboard',
    visitor_no_settings: 'Visitor accounts have no permission to access Settings or User panels.',
    permission_restricted: 'You do not have permission to view this module.',

    tab_general: 'General & Profile',
    tab_users: 'User Management (RBAC)',
    tab_admin: 'Security & Admin Panel',
    tab_audit: 'Activity & Audit Log',
    tab_database: 'Database & Maintenance',
    settings_title: 'System Settings & Administration',
    settings_desc: 'Manage organizational configuration, user permissions, enterprise security policies, and system activity logs.',

    company_name: 'Company / Workshop Name',
    base_currency: 'Base Operating Currency',
    vat_rate: 'VAT Rate (%)',
    vat_number: 'VAT / Tax Registration Number',
    cr_number: 'Commercial Registration (CR)',
    contact_phone: 'Primary Telephone',
    contact_email: 'Contact Email',
    workshop_address: 'Workshop Address',
    workshop_bays: 'Active Workshop Bays',
    default_labor_rate: 'Default Labor Hourly Rate',

    user_list: 'System Users & Credentials',
    add_new_user: 'Add System User',
    full_name: 'Full Name',
    email_address: 'Email Address',
    phone_number: 'Phone Number',
    department: 'Department',
    status: 'Status',
    two_factor_auth: '2FA Security',
    last_login: 'Last Login',
    actions: 'Actions',
    active: 'Active',
    suspended: 'Suspended',
    pending: 'Pending',

    admin_security_panel: 'Enterprise Security & Policy Control',
    admin_security_desc: 'Enforce multi-factor authentication, session timeouts, and strict access controls across all departments.',
    session_timeout: 'Inactivity Session Timeout (Minutes)',
    require_2fa_policy: 'Mandatory Two-Factor Authentication (2FA)',
    restrict_visitor_policy: 'Strict Visitor Lockdown (Hide All Settings & Financials)',
    rbac_matrix_title: 'Role-Based Access Control (RBAC) Matrix',
    rbac_matrix_desc: 'Authorized module permissions per organizational role tier.',

    audit_trail_title: 'Tamper-Evident Audit Trail',
    audit_trail_desc: 'Comprehensive immutable record of all transactions, job card stage changes, and security configurations.',
    clear_audit_logs: 'Flush Audit Logs',
    severity: 'Severity',
    category: 'Category',
    performed_by: 'Performed By',
    timestamp: 'Timestamp',
    details: 'Details',

    database_title: 'MySQL / MariaDB Health & Data Maintenance',
    database_desc: 'Relational database schema status, diagnostic health metrics, and automated snapshot backups.',
    tables_count: 'Relational Tables',
    server_engine: 'Database Engine',
    export_json_backup: 'Export Full Data Backup (JSON)',
    reset_sample_data: 'Reset to Production Sample Data',
  },

  ml: {
    app_title: 'അപെക്സ് ഇ.ആർ.പി സ്യൂട്ട്',
    search_placeholder: 'ഓർഡറുകൾ, പാർട്‌സുകൾ, നമ്പർ പ്ലേറ്റുകൾ, ഉപഭോക്താക്കൾ തിരയുക...',
    new_action: 'പുതിയ പ്രവർത്തനം',
    notifications: 'അറിയിപ്പുകൾ',
    mark_all_read: 'എല്ലാം വായിച്ചതായി അടയാളപ്പെടുത്തുക',
    no_notifications: 'അറിയിപ്പുകൾ ലഭ്യമല്ല',
    current_role: 'നിലവിലെ റോൾ',
    simulate_role: 'റോൾ മാറ്റുക (RBAC)',
    visitor_mode: 'വിസിറ്റർ മോഡ്',
    restricted_guest: 'നിയന്ത്രിത അതിഥി',
    reset_db: 'ഡാറ്റാബേസ് റീസെറ്റ്',
    db_status_connected: '11 പട്ടികകൾ • കണക്റ്റ് ചെയ്തു',
    public_readonly: 'പബ്ലിക് / വായിക്കാൻ മാത്രം',
    language: 'ഭാഷ',
    select_language: 'ഭാഷ തിരഞ്ഞെടുക്കുക',

    mod_dashboard: 'ഡാഷ്‌ബോർഡ്',
    mod_job_cards: 'ജോബ് കാർഡുകൾ',
    mod_estimates: 'വാഹന എസ്റ്റിമേറ്റുകൾ',
    mod_supervisor_live: 'വർക്ക്‌ഷോപ്പ് ലൈവ് & ടെക്നീഷ്യൻസ്',
    mod_workshop_inventory: 'പാർട്‌സുകളും സാമഗ്രികളും',
    mod_job_card_pnl: 'ജോബ് കാർഡ് ലാഭനഷ്ടം',
    mod_sales: 'വിൽപ്പന ഓർഡറുകൾ',
    mod_inventory: 'സെൻട്രൽ ഇൻവെന്ററി',
    mod_purchasing: 'പർച്ചേസിംഗ് (PO)',
    mod_finance: 'ഫിനാൻസ് & ലെഡ്ജർ',
    mod_hr: 'ഹ്യൂമൻ റിസോഴ്സസ് (HR)',
    mod_manufacturing: 'മാനുഫാക്ചറിംഗ് (BOM)',
    mod_settings: 'ക്രമീകരണങ്ങൾ & അഡ്മിൻ',
    mod_php_source: 'പി.എച്ച്.പി 8 സോഴ്സ്',
    mod_sql_console: 'എസ്.ക്യു.എൽ കൺസോൾ',

    nav_workshop: 'വർക്ക്‌ഷോപ്പ് പ്രവർത്തനങ്ങൾ',
    nav_enterprise: 'എന്റർപ്രൈസ് കോർ',
    nav_system: 'സിസ്റ്റം ആർക്കിടെക്ചർ',

    btn_save: 'മാറ്റങ്ങൾ സൂക്ഷിക്കുക',
    btn_cancel: 'റദ്ദാക്കുക',
    btn_delete: 'നീക്കം ചെയ്യുക',
    btn_edit: 'തിരുത്തുക',
    btn_add: 'ചേർക്കുക',
    btn_close: 'അടയ്ക്കുക',
    btn_export_csv: 'CSV എക്സ്പോർട്ട്',
    btn_print: 'പ്രിന്റ് ചെയ്യുക',
    btn_filter: 'ഫിൽട്ടർ',
    btn_refresh: 'പുതുക്കുക',
    btn_search: 'തിരയുക',
    btn_apply: 'ബാധകമാക്കുക',
    btn_confirm: 'സ്ഥിരീകരിക്കുക',
    btn_new_job_card: 'പുതിയ ജോബ് കാർഡ്',
    btn_new_estimate: 'പുതിയ എസ്റ്റിമേറ്റ്',
    btn_new_sales_order: 'പുതിയ സെയിൽസ് ഓർഡർ',
    btn_new_purchase_order: 'പുതിയ പർച്ചേസ് ഓർഡർ',
    btn_record_expense: 'ചെലവ് രേഖപ്പെടുത്തുക',
    btn_add_product: 'ഉൽപ്പന്നം ചേർക്കുക',
    btn_add_user: 'പുതിയ ഉപയോക്താവിനെ ചേർക്കുക',

    role_owner: 'ഉടമസ്ഥൻ (Owner)',
    role_admin: 'അഡ്മിൻ (Admin)',
    role_workshop_supervisor: 'വർക്ക്‌ഷോപ്പ് സൂപ്പർവൈസർ',
    role_accountant: 'അക്കൗണ്ടന്റ്',
    role_inventory_clerk: 'ഇൻവെന്ററി ക്ലാർക്ക്',
    role_sales_rep: 'സെയിൽസ് പ്രതിനിധി',
    role_hr_manager: 'എച്ച്.ആർ മാനേജർ',
    role_user: 'സാധാരണ ഉപയോക്താവ്',
    role_visitor: 'സന്ദർശകൻ (നിയന്ത്രിതം)',

    access_denied: 'പ്രവേശനം നിഷേധിച്ചു',
    visitor_restricted_title: 'സന്ദർശക പ്രവേശനം നിയന്ത്രിച്ചിരിക്കുന്നു',
    visitor_restricted_desc: 'സിസ്റ്റം ക്രമീകരണങ്ങൾ, ഉപയോക്തൃ മാനേജ്‌മെന്റ്, അഡ്മിൻ പാനലുകൾ എന്നിവ കാണാൻ സന്ദർശകർക്ക് കർശനമായി അനുമതിയില്ല.',
    return_to_dashboard: 'ഡാഷ്‌ബോർഡിലേക്ക് മടങ്ങുക',
    visitor_no_settings: 'സന്ദർശക അക്കൗണ്ടുകൾക്ക് ക്രമീകരണങ്ങളിലേക്കോ അഡ്മിൻ പാനലുകളിലേക്കോ പ്രവേശനമില്ല.',
    permission_restricted: 'ഈ മൊഡ്യൂൾ കാണാനുള്ള അനുമതി നിങ്ങൾക്കില്ല.',

    tab_general: 'ജനറൽ & പ്രൊഫൈൽ',
    tab_users: 'ഉപയോക്തൃ മാനേജ്‌മെന്റ് (RBAC)',
    tab_admin: 'സുരക്ഷ & അഡ്മിൻ പാനൽ',
    tab_audit: 'പ്രവർത്തന ലോഗ് (Audit)',
    tab_database: 'ഡാറ്റാബേസ് & മെയിന്റനൻസ്',
    settings_title: 'സിസ്റ്റം ക്രമീകരണങ്ങളും അഡ്മിനിസ്ട്രേഷനും',
    settings_desc: 'സ്ഥാപന വിവരങ്ങൾ, ഉപയോക്തൃ അനുമതികൾ, സുരക്ഷാ നയങ്ങൾ, സിസ്റ്റം ആക്റ്റിവിറ്റി ലോഗുകൾ എന്നിവ കൈകാര്യം ചെയ്യുക.',

    company_name: 'സ്ഥാപനത്തിന്റെ പേര്',
    base_currency: 'പ്രധാന കറൻസി',
    vat_rate: 'വാറ്റ് നിരക്ക് (%)',
    vat_number: 'വാറ്റ് രജിസ്ട്രേഷൻ നമ്പർ',
    cr_number: 'സി.ആർ നമ്പർ (വാണിജ്യ രജിസ്ട്രേഷൻ)',
    contact_phone: 'ഫോൺ നമ്പർ',
    contact_email: 'ഇമെയിൽ വിലാസം',
    workshop_address: 'വർക്ക്‌ഷോപ്പ് വിലാസം',
    workshop_bays: 'വർക്ക്‌ഷോപ്പ് ബേകൾ',
    default_labor_rate: 'സാധാരണ ലേബർ മണിക്കൂർ നിരക്ക്',

    user_list: 'സിസ്റ്റം ഉപയോക്താക്കൾ',
    add_new_user: 'ഉപയോക്താവിനെ ചേർക്കുക',
    full_name: 'പൂർണ്ണ പേര്',
    email_address: 'ഇമെയിൽ',
    phone_number: 'ഫോൺ',
    department: 'വിഭാഗം',
    status: 'സ്റ്റാറ്റസ്',
    two_factor_auth: '2FA സുരക്ഷ',
    last_login: 'അവസാന ലോഗിൻ',
    actions: 'നടപടികൾ',
    active: 'സജീവം',
    suspended: 'തടഞ്ഞു വെച്ചു',
    pending: 'തീർച്ചപ്പെടാത്തത്',

    admin_security_panel: 'സുരക്ഷാ നയ നിയന്ത്രണങ്ങൾ',
    admin_security_desc: 'രണ്ട് ഘട്ട സുരക്ഷ (2FA), സെഷൻ ടൈംഔട്ട്, സന്ദർശക നിയന്ത്രണങ്ങൾ എന്നിവ നടപ്പിലാക്കുക.',
    session_timeout: 'ഇനാക്റ്റിവിറ്റി സെഷൻ ടൈംഔട്ട് (മിനിറ്റുകൾ)',
    require_2fa_policy: 'നിർബന്ധിത 2-ഘട്ട സുരക്ഷ (2FA)',
    restrict_visitor_policy: 'സന്ദർശകരെ കർശനമായി തടയുക (എല്ലാ ക്രമീകരണങ്ങളും മറയ്ക്കുക)',
    rbac_matrix_title: 'റോൾ അടിസ്ഥാനത്തിലുള്ള അനുമതി പട്ടിക (RBAC)',
    rbac_matrix_desc: 'ഓരോ ജീവനക്കാരനും ലഭ്യമായ അധികാരങ്ങൾ.',

    audit_trail_title: 'മാറ്റമില്ലാത്ത ഓഡിറ്റ് ട്രയൽ',
    audit_trail_desc: 'എല്ലാ ഇടപാടുകളുടെയും ജോബ് കാർഡ് മാറ്റങ്ങളുടെയും പൂർണ്ണ വിവരങ്ങൾ.',
    clear_audit_logs: 'ഓഡിറ്റ് ലോഗുകൾ ഒഴിവാക്കുക',
    severity: 'തീവ്രത',
    category: 'വിഭാഗം',
    performed_by: 'ചെയ്ത വ്യക്തി',
    timestamp: 'തീയതി & സമയം',
    details: 'വിശദാംശങ്ങൾ',

    database_title: 'MySQL / MariaDB ഡാറ്റാബേസ് സ്ഥിതി',
    database_desc: 'റിലേഷണൽ ഡാറ്റാബേസ് ആരോഗ്യ നില, മെയിന്റനൻസ് ടൂളുകൾ, ബാക്കപ്പുകൾ.',
    tables_count: 'പട്ടികകൾ',
    server_engine: 'ഡാറ്റാബേസ് എൻജിൻ',
    export_json_backup: 'ഡാറ്റ ബാക്കപ്പ് ഡൗൺലോഡ് ചെയ്യുക (JSON)',
    reset_sample_data: 'സാമ്പിൾ ഡാറ്റയിലേക്ക് പുനഃസ്ഥാപിക്കുക',
  },

  ar: {
    app_title: 'مجموعة أيبكس ERP للسيارات',
    search_placeholder: 'بحث في الطلبات والقطع وأرقام اللوحات والعملاء (Ctrl+K)...',
    new_action: 'إجراء جديد',
    notifications: 'الإشعارات',
    mark_all_read: 'تحديد الكل كمقروء',
    no_notifications: 'لا توجد إشعارات جديدة',
    current_role: 'الدور الحالي',
    simulate_role: 'محاكاة الدور (الصلاحيات)',
    visitor_mode: 'وضع الزائر',
    restricted_guest: 'زائر مقيّد',
    reset_db: 'إعادة ضبط قاعدة البيانات',
    db_status_connected: '11 جدولاً • متصل',
    public_readonly: 'عام / للقراءة فقط',
    language: 'اللغة',
    select_language: 'اختر اللغة',

    mod_dashboard: 'لوحة التحكم',
    mod_job_cards: 'بطاقات العمل والورشة',
    mod_estimates: 'تقديرات المركبات والتأمين',
    mod_supervisor_live: 'مباشر الورشة والفنيين',
    mod_workshop_inventory: 'قطع الغيار والمستهلكات',
    mod_job_card_pnl: 'أرباح وخسائر بطاقات العمل',
    mod_sales: 'أوامر المبيعات',
    mod_inventory: 'المخزون العام',
    mod_purchasing: 'أوامر الشراء والتوريد',
    mod_finance: 'المالية ودفتر الأستاذ',
    mod_hr: 'الموارد البشرية والرواتب',
    mod_manufacturing: 'التصنيع والتجميع',
    mod_settings: 'الإعدادات والإدارة',
    mod_php_source: 'شفرة PHP 8 المصدرية',
    mod_sql_console: 'موجه أوامر SQL',

    nav_workshop: 'عمليات الورشة والسيارات',
    nav_enterprise: 'النواة المؤسسية',
    nav_system: 'النظام والهندسة التقنية',

    btn_save: 'حفظ التغييرات',
    btn_cancel: 'إلغاء',
    btn_delete: 'حذف',
    btn_edit: 'تعديل',
    btn_add: 'إضافة',
    btn_close: 'إغلاق',
    btn_export_csv: 'تصدير CSV',
    btn_print: 'طباعة',
    btn_filter: 'تصفية',
    btn_refresh: 'تحديث',
    btn_search: 'بحث',
    btn_apply: 'تطبيق',
    btn_confirm: 'تأكيد',
    btn_new_job_card: 'بطاقة عمل جديدة',
    btn_new_estimate: 'تقدير جديد',
    btn_new_sales_order: 'أمر بيع جديد',
    btn_new_purchase_order: 'أمر شراء جديد',
    btn_record_expense: 'تسجيل مصروف',
    btn_add_product: 'إضافة صنف',
    btn_add_user: 'إضافة مستخدم جديد',

    role_owner: 'المالك (Owner)',
    role_admin: 'المدير العام (Admin)',
    role_workshop_supervisor: 'مشرف الورشة',
    role_accountant: 'المحاسب المالي',
    role_inventory_clerk: 'أمين المستودع',
    role_sales_rep: 'ممثل المبيعات والاستقبال',
    role_hr_manager: 'مدير الموارد البشرية',
    role_user: 'مستخدم قياسي',
    role_visitor: 'زائر (مقيد تماماً)',

    access_denied: 'تم رفض الوصول',
    visitor_restricted_title: 'وصول الزائر مقيّد تماماً',
    visitor_restricted_desc: 'حسابات الزوار ممنوعة بشكل صارم من عرض أو تعديل إعدادات النظام، أو إدارة المستخدمين، أو لوحات الإدارة.',
    return_to_dashboard: 'العودة إلى لوحة التحكم',
    visitor_no_settings: 'ليس لدى حساب الزائر أي صلاحيات لعرض الإعدادات أو لوحات التحكم الإدارية.',
    permission_restricted: 'ليس لديك الصلاحية الكافية لعرض هذه الصفحة.',

    tab_general: 'الإعدادات العامة والمنشأة',
    tab_users: 'إدارة المستخدمين والصلاحيات',
    tab_admin: 'الأمان ولوحة الإدارة',
    tab_audit: 'سجل التدقيق والأنشطة',
    tab_database: 'قاعدة البيانات والصيانة',
    settings_title: 'إعدادات النظام والإدارة العامة',
    settings_desc: 'إدارة بيانات المنشأة، تعيين الصلاحيات، سياسات الأمان المتقدمة، وسجلات التدقيق غير القابلة للتعديل.',

    company_name: 'اسم الورشة / الشركة',
    base_currency: 'العملة الأساسية للنظام',
    vat_rate: 'نسبة ضريبة القيمة المضافة (%)',
    vat_number: 'الرقم الضريبي',
    cr_number: 'رقم السجل التجاري (CR)',
    contact_phone: 'رقم الهاتف الرئيسي',
    contact_email: 'البريد الإلكتروني',
    workshop_address: 'عنوان الورشة والموقع',
    workshop_bays: 'عدد مسارات / جسور الورشة',
    default_labor_rate: 'أجرة ساعة اليد العاملة الافتراضية',

    user_list: 'مستخدمو النظام والاعتمادات',
    add_new_user: 'إضافة مستخدم للنظام',
    full_name: 'الاسم الكامل',
    email_address: 'البريد الإلكتروني',
    phone_number: 'رقم الهاتف',
    department: 'القسم / الإدارة',
    status: 'الحالة',
    two_factor_auth: 'المصادقة الثنائية (2FA)',
    last_login: 'آخر تسجيل دخول',
    actions: 'الإجراءات',
    active: 'نشط',
    suspended: 'موقوف',
    pending: 'معلق',

    admin_security_panel: 'الأمان المتقدم وسياسات الحماية',
    admin_security_desc: 'فرض المصادقة الثنائية، فترات انتهاء الجلسات، وقفل الوصول للزوار لمنع تسرب البيانات.',
    session_timeout: 'مهلة خمول الجلسة (بالدقائق)',
    require_2fa_policy: 'إلزام المصادقة الثنائية (2FA)',
    restrict_visitor_policy: 'حظر الزوار الصارم (إخفاء كافة الإعدادات والماليات)',
    rbac_matrix_title: 'مصفوفة التحكم في الوصول بناءً على الأدوار (RBAC)',
    rbac_matrix_desc: 'الصلاحيات المتاحة لكل مسمى وظيفي في المؤسسة.',

    audit_trail_title: 'سجل التدقيق الرقمي الموثق',
    audit_trail_desc: 'سجل آمن وغير قابل للتلاعب يسجل جميع التعديلات والحركات وأوامر الصيانة وتحديثات الأمان.',
    clear_audit_logs: 'تفريغ سجل التدقيق',
    severity: 'مستوى الخطورة',
    category: 'التصنيف',
    performed_by: 'تم التنفيذ بواسطة',
    timestamp: 'التاريخ والوقت',
    details: 'التفاصيل',

    database_title: 'حالة قاعدة بيانات MySQL / MariaDB',
    database_desc: 'مؤشرات الأداء لقاعدة البيانات العلائقية، النسخ الاحتياطي، وأدوات الصيانة.',
    tables_count: 'الجداول العلائقية',
    server_engine: 'محرك قاعدة البيانات',
    export_json_backup: 'تصدير نسخة احتياطية كاملة (JSON)',
    reset_sample_data: 'استعادة بيانات المصنع التجريبية',
  },

  bn: {
    app_title: 'অ্যাপেক্স ইআরপি স্যুট',
    search_placeholder: 'অর্ডার, পার্টস, গাড়ির নম্বর প্লেট, গ্রাহক খুঁজুন (Ctrl+K)...',
    new_action: 'নতুন অ্যাকশন',
    notifications: 'বিজ্ঞপ্তি',
    mark_all_read: 'সব পঠিত হিসেবে চিহ্নিত করুন',
    no_notifications: 'কোন বিজ্ঞপ্তি নেই',
    current_role: 'বর্তমান ভূমিকা',
    simulate_role: 'ভূমিকা পরিবর্তন (RBAC)',
    visitor_mode: 'ভিজিটর মোড',
    restricted_guest: 'সীমাবদ্ধ অতিথি',
    reset_db: 'ডাটাবেস রিসেট',
    db_status_connected: '১১টি টেবিল • সংযুক্ত',
    public_readonly: 'পাবলিক / শুধু দেখার জন্য',
    language: 'ভাষা',
    select_language: 'ভাষা নির্বাচন করুন',

    mod_dashboard: 'ড্যাশবোর্ড',
    mod_job_cards: 'জব কার্ড ও ওয়ার্কশপ',
    mod_estimates: 'গাড়ির প্রাক্কলন (এস্টিমেট)',
    mod_supervisor_live: 'ওয়ার্কশপ লাইভ ও টেকনিশিয়ান',
    mod_workshop_inventory: 'যন্ত্রাংশ ও মালামাল',
    mod_job_card_pnl: 'জব কার্ড লাভ ও ক্ষতি',
    mod_sales: 'বিক্রয় আদেশ (সেলস)',
    mod_inventory: 'মূল ইনভেন্টরি',
    mod_purchasing: 'ক্রয় আদেশ (পারচেজ)',
    mod_finance: 'অর্থ ও হিসাবরক্ষণ',
    mod_hr: 'মানবসম্পদ (এইচআর)',
    mod_manufacturing: 'ম্যানুফ্যাকচারিং (বিওএম)',
    mod_settings: 'সেটিংস ও অ্যাডমিন',
    mod_php_source: 'পিএইচপি ৮ সোর্স কোড',
    mod_sql_console: 'এসকিউএল কনসোল',

    nav_workshop: 'ওয়ার্কশপ কার্যক্রম',
    nav_enterprise: 'এন্টারপ্রাইজ কোর',
    nav_system: 'সিস্টেম ও স্থাপত্য',

    btn_save: 'পরিবর্তন সংরক্ষণ করুন',
    btn_cancel: 'বাতিল',
    btn_delete: 'মুছুন',
    btn_edit: 'সম্পাদনা',
    btn_add: 'যোগ করুন',
    btn_close: 'বন্ধ করুন',
    btn_export_csv: 'CSV এক্সপোর্ট',
    btn_print: 'প্রিন্ট',
    btn_filter: 'ফিল্টার',
    btn_refresh: 'রিফ্রেশ',
    btn_search: 'অনুসন্ধান',
    btn_apply: 'প্রয়োগ করুন',
    btn_confirm: 'নিশ্চিত করুন',
    btn_new_job_card: 'নতুন জব কার্ড',
    btn_new_estimate: 'নতুন এস্টিমেট',
    btn_new_sales_order: 'নতুন সেলস অর্ডার',
    btn_new_purchase_order: 'নতুন পারচেজ অর্ডার',
    btn_record_expense: 'খরচ রেকর্ড করুন',
    btn_add_product: 'পণ্য যোগ করুন',
    btn_add_user: 'নতুন ব্যবহারকারী যোগ করুন',

    role_owner: 'মালিক (Owner)',
    role_admin: 'অ্যাডমিন (Admin)',
    role_workshop_supervisor: 'ওয়ার্কশপ সুপারভাইজার',
    role_accountant: 'হিসাবরক্ষক',
    role_inventory_clerk: 'ইনভেন্টরি ক্লার্ক',
    role_sales_rep: 'বিক্রয় প্রতিনিধি',
    role_hr_manager: 'এইচআর ম্যানেজার',
    role_user: 'সাধারণ ব্যবহারকারী',
    role_visitor: 'ভিজিটর (সীমাবদ্ধ)',

    access_denied: 'প্রবেশাধিকার নিষিদ্ধ',
    visitor_restricted_title: 'ভিজিটর অ্যাক্সেস সীমাবদ্ধ',
    visitor_restricted_desc: 'ভিজিটর অ্যাকাউন্টে সিস্টেম সেটিংস, ব্যবহারকারী ব্যবস্থাপনা অথবা অ্যাডমিন প্যানেল দেখা বা পরিবর্তন করা সম্পূর্ণ নিষিদ্ধ।',
    return_to_dashboard: 'ড্যাশবোর্ডে ফিরে যান',
    visitor_no_settings: 'ভিজিটর অ্যাকাউন্টের সেটিংস দেখার কোনো অনুমতি নেই।',
    permission_restricted: 'এই মডিউল দেখার জন্য আপনার উপযুক্ত অনুমতি নেই।',

    tab_general: 'সাধারণ ও প্রোফাইল',
    tab_users: 'ব্যবহারকারী ব্যবস্থাপনা (RBAC)',
    tab_admin: 'নিরাপত্তা ও অ্যাডমিন প্যানেল',
    tab_audit: 'কার্যকলাপ ও অডিট লগ',
    tab_database: 'ডাটাবেস ও রক্ষণাবেক্ষণ',
    settings_title: 'সিস্টেম সেটিংস ও প্রশাসন',
    settings_desc: 'প্রতিষ্ঠানের তথ্য, কর্মী অনুমতি, নিরাপত্তা নীতিমালা এবং সিস্টেমের অডিট লগ পরিচালনা করুন।',

    company_name: 'কোম্পানি / ওয়ার্কশপের নাম',
    base_currency: 'মূল পরিচালন মুদ্রা',
    vat_rate: 'ভ্যাট হার (%)',
    vat_number: 'ভ্যাট নিবন্ধন নম্বর',
    cr_number: 'সিআর নম্বর (বাণিজ্যিক নিবন্ধন)',
    contact_phone: 'যোগাযোগের ফোন নম্বর',
    contact_email: 'ইমেইল ঠিকানা',
    workshop_address: 'ওয়ার্কশপের ঠিকানা',
    workshop_bays: 'ওয়ার্কশপ বের সংখ্যা',
    default_labor_rate: 'সাধারণ লেবার রেট (প্রতি ঘণ্টা)',

    user_list: 'সিস্টেম ব্যবহারকারীদের তালিকা',
    add_new_user: 'ব্যবহারকারী যুক্ত করুন',
    full_name: 'পূর্ণ নাম',
    email_address: 'ইমেইল',
    phone_number: 'ফোন',
    department: 'বিভাগ',
    status: 'অবস্থা',
    two_factor_auth: 'টু-ফ্যাক্টর নিরাপত্তা (2FA)',
    last_login: 'সর্বশেষ লগইন',
    actions: 'পদক্ষেপ',
    active: 'সক্রিয়',
    suspended: 'স্থগিত',
    pending: 'অপেক্ষমাণ',

    admin_security_panel: 'উন্নত নিরাপত্তা ও নীতিমালা',
    admin_security_desc: 'টু-ফ্যাক্টর প্রমাণীকরণ, সেশন টাইমআউট এবং ভিজিটরদের কড়া নজরদারি নিশ্চিত করুন।',
    session_timeout: 'নিষ্ক্রিয় সেশন টাইমআউট (মিনিট)',
    require_2fa_policy: 'বাধ্যতামূলক টু-ফ্যাক্টর প্রমাণীকরণ (2FA)',
    restrict_visitor_policy: 'ভিজিটরদের জন্য কড়া বিধিনিষেধ (সেটিংস ও অর্থ লুকান)',
    rbac_matrix_title: 'ভূমিকা ভিত্তিক প্রবেশাধিকার ম্যাট্রিক্স (RBAC)',
    rbac_matrix_desc: 'প্রতিটি পদের জন্য অনুমোদিত মডিউলসমূহ।',

    audit_trail_title: 'অপরিবর্তনীয় অডিট ট্রেইল',
    audit_trail_desc: 'সমস্ত লেনদেন, জব কার্ডের অগ্রগতি এবং নিরাপত্তা পরিবর্তনের নির্ভরযোগ্য রেকর্ড।',
    clear_audit_logs: 'অডিট লগ খালি করুন',
    severity: 'তীব্রতা',
    category: 'বিভাগ',
    performed_by: 'সম্পাদনকারী',
    timestamp: 'তারিখ ও সময়',
    details: 'বিবরণ',

    database_title: 'MySQL / MariaDB ডাটাবেস স্বাস্থ্য',
    database_desc: 'রিলেশনাল ডাটাবেস কার্যকারিতা, রক্ষণাবেক্ষণ সরঞ্জাম এবং ডেটা ব্যাকআপ।',
    tables_count: 'টেবিল সংখ্যা',
    server_engine: 'ডাটাবেস ইঞ্জিন',
    export_json_backup: 'সম্পূর্ণ ডেটা ব্যাকআপ ডাউনলোড (JSON)',
    reset_sample_data: 'নমুনা তথ্যে পুনরায় সেট করুন',
  },

  ur: {
    app_title: 'ایپکس ای آر پی سویٹ برائے آٹوموٹو',
    search_placeholder: 'آرڈرز، پرزے، نمبر پلیٹس، اور کسٹمرز تلاش کریں (Ctrl+K)...',
    new_action: 'نیا عمل',
    notifications: 'اطلاعات',
    mark_all_read: 'سب کو پڑھا ہوا نشان زد کریں',
    no_notifications: 'کوئی نئی اطلاع نہیں',
    current_role: 'موجودہ کردار',
    simulate_role: 'کردار تبدیل کریں (RBAC)',
    visitor_mode: 'وزیٹر موڈ',
    restricted_guest: 'محدود مہمان',
    reset_db: 'ڈیٹا بیس ری سیٹ',
    db_status_connected: '11 جداول • منسلک',
    public_readonly: 'عوامی / صرف پڑھنے کے لیے',
    language: 'زبان',
    select_language: 'زبان منتخب کریں',

    mod_dashboard: 'ڈیش بورڈ',
    mod_job_cards: 'جاب کارڈز اور ورکشاپ',
    mod_estimates: 'گاڑیوں کے تخمینے',
    mod_supervisor_live: 'ورکشاپ لائیو اور ٹیکنیشنز',
    mod_workshop_inventory: 'پرزے اور استعمالی اشیاء',
    mod_job_card_pnl: 'جاب کارڈ نفع و نقصان',
    mod_sales: 'سیلز آرڈرز',
    mod_inventory: 'مرکزی انوینٹری',
    mod_purchasing: 'خریداری کے آرڈرز (PO)',
    mod_finance: 'مالیات اور لیجر',
    mod_hr: 'انسانی وسائل (HR)',
    mod_manufacturing: 'مینوفیکچرنگ (BOM)',
    mod_settings: 'ترتیبات اور ایڈمن',
    mod_php_source: 'پی ایچ پی 8 سورس کوڈ',
    mod_sql_console: 'ایس کیو ایل کنسول',

    nav_workshop: 'ورکشاپ کے آپریشنز',
    nav_enterprise: 'انٹرپرائز کور',
    nav_system: 'سسٹم اور فن تعمیر',

    btn_save: 'تبدیلیاں محفوظ کریں',
    btn_cancel: 'منسوخ کریں',
    btn_delete: 'حذف کریں',
    btn_edit: 'ترمیم کریں',
    btn_add: 'شامل کریں',
    btn_close: 'بند کریں',
    btn_export_csv: 'CSV برآمد کریں',
    btn_print: 'پرنٹ کریں',
    btn_filter: 'فلٹر',
    btn_refresh: 'تازہ کریں',
    btn_search: 'تلاش کریں',
    btn_apply: 'لاگو کریں',
    btn_confirm: 'تصدیق کریں',
    btn_new_job_card: 'نیا جاب کارڈ',
    btn_new_estimate: 'نیا تخمینہ',
    btn_new_sales_order: 'نیا سیلز آرڈر',
    btn_new_purchase_order: 'نیا خریداری آرڈر',
    btn_record_expense: 'خرچ درج کریں',
    btn_add_product: 'پروڈکٹ شامل کریں',
    btn_add_user: 'نیا صارف شامل کریں',

    role_owner: 'مالک (Owner)',
    role_admin: 'ایڈمن (Admin)',
    role_workshop_supervisor: 'ورکشاپ سپروائزر',
    role_accountant: 'اکاؤنٹنٹ',
    role_inventory_clerk: 'انوینٹری کلارک',
    role_sales_rep: 'سیلز نمائندہ',
    role_hr_manager: 'ایچ آر منیجر',
    role_user: 'معیاری صارف',
    role_visitor: 'وزیٹر (سختی سے محدود)',

    access_denied: 'رسائی مسترد کر دی گئی',
    visitor_restricted_title: 'وزیٹر کی رسائی سختی سے محدود ہے',
    visitor_restricted_desc: 'وزیٹر اکاؤنٹس کے لیے سسٹم کی ترتیبات، صارفین کے انتظام، یا ایڈمن پینلز کو دیکھنا یا تبدیل کرنا سختی سے منع ہے۔',
    return_to_dashboard: 'ڈیش بورڈ پر واپس جائیں',
    visitor_no_settings: 'وزیٹر اکاؤنٹ کے پاس ترتیبات یا ایڈمن پینل دیکھنے کی کوئی اجازت نہیں ہے۔',
    permission_restricted: 'آپ کے پاس اس ماڈیول کو دیکھنے کی اجازت نہیں ہے۔',

    tab_general: 'عمومی اور پروفائل',
    tab_users: 'صارفین کا انتظام (RBAC)',
    tab_admin: 'سیکیورٹی اور ایڈمن پینل',
    tab_audit: 'سرگرمی اور آڈٹ لاگ',
    tab_database: 'ڈیٹا بیس اور دیکھ بھال',
    settings_title: 'سسٹم کی ترتیبات اور انتظامیہ',
    settings_desc: 'ادارے کی تفصیلات، صارفین کی اجازتیں، سیکیورٹی پالیسیاں، اور سسٹم آڈٹ لاگز کا انتظام کریں۔',

    company_name: 'ورکشاپ / کمپنی کا نام',
    base_currency: 'بنیادی آپریٹنگ کرنسی',
    vat_rate: 'ویٹ کی شرح (%)',
    vat_number: 'ٹیکس رجسٹریشن نمبر',
    cr_number: 'کمرشل رجسٹریشن (CR)',
    contact_phone: 'رابطہ فون نمبر',
    contact_email: 'رابطہ ای میل',
    workshop_address: 'ورکشاپ کا پتہ',
    workshop_bays: 'ورکشاپ کے فعال راستے (Bays)',
    default_labor_rate: 'لیبر کی معیاری فی گھنٹہ اجرت',

    user_list: 'سسٹم کے صارفین کی فہرست',
    add_new_user: 'نیا صارف شامل کریں',
    full_name: 'مکمل نام',
    email_address: 'ای میل',
    phone_number: 'فون نمبر',
    department: 'شعبہ',
    status: 'حیثیت',
    two_factor_auth: 'ٹو فیکٹر سیکیورٹی (2FA)',
    last_login: 'آخری لاگ ان',
    actions: 'اقدامات',
    active: 'فعال',
    suspended: 'معطل',
    pending: 'زیر التواء',

    admin_security_panel: 'اعلیٰ درجے کی سیکیورٹی اور پالیسی',
    admin_security_desc: 'ٹو فیکٹر تصدیق، سیشن ٹائم آؤٹ، اور وزیٹرز کے لیے سخت سیکیورٹی نافذ کریں۔',
    session_timeout: 'غیر فعال سیشن ٹائم آؤٹ (منٹ)',
    require_2fa_policy: 'لازمی ٹو فیکٹر تصدیق (2FA)',
    restrict_visitor_policy: 'وزیٹرز پر سخت پابندی (تمام ترتیبات اور مالیات چھپائیں)',
    rbac_matrix_title: 'کردار کی بنیاد پر رسائی کنٹرول میٹرکس (RBAC)',
    rbac_matrix_desc: 'تنظیم میں ہر عہدے کے لیے دستیاب ماڈیولز کی اجازت۔',

    audit_trail_title: 'محفوظ اور ناقابل تغیر آڈٹ ٹریل',
    audit_trail_desc: 'تمام لین دین، جاب کارڈ کے مراحل، اور سیکیورٹی تبدیلیوں کا محفوظ ریکارڈ۔',
    clear_audit_logs: 'آڈٹ لاگز صاف کریں',
    severity: 'شدت',
    category: 'زمرہ',
    performed_by: 'عمل کرنے والا',
    timestamp: 'تاریخ اور وقت',
    details: 'تفصیلات',

    database_title: 'MySQL / MariaDB ڈیٹا بیس کی صحت',
    database_desc: 'ڈیٹا بیس کی کارکردگی، خودکار بیک اپس، اور ڈیٹا بیس کی دیکھ بھال۔',
    tables_count: 'جداول کی تعداد',
    server_engine: 'ڈیٹا بیس انجن',
    export_json_backup: 'مکمل ڈیٹا بیک اپ برآمد کریں (JSON)',
    reset_sample_data: 'پیداواری نمونہ ڈیٹا پر دوبارہ سیٹ کریں',
  },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
  t: (key: TranslationKey, fallback?: string) => string;
  currentLangInfo: LanguageOption;
  availableLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'APEX_ERP_SELECTED_LANG';

export const LanguageProvider: React.FC<{
  children: React.ReactNode;
  initialLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}> = ({ children, initialLanguage, onLanguageChange }) => {
  const [language, setLangState] = useState<SupportedLanguage>(() => {
    if (initialLanguage) return initialLanguage;
    const stored = typeof window !== 'undefined' ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;
    if (stored && ['en', 'ml', 'ar', 'bn', 'ur'].includes(stored)) {
      return stored as SupportedLanguage;
    }
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLangState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  const currentLangInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  const dir = currentLangInfo.dir;
  const isRtl = dir === 'rtl';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', language);
      document.documentElement.setAttribute('dir', dir);
    }
  }, [language, dir]);

  const t = (key: TranslationKey, fallback?: string): string => {
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English
    if (TRANSLATIONS.en[key]) {
      return TRANSLATIONS.en[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        dir,
        isRtl,
        t,
        currentLangInfo,
        availableLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      <div dir={dir} className="contents">
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
