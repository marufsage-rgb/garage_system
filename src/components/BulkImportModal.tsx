import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  FileText,
  Package,
  Users,
  Building2,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { Product, Customer, Employee } from '../types';
import {
  parseProductsCsv,
  parseCustomersCsv,
  parseEmployeesCsv,
  SAMPLE_TEMPLATES,
  ParseResult
} from '../utils/csvParser';

export type ImportEntityType = 'products' | 'customers' | 'employees';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: ImportEntityType;
  existingProducts: Product[];
  existingCustomers: Customer[];
  existingEmployees: Employee[];
  onImportProducts: (products: Product[]) => void;
  onImportCustomers: (customers: Customer[]) => void;
  onImportEmployees: (employees: Employee[]) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  initialType = 'products',
  existingProducts,
  existingCustomers,
  existingEmployees,
  onImportProducts,
  onImportCustomers,
  onImportEmployees,
}) => {
  const [entityType, setEntityType] = useState<ImportEntityType>(initialType);
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [rawText, setRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'errors'>('preview');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialType when modal opens with a different target
  React.useEffect(() => {
    if (isOpen) {
      setEntityType(initialType);
      resetState();
    }
  }, [isOpen, initialType]);

  const resetState = () => {
    setRawText('');
    setFileName(null);
    setFileSize(null);
    setActiveTab('preview');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  // Compute parsed data based on entityType and rawText
  const productsResult: ParseResult<Product> | null =
    entityType === 'products' && rawText.trim()
      ? parseProductsCsv(rawText, existingProducts)
      : null;

  const customersResult: ParseResult<Customer> | null =
    entityType === 'customers' && rawText.trim()
      ? parseCustomersCsv(rawText, existingCustomers)
      : null;

  const employeesResult: ParseResult<Employee> | null =
    entityType === 'employees' && rawText.trim()
      ? parseEmployeesCsv(rawText, existingEmployees)
      : null;

  const activeResult =
    entityType === 'products'
      ? productsResult
      : entityType === 'customers'
      ? customersResult
      : employeesResult;

  const validCount = activeResult?.validItems.length || 0;
  const errorCount = activeResult?.errors.length || 0;
  const totalCount = activeResult?.totalRows || 0;

  // File handling
  const handleFileChange = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setRawText(content || '');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Sample data loading
  const handleLoadSample = () => {
    const template = SAMPLE_TEMPLATES[entityType];
    setRawText(template.content);
    setFileName(`Sample_${template.filename}`);
    setFileSize('1.2 KB');
  };

  // Download template
  const handleDownloadTemplate = () => {
    const template = SAMPLE_TEMPLATES[entityType];
    const blob = new Blob([template.content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', template.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit bulk import
  const handleExecuteImport = () => {
    if (!activeResult || activeResult.validItems.length === 0) return;

    if (entityType === 'products' && productsResult) {
      onImportProducts(productsResult.validItems);
    } else if (entityType === 'customers' && customersResult) {
      onImportCustomers(customersResult.validItems);
    } else if (entityType === 'employees' && employeesResult) {
      onImportEmployees(employeesResult.validItems);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="bulk-import-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col my-6 max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Bulk Data Import Utility</h2>
              <p className="text-xs text-slate-500">
                Upload CSV spreadsheets to rapidly onboard products, customers, or workforce records.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entity Type Selector & Template Controls */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Import Target:</span>
            <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
              <button
                type="button"
                id="btn-import-target-products"
                onClick={() => {
                  setEntityType('products');
                  resetState();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  entityType === 'products'
                    ? 'bg-white shadow-xs text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Products / SKU</span>
              </button>

              <button
                type="button"
                id="btn-import-target-customers"
                onClick={() => {
                  setEntityType('customers');
                  resetState();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  entityType === 'customers'
                    ? 'bg-white shadow-xs text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Customers</span>
              </button>

              <button
                type="button"
                id="btn-import-target-employees"
                onClick={() => {
                  setEntityType('employees');
                  resetState();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  entityType === 'employees'
                    ? 'bg-white shadow-xs text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Employees</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              id="btn-load-sample-csv"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
              title="Populate with verified demonstration data"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span>Load Sample Demo Data</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              id="btn-download-csv-template"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
              title="Download clean CSV template formatted for Excel or Google Sheets"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download CSV Template</span>
            </button>
          </div>
        </div>

        {/* Upload or Paste Container */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Toggle between Drag/Drop file upload and raw CSV paste */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="text-slate-500">Input Mode:</span>
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  inputMode === 'upload' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                File Upload (.csv)
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setInputMode('paste')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  inputMode === 'paste' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Direct Text Paste
              </button>
            </div>

            {fileName && (
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-medium truncate max-w-[200px]">{fileName}</span>
                {fileSize && <span className="text-slate-400">({fileSize})</span>}
                <button
                  type="button"
                  onClick={resetState}
                  className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {inputMode === 'upload' ? (
            /* Drag and Drop Zone */
            <div
              id="csv-dropzone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99]'
                  : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/80 bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-1">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  Click to browse or drag and drop your CSV file here
                </div>
                <p className="text-xs text-slate-500 max-w-md">
                  Supports comma-delimited <span className="font-mono text-slate-600">.csv</span> files exported from Excel, QuickBooks, ERP, or CRM systems.
                </p>
                <div className="mt-2 text-[11px] text-indigo-600 font-medium">
                  Accepted headers:{' '}
                  {entityType === 'products'
                    ? 'sku, name, category, unit_price, cost_price, stock_quantity, reorder_level, location'
                    : entityType === 'customers'
                    ? 'name, company, email, phone, address, outstanding_balance'
                    : 'emp_id, name, email, phone, role, department, salary, status, join_date'}
                </div>
              </div>
            </div>
          ) : (
            /* Text Area for direct paste */
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Paste Raw CSV Data (including header row):
              </label>
              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setFileName('pasted_data.csv');
                }}
                rows={6}
                placeholder="sku,name,category,unit_price,cost_price,stock_quantity&#10;SKU-990,Sample Item,Hardware,19.99,10.00,50"
                className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
              />
            </div>
          )}

          {/* Parsing Results & Live Data Validation Preview */}
          {rawText.trim() && (
            <div className="space-y-3 pt-2">
              {/* Validation Summary Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-bold text-slate-700">{totalCount}</span>
                    <span className="text-slate-500">Rows processed</span>
                  </div>

                  <div className="h-4 w-px bg-slate-300" />

                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{validCount} Ready to Import</span>
                  </div>

                  {errorCount > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{errorCount} Invalid / Skipped</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activeTab === 'preview'
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Valid Records ({validCount})
                  </button>
                  {errorCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('errors')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        activeTab === 'errors'
                          ? 'bg-rose-50 text-rose-700 font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Errors ({errorCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Tab 1: Valid Records Table */}
              {activeTab === 'preview' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {validCount === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No valid records identified</p>
                      <p className="mt-1">
                        Please review the required column headers or check the Errors tab to see why rows could not be parsed.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                          {entityType === 'products' && (
                            <tr>
                              <th className="py-2 px-3">SKU</th>
                              <th className="py-2 px-3">Product Name</th>
                              <th className="py-2 px-3">Category</th>
                              <th className="py-2 px-3 text-right">Price</th>
                              <th className="py-2 px-3 text-right">Cost</th>
                              <th className="py-2 px-3 text-right">Initial Stock</th>
                              <th className="py-2 px-3">Warehouse Location</th>
                            </tr>
                          )}
                          {entityType === 'customers' && (
                            <tr>
                              <th className="py-2 px-3">Contact Name</th>
                              <th className="py-2 px-3">Company</th>
                              <th className="py-2 px-3">Email Address</th>
                              <th className="py-2 px-3">Phone</th>
                              <th className="py-2 px-3 text-right">AR Balance</th>
                            </tr>
                          )}
                          {entityType === 'employees' && (
                            <tr>
                              <th className="py-2 px-3">Badge ID</th>
                              <th className="py-2 px-3">Staff Name</th>
                              <th className="py-2 px-3">Department</th>
                              <th className="py-2 px-3">Job Role</th>
                              <th className="py-2 px-3 text-right">Annual Salary</th>
                              <th className="py-2 px-3">Status</th>
                            </tr>
                          )}
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                          {entityType === 'products' &&
                            productsResult?.validItems.map((prod) => (
                              <tr key={prod.id} className="hover:bg-slate-50/80">
                                <td className="py-2 px-3 font-mono font-medium text-indigo-700">{prod.sku}</td>
                                <td className="py-2 px-3 font-semibold text-slate-900">{prod.name}</td>
                                <td className="py-2 px-3">
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-600 border border-slate-200">
                                    {prod.category}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-medium text-slate-900">
                                  ${prod.unitPrice.toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-right text-slate-500">
                                  ${prod.costPrice.toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <span className="font-bold text-slate-800">{prod.stockQuantity}</span> {prod.unit}
                                </td>
                                <td className="py-2 px-3 text-slate-500 truncate max-w-[150px]">
                                  {prod.warehouseLocation}
                                </td>
                              </tr>
                            ))}

                          {entityType === 'customers' &&
                            customersResult?.validItems.map((cust) => (
                              <tr key={cust.id} className="hover:bg-slate-50/80">
                                <td className="py-2 px-3 font-semibold text-slate-900">{cust.name}</td>
                                <td className="py-2 px-3 font-medium text-slate-800">{cust.company}</td>
                                <td className="py-2 px-3 text-slate-600">{cust.email}</td>
                                <td className="py-2 px-3 text-slate-500 font-mono">{cust.phone}</td>
                                <td className="py-2 px-3 text-right font-medium text-slate-900">
                                  ${cust.outstandingBalance.toFixed(2)}
                                </td>
                              </tr>
                            ))}

                          {entityType === 'employees' &&
                            employeesResult?.validItems.map((emp) => (
                              <tr key={emp.id} className="hover:bg-slate-50/80">
                                <td className="py-2 px-3 font-mono font-medium text-indigo-700">{emp.empId}</td>
                                <td className="py-2 px-3 font-semibold text-slate-900">{emp.name}</td>
                                <td className="py-2 px-3">
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-600 border border-slate-200">
                                    {emp.department}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-700">{emp.role}</td>
                                <td className="py-2 px-3 text-right font-semibold text-slate-900">
                                  ${emp.salary.toLocaleString()}
                                </td>
                                <td className="py-2 px-3">
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                    {emp.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Errors and Skipped Rows */}
              {activeTab === 'errors' && (
                <div className="border border-rose-200 rounded-xl overflow-hidden bg-rose-50/30">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-rose-100/70 text-rose-800 font-semibold sticky top-0 border-b border-rose-200">
                        <tr>
                          <th className="py-2 px-3 w-16">CSV Row</th>
                          <th className="py-2 px-3">Failure Reason</th>
                          <th className="py-2 px-3">Raw Values</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100 text-slate-700">
                        {activeResult?.errors.map((err, idx) => (
                          <tr key={idx} className="hover:bg-rose-50">
                            <td className="py-2 px-3 font-mono font-bold text-rose-700">#{err.row}</td>
                            <td className="py-2 px-3 font-semibold text-rose-900">{err.message}</td>
                            <td className="py-2 px-3 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                              {Object.entries(err.data)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(' | ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick tips footer box */}
          <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">Automatic Duplicate Detection & Sanitization:</span>
              <p className="mt-0.5 text-slate-500">
                The utility automatically validates uniqueness of SKUs against existing catalog items, verifies email syntax for customer billing, normalizes HR divisions into proper departments, and skips invalid rows without aborting the rest of the batch.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={resetState}
            disabled={!rawText}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clear Input</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              id="btn-confirm-bulk-import"
              onClick={handleExecuteImport}
              disabled={validCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Import {validCount} {entityType === 'products' ? 'Products' : entityType === 'customers' ? 'Customers' : 'Employees'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
