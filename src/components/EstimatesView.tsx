import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Send,
  Mail,
  Printer,
  CheckCircle2,
  Clock,
  Car,
  DollarSign,
  Search,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Trash2,
  ExternalLink,
  Percent,
  Download
} from 'lucide-react';
import { Estimate, EstimateItem, ERPState, JobCard, NotificationLog, AuditLog } from '../types';
import { formatCurrency } from '../utils/formatters';
import { exportEstimateQuotationPDF } from '../utils/pdfExport';

interface EstimatesViewProps {
  state: ERPState;
  onUpdateState: React.Dispatch<React.SetStateAction<ERPState>>;
  onNavigateToJobCard?: (jobCardId: string | number) => void;
}

export const EstimatesView: React.FC<EstimatesViewProps> = ({
  state,
  onUpdateState,
  onNavigateToJobCard,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'create' | 'insurance'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'parts_labour' | 'lumpsum'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'approved' | 'invoiced'>('all');

  // Modals
  const [selectedEstimateForWhatsApp, setSelectedEstimateForWhatsApp] = useState<Estimate | null>(null);
  const [selectedEstimateForEmail, setSelectedEstimateForEmail] = useState<Estimate | null>(null);
  const [selectedEstimateForPrint, setSelectedEstimateForPrint] = useState<Estimate | null>(null);

  // WhatsApp compose state
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');

  // Insurance compose state
  const [insuranceEmail, setInsuranceEmail] = useState('claims@omanunited.om');
  const [insuranceSubject, setInsuranceSubject] = useState('');
  const [insuranceBody, setInsuranceBody] = useState('');
  const [attachSurveyReport, setAttachSurveyReport] = useState(true);

  // Form State for Creating New Estimate
  const [estimateType, setEstimateType] = useState<'parts_labour' | 'lumpsum'>('parts_labour');
  const [customerName, setCustomerName] = useState('');
  const [contactPhone, setContactPhone] = useState('+968 ');
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [selectedJobCardId, setSelectedJobCardId] = useState('');
  const [notes, setNotes] = useState('');

  // Insurance optional fields
  const [isInsuranceClaim, setIsInsuranceClaim] = useState(false);
  const [insuranceCompany, setInsuranceCompany] = useState('Oman United Insurance SAOG');
  const [claimNumber, setClaimNumber] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');

  // Parts + Labour lines
  const [items, setItems] = useState<EstimateItem[]>([
    { id: 'item-1', type: 'part', partNumber: '', description: 'OEM Engine Oil Filter', quantity: 1, unitPrice: 5.500, total: 5.500 },
    { id: 'item-2', type: 'labour', description: 'Engine Diagnostic & Lube Service Labor (1.0 hr)', quantity: 1, unitPrice: 15.000, total: 15.000 },
  ]);

  // Lumpsum package details
  const [lumpsumName, setLumpsumName] = useState('Turnkey Minor Service & 32-Point Safety Inspection');
  const [lumpsumScope, setLumpsumScope] = useState('Includes full synthetic 5W-30 oil drain/refill, filter replacement, AC filter blow out, suspension bolt torque check, brake wear measurement, and fluid top-up.');
  const [lumpsumWarranty, setLumpsumWarranty] = useState('6 Months or 10,000 KM Workshop Warranty');
  const [lumpsumPrice, setLumpsumPrice] = useState(45.000);

  // Calculations for current form
  const partsLabourSubtotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
  const currentSubtotal = estimateType === 'parts_labour' ? partsLabourSubtotal : (Number(lumpsumPrice) || 0);
  const currentVat = +(currentSubtotal * 0.05).toFixed(3);
  const currentGrandTotal = +(currentSubtotal + currentVat).toFixed(3);

  // Add line item
  const handleAddItem = (type: 'part' | 'labour') => {
    const newItem: EstimateItem = {
      id: `item-${Date.now()}`,
      type,
      partNumber: type === 'part' ? '' : undefined,
      description: type === 'part' ? 'New Spare Part' : 'Labor Operation',
      quantity: 1,
      unitPrice: type === 'part' ? 10.000 : 15.000,
      total: type === 'part' ? 10.000 : 15.000,
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof EstimateItem, val: any) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = +(Number(updated.quantity) * Number(updated.unitPrice)).toFixed(3);
      }
      return updated;
    }));
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(i => i.id !== id));
  };

  // Submit new estimate
  const handleCreateEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter a customer name.');
      return;
    }

    const nextIdNumber = (state.estimates?.length || 0) + 55;
    const estNumber = `EST-2026-0${nextIdNumber}`;

    const newEstimate: Estimate = {
      id: `est-${Date.now()}`,
      estimateNumber: estNumber,
      estimateType,
      jobCardId: selectedJobCardId || undefined,
      customerName,
      contactPhone,
      vehicleDetails: vehicleDetails ? `${vehicleDetails} (${plateNumber || 'No Plate'})` : (plateNumber || 'Customer Vehicle'),
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      insuranceCompany: isInsuranceClaim ? insuranceCompany : undefined,
      claimNumber: isInsuranceClaim ? claimNumber : undefined,
      policyNumber: isInsuranceClaim ? policyNumber : undefined,
      items: estimateType === 'parts_labour' ? items : undefined,
      lumpsumDetails: estimateType === 'lumpsum' ? {
        packageName: lumpsumName,
        scopeOfWork: lumpsumScope,
        warranty: lumpsumWarranty,
        packagePrice: Number(lumpsumPrice) || 0,
      } : undefined,
      totalAmount: currentSubtotal,
      subtotal: currentSubtotal,
      vatRate: 0.05,
      vatAmount: currentVat,
      grandTotal: currentGrandTotal,
      status: 'draft',
      notes,
    };

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      action: 'Estimate Created',
      category: 'workshop',
      details: `Generated ${estimateType === 'parts_labour' ? 'Spare Parts + Labour' : 'Lumpsum'} estimate ${estNumber} for ${customerName} (Total: ${formatCurrency(currentGrandTotal, state.settings.currency)})`,
      performedBy: 'Workshop Estimator',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      severity: 'info',
    };

    onUpdateState(prev => ({
      ...prev,
      estimates: [newEstimate, ...(prev.estimates || [])],
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));

    // Reset form
    setCustomerName('');
    setContactPhone('+968 ');
    setVehicleDetails('');
    setPlateNumber('');
    setNotes('');
    setActiveTab('all');
    alert(`Estimate ${estNumber} successfully created!`);
  };

  // Open WhatsApp modal with formatted message
  const handleOpenWhatsApp = (est: Estimate) => {
    setSelectedEstimateForWhatsApp(est);
    setWhatsappPhone(est.contactPhone || '+968 ');
    const msg = `*Apex Auto Workshop Estimate Quote*\n` +
      `Estimator Ref: *${est.estimateNumber}*\n` +
      `Vehicle: ${est.vehicleDetails || 'Registered Vehicle'}\n` +
      `Type: ${est.estimateType === 'parts_labour' ? 'Itemized Spare Parts & Labour' : 'Turnkey Package'}\n` +
      `--------------------------------\n` +
      `Subtotal: ${formatCurrency(est.subtotal, state.settings.currency)}\n` +
      `5.0% Oman VAT: ${formatCurrency(est.vatAmount, state.settings.currency)}\n` +
      `*Grand Total: ${formatCurrency(est.grandTotal, state.settings.currency)}*\n` +
      `--------------------------------\n` +
      `Please reply YES to approve work or view breakdown online: https://erp.apex.om/quote/${est.estimateNumber}`;
    setWhatsappMessage(msg);
  };

  // Send WhatsApp (launches link and records notification log)
  const handleSendWhatsApp = () => {
    if (!selectedEstimateForWhatsApp) return;

    const cleanPhone = whatsappPhone.replace(/[^0-9+]/g, '');
    const encoded = encodeURIComponent(whatsappMessage);
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;

    // Record in notification log
    const notif: NotificationLog = {
      id: Date.now(),
      jobCardId: typeof selectedEstimateForWhatsApp.jobCardId === 'number' ? selectedEstimateForWhatsApp.jobCardId : 101,
      channel: 'WHATSAPP',
      recipient: cleanPhone,
      message: whatsappMessage.substring(0, 200) + '...',
      status: 'SENT',
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      action: 'Estimate Dispatched via WhatsApp',
      category: 'workshop',
      details: `Quote ${selectedEstimateForWhatsApp.estimateNumber} sent to customer ${selectedEstimateForWhatsApp.customerName} (${cleanPhone})`,
      performedBy: 'Workshop Advisor',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      severity: 'info',
    };

    onUpdateState(prev => ({
      ...prev,
      estimates: (prev.estimates || []).map(e => e.id === selectedEstimateForWhatsApp.id ? { ...e, status: 'sent', sentViaWhatsApp: true } : e),
      notificationLogs: [notif, ...(prev.notificationLogs || [])],
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));

    window.open(waUrl, '_blank');
    setSelectedEstimateForWhatsApp(null);
  };

  // Open Email Insurance Modal
  const handleOpenEmail = (est: Estimate) => {
    setSelectedEstimateForEmail(est);
    setInsuranceSubject(`Insurance Repair Estimate [${est.estimateNumber}] - ${est.vehicleDetails || 'Vehicle Claim'}`);
    const body = `Dear Claims Department (${est.insuranceCompany || 'Insurance Company'}),\n\n` +
      `Please find attached our formal quotation and surveyor assessment for Claim #${est.claimNumber || 'PENDING'} under Policy #${est.policyNumber || 'PENDING'}.\n\n` +
      `Customer Name: ${est.customerName}\n` +
      `Vehicle: ${est.vehicleDetails || 'Vehicle'}\n` +
      `Scope of Repair: ${est.notes || (est.estimateType === 'parts_labour' ? 'OEM Spare parts replacement and Bodyshop/Paint refinish' : est.lumpsumDetails?.packageName || 'Turnkey Repairs')}\n\n` +
      `FINANCIAL BREAKDOWN (5% Oman VAT Compliance):\n` +
      `• Subtotal Parts & Labour: ${formatCurrency(est.subtotal, state.settings.currency)}\n` +
      `• 5% Oman VAT: ${formatCurrency(est.vatAmount, state.settings.currency)}\n` +
      `• Total Payable: ${formatCurrency(est.grandTotal, state.settings.currency)}\n\n` +
      `Awaiting your surveyor LPO / approval voucher.\n\n` +
      `Best regards,\nApex Automotive Workshop & Bodyshop Team\nMuscat, Sultanate of Oman`;
    setInsuranceBody(body);
  };

  const handleSendInsuranceEmail = () => {
    if (!selectedEstimateForEmail) return;

    const notif: NotificationLog = {
      id: Date.now(),
      jobCardId: typeof selectedEstimateForEmail.jobCardId === 'number' ? selectedEstimateForEmail.jobCardId : 203,
      channel: 'EMAIL',
      recipient: insuranceEmail,
      message: `Quotation ${selectedEstimateForEmail.estimateNumber} for Claim #${selectedEstimateForEmail.claimNumber || 'N/A'} dispatched to ${insuranceEmail}`,
      status: 'SENT',
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      action: 'Estimate Dispatched to Insurance',
      category: 'workshop',
      details: `Dispatched formal insurance quotation ${selectedEstimateForEmail.estimateNumber} to ${insuranceEmail} (${selectedEstimateForEmail.insuranceCompany || 'Insurance'}) for Claim #${selectedEstimateForEmail.claimNumber || 'N/A'}`,
      performedBy: 'Insurance Claims Coordinator',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      severity: 'info',
    };

    onUpdateState(prev => ({
      ...prev,
      estimates: (prev.estimates || []).map(e => e.id === selectedEstimateForEmail.id ? { ...e, status: 'sent', sentViaEmail: true } : e),
      notificationLogs: [notif, ...(prev.notificationLogs || [])],
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));

    alert(`Insurance quotation successfully dispatched to ${insuranceEmail}! Audit trail logged.`);
    setSelectedEstimateForEmail(null);
  };

  // Convert Estimate to Job Card
  const handleConvertToJobCard = (est: Estimate) => {
    const isLube = est.notes?.toLowerCase().includes('lube') || est.notes?.toLowerCase().includes('oil') || est.estimateType === 'parts_labour' && est.items?.some(i => i.description.toLowerCase().includes('oil') || i.description.toLowerCase().includes('service'));
    const serialType = isLube ? 'lube' : 'bodyshop';
    const nextSeq = (state.jobCards?.length || 0) + 104;
    const jcNumber = serialType === 'lube' ? `LB-2026-${nextSeq}` : `BS-2026-${nextSeq}`;

    const newJobCard: JobCard = {
      id: `jc-${Date.now()}`,
      jobCardNumber: jcNumber,
      jobType: serialType,
      customerName: est.customerName,
      contactPhone: est.contactPhone,
      vehicleDetails: est.vehicleDetails,
      status: 'in_progress',
      assignedTechnicianId: serialType === 'lube' ? 'tech-01' : 'tech-02',
      assignedTechnicianName: serialType === 'lube' ? 'Rashid Al-Ghafri' : 'Tariq Mahmoud',
      bayNumber: serialType === 'lube' ? 'Bay 1 (Lube Pit)' : 'Bay 4 (Chassis Jig)',
      workTimerStatus: 'running',
      timerStartedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      elapsedMinutes: 0,
      notes: `Converted from approved Estimate ${est.estimateNumber}. ${est.notes || ''}`,
      isRepeatJob: false,
      isRepeatCustomer: (state.jobCards || []).some(j => j.customerName.toLowerCase() === est.customerName.toLowerCase()),
      repeatVisitCount: (state.jobCards || []).filter(j => j.customerName.toLowerCase() === est.customerName.toLowerCase()).length + 1,
      partsRequired: est.items?.filter(i => i.type === 'part').map((p, idx) => ({
        id: `jcp-c-${idx}`,
        partNumber: p.partNumber || 'PART-GEN',
        partName: p.description,
        category: 'spare_part',
        quantity: p.quantity,
        unitCost: +(p.unitPrice * 0.65).toFixed(3),
        unitPrice: p.unitPrice,
        status: 'pending',
      })) || [],
      laborEntries: est.items?.filter(i => i.type === 'labour').map((l, idx) => ({
        id: `jcl-c-${idx}`,
        technicianId: serialType === 'lube' ? 'tech-01' : 'tech-02',
        technicianName: serialType === 'lube' ? 'Rashid Al-Ghafri' : 'Tariq Mahmoud',
        operation: l.description,
        hourlyWageCost: 5.000,
        hourlyChargeRate: l.unitPrice,
        hours: l.quantity,
        status: 'active',
      })) || [],
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      action: 'Job Card Opened from Estimate',
      category: 'workshop',
      details: `Generated new ${serialType.toUpperCase()} Job Card ${jcNumber} from Estimate ${est.estimateNumber}`,
      performedBy: 'Workshop Supervisor',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      severity: 'info',
    };

    onUpdateState(prev => ({
      ...prev,
      estimates: (prev.estimates || []).map(e => e.id === est.id ? { ...e, status: 'approved', jobCardNumber: jcNumber } : e),
      jobCards: [newJobCard, ...(prev.jobCards || [])],
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));

    alert(`Job Card ${jcNumber} opened successfully!`);
    if (onNavigateToJobCard) {
      onNavigateToJobCard(newJobCard.id);
    }
  };

  // Filtered estimates list
  const filteredEstimates = (state.estimates || []).filter(e => {
    if (activeTab === 'insurance' && !e.insuranceCompany && !e.claimNumber) return false;
    if (typeFilter !== 'all' && e.estimateType !== typeFilter) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.estimateNumber.toLowerCase().includes(q) ||
        e.customerName.toLowerCase().includes(q) ||
        (e.vehicleDetails && e.vehicleDetails.toLowerCase().includes(q)) ||
        (e.insuranceCompany && e.insuranceCompany.toLowerCase().includes(q)) ||
        (e.claimNumber && e.claimNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Calculate high level metrics
  const totalEstimatesCount = state.estimates?.length || 0;
  const partsLabourCount = (state.estimates || []).filter(e => e.estimateType === 'parts_labour').length;
  const lumpsumCount = (state.estimates || []).filter(e => e.estimateType === 'lumpsum').length;
  const insuranceCount = (state.estimates || []).filter(e => e.insuranceCompany || e.claimNumber).length;
  const totalQuotedValue = (state.estimates || []).reduce((acc, curr) => acc + (curr.grandTotal || 0), 0);
  const totalVatCollected = (state.estimates || []).reduce((acc, curr) => acc + (curr.vatAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header and Action Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Module A & B
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Vehicle Estimates & Client Dispatch
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Create itemized spare parts + labour quotes or lumpsum packages with 5% Oman VAT, direct WhatsApp customer alerts, and email to insurance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Quotes ({totalEstimatesCount})
          </button>
          <button
            onClick={() => setActiveTab('insurance')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'insurance'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Insurance Claims ({insuranceCount})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'create'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>New Vehicle Estimate</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Quoted Value</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {formatCurrency(totalQuotedValue, state.settings.currency)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Inc. 5% Oman VAT</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">5% Oman VAT Total</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1 font-mono">
            {formatCurrency(totalVatCollected, state.settings.currency)}
          </div>
          <div className="text-xs text-indigo-600 mt-1">DECIMAL(10,3) precision</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Parts + Labour Quotes</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            {partsLabourCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">Itemized line calculations</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lumpsum Package Quotes</div>
          <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">
            {lumpsumCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">Fixed turnkey scopes</div>
        </div>
      </div>

      {/* CREATE ESTIMATE FORM VIEW */}
      {activeTab === 'create' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Create Vehicle Estimate</h2>
              <p className="text-xs text-slate-500">Select estimate archetype and calculate parts, labour, or fixed lumpsum packages.</p>
            </div>

            {/* Type Switcher */}
            <div className="inline-flex rounded-lg border border-slate-300 p-1 bg-slate-50">
              <button
                type="button"
                onClick={() => setEstimateType('parts_labour')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all ${
                  estimateType === 'parts_labour'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Spare Parts + Labour
              </button>
              <button
                type="button"
                onClick={() => setEstimateType('lumpsum')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all ${
                  estimateType === 'lumpsum'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Lumpsum Package
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateEstimate} className="space-y-6">
            {/* Customer & Vehicle Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sultan Al-Harthy"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  WhatsApp / Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+968 9123 4567"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Vehicle Registration / Plate Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muscat 48291-A"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Vehicle Make & Model
                </label>
                <input
                  type="text"
                  placeholder="e.g. Toyota Land Cruiser V8 5.7L / 2023"
                  value={vehicleDetails}
                  onChange={(e) => setVehicleDetails(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Link to Existing Job Card (Optional)
                </label>
                <select
                  value={selectedJobCardId}
                  onChange={(e) => setSelectedJobCardId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Standalone Quote / Pre-Intake --</option>
                  {(state.jobCards || []).map((jc) => (
                    <option key={jc.id} value={jc.id}>
                      {jc.jobCardNumber} — {jc.customerName} ({jc.vehicleDetails || 'Vehicle'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Insurance Claim Checkbox & Drawer */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInsuranceClaim}
                  onChange={(e) => setIsInsuranceClaim(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-sm font-semibold text-slate-800">
                  This is an Insurance Claim Quotation (Module B.2: Email to Insurance)
                </span>
              </label>

              {isInsuranceClaim && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Insurance Company</label>
                    <select
                      value={insuranceCompany}
                      onChange={(e) => setInsuranceCompany(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="Oman United Insurance SAOG">Oman United Insurance SAOG</option>
                      <option value="Dhofar Insurance Co.">Dhofar Insurance Co.</option>
                      <option value="AXA / GIG Gulf Oman">AXA / GIG Gulf Oman</option>
                      <option value="National Life & General Insurance">National Life & General Insurance</option>
                      <option value="Arabia Falcon Insurance SAOG">Arabia Falcon Insurance SAOG</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Claim Number</label>
                    <input
                      type="text"
                      placeholder="e.g. OUI-CLM-2026-9812"
                      value={claimNumber}
                      onChange={(e) => setClaimNumber(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Policy Number</label>
                    <input
                      type="text"
                      placeholder="e.g. POL-OM-90219"
                      value={policyNumber}
                      onChange={(e) => setPolicyNumber(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ESTIMATE TYPE 1: SPARE PARTS + LABOUR */}
            {estimateType === 'parts_labour' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <span>1. Itemized Spare Parts & Labour Operations</span>
                    <span className="text-xs font-normal text-slate-400">({items.length} lines)</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddItem('part')}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-medium border border-indigo-200 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Spare Part</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItem('labour')}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium border border-emerald-200 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Labour Operation</span>
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 w-24">Type</th>
                        <th className="px-3 py-2 w-32">Part # / Code</th>
                        <th className="px-3 py-2">Description / Scope</th>
                        <th className="px-3 py-2 w-20 text-center">Qty / Hrs</th>
                        <th className="px-3 py-2 w-28 text-right">Unit Price</th>
                        <th className="px-3 py-2 w-28 text-right">Line Total</th>
                        <th className="px-3 py-2 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.type === 'part'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {item.type === 'part' ? (
                              <input
                                type="text"
                                placeholder="OEM / SKU"
                                value={item.partNumber || ''}
                                onChange={(e) => handleUpdateItem(item.id, 'partNumber', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono"
                              />
                            ) : (
                              <span className="text-slate-400 text-xs">LABOUR</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-16 px-2 py-1 text-xs border border-slate-200 rounded text-center font-mono"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-xs border border-slate-200 rounded text-right font-mono"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-medium text-slate-800">
                            {formatCurrency(item.total, state.settings.currency)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-400 hover:text-red-600 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ESTIMATE TYPE 2: LUMPSUM PACKAGE */}
            {estimateType === 'lumpsum' && (
              <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-200 space-y-4">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>2. Lumpsum Turnkey Package Configuration</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Package Name / Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={lumpsumName}
                      onChange={(e) => setLumpsumName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Lumpsum Package Base Price (OMR) *
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={lumpsumPrice}
                      onChange={(e) => setLumpsumPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Detailed Scope of Work & Deliverables
                  </label>
                  <textarea
                    rows={3}
                    value={lumpsumScope}
                    onChange={(e) => setLumpsumScope(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Warranty Period / Coverage Terms
                  </label>
                  <input
                    type="text"
                    value={lumpsumWarranty}
                    onChange={(e) => setLumpsumWarranty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700"
                  />
                </div>
              </div>
            )}

            {/* Financial Summary & 5% Oman VAT Calculation */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-slate-200">
              <div className="w-full sm:w-1/2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  General Quotation Notes / Terms
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Prices valid for 30 days. Genuine OEM parts backed by manufacturer guarantee."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="w-full sm:w-80 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal Amount:</span>
                  <span className="font-mono font-medium">{formatCurrency(currentSubtotal, state.settings.currency)}</span>
                </div>
                <div className="flex justify-between text-sm text-indigo-700 font-medium">
                  <span className="flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" />
                    Oman VAT (5.0%):
                  </span>
                  <span className="font-mono font-semibold">{formatCurrency(currentVat, state.settings.currency)}</span>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between text-base font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-emerald-600">{formatCurrency(currentGrandTotal, state.settings.currency)}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Vehicle Estimate</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ALL ESTIMATES TABLE & FILTERING */}
      {activeTab !== 'create' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search estimate #, plate, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <select
                value={typeFilter}
                onChange={(e: any) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
              >
                <option value="all">All Types</option>
                <option value="parts_labour">Spare Parts + Labour</option>
                <option value="lumpsum">Lumpsum Package</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="invoiced">Invoiced</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">Estimate #</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Customer & Vehicle</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-right">5% VAT</th>
                  <th className="px-4 py-3 text-right">Grand Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Dispatch Actions (b.1 & b.2)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEstimates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      No vehicle estimates match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEstimates.map((est) => (
                    <tr key={est.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-slate-900">{est.estimateNumber}</div>
                        <div className="text-[11px] text-slate-400">{est.date}</div>
                        {est.jobCardNumber && (
                          <span className="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            JC: {est.jobCardNumber}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          est.estimateType === 'parts_labour'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {est.estimateType === 'parts_labour' ? 'Parts + Labour' : 'Lumpsum'}
                        </span>
                        {est.insuranceCompany && (
                          <div className="text-[10px] text-amber-700 font-semibold mt-1 truncate max-w-[140px]" title={est.insuranceCompany}>
                            🛡️ {est.insuranceCompany}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{est.customerName}</div>
                        <div className="text-xs text-slate-500">{est.vehicleDetails}</div>
                        <div className="text-[11px] font-mono text-slate-400">{est.contactPhone}</div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {formatCurrency(est.subtotal, state.settings.currency)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-indigo-700 font-medium">
                        {formatCurrency(est.vatAmount, state.settings.currency)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(est.grandTotal, state.settings.currency)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          est.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : est.status === 'invoiced'
                            ? 'bg-blue-100 text-blue-800'
                            : est.status === 'sent'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {est.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Module B.1: WhatsApp Customer */}
                          <button
                            onClick={() => handleOpenWhatsApp(est)}
                            title="Send WhatsApp Quote to Customer"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {/* Module B.2: Email Insurance */}
                          <button
                            onClick={() => handleOpenEmail(est)}
                            title="Email Quote to Insurance Company"
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* Download PDF Quotation via jsPDF */}
                          <button
                            onClick={() => exportEstimateQuotationPDF(est, state.settings)}
                            title="Download PDF Quotation (jsPDF)"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Print / View formal Sheet */}
                          <button
                            onClick={() => setSelectedEstimateForPrint(est)}
                            title="Preview / Print Sheet"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Convert to Job Card if not yet linked */}
                          {!est.jobCardNumber && (
                            <button
                              onClick={() => handleConvertToJobCard(est)}
                              title="Convert to Active Job Card"
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <span>Open JC</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL B.1: SEND TO CUSTOMER VIA WHATSAPP */}
      {selectedEstimateForWhatsApp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Module B.1: Send to Customer via WhatsApp</h3>
                  <p className="text-xs text-slate-500">Estimate {selectedEstimateForWhatsApp.estimateNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEstimateForWhatsApp(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recipient WhatsApp Number (International format)
              </label>
              <input
                type="text"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Formatted WhatsApp Message (5% Oman VAT Included)
              </label>
              <textarea
                rows={7}
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-slate-50 text-slate-800"
              />
            </div>

            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Clicking 'Send WhatsApp' will open WhatsApp Web / App and record an entry into notification_log table.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedEstimateForWhatsApp(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Launch WhatsApp & Log</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL B.2: EMAIL TO INSURANCE */}
      {selectedEstimateForEmail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Module B.2: Email to Insurance Company</h3>
                  <p className="text-xs text-slate-500">
                    {selectedEstimateForEmail.insuranceCompany || 'Insurance Partner'} — {selectedEstimateForEmail.estimateNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEstimateForEmail(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Insurance Claims Email
                </label>
                <input
                  type="email"
                  value={insuranceEmail}
                  onChange={(e) => setInsuranceEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Claim / Policy Reference
                </label>
                <input
                  type="text"
                  readOnly
                  value={`Claim: ${selectedEstimateForEmail.claimNumber || 'OUI-CLM-2026-9812'}`}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm font-mono text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={insuranceSubject}
                onChange={(e) => setInsuranceSubject(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quotation Body & 5% Oman VAT Statement
              </label>
              <textarea
                rows={6}
                value={insuranceBody}
                onChange={(e) => setInsuranceBody(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 bg-slate-50"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                checked={attachSurveyReport}
                onChange={(e) => setAttachSurveyReport(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span className="text-xs font-medium text-slate-700">
                Attach digital damage survey report, before/after intake photos, and part supplier invoices
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedEstimateForEmail(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendInsuranceEmail}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm"
              >
                <Mail className="w-4 h-4" />
                <span>Send to Insurance & Log</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT FORMAL ESTIMATE SHEET MODAL */}
      {selectedEstimateForPrint && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="text-xl font-extrabold text-slate-900 tracking-tight">APEX AUTOMOTIVE & BODYSHOP</div>
                <div className="text-xs text-slate-500">Muscat Industrial Area, Sultanate of Oman • VAT ID: OM-89104820</div>
                <div className="text-xs text-slate-500">Tel: +968 2450 0000 • Email: workshop@apex.om</div>
              </div>
              <div className="text-right">
                <span className="text-xs px-2.5 py-1 rounded bg-slate-900 text-white font-mono font-bold">
                  {selectedEstimateForPrint.estimateNumber}
                </span>
                <div className="text-xs text-slate-500 mt-1">Date: {selectedEstimateForPrint.date}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-0.5">CLIENT DETAILS</span>
                <div className="text-slate-900 font-semibold">{selectedEstimateForPrint.customerName}</div>
                <div className="text-slate-600">{selectedEstimateForPrint.contactPhone}</div>
                {selectedEstimateForPrint.insuranceCompany && (
                  <div className="text-amber-800 font-medium mt-1">
                    Insurer: {selectedEstimateForPrint.insuranceCompany} (Claim #{selectedEstimateForPrint.claimNumber || 'N/A'})
                  </div>
                )}
              </div>
              <div>
                <span className="font-bold text-slate-700 block mb-0.5">VEHICLE DETAILS</span>
                <div className="text-slate-900 font-semibold">{selectedEstimateForPrint.vehicleDetails}</div>
                <div className="text-slate-600">Estimate Type: {selectedEstimateForPrint.estimateType === 'parts_labour' ? 'Spare Parts + Labour' : 'Turnkey Lumpsum Package'}</div>
              </div>
            </div>

            {selectedEstimateForPrint.estimateType === 'parts_labour' && selectedEstimateForPrint.items && (
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2">Description</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedEstimateForPrint.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-mono uppercase">{it.type}</td>
                      <td className="p-2">{it.description}</td>
                      <td className="p-2 text-center font-mono">{it.quantity}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(it.unitPrice, state.settings.currency)}</td>
                      <td className="p-2 text-right font-mono font-medium">{formatCurrency(it.total, state.settings.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedEstimateForPrint.estimateType === 'lumpsum' && selectedEstimateForPrint.lumpsumDetails && (
              <div className="border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-slate-900 text-sm">{selectedEstimateForPrint.lumpsumDetails.packageName}</div>
                <p className="text-slate-600">{selectedEstimateForPrint.lumpsumDetails.scopeOfWork}</p>
                <div className="text-emerald-700 font-medium">Warranty: {selectedEstimateForPrint.lumpsumDetails.warranty}</div>
              </div>
            )}

            <div className="border-t border-slate-200 pt-3 flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Amount:</span>
                  <span className="font-mono">{formatCurrency(selectedEstimateForPrint.subtotal, state.settings.currency)}</span>
                </div>
                <div className="flex justify-between text-indigo-700 font-semibold">
                  <span>5% Oman VAT:</span>
                  <span className="font-mono">{formatCurrency(selectedEstimateForPrint.vatAmount, state.settings.currency)}</span>
                </div>
                <div className="border-t border-slate-300 pt-1 flex justify-between font-bold text-sm text-slate-900">
                  <span>Grand Total (OMR):</span>
                  <span className="font-mono text-emerald-600">{formatCurrency(selectedEstimateForPrint.grandTotal, state.settings.currency)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <div className="text-[10px] text-slate-400">
                Printed via Apex ERP Automotive Suite • Authorized Workshop Stamp
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEstimateForPrint(null)}
                  className="px-4 py-1.5 border border-slate-300 rounded text-xs font-medium cursor-pointer hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => exportEstimateQuotationPDF(selectedEstimateForPrint, state.settings)}
                  id="btn-download-estimate-pdf"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Quotation</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
