import React, { useState } from 'react';
import {
  Boxes,
  Package,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  Truck,
  Droplet,
  Flame,
  Paperclip,
  TrendingDown,
  Car
} from 'lucide-react';
import {
  ERPState,
  ConsumableItem,
  JobCard,
  JobCardPartItem,
  JobCardConsumableItem,
  AuditLog
} from '../types';
import { formatCurrency } from '../utils/formatters';

interface WorkshopInventoryViewProps {
  state: ERPState;
  onUpdateState: React.Dispatch<React.SetStateAction<ERPState>>;
  defaultJobCardId?: string | number;
  onNavigateToJobCard?: (jobCardId?: string | number) => void;
}

export const WorkshopInventoryView: React.FC<WorkshopInventoryViewProps> = ({
  state,
  onUpdateState,
  defaultJobCardId,
  onNavigateToJobCard,
}) => {
  const [activeTab, setActiveTab] = useState<'parts_monitoring' | 'spare_parts_stock' | 'consumables_stock' | 'transfer_modal'>('parts_monitoring');
  const [searchQuery, setSearchQuery] = useState('');
  const [consumableCategoryFilter, setConsumableCategoryFilter] = useState<'all' | 'paint_material' | 'clips_fasteners' | 'welding_rods' | 'lubricants_fluids'>('all');

  // Transfer Form State (f.3 & f.4)
  const [transferType, setTransferType] = useState<'spare_part' | 'consumable'>('spare_part');
  const [targetJobCardId, setTargetJobCardId] = useState<string | number>(
    defaultJobCardId || (state.jobCards && state.jobCards[0]?.id) || ''
  );
  const [selectedStockId, setSelectedStockId] = useState<string | number>('');
  const [transferQuantity, setTransferQuantity] = useState<number>(1);
  const [transferNotes, setTransferNotes] = useState('');

  // Add Required Part modal/drawer (e.1)
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [partJcId, setPartJcId] = useState<string | number>((state.jobCards && state.jobCards[0]?.id) || '');
  const [newPartName, setNewPartName] = useState('');
  const [newPartNumber, setNewPartNumber] = useState('');
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartCost, setNewPartCost] = useState(25.000);
  const [newPartPrice, setNewPartPrice] = useState(38.000);

  // Handle Mark Part Status (e.2: arrived / pending / allocated)
  const handleUpdatePartStatus = (
    jobCardId: string | number,
    partId: string,
    newStatus: 'pending' | 'ordered' | 'arrived' | 'allocated'
  ) => {
    const jc = (state.jobCards || []).find((j) => j.id === jobCardId);
    if (!jc) return;

    const updatedParts = (jc.partsRequired || []).map((p) =>
      p.id === partId ? { ...p, status: newStatus } : p
    );

    // If all parts arrived, we can notify or move stage from parts_waiting
    let newJcStatus = jc.status;
    if (jc.status === 'parts_waiting' && newStatus === 'arrived') {
      const remainingPending = updatedParts.filter((p) => p.status === 'pending' || p.status === 'ordered');
      if (remainingPending.length === 0) {
        newJcStatus = jc.jobType === 'bodyshop' ? 'denting' : 'in_progress';
      }
    }

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      action: 'Part Status Updated',
      category: 'workshop',
      details: `Updated part status to ${newStatus.toUpperCase()} on Job Card ${jc.jobCardNumber}`,
      performedBy: 'Parts Coordinator',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      severity: 'info',
    };

    onUpdateState((prev) => ({
      ...prev,
      jobCards: (prev.jobCards || []).map((j) =>
        j.id === jobCardId ? { ...j, partsRequired: updatedParts, status: newJcStatus } : j
      ),
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));
  };

  // Add Part to Job Card (e.1)
  const handleAddRequiredPart = (e: React.FormEvent) => {
    e.preventDefault();
    const jc = (state.jobCards || []).find((j) => j.id === partJcId);
    if (!jc || !newPartName.trim()) return;

    const newPart: JobCardPartItem = {
      id: `jcp-${Date.now()}`,
      partNumber: newPartNumber || 'PART-GEN',
      partName: newPartName,
      category: 'spare_part',
      quantity: Number(newPartQty) || 1,
      unitCost: Number(newPartCost) || 0,
      unitPrice: Number(newPartPrice) || 0,
      status: 'pending',
    };

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      action: 'Required Part Added to Job Card',
      category: 'workshop',
      details: `Added ${newPart.quantity}x ${newPart.partName} (#${newPart.partNumber}) to Job Card ${jc.jobCardNumber}`,
      performedBy: 'Estimator / Parts Store',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      severity: 'info',
    };

    onUpdateState((prev) => ({
      ...prev,
      jobCards: (prev.jobCards || []).map((j) =>
        j.id === partJcId ? { ...j, partsRequired: [...(j.partsRequired || []), newPart] } : j
      ),
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));

    setNewPartName('');
    setNewPartNumber('');
    setShowAddPartModal(false);
    alert(`Part added to ${jc.jobCardNumber} requisition list!`);
  };

  // Handle Transfer Items to Job Card (f.3 & f.4)
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const targetJc = (state.jobCards || []).find((j) => j.id === targetJobCardId);
    if (!targetJc) {
      alert('Please select a target Job Card.');
      return;
    }

    if (transferType === 'spare_part') {
      // f.3: Transfer spare parts stock item to job card
      const stockItem = (state.products || []).find((i) => i.id === selectedStockId);
      if (!stockItem) {
        alert('Please select a spare part from stock.');
        return;
      }

      if (stockItem.stockQuantity < transferQuantity) {
        alert(`Insufficient stock! Available: ${stockItem.stockQuantity}, Requested: ${transferQuantity}`);
        return;
      }

      const allocatedPart: JobCardPartItem = {
        id: `jcp-trans-${Date.now()}`,
        partNumber: stockItem.sku,
        partName: stockItem.name,
        category: 'spare_part',
        quantity: transferQuantity,
        unitCost: stockItem.costPrice,
        unitPrice: stockItem.unitPrice,
        status: 'allocated',
      };

      const audit: AuditLog = {
        id: `aud-${Date.now()}`,
        action: 'Spare Part Transferred to Job Card',
        category: 'workshop',
        details: `Transferred ${transferQuantity}x ${stockItem.name} from warehouse to ${targetJc.jobCardNumber} (${targetJc.vehicleDetails})`,
        performedBy: 'Storekeeper',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        severity: 'info',
      };

      onUpdateState((prev) => ({
        ...prev,
        products: (prev.products || []).map((i) =>
          i.id === stockItem.id ? { ...i, stockQuantity: Math.max(0, i.stockQuantity - transferQuantity) } : i
        ),
        jobCards: (prev.jobCards || []).map((j) =>
          j.id === targetJc.id
            ? { ...j, partsRequired: [...(j.partsRequired || []), allocatedPart] }
            : j
        ),
        auditLogs: [audit, ...(prev.auditLogs || [])],
      }));

      alert(`Transferred ${transferQuantity}x ${stockItem.name} to ${targetJc.jobCardNumber}! Stock deducted.`);
    } else {
      // f.4: Transfer consumables to job card (paint materials, clips, welding rods)
      const consumable = (state.consumables || []).find((c) => c.id === selectedStockId);
      if (!consumable) {
        alert('Please select a consumable item.');
        return;
      }

      if (consumable.stockQuantity < transferQuantity) {
        alert(`Insufficient consumable stock! Available: ${consumable.stockQuantity} ${consumable.unit}`);
        return;
      }

      const allocatedConsumable: JobCardConsumableItem = {
        id: `jcc-trans-${Date.now()}`,
        consumableId: consumable.id,
        name: consumable.name,
        category: consumable.category,
        quantity: transferQuantity,
        unit: consumable.unit,
        unitCost: consumable.unitCost,
        totalCost: +(transferQuantity * consumable.unitCost).toFixed(3),
        transferredAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      const audit: AuditLog = {
        id: `aud-${Date.now()}`,
        action: 'Consumables Transferred to Job Card',
        category: 'workshop',
        details: `Allocated ${transferQuantity} ${consumable.unit} of ${consumable.name} (${consumable.category}) to Job Card ${targetJc.jobCardNumber}`,
        performedBy: 'Bodyshop Foreman',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        severity: 'info',
      };

      onUpdateState((prev) => ({
        ...prev,
        consumables: (prev.consumables || []).map((c) =>
          c.id === consumable.id ? { ...c, stockQuantity: +(c.stockQuantity - transferQuantity).toFixed(2) } : c
        ),
        jobCards: (prev.jobCards || []).map((j) =>
          j.id === targetJc.id
            ? {
                ...j,
                consumablesUsed: [...(j.consumablesUsed || []), allocatedConsumable],
              }
            : j
        ),
        auditLogs: [audit, ...(prev.auditLogs || [])],
      }));

      alert(`Allocated ${transferQuantity} ${consumable.unit} of ${consumable.name} to ${targetJc.jobCardNumber}!`);
    }

    setTransferQuantity(1);
    setTransferNotes('');
    setActiveTab('parts_monitoring');
  };

  // Filtered Parts list across all Job Cards (e.2)
  const allJobCardParts = (state.jobCards || []).flatMap((jc) =>
    (jc.partsRequired || []).map((p) => ({
      ...p,
      jobCardId: jc.id,
      jobCardNumber: jc.jobCardNumber,
      customerName: jc.customerName,
      vehicleDetails: jc.vehicleDetails,
      stage: jc.status,
    }))
  );

  const filteredParts = allJobCardParts.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.partName.toLowerCase().includes(q) ||
        p.partNumber.toLowerCase().includes(q) ||
        p.jobCardNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered consumables
  const filteredConsumables = (state.consumables || []).filter((c) => {
    if (consumableCategoryFilter !== 'all' && c.category !== consumableCategoryFilter) return false;
    if (searchQuery) {
      return c.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Action Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Module E & F
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Spare Parts & Consumables SCM
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Job card parts lists, arrival monitoring, paint/clips/welding consumables stock, and transfers to active job cards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('parts_monitoring')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'parts_monitoring'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Parts Monitoring (e.2)
          </button>

          <button
            onClick={() => setActiveTab('spare_parts_stock')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'spare_parts_stock'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Spare Parts Stock (f.1)
          </button>

          <button
            onClick={() => setActiveTab('consumables_stock')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'consumables_stock'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Consumables Stock (f.2)
          </button>

          <button
            onClick={() => setActiveTab('transfer_modal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'transfer_modal'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transfer to JC (f.3 & f.4)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PARTS MONITORING ACROSS JOB CARDS (e.1 & e.2) */}
      {activeTab === 'parts_monitoring' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-600" />
                <span>Module E.2: Live Parts Monitoring (Pending vs Arrived)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Track status of parts ordered for each vehicle: pending, ordered, arrived, or allocated to bay.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search part #, name, JC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <button
                onClick={() => setShowAddPartModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Part to JC (e.1)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">Target Job Card</th>
                  <th className="px-4 py-3">Part Name & OEM #</th>
                  <th className="px-4 py-3 text-center">Required Qty</th>
                  <th className="px-4 py-3 text-right">Unit Cost</th>
                  <th className="px-4 py-3 text-right">Selling Price</th>
                  <th className="px-4 py-3 text-center">Status Monitoring (e.2)</th>
                  <th className="px-4 py-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No required parts found across active job cards.
                    </td>
                  </tr>
                ) : (
                  filteredParts.map((part) => (
                    <tr key={part.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-900">{part.jobCardNumber}</span>
                        <div className="text-xs text-slate-500">{part.customerName}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{part.vehicleDetails}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{part.partName}</div>
                        <div className="text-xs font-mono text-indigo-700">OEM: {part.partNumber}</div>
                      </td>

                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                        {part.quantity}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {formatCurrency(part.unitCost, state.settings.currency)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(part.unitPrice, state.settings.currency)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          part.status === 'allocated'
                            ? 'bg-emerald-100 text-emerald-800'
                            : part.status === 'arrived'
                            ? 'bg-blue-100 text-blue-800'
                            : part.status === 'ordered'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {part.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        {part.status === 'pending' && (
                          <button
                            onClick={() => handleUpdatePartStatus(part.jobCardId, part.id, 'ordered')}
                            className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded text-xs font-medium cursor-pointer"
                          >
                            Mark Ordered
                          </button>
                        )}
                        {part.status === 'ordered' && (
                          <button
                            onClick={() => handleUpdatePartStatus(part.jobCardId, part.id, 'arrived')}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded text-xs font-medium cursor-pointer"
                          >
                            Mark Arrived
                          </button>
                        )}
                        {part.status === 'arrived' && (
                          <button
                            onClick={() => handleUpdatePartStatus(part.jobCardId, part.id, 'allocated')}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-medium cursor-pointer"
                          >
                            Allocate to Bay
                          </button>
                        )}
                        {part.status === 'allocated' && (
                          <span className="text-xs text-emerald-600 font-semibold">Installed ✅</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SPARE PARTS STOCK (f.1) */}
      {activeTab === 'spare_parts_stock' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <span>Module F.1: Spare Parts Inventory Stock</span>
              </h2>
              <p className="text-xs text-slate-500">
                Warehouse stock of fast-moving mechanical, electrical, and suspension spare parts.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">SKU / Code</th>
                  <th className="px-4 py-3">Part Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">In Stock</th>
                  <th className="px-4 py-3 text-right">Cost Price</th>
                  <th className="px-4 py-3 text-right">Selling Price</th>
                  <th className="px-4 py-3 text-right">Quick Transfer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(state.products || []).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{item.sku}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 uppercase">{item.category}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded ${
                        item.stockQuantity <= item.reorderLevel
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.stockQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {formatCurrency(item.costPrice, state.settings.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.unitPrice, state.settings.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setTransferType('spare_part');
                          setSelectedStockId(item.id);
                          setActiveTab('transfer_modal');
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold cursor-pointer"
                      >
                        Transfer to JC →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONSUMABLES STOCK (f.2) */}
      {activeTab === 'consumables_stock' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-purple-600" />
                <span>Module F.2: Workshop Consumables Stock</span>
              </h2>
              <p className="text-xs text-slate-500">
                Bodyshop paint materials, bumper clips & fasteners, MIG welding rods, and workshop solvents.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 p-1 rounded-lg text-xs">
              <button
                onClick={() => setConsumableCategoryFilter('all')}
                className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                  consumableCategoryFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                All Consumables
              </button>
              <button
                onClick={() => setConsumableCategoryFilter('paint_material')}
                className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                  consumableCategoryFilter === 'paint_material' ? 'bg-white text-purple-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Paint Materials
              </button>
              <button
                onClick={() => setConsumableCategoryFilter('clips_fasteners')}
                className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                  consumableCategoryFilter === 'clips_fasteners' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Clips & Fasteners
              </button>
              <button
                onClick={() => setConsumableCategoryFilter('welding_rods')}
                className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                  consumableCategoryFilter === 'welding_rods' ? 'bg-white text-amber-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Welding Rods
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">Consumable Material</th>
                  <th className="px-4 py-3">Category (f.4)</th>
                  <th className="px-4 py-3 text-center">Stock Quantity</th>
                  <th className="px-4 py-3 text-right">Unit Cost (OMR)</th>
                  <th className="px-4 py-3 text-right">Reorder Point</th>
                  <th className="px-4 py-3 text-right">Transfer Action (f.4)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredConsumables.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-400">Unit: {item.unit}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        item.category === 'paint_materials'
                          ? 'bg-purple-100 text-purple-800'
                          : item.category === 'clips_fasteners'
                          ? 'bg-indigo-100 text-indigo-800'
                          : item.category === 'welding_rods'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {item.category.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded ${
                        item.stockQuantity <= (item.minStock ?? item.reorderLevel)
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.stockQuantity} {item.unit}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-slate-800">
                      {formatCurrency(item.unitCost, state.settings.currency)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-slate-500">
                      {item.minStock ?? item.reorderLevel} {item.unit}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setTransferType('consumable');
                          setSelectedStockId(item.id);
                          setActiveTab('transfer_modal');
                        }}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded text-xs font-semibold cursor-pointer"
                      >
                        Allocate Consumable →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TRANSFER STOCK ITEMS / CONSUMABLES TO JOB CARD (f.3 & f.4) */}
      {activeTab === 'transfer_modal' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 max-w-2xl mx-auto">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Module F.3 & F.4: Transfer Stock / Consumables to Job Card
            </h2>
            <p className="text-xs text-slate-500">
              Allocate warehouse spare parts (f.3) or paint materials, clips, and welding rods (f.4) directly to an active vehicle.
            </p>
          </div>

          <form onSubmit={handleExecuteTransfer} className="space-y-4">
            {/* Transfer Type Switcher */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Transfer Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTransferType('spare_part');
                    setSelectedStockId((state.products && state.products[0]?.id) || '');
                  }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    transferType === 'spare_part'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div className="text-xs uppercase">f.3 Spare Part Transfer</div>
                  <div className="text-sm font-semibold">Warehouse OEM Stock Item</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTransferType('consumable');
                    setSelectedStockId((state.consumables && state.consumables[0]?.id) || '');
                  }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    transferType === 'consumable'
                      ? 'border-purple-600 bg-purple-50/70 text-purple-900 font-bold shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div className="text-xs uppercase">f.4 Consumable Transfer</div>
                  <div className="text-sm font-semibold">Paint, Clips & Welding Rods</div>
                </button>
              </div>
            </div>

            {/* Target Job Card Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Select Target Job Card *
              </label>
              <select
                value={targetJobCardId}
                onChange={(e) => setTargetJobCardId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800"
              >
                {(state.jobCards || []).map((jc) => (
                  <option key={jc.id} value={jc.id}>
                    {jc.jobCardNumber} — {jc.customerName} ({jc.vehicleDetails || 'Vehicle'}) [{jc.status.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>

            {/* Item Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Select {transferType === 'spare_part' ? 'Spare Part Item' : 'Consumable Material'} *
              </label>
              {transferType === 'spare_part' ? (
                <select
                  value={selectedStockId}
                  onChange={(e) => setSelectedStockId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                >
                  {(state.products || []).map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.sku}] {item.name} — Stock: {item.stockQuantity} units (Cost: {item.costPrice} OMR)
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedStockId}
                  onChange={(e) => setSelectedStockId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  {(state.consumables || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category}) — Available: {c.stockQuantity} {c.unit} (Cost: {c.unitCost} OMR/{c.unit})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Transfer Quantity *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('parts_monitoring')}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Confirm Transfer & Deduct Stock</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL E.1: ADD REQUIRED PART */}
      {showAddPartModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900">Module E.1: Add Required Spare Part</h3>
                <p className="text-xs text-slate-500">Add to job card parts requisition list</p>
              </div>
              <button
                onClick={() => setShowAddPartModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRequiredPart} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Job Card</label>
                <select
                  value={partJcId}
                  onChange={(e) => setPartJcId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  {(state.jobCards || []).map((jc) => (
                    <option key={jc.id} value={jc.id}>
                      {jc.jobCardNumber} — {jc.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Part Name / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Front Brake Disc Rotor (Pair)"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">OEM Part Number / SKU</label>
                <input
                  type="text"
                  placeholder="e.g. 43512-60190"
                  value={newPartNumber}
                  onChange={(e) => setNewPartNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newPartQty}
                    onChange={(e) => setNewPartQty(parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Cost (OMR)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newPartCost}
                    onChange={(e) => setNewPartCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (OMR)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newPartPrice}
                    onChange={(e) => setNewPartPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddPartModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  Add Part to Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
