import React, { useState } from 'react';
import { X, Package } from 'lucide-react';
import { Product } from '../types';

interface AddProductModalProps {
  editProduct?: Product | null;
  onClose: () => void;
  onSubmit: (product: Product) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ editProduct, onClose, onSubmit }) => {
  const [sku, setSku] = useState(editProduct?.sku || `SKU-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState(editProduct?.name || '');
  const [category, setCategory] = useState(editProduct?.category || 'Industrial Components');
  const [unit, setUnit] = useState(editProduct?.unit || 'pcs');
  const [unitPrice, setUnitPrice] = useState<number>(editProduct?.unitPrice || 120);
  const [costPrice, setCostPrice] = useState<number>(editProduct?.costPrice || 70);
  const [stockQuantity, setStockQuantity] = useState<number>(editProduct?.stockQuantity || 25);
  const [reorderLevel, setReorderLevel] = useState<number>(editProduct?.reorderLevel || 10);
  const [warehouseLocation, setWarehouseLocation] = useState(editProduct?.warehouseLocation || 'WH-A / Row 1 / Shelf 1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const prod: Product = {
      id: editProduct ? editProduct.id : `prod-${Date.now()}`,
      sku,
      name,
      category,
      unit,
      unitPrice,
      costPrice,
      stockQuantity,
      reorderLevel,
      warehouseLocation,
      status: stockQuantity === 0 ? 'out_of_stock' : stockQuantity <= reorderLevel ? 'low_stock' : 'in_stock',
    };

    onSubmit(prod);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-sm">
              {editProduct ? 'Edit Product SKU' : 'Add New Product SKU to Inventory'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU Code *</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono focus:bg-white focus:outline-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
              >
                <option value="Industrial Components">Industrial Components</option>
                <option value="Sensors & IoT">Sensors & IoT</option>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Electronics">Electronics</option>
                <option value="Hydraulics">Hydraulics</option>
                <option value="Fasteners">Fasteners</option>
                <option value="Chemicals & Consumables">Chemicals & Consumables</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product Description / Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brushless Servo Motor 12V 200W"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cost Price ($) *</label>
              <input
                type="number"
                step="0.1"
                min={0}
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Selling Price ($) *</label>
              <input
                type="number"
                step="0.1"
                min={0}
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Stock Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pcs, units, kg"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial In-Stock Count</label>
              <input
                type="number"
                min={0}
                value={stockQuantity}
                onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reorder Point Threshold</label>
              <input
                type="number"
                min={1}
                value={reorderLevel}
                onChange={(e) => setReorderLevel(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Warehouse Storage Bin Location</label>
            <input
              type="text"
              value={warehouseLocation}
              onChange={(e) => setWarehouseLocation(e.target.value)}
              placeholder="e.g. WH-B / Row 3 / Bin 12"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
            >
              Save SKU to Catalog
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
