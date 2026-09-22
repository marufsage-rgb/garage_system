import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  Calendar,
  Building,
  Upload
} from 'lucide-react';
import { Employee } from '../types';

interface HrViewProps {
  employees: Employee[];
  onOpenAddEmployeeModal: () => void;
  onOpenBulkImport?: () => void;
}

export const HrView: React.FC<HrViewProps> = ({
  employees,
  onOpenAddEmployeeModal,
  onOpenBulkImport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  const departments = Array.from(new Set(employees.map((e) => e.department)));

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.empId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const totalAnnualPayroll = employees.reduce((acc, e) => acc + e.salary, 0);
  const monthlyPayroll = totalAnnualPayroll / 12;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Human Resources & Workforce</h1>
          <p className="text-xs text-slate-500 mt-1">
            Staff roster, department allocations, headcount compensation, and employee records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {onOpenBulkImport && (
            <button
              onClick={onOpenBulkImport}
              id="btn-bulk-import-employees"
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
              title="Upload CSV to import employee records in bulk"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Bulk Import CSV</span>
            </button>
          )}

          <button
            onClick={onOpenAddEmployeeModal}
            id="btn-add-employee"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Headcount</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{employees.length} Full-Time Personnel</div>
          <div className="text-[11px] text-slate-400 mt-1">Across 5 business divisions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Monthly Payroll Run</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            ${monthlyPayroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Annualized: ${totalAnnualPayroll.toLocaleString()}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active Status Rate</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">100% Present</div>
          <div className="text-[11px] text-slate-400 mt-1">Zero unauthorized leaves</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee name, role, ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Department:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 py-1.5 px-2.5 rounded-lg focus:outline-none"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => (
          <div key={emp.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {emp.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 uppercase">
                  {emp.status}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm mt-3">{emp.name}</h3>
              <div className="text-xs font-semibold text-indigo-600 mt-0.5">{emp.role}</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">ID: {emp.empId}</div>

              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{emp.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{emp.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px] text-slate-500">Joined: {emp.joinDate}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Annual Base:</span>
              <span className="font-bold text-slate-900">
                ${emp.salary.toLocaleString('en-US', { minimumFractionDigits: 0 })}/yr
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
