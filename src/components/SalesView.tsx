import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Building2,
  Phone,
  Mail,
  FileText,
  Check,
  ChevronDown,
  Clock,
  Printer,
  Upload,
  Edit2,
  Trash2,
  Download
} from 'lucide-react';
import { SalesOrder, Customer, Product, OrderStatus, PaymentStatus } from '../types';
import { formatCurrency } from '../utils/formatters';
import { exportSalesInvoicePDF } from '../utils/pdfExport';

interface SalesViewProps {
  salesOrders: SalesOrder[];
  customers: Customer[];
  products: Product[];
  currency: string;
  onOpenNewOrderModal: () => void;
  onOpenNewCustomerModal: (customer?: Customer) => void;
  onOpenBulkImportCustomers?: () => void;
  onViewInvoice: (order: SalesOrder) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
  onDeleteCustomer: (customerId: string) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  salesOrders,
  customers,
  currency,
  onOpenNewOrderModal,
  onOpenNewCustomerModal,
  onOpenBulkImportCustomers,
  onViewInvoice,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onDeleteCustomer,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const filteredOrders = salesOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const filteredCustomers = customers.filter((cust) => {
    return (
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalSalesVolume = salesOrders.reduce((acc, o) => acc + o.total, 0);
  const totalOpenReceivables = salesOrders
    .filter((o) => o.paymentStatus !== 'paid')
    .reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Tabs */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales & Customer Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Order fulfillment pipelines, customer accounts, quotations, and invoice tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-1.5 rounded-md transition-all ${
                activeTab === 'orders' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600'
              }`}
            >
              Sales Orders ({salesOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3.5 py-1.5 rounded-md transition-all ${
                activeTab === 'customers' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600'
              }`}
            >
              Customers ({customers.length})
            </button>
          </div>

          {activeTab === 'orders' ? (
            <button
              onClick={onOpenNewOrderModal}
              id="btn-create-sales-order"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Sales Order</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {onOpenBulkImportCustomers && (
                <button
                  onClick={onOpenBulkImportCustomers}
                  id="btn-bulk-import-customers"
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                  title="Upload CSV to import customer accounts in bulk"
                >
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Import CSV</span>
                </button>
              )}
              <button
                onClick={() => onOpenNewCustomerModal()}
                id="btn-add-customer"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Customer</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mini Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Sales Invoiced</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalSalesVolume, currency)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Unsettled Receivables</span>
          <div className="text-xl font-bold text-amber-600 mt-1">
            {formatCurrency(totalOpenReceivables, currency)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active Client Accounts</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {customers.length} Enterprise Clients
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'orders' ? 'Filter by order # or customer...' : 'Search customer directory...'}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-indigo-500"
          />
        </div>

        {activeTab === 'orders' && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 py-1.5 px-2.5 rounded-lg focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <span className="text-xs text-slate-500 font-medium ml-2">Payment:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 py-1.5 px-2.5 rounded-lg focus:outline-none"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Table / Directory List */}
      {activeTab === 'orders' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Order Number</th>
                  <th className="px-4 py-3">Customer Entity</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Items Count</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Fulfillment Status</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      No sales orders match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{order.customerCompany}</div>
                        <div className="text-[11px] text-slate-400">{order.customerName}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        <div>{order.date}</div>
                        <div className="text-[10px] text-slate-400">Due: {order.dueDate}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} units ({order.items.length} SKUs)
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {formatCurrency(order.total, currency)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className={`text-[11px] font-semibold rounded-md px-2 py-1 border focus:outline-none cursor-pointer ${
                            order.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : order.status === 'shipped'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : order.status === 'processing'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : order.status === 'confirmed'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="draft">Draft</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={order.paymentStatus}
                          onChange={(e) => onUpdatePaymentStatus(order.id, e.target.value as PaymentStatus)}
                          className={`text-[11px] font-semibold rounded-md px-2 py-1 border focus:outline-none cursor-pointer ${
                            order.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : order.paymentStatus === 'partial'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="partial">Partial</option>
                          <option value="paid">Paid</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => exportSalesInvoicePDF(order, { currency: currency as any })}
                            title="Download Tax Invoice PDF"
                            className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-medium px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => onViewInvoice(order)}
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2.5 py-1 rounded bg-slate-50 hover:bg-indigo-50 transition-colors border border-slate-200 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Customers Directory */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => (
            <div key={cust.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    {cust.company.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                        cust.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {cust.status}
                    </span>
                    <button
                      onClick={() => onOpenNewCustomerModal(cust)}
                      className="w-6 h-6 rounded bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-colors"
                      title="Edit Customer"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteCustomer(cust.id)}
                      className="w-6 h-6 rounded bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-3">{cust.company}</h3>
                <div className="text-xs text-slate-500 font-medium">{cust.name}</div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{cust.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{cust.phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-slate-500 line-clamp-2">{cust.address}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Open Balance:</span>
                <span className={`font-bold ${cust.outstandingBalance > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                  {formatCurrency(cust.outstandingBalance, currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
