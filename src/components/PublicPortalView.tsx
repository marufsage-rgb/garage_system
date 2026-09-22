import React, { useState, useMemo } from 'react';
import {
  Car,
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  Printer,
  Share2,
  ArrowRight,
  ChevronRight,
  Fuel,
  Settings as WrenchIcon,
  Shield,
  Layers,
  Check,
  Send,
  User,
  Info,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { ERPState, JobCard } from '../types';
import { ZukaitEmblem, ZukaitBrandHeader, ZukaitSignboard, ZukaitWorkshopShowcase } from './ZukaitBrand';

interface PublicPortalViewProps {
  state: ERPState;
  onNavigate?: (module: any) => void;
  onNavigateToJobCards?: () => void;
  onBookAppointment?: (appointment: any) => void;
}

export const PublicPortalView: React.FC<PublicPortalViewProps> = ({
  state,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'tracking' | 'services' | 'photos' | 'about' | 'booking'>('tracking');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedCardId, setSearchedCardId] = useState<string>('R-4011');

  // Booking appointment state
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingVehicle, setBookingVehicle] = useState('');
  const [bookingService, setBookingService] = useState('Computerized Paint & Denting');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  // All job cards
  const jobCards = useMemo(() => state.jobCards || [], [state.jobCards]);

  // Find tracked job card
  const trackedCard: JobCard | undefined = useMemo(() => {
    if (!searchedCardId && !searchQuery) {
      return jobCards[0];
    }
    const q = (searchQuery || searchedCardId).trim().toLowerCase();
    return jobCards.find(
      (jc) =>
        jc.jobCardNumber.toLowerCase().includes(q) ||
        (jc.plateNumber && jc.plateNumber.toLowerCase().includes(q)) ||
        (jc.contactPhone && jc.contactPhone.toLowerCase().includes(q)) ||
        jc.customerName.toLowerCase().includes(q) ||
        (jc.vinNumber && jc.vinNumber.toLowerCase().includes(q)) ||
        (jc.vehicleDetails && jc.vehicleDetails.toLowerCase().includes(q))
    ) || jobCards[0];
  }, [jobCards, searchedCardId, searchQuery]);

  const stages: { key: string; label: string; desc: string; icon: any }[] = [
    { key: 'parts_waiting', label: 'Parts Waiting', desc: 'Parts sourcing and logistics verification', icon: Clock },
    { key: 'denting', label: 'Denting & Alignment', desc: 'Hydraulic chassis pull & precision bodywork', icon: Wrench },
    { key: 'painting', label: 'Paint Booth Oven', desc: 'Computerized shade matching & thermal bake', icon: Sparkles },
    { key: 'ready_to_deliver', label: 'QC & Ready for Pickup', desc: 'Final polish, wash, and inspection passed', icon: CheckCircle2 },
    { key: 'delivered', label: 'Delivered to Client', desc: 'Vehicle handed over with repair warranty', icon: Car },
  ];

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'parts_waiting': return 0;
      case 'denting': return 1;
      case 'painting': return 2;
      case 'ready_to_deliver': return 3;
      case 'delivered':
      case 'completed': return 4;
      default: return 1;
    }
  };

  const currentStageIndex = trackedCard ? getStageIndex(trackedCard.status) : 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchedCardId(searchQuery.trim());
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSubmitted(true);
    setTimeout(() => {
      setBookingName('');
      setBookingPhone('');
      setBookingVehicle('');
      setBookingDate('');
      setBookingSubmitted(false);
    }, 4000);
  };

  const handlePrintPass = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ─────────────────────────────────────────────────────────
          AUTHENTIC WORKSHOP SIGNBOARD FASCIA
      ───────────────────────────────────────────────────────── */}
      <ZukaitSignboard />

      {/* ─────────────────────────────────────────────────────────
          TOP BRANDING & PUBLIC ANNOUNCEMENT HEADER
      ───────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-2xl shadow-xl overflow-hidden border border-slate-800">
        <div className="px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4 max-w-2xl">
              <ZukaitEmblem size={56} useImage={true} className="ring-2 ring-orange-500/50 hidden sm:block shrink-0" />
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>OFFICIAL PUBLIC TRACKING & SERVICES PORTAL</span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                  <span className="text-orange-500">ZUKAIT AUTO SERVICES</span> INTERNATIONAL L.L.C.
                  <span className="block text-sm md:text-base font-bold text-orange-400 mt-1 font-arabic">
                    زكيت لخدمات السيارات الدولية ش.م.م • Barka Industrial Area
                  </span>
                </h1>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  State-of-the-Art Automotive Collision, Hydraulic ATS Service Lifts, Italian Computerized Paint Booth, 3D Chassis Alignment, and Express Lube Center. Under the executive leadership of Owner & CEO <strong className="text-white font-bold">ANSHAD</strong> (+968 94616364).
                </p>
              </div>
            </div>

            {/* Quick Contact Badges */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              <a
                href="https://wa.me/96894616364?text=Hello%20CEO%20Anshad,%20I%20am%20inquiring%20about%20my%20vehicle%20service%20at%20Zukait%20Auto%20Services"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>WhatsApp Owner (Anshad)</span>
                </div>
                <span className="text-[11px] font-mono bg-emerald-700/60 px-2 py-0.5 rounded">
                  +968 94616364
                </span>
              </a>

              <a
                href="tel:+96893211154"
                className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-orange-400" />
                  <span>Workshop Reception</span>
                </div>
                <span className="text-[11px] font-mono text-slate-300">
                  +968 93211154
                </span>
              </a>

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 font-mono">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>C.R. No: 1194220 • 5% Oman VAT</span>
              </div>
            </div>
          </div>

          {/* Navigation Bar for Public View */}
          <div className="flex flex-wrap gap-2 pt-6 mt-6 border-t border-slate-800/80">
            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tracking'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Live Vehicle Tracker</span>
            </button>

            <button
              onClick={() => setActiveTab('photos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'photos'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Workshop Photos & Facility</span>
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Workshop Services</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'about'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Company Information</span>
            </button>

            <button
              onClick={() => setActiveTab('booking')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'booking'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Service / Inspection</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          TAB 1: LIVE VEHICLE & JOB CARD TRACKER
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          {/* Tracking Search Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
              Track Your Vehicle Repair Progress in Real-Time
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter your Job Card Number (e.g. <strong className="text-indigo-600">R-4011</strong>, <strong className="text-indigo-600">L-2023</strong>), Vehicle Plate Number, or Registered Customer Phone.
            </p>

            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Job Card (R-4011), Plate (7842 A), or Phone..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Track Vehicle</span>
              </button>
            </form>

            {/* Quick Demo Search Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Sample Tracking:
              </span>
              {jobCards.slice(0, 4).map((jc) => (
                <button
                  key={jc.id}
                  onClick={() => {
                    setSearchQuery(jc.jobCardNumber);
                    setSearchedCardId(jc.jobCardNumber);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                    trackedCard?.id === jc.id
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {jc.jobCardNumber} ({jc.vehicleDetails || 'Vehicle'})
                </button>
              ))}
            </div>
          </div>

          {/* Tracked Vehicle Status Display */}
          {trackedCard ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase tracking-wide">
                        {trackedCard.jobCardNumber}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        VIN: {trackedCard.vinNumber || 'OM-98218-VIN'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                        {trackedCard.jobType === 'bodyshop' ? 'Body & Paint Shop' : 'Express Lube Center'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      {trackedCard.vehicleDetails || 'Vehicle'} ({trackedCard.plateNumber || 'No Plate'})
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center gap-4 mt-0.5">
                      <span>Customer: <strong>{trackedCard.customerName}</strong></span>
                      <span>Bay: <strong>Bay #{trackedCard.bayNumber || 3}</strong></span>
                      <span>Supervisor: <strong>Rashid Al-Ghafri</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintPass}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Status Slip</span>
                  </button>
                  <a
                    href={`https://wa.me/96894616364?text=Hello%20Anshad,%20inquiring%20about%20Job%20Card%20${trackedCard.jobCardNumber}%20(${encodeURIComponent(trackedCard.vehicleDetails || 'Vehicle')})`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Direct WhatsApp CEO Anshad</span>
                  </a>
                </div>
              </div>

              {/* Multi-Step Repair Journey Tracker */}
              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                    Current Repair Progress Milestone
                  </h4>
                  <div className="relative">
                    {/* Connecting Line */}
                    <div className="hidden md:block absolute top-5 left-8 right-8 h-1 bg-slate-200 -z-0">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
                      />
                    </div>

                    {/* Step Nodes */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                      {stages.map((stg, idx) => {
                        const Icon = stg.icon;
                        const isCompleted = idx < currentStageIndex;
                        const isCurrent = idx === currentStageIndex;
                        return (
                          <div
                            key={stg.key}
                            className={`p-4 rounded-xl border transition-all ${
                              isCurrent
                                ? 'bg-indigo-50/80 border-indigo-400 shadow-sm'
                                : isCompleted
                                ? 'bg-white border-slate-200'
                                : 'bg-slate-50/50 border-slate-100 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-3 md:flex-col md:items-center md:text-center">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                                  isCurrent
                                    ? 'bg-indigo-600 text-white shadow-md ring-4 ring-indigo-100'
                                    : isCompleted
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 md:justify-center">
                                  <span className="text-xs font-bold text-slate-800">
                                    {stg.label}
                                  </span>
                                  {isCurrent && (
                                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                  {stg.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Tracking Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Lead Certified Technician
                    </div>
                    <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-600" />
                      <span>{trackedCard.assignedTechnicianName || 'Kamal Al-Busaidi'}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Automotive Bodyshop & Paint Specialist (ASE Certified)
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Intake & Estimated Completion
                    </div>
                    <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>2026-09-24 (Estimated)</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Intake Date: {trackedCard.createdAt?.substring(0, 10) || '2026-09-18'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Workshop Guarantee
                    </div>
                    <div className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>12 Months Paint & Labor Warranty</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      OEM Grade Standox Paint & Computerized Oven Cure
                    </div>
                  </div>
                </div>

                {/* Repair Notes by Supervisor */}
                {trackedCard.notes && (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                    <div className="font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-amber-700" />
                      <span>Workshop Inspection & Supervisor Notes</span>
                    </div>
                    <p className="text-amber-800 leading-relaxed">
                      {trackedCard.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Job Card Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Please verify the Job Card number or contact Reception at +968 93211154.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          TAB: WORKSHOP PHOTOS & FACILITY SHOWCASE
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2 py-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold border border-orange-200">
              <Camera className="w-3.5 h-3.5 text-orange-600" />
              <span>BARKA WORKSHOP PHOTO TOUR & SERVICE BAYS</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900">
              Inside Zukait Auto Services International
            </h2>
            <p className="text-xs md:text-sm text-slate-500">
              State-of-the-art facility featuring 8 hydraulic ATS lifts, computerized paint oven, precision unibody frame alignment, and dedicated quick lube bays in Barka Sanayya.
            </p>
          </div>

          {/* Main Hero Workshop Photo Showcase with interactive expand modal */}
          <ZukaitWorkshopShowcase onBookService={() => setActiveTab('booking')} />

          {/* Detailed Service Bay Photo Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="relative h-44 rounded-xl overflow-hidden bg-slate-900">
                <img
                  src="/assets/zukait_workshop.jpg"
                  alt="Hydraulic Car Lift Bay"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-orange-600 text-white text-[11px] font-bold">
                  Bays 1 & 2 • ATS ELGI Lifts
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Hydraulic Vehicle Service Lifts</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Two-post heavy-duty ATS ELGI hydraulic vehicle lifts for safe suspension overhauls, brake disc skimming, chassis inspection, and exhaust works.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="relative h-44 rounded-xl overflow-hidden bg-slate-900">
                <img
                  src="/assets/zukait_workshop.jpg"
                  alt="Diagnostic & Electrical Station"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-blue-600 text-white text-[11px] font-bold">
                  Bays 3 & 4 • Diagnostics & AC
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Computer Diagnostics & AC Station</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Dedicated electronic testing terminal with live ECU scanners, oscilloscope wave analysis, automated R134a/R1234yf AC refrigerant recovery and flush.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="relative h-44 rounded-xl overflow-hidden bg-slate-900">
                <img
                  src="/assets/zukait_logo.jpg"
                  alt="Official Zukait Brand Emblem"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain p-4 bg-slate-950 hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-slate-800 text-orange-400 text-[11px] font-bold border border-orange-500/40">
                  Official Brand Identity
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Zukait Auto Services Emblem</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Registered trademark and official logo emblem for Zukait Auto Services International L.L.C. (C.R. 1194220), Sultanate of Oman.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          TAB 2: WORKSHOP SERVICES & FACILITY SHOWCASE
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2 py-4">
            <h2 className="text-xl md:text-2xl font-black text-slate-900">
              Complete Automotive Solutions Under One Roof
            </h2>
            <p className="text-xs md:text-sm text-slate-500">
              Equipped with European downdraft spray booths, laser frame alignment machines, and advanced diagnostics in Barka Industrial Area.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Service 1 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Italian Computerized Paint Oven</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Downdraft thermal spray booth with computerized spectrophotometer color matching. Guaranteed zero dust particles, OEM factory gloss, and 12-month clearcoat guarantee.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Computerized PPG / Standox Paint Mixing</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Infrared Rapid Curing Lamps</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3-Stage Ceramic Polish & Protection</span>
                </li>
              </ul>
            </div>

            {/* Service 2 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Heavy Collision & Chassis Alignment</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Hydraulic 10-ton pulling bench with digital ultrasonic measuring system to restore unibody and ladder frames to original factory tolerances after accidents.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Laser Chassis & Frame Bench</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Spot Welding & Argon Aluminum Repair</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Paintless Dent Removal (PDR)</span>
                </li>
              </ul>
            </div>

            {/* Service 3 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Fuel className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Express Lube & Oil Center</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  15-minute express oil change using fully synthetic OEM certified oils (Castrol, Mobil 1, Shell). Includes 25-point complimentary safety check.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>OEM Oil, Air & Cabin Filter Replacements</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Coolant & Brake Fluid Flush</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Free Battery & Alternator Health Check</span>
                </li>
              </ul>
            </div>

            {/* Service 4 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Insurance Claim Quotations (5% VAT)</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Official registered repair facility for major Sultanate of Oman insurance firms (Oman Qatar Insurance, Dhofar Insurance, National Life, etc.).
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Direct Surveyor Inspection Bay</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Lumpsum or Itemized Spare Parts Quotations</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Full WhatsApp / PDF Quotation Dispatch</span>
                </li>
              </ul>
            </div>

            {/* Service 5 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <WrenchIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">3D Wheel Alignment & Suspension</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  High-definition camera 3D wheel alignment system to correct tire wear, vehicle pulling, and steering wheel alignment with instant before/after printout.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Camber, Caster & Toe Precision Adjustment</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bushing & Control Arm Replacements</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dynamic Electronic Wheel Balancing</span>
                </li>
              </ul>
            </div>

            {/* Service 6 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Computerized OBD-II Diagnostics</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Deep scanning for European, Japanese, and American vehicles. Engine check light, transmission, ABS, Airbag, and hybrid powertrain diagnosis.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Live Sensor Data Stream & Graphing</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Module Coding & Adaptations</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Full System Diagnostic Health Report</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          TAB 3: COMPANY INFORMATION & CONTACT
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'about' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <ZukaitEmblem size={44} useImage={true} className="ring-1 ring-orange-500/40" />
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                  <span className="text-orange-600">ZUKAIT AUTO SERVICES</span> INTERNATIONAL L.L.C.
                </h3>
                <p className="text-xs text-orange-500 font-bold font-arabic">
                  زكيت لخدمات السيارات الدولية ش.م.م
                </p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>ZUKAIT AUTO SERVICES INTERNATIONAL L.L.C. (زكيت لخدمات السيارات الدولية ش.م.م)</strong> is a premier automotive engineering, collision repair, computerized diagnostics, and vehicle maintenance facility based in the Sultanate of Oman.
              </p>
              <p>
                Under the direct executive stewardship of <strong>Owner & CEO ANSHAD</strong> (+968 94616364), Zukait Auto Services operates an 8-bay heavy-duty industrial workshop equipped with two-post ATS ELGI hydraulic vehicle lifts, computerized paint curing ovens, unibody frame alignment benches, and certified automotive diagnostic technicians.
              </p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] space-y-1.5 text-slate-700">
                <div>Company Name: <strong className="text-slate-900">ZUKAIT AUTO SERVICES INTERNATIONAL L.L.C.</strong></div>
                <div>Arabic Name: <strong className="font-arabic text-slate-900">زكيت لخدمات السيارات الدولية ش.م.م</strong></div>
                <div>Commercial Registration (C.R.): <strong className="text-orange-600">1194220 / س.ت: ١١٩٤٢٢٠</strong></div>
                <div>VAT Identification Number: <strong>OM-VAT-1194220</strong></div>
                <div>Tax Rate: <strong>5.0% Sultanate of Oman VAT Compliant</strong></div>
                <div>Specialties: <strong>Computer Checking • AC Works • Electrical • Car Care • Quick Lube</strong></div>
                <div>Location: <strong>Sanayya, Barka Industrial Area, Sultanate of Oman</strong></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Contact & Working Hours</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-900">Owner & CEO (ANSHAD)</div>
                  <div className="text-emerald-700 font-mono">+968 94616364</div>
                </div>
                <a
                  href="https://wa.me/96894616364"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  WhatsApp
                </a>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Workshop Reception & Desk</div>
                  <div className="text-slate-600 font-mono">+968 93211154 / +968 92403420</div>
                </div>
                <a
                  href="tel:+96893211154"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                >
                  Call Now
                </a>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Workshop Operational Hours</span>
                </div>
                <div className="text-slate-600 text-[11px] space-y-0.5">
                  <div>• Saturday to Thursday: <strong>8:00 AM – 1:00 PM</strong> & <strong>4:00 PM – 9:00 PM</strong></div>
                  <div>• Friday: <strong>Closed (Maintenance & System Calibration)</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          TAB 4: BOOKING SERVICE APPOINTMENT
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'booking' && (
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="text-center space-y-1 mb-6">
            <h2 className="text-lg font-bold text-slate-900">Book Workshop Service or Estimate</h2>
            <p className="text-xs text-slate-500">
              Submit your vehicle details to reserve an inspection bay at Barka Industrial Center.
            </p>
          </div>

          {bookingSubmitted ? (
            <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-in fade-in">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-emerald-900">Appointment Request Submitted!</h3>
              <p className="text-xs text-emerald-700">
                Thank you, {bookingName}. Our front desk reception (+968 93211154) or CEO Anshad will confirm your slot via WhatsApp promptly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name / Company *
                </label>
                <input
                  type="text"
                  required
                  value={bookingName}
                  onChange={(e) => setBookingName(e.target.value)}
                  placeholder="e.g. Salim Al-Harthy"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    placeholder="+968 9xxx xxxx"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Vehicle Model & Plate *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingVehicle}
                    onChange={(e) => setBookingVehicle(e.target.value)}
                    placeholder="e.g. Toyota Prado (7842 A)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Required Service
                  </label>
                  <select
                    value={bookingService}
                    onChange={(e) => setBookingService(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="Computerized Paint & Denting">Computerized Paint & Denting</option>
                    <option value="Heavy Collision Repair">Heavy Collision Repair</option>
                    <option value="Express Oil & Filter Change">Express Oil & Filter Change</option>
                    <option value="Insurance Claim Estimate">Insurance Claim Estimate (5% VAT)</option>
                    <option value="3D Wheel Alignment">3D Wheel Alignment & Suspension</option>
                    <option value="OBD-II Computer Diagnostic">OBD-II Computer Diagnostic</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer mt-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Booking to Reception</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
