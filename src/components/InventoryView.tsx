import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ArrowUpDown,
  Layers,
  MapPin,
  CheckCircle2,
  DollarSign,
  Upload,
  Edit2,
  Trash2
} from 'lucide-react';
import { Product, ProductStatus } from '../types';
import { formatCurrency } from '../utils/formatters';

interface InventoryViewProps {
  products: Product[];
  currency: string;
  onOpenAddProductModal: (product?: Product) => void;
  onAdjustStock: (productId: string, newQuantity: number) => void;
  onDeleteProduct: (productId: string) => void;
  onOpenBulkImport?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  currency,
  onOpenAddProductModal,
  onAdjustStock,
  onDeleteProduct,
  onOpenBulkImport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Derive categories
  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.warehouseLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === 'low') {
      matchesStatus = p.stockQuantity <= p.reorderLevel && p.stockQuantity > 0;
    } else if (statusFilter === 'out') {
      matchesStatus = p.stockQuantity === 0;
    } else if (statusFilter === 'in_stock') {
      matchesStatus = p.stockQuantity > p.reorderLevel;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalCostValuation = products.reduce((acc, p) => acc + p.stockQuantity * p.costPrice, 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + p.stockQuantity * p.unitPrice, 0);
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.reorderLevel).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventory & Warehouse Control</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-location warehouse stocks, SKU tracking, valuation, and reorder levels.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {onOpenBulkImport && (
            <button
              onClick={onOpenBulkImport}
              id="btn-bulk-import-products"
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
              title="Upload CSV to add multiple products or update stock in bulk"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Bulk Import CSV</span>
            </button>
          )}

          <button
            onClick={() => onOpenAddProductModal()}
            id="btn-add-new-product"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add SKU / Item</span>
          </button>
        </div>
      </div>

      {/* Valuation Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Inventory Asset Cost</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalCostValuation, currency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Carrying cost at purchase valuation</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Projected Retail Value</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {formatCurrency(totalRetailValuation, currency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Potential gross liquidation value</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Under Reorder Point</span>
          <div className={`text-xl font-bold mt-1 ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {lowStockCount} Items At Risk
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Requires immediate purchase replenishment</div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by SKU, item name, warehouse location..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-medium">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 py-1.5 px-2.5 rounded-lg focus:outline-none"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-500 font-medium ml-2">Stock Level:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 py-1.5 px-2.5 rounded-lg focus:outline-none"
          >
            <option value="all">All Levels</option>
            <option value="low">Low Stock Only</option>
            <option value="out">Out of Stock</option>
            <option value="in_stock">Healthy Stock</option>
          </select>
        </div>
      </div>

      {/* Products Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">SKU & Item Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Unit Cost / Price</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">Total Asset Value</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No inventory products match your criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stockQuantity <= p.reorderLevel && p.stockQuantity > 0;
                  const isOut = p.stockQuantity === 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="font-mono text-[10px] text-indigo-600 mt-0.5">{p.sku}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[11px]">{p.warehouseLocation}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{formatCurrency(p.unitPrice, currency)}</div>
                        <div className="text-[10px] text-slate-400">Cost: {formatCurrency(p.costPrice, currency)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{p.stockQuantity}</span>
                          <span className="text-[11px] text-slate-400">{p.unit}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Min Reorder: {p.reorderLevel}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatCurrency((p.stockQuantity * p.costPrice), currency)}
                      </td>
                      <td className="px-4 py-3">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 uppercase">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">
                            Low Buffer
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 uppercase">
                            Optimal
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onOpenAddProductModal(p)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="w-px h-4 bg-slate-200 mx-1"></div>
                          <button
                            onClick={() => onAdjustStock(p.id, Math.max(0, p.stockQuantity - 1))}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors text-xs"
                            title="Decrement stock by 1"
                          >
                            -
                          </button>
                          <button
                            onClick={() => onAdjustStock(p.id, p.stockQuantity + 5)}
                            className="w-6 h-6 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center transition-colors text-xs"
                            title="Add 5 units (Receive batch)"
                          >
                            +5
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
