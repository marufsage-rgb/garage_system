import React, { useState, useRef, useEffect } from 'react';
import {
  FilePlus,
  PlusCircle,
  UserPlus,
  Car,
  Wrench,
  CheckCircle2,
  Phone,
  Calendar,
  Layers,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Mic,
  MicOff,
  Volume2
} from 'lucide-react';
import { ERPState, JobCard, Estimate, Customer } from '../types';
import { ZukaitEmblem } from './ZukaitBrand';

interface OperatorPortalViewProps {
  state: ERPState;
  onCreateJobCard: (card: JobCard) => void;
  onCreateEstimate: (estimate: Estimate) => void;
  onCreateCustomer?: (customer: Customer) => void;
  onNavigate: (module: any) => void;
}

export const OperatorPortalView: React.FC<OperatorPortalViewProps> = ({
  state,
  onCreateJobCard,
  onCreateEstimate,
  onCreateCustomer,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'new_job_card' | 'new_estimate' | 'new_customer' | 'recent_entries'>('new_job_card');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Form State: Fast Job Card Entry
  const [jcType, setJcType] = useState<'lube' | 'bodyshop'>('bodyshop');
  const [jcCustomerName, setJcCustomerName] = useState('');
  const [jcCustomerPhone, setJcCustomerPhone] = useState('');
  const [jcVehicleModel, setJcVehicleModel] = useState('');
  const [jcVehiclePlate, setJcVehiclePlate] = useState('');
  const [jcVehicleVin, setJcVehicleVin] = useState('');
  const [jcServiceType, setJcServiceType] = useState('Accident Repair & Paint');
  const [jcClaimNumber, setJcClaimNumber] = useState('');
  const [jcNotes, setJcNotes] = useState('');

  // Voice Memo / Web Speech API State
  const [isListeningJc, setIsListeningJc] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Check Web Speech API availability
  const isSpeechSupported = typeof window !== 'undefined' && 
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const toggleVoiceMemo = () => {
    setVoiceError(null);

    if (!isSpeechSupported) {
      setVoiceError('Web Speech API is not supported in this browser. Please try in Chrome, Edge, or Safari.');
      return;
    }

    if (isListeningJc) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsListeningJc(false);
      setInterimTranscript('');
      return;
    }

    try {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListeningJc(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let finalPhrase = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalPhrase += item[0].transcript + ' ';
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (finalPhrase.trim()) {
          setJcNotes((prev) => {
            const trimmed = prev.trim();
            const cleanFinal = finalPhrase.trim();
            return trimmed ? `${trimmed} ${cleanFinal}` : cleanFinal;
          });
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceError('Microphone permission blocked. Please allow mic access in browser.');
        } else if (event.error === 'no-speech') {
          setVoiceError('No speech detected. Please speak closer to the microphone.');
        } else if (event.error === 'audio-capture') {
          setVoiceError('No microphone detected or audio capture failed.');
        } else if (event.error !== 'aborted') {
          setVoiceError(`Voice memo error: ${event.error}`);
        }
        setIsListeningJc(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListeningJc(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start SpeechRecognition:', err);
      setVoiceError(err?.message || 'Could not start voice dictation.');
      setIsListeningJc(false);
    }
  };

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  // Form State: Fast Estimate Entry
  const [estCustomerName, setEstCustomerName] = useState('');
  const [estCustomerPhone, setEstCustomerPhone] = useState('');
  const [estVehicleModel, setEstVehicleModel] = useState('');
  const [estVehiclePlate, setEstVehiclePlate] = useState('');
  const [estFormat, setEstFormat] = useState<'itemized' | 'lumpsum'>('itemized');
  const [estAmount, setEstAmount] = useState<number>(250);
  const [estNotes, setEstNotes] = useState('');

  // Form State: Fast Customer Registration
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custVehicle, setCustVehicle] = useState('');

  // Submit Fast Job Card
  const handleJobCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jcCustomerName || !jcVehicleModel || !jcVehiclePlate) {
      alert('Please fill in required customer and vehicle fields.');
      return;
    }

    const nextIdNum = (state.jobCards?.length || 0) + 4015;
    const serial = jcType === 'lube' ? `L-${nextIdNum}` : `R-${nextIdNum}`;
    const newCard: JobCard = {
      id: `jc-${Date.now()}`,
      jobCardNumber: serial,
      jobType: jcType,
      status: 'parts_waiting',
      customerName: jcCustomerName,
      contactPhone: jcCustomerPhone || '+968 9000 0000',
      vehicleDetails: jcVehicleModel,
      plateNumber: jcVehiclePlate,
      vinNumber: jcVehicleVin || 'N/A',
      bayNumber: '2',
      assignedTechnicianName: 'Kamal Al-Busaidi',
      notes: jcNotes,
      isRepeatJob: false,
      partsRequired: [],
      consumablesUsed: [],
      laborEntries: [],
      createdAt: new Date().toISOString(),
    };

    onCreateJobCard(newCard);
    setSuccessNotice(`Job Card ${serial} created successfully by Operator desk!`);
    setTimeout(() => setSuccessNotice(null), 4000);

    // Reset fields
    if (isListeningJc && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      setIsListeningJc(false);
      setInterimTranscript('');
    }
    setJcCustomerName('');
    setJcCustomerPhone('');
    setJcVehicleModel('');
    setJcVehiclePlate('');
    setJcVehicleVin('');
    setJcClaimNumber('');
    setJcNotes('');
  };

  // Submit Fast Estimate
  const handleEstimateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!estCustomerName || !estVehicleModel || !estVehiclePlate) {
      alert('Please fill in required fields.');
      return;
    }

    const nextEstNum = (state.estimates?.length || 0) + 1020;
    const serial = `EST-${nextEstNum}`;
    const vatAmount = estAmount * 0.05;
    const totalWithVat = estAmount + vatAmount;

    const newEstimate: Estimate = {
      id: `est-${Date.now()}`,
      estimateNumber: serial,
      estimateType: estFormat === 'lumpsum' ? 'lumpsum' : 'parts_labour',
      customerName: estCustomerName,
      contactPhone: estCustomerPhone || '+968 9000 0000',
      vehicleDetails: `${estVehicleModel} (${estVehiclePlate})`,
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      totalAmount: estAmount,
      subtotal: estAmount,
      vatRate: 0.05,
      vatAmount: vatAmount,
      grandTotal: totalWithVat,
      status: 'draft',
      items: [
        {
          id: `p-${Date.now()}-1`,
          type: 'part',
          description: 'Repair & Parts Package',
          quantity: 1,
          unitPrice: estAmount * 0.6,
          total: estAmount * 0.6,
        },
        {
          id: `l-${Date.now()}-1`,
          type: 'labour',
          description: 'Bodyshop Labor & Thermal Paint Cure',
          quantity: 4,
          unitPrice: (estAmount * 0.4) / 4,
          total: estAmount * 0.4,
        },
      ],
    };

    onCreateEstimate(newEstimate);
    setSuccessNotice(`Estimate ${serial} recorded in draft status!`);
    setTimeout(() => setSuccessNotice(null), 4000);

    setEstCustomerName('');
    setEstCustomerPhone('');
    setEstVehicleModel('');
    setEstVehiclePlate('');
    setEstAmount(250);
    setEstNotes('');
  };

  // Submit Fast Customer
  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPhone) {
      alert('Please provide customer name and phone.');
      return;
    }

    if (onCreateCustomer) {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        name: custName,
        company: 'Private Owner',
        email: custEmail || `${custName.toLowerCase().replace(/\s+/g, '')}@client.om`,
        phone: custPhone,
        address: 'Barka, Sultanate of Oman',
        outstandingBalance: 0,
        status: 'active',
      };
      onCreateCustomer(newCust);
    }

    setSuccessNotice(`Customer ${custName} registered into workshop directory!`);
    setTimeout(() => setSuccessNotice(null), 4000);

    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setCustVehicle('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Operator Safety & Scope Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ZukaitEmblem size={52} useImage={true} className="ring-2 ring-orange-500/40 shrink-0 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-900 uppercase tracking-wide">
                OPERATOR DESK • ZUKAIT AUTO SERVICES
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Barka Facility • Bay 1-8
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 mt-0.5">
              Rapid Workshop Intake & Job Card Entry
            </h1>
            <p className="text-xs text-slate-500">
              High-speed shop floor entry for Job Cards, Estimates, and Client Intake. Voice memo and rapid plate identification enabled.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
            <img
              src="/assets/zukait_workshop.jpg"
              alt="Barka Workshop Bay"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-200"
            />
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-slate-800 block">Barka Workshop</span>
              <span className="text-emerald-600 font-medium">● 8 Bays Active</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('job_cards')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <span>View All Job Cards</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Operator Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('new_job_card')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'new_job_card'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>1. Fast Job Card Entry</span>
        </button>

        <button
          onClick={() => setActiveTab('new_estimate')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'new_estimate'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>2. Fast Estimate Entry</span>
        </button>

        <button
          onClick={() => setActiveTab('new_customer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'new_customer'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>3. Fast Customer Intake</span>
        </button>

        <button
          onClick={() => setActiveTab('recent_entries')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'recent_entries'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Recent Entries Today ({state.jobCards?.length || 0})</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────
          TAB 1: FAST JOB CARD ENTRY
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'new_job_card' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Create Workshop Job Card (Intake Desk)
              </h2>
              <p className="text-xs text-slate-500">
                Register incoming vehicle for Lube or Bodyshop bay. Serial will be auto-generated.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setJcType('bodyshop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  jcType === 'bodyshop' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Bodyshop (R-Series)
              </button>
              <button
                type="button"
                onClick={() => setJcType('lube')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  jcType === 'lube' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Lube Center (L-Series)
              </button>
            </div>
          </div>

          <form onSubmit={handleJobCardSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={jcCustomerName}
                  onChange={(e) => setJcCustomerName(e.target.value)}
                  placeholder="e.g. Salim Al-Harthy"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Customer Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={jcCustomerPhone}
                  onChange={(e) => setJcCustomerPhone(e.target.value)}
                  placeholder="+968 9xxx xxxx"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Vehicle Make & Model *
                </label>
                <input
                  type="text"
                  required
                  value={jcVehicleModel}
                  onChange={(e) => setJcVehicleModel(e.target.value)}
                  placeholder="e.g. Toyota Prado 4.0L"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Vehicle Plate Number *
                </label>
                <input
                  type="text"
                  required
                  value={jcVehiclePlate}
                  onChange={(e) => setJcVehiclePlate(e.target.value)}
                  placeholder="e.g. 7842 A"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Chassis / VIN Number
                </label>
                <input
                  type="text"
                  value={jcVehicleVin}
                  onChange={(e) => setJcVehicleVin(e.target.value)}
                  placeholder="e.g. JTEBU29J..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Service Required
                </label>
                <input
                  type="text"
                  value={jcServiceType}
                  onChange={(e) => setJcServiceType(e.target.value)}
                  placeholder="e.g. Rear Bumper Denting + Paint Bake"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Insurance Claim # (If Applicable)
                </label>
                <input
                  type="text"
                  value={jcClaimNumber}
                  onChange={(e) => setJcClaimNumber(e.target.value)}
                  placeholder="e.g. CLM-2026-OM"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-xs">
                  Visual Inspection / Customer Request Notes
                </label>
                <div className="flex items-center gap-2">
                  {jcNotes && (
                    <button
                      type="button"
                      id="btn-clear-jc-notes"
                      onClick={() => setJcNotes('')}
                      className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer px-1.5 py-0.5"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    id="btn-voice-memo-jc"
                    onClick={toggleVoiceMemo}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                      isListeningJc
                        ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-300 animate-pulse'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                    }`}
                    title={isListeningJc ? 'Stop voice recording' : 'Dictate technician notes with microphone'}
                  >
                    {isListeningJc ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        <MicOff className="w-3.5 h-3.5" />
                        <span>Stop Voice Memo</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Voice Memo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Active Recording or Status Banner */}
              {isListeningJc && (
                <div id="voice-memo-live-banner" className="mb-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-900 shadow-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                    </span>
                    <span className="font-bold shrink-0">Listening... Speak now:</span>
                    <span className="italic text-rose-700 font-mono text-[11px] truncate">
                      {interimTranscript ? `"${interimTranscript}"` : 'Awaiting speech input...'}
                    </span>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 uppercase tracking-wide ml-2">
                    Live Dictation
                  </span>
                </div>
              )}

              {voiceError && (
                <div id="voice-memo-error-banner" className="mb-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{voiceError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoiceError(null)}
                    className="text-amber-700 hover:text-amber-900 text-[10px] font-bold underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <textarea
                id="operator-jc-notes"
                rows={3}
                value={jcNotes}
                onChange={(e) => setJcNotes(e.target.value)}
                placeholder="Dictate notes with 'Voice Memo' button or type: Front wing scratch, customer requested computerized paint matching..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none text-xs leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Tip: Technicians can click <strong>Voice Memo</strong> to dictate damage assessments, customer requests, or bay notes hands-free.</span>
                <span className="font-mono text-[10px]">{jcNotes.length} characters</span>
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Save & Generate Job Card</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          TAB 2: FAST ESTIMATE ENTRY
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'new_estimate' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8">
          <div className="pb-4 border-b border-slate-100 mb-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Create Vehicle Repair Estimate
            </h2>
            <p className="text-xs text-slate-500">
              Record repair quotation with 5% Oman VAT. Saved as draft for Manager / Anshad approval.
            </p>
          </div>

          <form onSubmit={handleEstimateSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Customer / Insurance Company *
                </label>
                <input
                  type="text"
                  required
                  value={estCustomerName}
                  onChange={(e) => setEstCustomerName(e.target.value)}
                  placeholder="e.g. Oman Qatar Insurance / Ahmed Al-Kharusi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Customer Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={estCustomerPhone}
                  onChange={(e) => setEstCustomerPhone(e.target.value)}
                  placeholder="+968 9xxx xxxx"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Vehicle Model *
                </label>
                <input
                  type="text"
                  required
                  value={estVehicleModel}
                  onChange={(e) => setEstVehicleModel(e.target.value)}
                  placeholder="e.g. Nissan Patrol Titanium"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Vehicle Plate *
                </label>
                <input
                  type="text"
                  required
                  value={estVehiclePlate}
                  onChange={(e) => setEstVehiclePlate(e.target.value)}
                  placeholder="e.g. 5912 B"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Quotation Format
                </label>
                <select
                  value={estFormat}
                  onChange={(e) => setEstFormat(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="itemized">Itemized (Parts + Labour)</option>
                  <option value="lumpsum">Lumpsum Repair Quote</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider">
                  Estimated Repair Subtotal (OMR)
                </label>
                <span className="font-mono font-bold text-indigo-700">
                  {estAmount.toFixed(3)} OMR
                </span>
              </div>
              <input
                type="number"
                min="10"
                step="5"
                value={estAmount}
                onChange={(e) => setEstAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
                <span>+ 5% Oman VAT: <strong>{(estAmount * 0.05).toFixed(3)} OMR</strong></span>
                <span>Grand Total: <strong className="text-indigo-700">{(estAmount * 1.05).toFixed(3)} OMR</strong></span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Save Draft Estimate</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          TAB 3: FAST CUSTOMER INTAKE
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'new_customer' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8 max-w-2xl">
          <div className="pb-4 border-b border-slate-100 mb-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Register New Customer Profile
            </h2>
            <p className="text-xs text-slate-500">
              Add client contact details into the CRM directory for instant lookup.
            </p>
          </div>

          <form onSubmit={handleCustomerSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Full Name *
              </label>
              <input
                type="text"
                required
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                placeholder="e.g. Mohammed Al-Siyabi"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="+968 9xxx xxxx"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  placeholder="client@domain.om"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Save Customer</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          TAB 4: RECENT ENTRIES TODAY
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'recent_entries' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Recently Logged Job Cards (Read-Only Confirmation)
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Total {state.jobCards?.length || 0} Registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Serial #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Current Stage</th>
                  <th className="py-3 px-4">Date In</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(state.jobCards || []).slice(0, 8).map((jc) => (
                  <tr key={jc.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {jc.jobCardNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {jc.customerName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {jc.vehicleDetails || 'Vehicle'} ({jc.plateNumber || 'No Plate'})
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        jc.jobType === 'bodyshop' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {jc.jobType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                        {jc.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {jc.createdAt?.substring(0, 10) || '2026-09-18'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
