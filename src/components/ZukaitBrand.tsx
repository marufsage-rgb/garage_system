import React, { useState } from 'react';
import {
  Wrench,
  ShieldCheck,
  Phone,
  MapPin,
  Sparkles,
  Maximize2,
  X,
  Car,
  Activity,
  Award,
  CheckCircle2
} from 'lucide-react';

interface ZukaitEmblemProps {
  size?: number | string;
  className?: string;
  useImage?: boolean;
}

/**
 * High-definition circular vector emblem matching the official Zukait Auto Services International emblem:
 * Dark slate circular container, stylized "Z" with left speed stripes and vibrant orange right triangle accent.
 */
export const ZukaitEmblem: React.FC<ZukaitEmblemProps> = ({
  size = 40,
  className = '',
  useImage = false
}) => {
  const [imgError, setImgError] = useState(false);

  if (useImage && !imgError) {
    return (
      <img
        src="/assets/zukait_logo.jpg"
        alt="Zukait Auto Services Emblem"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const dim = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg
      viewBox="0 0 100 100"
      className={`shrink-0 drop-shadow-sm select-none ${className}`}
      style={{ width: dim, height: dim }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circular badge */}
      <circle cx="50" cy="50" r="48" fill="#1E293B" stroke="#EA580C" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="44" fill="#0F172A" />

      {/* Speed stripes on left upper quadrant */}
      <g fill="#94A3B8" opacity="0.9">
        <rect x="20" y="27" width="18" height="3" rx="1.5" />
        <rect x="18" y="33" width="22" height="3" rx="1.5" />
        <rect x="16" y="39" width="26" height="3" rx="1.5" />
        <rect x="18" y="45" width="20" height="3" rx="1.5" />
      </g>

      {/* Stylized geometric letter Z */}
      {/* Top horizontal bar */}
      <path
        d="M20 25 H80 L72 35 H32 Z"
        fill="#F8FAFC"
      />
      {/* Diagonal spine */}
      <path
        d="M74 33 L32 67 H46 L82 37 Z"
        fill="#E2E8F0"
      />
      {/* Bottom horizontal bar */}
      <path
        d="M22 65 H78 L70 75 H16 Z"
        fill="#F8FAFC"
      />

      {/* Vibrant Orange Geometric Right Accent Triangle */}
      <path
        d="M52 46 L78 35 L70 63 Z"
        fill="#EA580C"
      />
      <path
        d="M58 50 L75 42 L69 61 Z"
        fill="#F97316"
      />

      {/* Lower Speed Lines */}
      <g fill="#94A3B8" opacity="0.8">
        <rect x="62" y="55" width="16" height="2.5" rx="1.25" />
        <rect x="58" y="61" width="18" height="2.5" rx="1.25" />
      </g>

      {/* Inner subtle glow ring */}
      <circle cx="50" cy="50" r="44" stroke="#EA580C" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
    </svg>
  );
};

interface ZukaitBrandHeaderProps {
  showBadges?: boolean;
  variant?: 'light' | 'dark' | 'compact';
  className?: string;
}

/**
 * Primary bilingual brand logotype component for ZUKAIT AUTO SERVICES INTERNATIONAL L.L.C.
 */
export const ZukaitBrandHeader: React.FC<ZukaitBrandHeaderProps> = ({
  showBadges = true,
  variant = 'light',
  className = ''
}) => {
  const isDark = variant === 'dark';
  const isCompact = variant === 'compact';

  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      <ZukaitEmblem size={isCompact ? 36 : 46} useImage={true} />
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-black tracking-tight uppercase leading-tight ${
              isCompact ? 'text-sm sm:text-base' : 'text-base sm:text-lg lg:text-xl'
            } ${isDark ? 'text-white' : 'text-slate-900'}`}
          >
            <span className="text-orange-600">ZUKAIT AUTO SERVICES</span>{' '}
            <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>INTERNATIONAL L.L.C.</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium">
          <span className="text-orange-500 font-bold font-arabic">
            زكيت لخدمات السيارات الدولية ش.م.م
          </span>
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>• Barka, Oman</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 font-bold">
            C.R. 1194220
          </span>
        </div>

        {showBadges && !isCompact && (
          <div className="hidden md:flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-[10px] font-bold text-orange-400 tracking-wide">
              COMPUTER CHECKING
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-[10px] font-bold text-orange-400 tracking-wide">
              AC WORKS
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-[10px] font-bold text-orange-400 tracking-wide">
              ELECTRICAL WORKS
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-[10px] font-bold text-orange-400 tracking-wide">
              CAR CARE
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Authentic Signboard Component matching the physical workshop's exterior fascia:
 * Black/slate industrial panel, orange accents, Arabic and English services listed on flanks.
 */
export const ZukaitSignboard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl border-2 border-orange-600 shadow-2xl overflow-hidden ${className}`}
    >
      {/* Top industrial orange beam strip */}
      <div className="h-2 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600" />

      <div className="p-4 sm:p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left Side: English Specialties (as on the real signboard) */}
        <div className="hidden xl:flex flex-col gap-1 text-[11px] font-bold tracking-wider uppercase text-slate-300 border-r border-slate-800 pr-6 shrink-0">
          <span className="text-orange-400 font-black mb-1 text-xs">MAIN SPECIALIZATIONS:</span>
          <span>• OIL & QUICK LUBE</span>
          <span>• BRAKE & AXLE SERVICE</span>
          <span>• ENGINE & GEAR REPAIR</span>
          <span>• ELECTRICAL & AC WORKS</span>
          <span>• COMPUTER DIAGNOSTICS</span>
        </div>

        {/* Center: Official Company Name and Emblem */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <ZukaitEmblem size={72} useImage={true} className="shadow-xl ring-2 ring-orange-500/50" />
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-none">
              <span className="text-orange-500">ZUKAIT AUTO SERVICES</span>{' '}
              <span className="text-slate-100">INTERNATIONAL L.L.C.</span>
            </h2>
            <p className="text-sm sm:text-base font-bold text-orange-400 font-arabic tracking-wide">
              زكيت لخدمات السيارات الدولية ش.م.م
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-400 font-mono pt-1">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                س.ت: ١١٩٤٢٢٠ / C.R. 1194220
              </span>
              <span>• Barka Sanayya, Sultanate of Oman</span>
            </div>
          </div>
        </div>

        {/* Right Side: Arabic Specialties (as on the real signboard) */}
        <div className="hidden xl:flex flex-col gap-1 text-[11px] font-bold text-right text-slate-300 border-l border-slate-800 pl-6 shrink-0 font-arabic">
          <span className="text-orange-400 font-black mb-1 text-xs">الخدمات المتخصصة:</span>
          <span>• تغيير الزيوت والخدمة السريعة</span>
          <span>• إصلاح محاور وفراميل السيارات</span>
          <span>• تصليح المكينة والجير الأوتوماتيك</span>
          <span>• الأعمال الكهربائية وتصليح المكيف</span>
          <span>• فحص شامل وبرمجة بالكمبيوتر</span>
        </div>
      </div>

      {/* Bottom 3 Pills (As on the official logo) */}
      <div className="bg-black/60 border-t border-slate-800 px-4 py-2.5 flex items-center justify-center gap-2 sm:gap-4 flex-wrap text-[11px] font-bold">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 text-orange-400 border border-orange-500/30">
          <span>فحص بالكمبيوتر</span>
          <span className="text-slate-500">|</span>
          <span className="text-white">COMPUTER CHECKING</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 text-orange-400 border border-orange-500/30">
          <span>تصليح المكيف</span>
          <span className="text-slate-500">|</span>
          <span className="text-white">AC WORKS</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 text-orange-400 border border-orange-500/30">
          <span>الأعمال الكهربائية</span>
          <span className="text-slate-500">|</span>
          <span className="text-white">ELECTRICAL WORKS</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 text-orange-400 border border-orange-500/30">
          <span>العناية بالسيارات</span>
          <span className="text-slate-500">|</span>
          <span className="text-white">CAR CARE</span>
        </div>
      </div>
    </div>
  );
};

/**
 * High-resolution Workshop Photo Banner showcasing the actual Barka facility,
 * ATS hydraulic service lifts, clean service bays, and executive contact.
 */
export const ZukaitWorkshopShowcase: React.FC<{ onBookService?: () => void }> = ({ onBookService }) => {
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden group">
        <img
          src="/assets/zukait_workshop.jpg"
          alt="Zukait Auto Services International Workshop Facility"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold border border-white/20">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>AUTHENTIC FACILITY • BARKA INDUSTRIAL AREA</span>
          </div>
          <button
            onClick={() => setPhotoModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold transition-colors cursor-pointer"
            title="View Full Workshop Image"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Expand Photo</span>
          </button>
        </div>

        {/* Bottom Facility Info */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-orange-600 text-white text-[11px] font-black uppercase tracking-wide">
                  Main Service Bays
                </span>
                <span className="text-xs text-orange-300 font-medium">8 Certified Heavy Hydraulic Lifts</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                Zukait International Automotive Engineering Center
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2 sm:line-clamp-none">
                Equipped with two-post ATS ELGI vehicle hydraulic service lifts, computerized diagnostics, engine repair cranes, computerized paint oven, and dedicated quick lube bays in Barka Sanayya.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://wa.me/96894616364?text=Hello%20Owner%20Anshad,%20I%20saw%20your%20Zukait%20Auto%20Services%20workshop%20and%20would%20like%20to%20inquire"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
              >
                <Phone className="w-4 h-4" />
                <span>Contact Owner Anshad</span>
              </a>
              {onBookService && (
                <button
                  onClick={onBookService}
                  className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Book Service Bay
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Facility Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border-t border-slate-200 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900">8 Dedicated Bays</div>
            <div className="text-[11px] text-slate-500">Hydraulic ATS Lifts</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900">OBD-II Diagnostics</div>
            <div className="text-[11px] text-slate-500">Live ECUs Scanning</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900">Official CR: 1194220</div>
            <div className="text-[11px] text-slate-500">5% Oman VAT Invoice</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900">Italian Paint Oven</div>
            <div className="text-[11px] text-slate-500">Downdraft Thermal Bake</div>
          </div>
        </div>
      </div>

      {/* Full Photo Modal */}
      {photoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 text-white">
              <div className="flex items-center gap-3">
                <ZukaitEmblem size={32} useImage={true} />
                <div>
                  <h4 className="font-bold text-sm text-white">Zukait Auto Services International L.L.C. Facility</h4>
                  <p className="text-xs text-orange-400 font-arabic">زكيت لخدمات السيارات الدولية ش.م.م • Barka, Oman</p>
                </div>
              </div>
              <button
                onClick={() => setPhotoModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto bg-black flex items-center justify-center p-2">
              <img
                src="/assets/zukait_workshop.jpg"
                alt="Full Workshop Facility View"
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-4 bg-slate-950 text-xs text-slate-400 flex items-center justify-between">
              <span>Barka Industrial Area (Sanayya Barka), Sultanate of Oman</span>
              <span className="font-mono text-orange-400">CEO & Owner ANSHAD: +968 94616364</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
