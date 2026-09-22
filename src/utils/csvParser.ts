import { Product, Customer, Employee, ProductStatus } from '../types';

/**
 * Robust RFC 4180 compliant CSV parser.
 * Handles escaped quotes, newlines, commas inside quotes, and trims headers.
 */
export function parseCsvRaw(text: string): string[][] {
  // Normalize line endings and strip BOM
  const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          // Closing quote
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        // Only push row if it's not a trailing completely empty row
        if (currentRow.some((field) => field.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Final field & row if not ended with newline
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export interface RowError {
  row: number;
  data: Record<string, string>;
  message: string;
}

export interface ParseResult<T> {
  validItems: T[];
  errors: RowError[];
  totalRows: number;
  headers: string[];
}

// Normalize header string: lowercase, remove spaces, underscores, dashes
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Parser for Products
 */
export function parseProductsCsv(csvText: string, existingProducts: Product[] = []): ParseResult<Product> {
  const rows = parseCsvRaw(csvText);
  if (rows.length < 2) {
    return { validItems: [], errors: [{ row: 1, data: {}, message: 'CSV must contain a header row and at least one data row' }], totalRows: 0, headers: [] };
  }

  const rawHeaders = rows[0];
  const normalizedHeaders = rawHeaders.map(normalizeHeader);
  const dataRows = rows.slice(1);

  const existingSkus = new Set(existingProducts.map((p) => p.sku.toUpperCase()));
  const newSkusInBatch = new Set<string>();

  const validItems: Product[] = [];
  const errors: RowError[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2; // 1-based index including header
    const rowMap: Record<string, string> = {};
    rawHeaders.forEach((header, colIdx) => {
      rowMap[header] = row[colIdx] || '';
    });

    const getField = (...candidates: string[]): string => {
      for (const cand of candidates) {
        const normCand = normalizeHeader(cand);
        const colIdx = normalizedHeaders.indexOf(normCand);
        if (colIdx !== -1 && row[colIdx] !== undefined) {
          return row[colIdx].trim();
        }
      }
      return '';
    };

    const sku = getField('sku', 'code', 'product_sku', 'item_code');
    const name = getField('name', 'product_name', 'item_name', 'title');
    const category = getField('category', 'group', 'type') || 'General';
    const unit = getField('unit', 'uom', 'measure') || 'pcs';
    const unitPriceRaw = getField('unit_price', 'price', 'unitprice', 'retail_price', 'sell_price');
    const costPriceRaw = getField('cost_price', 'cost', 'costprice', 'buy_price');
    const stockQtyRaw = getField('stock_quantity', 'stock', 'quantity', 'qty', 'inventory');
    const reorderLevelRaw = getField('reorder_level', 'reorder', 'min_stock', 'safety_stock');
    const location = getField('warehouse_location', 'location', 'warehouse', 'bin', 'shelf') || 'Main Warehouse (Rack A-1)';

    // Validation checks
    if (!sku) {
      errors.push({ row: rowNumber, data: rowMap, message: 'SKU is required' });
      return;
    }
    const skuUpper = sku.toUpperCase();
    if (existingSkus.has(skuUpper)) {
      errors.push({ row: rowNumber, data: rowMap, message: `SKU "${sku}" already exists in the catalog` });
      return;
    }
    if (newSkusInBatch.has(skuUpper)) {
      errors.push({ row: rowNumber, data: rowMap, message: `Duplicate SKU "${sku}" found within this CSV batch` });
      return;
    }

    if (!name) {
      errors.push({ row: rowNumber, data: rowMap, message: 'Product name is required' });
      return;
    }

    const unitPrice = parseFloat(unitPriceRaw);
    if (isNaN(unitPrice) || unitPrice < 0) {
      errors.push({ row: rowNumber, data: rowMap, message: `Invalid unit price: "${unitPriceRaw}". Must be a non-negative number.` });
      return;
    }

    const costPrice = costPriceRaw ? parseFloat(costPriceRaw) : unitPrice * 0.6;
    if (isNaN(costPrice) || costPrice < 0) {
      errors.push({ row: rowNumber, data: rowMap, message: `Invalid cost price: "${costPriceRaw}". Must be a non-negative number.` });
      return;
    }

    const stockQuantity = stockQtyRaw ? parseInt(stockQtyRaw, 10) : 0;
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      errors.push({ row: rowNumber, data: rowMap, message: `Invalid stock quantity: "${stockQtyRaw}". Must be an integer >= 0.` });
      return;
    }

    const reorderLevel = reorderLevelRaw ? parseInt(reorderLevelRaw, 10) : 10;
    if (isNaN(reorderLevel) || reorderLevel < 0) {
      errors.push({ row: rowNumber, data: rowMap, message: `Invalid reorder level: "${reorderLevelRaw}". Must be an integer >= 0.` });
      return;
    }

    let status: ProductStatus = 'in_stock';
    if (stockQuantity === 0) {
      status = 'out_of_stock';
    } else if (stockQuantity <= reorderLevel) {
      status = 'low_stock';
    }

    newSkusInBatch.add(skuUpper);
    validItems.push({
      id: `prod-bulk-${Date.now()}-${index}`,
      sku: sku.trim(),
      name: name.trim(),
      category: category.trim(),
      unit: unit.trim(),
      unitPrice,
      costPrice,
      stockQuantity,
      reorderLevel,
      warehouseLocation: location.trim(),
      status
    });
  });

  return {
    validItems,
    errors,
    totalRows: dataRows.length,
    headers: rawHeaders
  };
}

/**
 * Parser for Customers
 */
export function parseCustomersCsv(csvText: string, existingCustomers: Customer[] = []): ParseResult<Customer> {
  const rows = parseCsvRaw(csvText);
  if (rows.length < 2) {
    return { validItems: [], errors: [{ row: 1, data: {}, message: 'CSV must contain a header row and at least one data row' }], totalRows: 0, headers: [] };
  }

  const rawHeaders = rows[0];
  const normalizedHeaders = rawHeaders.map(normalizeHeader);
  const dataRows = rows.slice(1);

  const existingEmails = new Set(existingCustomers.map((c) => c.email.toLowerCase().trim()));
  const newEmailsInBatch = new Set<string>();

  const validItems: Customer[] = [];
  const errors: RowError[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const rowMap: Record<string, string> = {};
    rawHeaders.forEach((header, colIdx) => {
      rowMap[header] = row[colIdx] || '';
    });

    const getField = (...candidates: string[]): string => {
      for (const cand of candidates) {
        const normCand = normalizeHeader(cand);
        const colIdx = normalizedHeaders.indexOf(normCand);
        if (colIdx !== -1 && row[colIdx] !== undefined) {
          return row[colIdx].trim();
        }
      }
      return '';
    };

    const name = getField('name', 'contact_name', 'full_name', 'person');
    const company = getField('company', 'company_name', 'organization', 'client', 'business');
    const email = getField('email', 'email_address', 'mail');
    const phone = getField('phone', 'telephone', 'mobile', 'tel') || '+1 (555) 000-0000';
    const address = getField('address', 'billing_address', 'location', 'city') || '100 Business Way, Suite 100, City, State';
    const balanceRaw = getField('outstanding_balance', 'balance', 'outstanding', 'ar_balance');
    const statusRaw = getField('status', 'account_status');

    if (!name && !company) {
      errors.push({ row: rowNumber, data: rowMap, message: 'Either Customer Contact Name or Company is required' });
      return;
    }

    if (!email) {
      errors.push({ row: rowNumber, data: rowMap, message: 'Email address is required' });
      return;
    }

    // Basic email check
    if (!email.includes('@') || !email.includes('.')) {
      errors.push({ row: rowNumber, data: rowMap, message: `Invalid email format: "${email}"` });
      return;
    }

    const emailLower = email.toLowerCase().trim();
    if (existingEmails.has(emailLower)) {
      errors.push({ row: rowNumber, data: rowMap, message: `Customer with email "${email}" already exists` });
      return;
    }
    if (newEmailsInBatch.has(emailLower)) {
      errors.push({ row: rowNumber, data: rowMap, message: `Duplicate email "${email}" found within this CSV batch` });
      return;
    }

    let outstandingBalance = 0;
    if (balanceRaw) {
      const parsedBal = parseFloat(balanceRaw.replace(/[$,]/g, ''));
      if (isNaN(parsedBal)) {
        errors.push({ row: rowNumber, data: rowMap, message: `Invalid balance value: "${balanceRaw}"` });
        return;
      }
      outstandingBalance = parsedBal;
    }

    const status: 'active' | 'inactive' = statusRaw.toLowerCase() === 'inactive' ? 'inactive' : 'active';

    newEmailsInBatch.add(emailLower);
    validItems.push({
      id: `cust-bulk-${Date.now()}-${index}`,
      name: name || company,
      company: company || name,
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      outstandingBalance,
      status
    });
  });

  return {
    validItems,
    errors,
    totalRows: dataRows.length,
    headers: rawHeaders
  };
}

/**
 * Parser for Employees
 */
const VALID_DEPARTMENTS: Array<Employee['department']> = [
  'Engineering',
  'Sales & Marketing',
  'Operations',
  'Finance',
  'Human Resources',
  'Executive'
];

function matchDepartment(deptStr: string): Employee['department'] {
  const norm = deptStr.toLowerCase().replace(/[^a-z]/g, '');
  if (norm.includes('engineer') || norm.includes('tech') || norm.includes('dev')) return 'Engineering';
  if (norm.includes('sale') || norm.includes('market')) return 'Sales & Marketing';
  if (norm.includes('operat') || norm.includes('logist') || norm.includes('warehous')) return 'Operations';
  if (norm.includes('finan') || norm.includes('account') || norm.includes('treasur')) return 'Finance';
  if (norm.includes('hr') || norm.includes('human') || norm.includes('people') || norm.includes('talent')) return 'Human Resources';
  if (norm.includes('exec') || norm.includes('manage') || norm.includes('csuite')) return 'Executive';
  return 'Operations';
}

export function parseEmployeesCsv(csvText: string, existingEmployees: Employee[] = []): ParseResult<Employee> {
  const rows = parseCsvRaw(csvText);
  if (rows.length < 2) {
    return { validItems: [], errors: [{ row: 1, data: {}, message: 'CSV must contain a header row and at least one data row' }], totalRows: 0, headers: [] };
  }

  const rawHeaders = rows[0];
  const normalizedHeaders = rawHeaders.map(normalizeHeader);
  const dataRows = rows.slice(1);

  const existingEmpIds = new Set(existingEmployees.map((e) => e.empId.toUpperCase().trim()));
  const newEmpIdsInBatch = new Set<string>();

  const validItems: Employee[] = [];
  const errors: RowError[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const rowMap: Record<string, string> = {};
    rawHeaders.forEach((header, colIdx) => {
      rowMap[header] = row[colIdx] || '';
    });

    const getField = (...candidates: string[]): string => {
      for (const cand of candidates) {
        const normCand = normalizeHeader(cand);
        const colIdx = normalizedHeaders.indexOf(normCand);
        if (colIdx !== -1 && row[colIdx] !== undefined) {
          return row[colIdx].trim();
        }
      }
      return '';
    };

    const empId = getField('empid', 'emp_id', 'employee_id', 'badge_id', 'id') || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const name = getField('name', 'full_name', 'employee_name', 'staff_name');
    const email = getField('email', 'email_address', 'work_email');
    const phone = getField('phone', 'telephone', 'mobile') || '+1 (555) 019-2831';
    const role = getField('role', 'job_title', 'title', 'position');
    const departmentRaw = getField('department', 'dept', 'division') || 'Operations';
    const salaryRaw = getField('salary', 'annual_salary', 'compensation', 'base_pay');
    const statusRaw = getField('status', 'employment_status') || 'active';
    const joinDateRaw = getField('join_date', 'joined', 'hire_date', 'start_date') || new Date().toISOString().split('T')[0];

    if (!name) {
      errors.push({ row: rowNumber, data: rowMap, message: 'Employee name is required' });
      return;
    }

    if (!role) {
      errors.push({ row: rowNumber, data: rowMap, message: 'Job role / position is required' });
      return;
    }

    const empIdUpper = empId.toUpperCase().trim();
    if (existingEmpIds.has(empIdUpper)) {
      errors.push({ row: rowNumber, data: rowMap, message: `Employee ID "${empId}" already exists in workforce` });
      return;
    }
    if (newEmpIdsInBatch.has(empIdUpper)) {
      errors.push({ row: rowNumber, data: rowMap, message: `Duplicate Employee ID "${empId}" found within this CSV batch` });
      return;
    }

    let salary = 65000;
    if (salaryRaw) {
      const parsedSalary = parseFloat(salaryRaw.replace(/[$,]/g, ''));
      if (isNaN(parsedSalary) || parsedSalary < 0) {
        errors.push({ row: rowNumber, data: rowMap, message: `Invalid salary amount: "${salaryRaw}"` });
        return;
      }
      salary = parsedSalary;
    }

    let employeeEmail = email;
    if (!employeeEmail) {
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '.');
      employeeEmail = `${sanitizedName}@apexcorp.internal`;
    }

    const department = matchDepartment(departmentRaw);
    let status: 'active' | 'on_leave' | 'inactive' = 'active';
    const normStatus = statusRaw.toLowerCase().replace(/[^a-z]/g, '');
    if (normStatus.includes('leave')) {
      status = 'on_leave';
    } else if (normStatus.includes('inact') || normStatus.includes('terminat')) {
      status = 'inactive';
    }

    newEmpIdsInBatch.add(empIdUpper);
    validItems.push({
      id: `emp-bulk-${Date.now()}-${index}`,
      empId: empIdUpper,
      name: name.trim(),
      email: employeeEmail.trim(),
      phone: phone.trim(),
      role: role.trim(),
      department,
      salary,
      status,
      joinDate: joinDateRaw.trim()
    });
  });

  return {
    validItems,
    errors,
    totalRows: dataRows.length,
    headers: rawHeaders
  };
}

/**
 * Predefined Sample CSV Templates for quick testing and user download
 */
export const SAMPLE_TEMPLATES: Record<'products' | 'customers' | 'employees', { filename: string; content: string }> = {
  products: {
    filename: 'apex_products_import_template.csv',
    content: `sku,name,category,unit,unit_price,cost_price,stock_quantity,reorder_level,warehouse_location
SKU-OPT-901,High-Precision Laser Diode 450nm,Optoelectronics,pcs,185.00,95.00,45,15,Austin Facility (Bay C-04)
SKU-SOL-420,Monocrystalline Solar Cell 6x6,Clean Energy,pcs,14.50,7.20,1200,300,Warehouse East (Rack S-12)
SKU-MCU-880,Industrial ARM Cortex-M7 Core Board,Microcontrollers,pcs,89.00,48.00,80,25,Austin Facility (Bay B-02)
SKU-SEN-310,MEMS Vibration Sensor IP67,Sensory,pcs,64.00,31.50,150,40,Detroit Staging (Shelf V-01)
SKU-ENC-505,Die-Cast Aluminum NEMA Enclosure,Hardware,pcs,42.00,19.00,210,50,Austin Facility (Bay A-09)`
  },
  customers: {
    filename: 'apex_customers_import_template.csv',
    content: `name,company,email,phone,address,outstanding_balance,status
Elena Rostova,AeroDynamics Aerospace Corp,e.rostova@aerodynamics.io,+1 (206) 555-0182,"900 Boeing Field Way, Seattle, WA 98108",14250.00,active
Marcus Vance,Vance Robotics & Automation,marcus@vancerobotics.com,+1 (412) 555-0941,"420 Innovation Blvd, Pittsburgh, PA 15213",0.00,active
Sarah Jenkins,Quantum Power Systems,sjenkins@quantumpower.net,+1 (617) 555-3312,"50 Memorial Drive, Cambridge, MA 02142",8500.00,active
David O'Connor,BioMed Diagnostics Inc,doconnor@biomeddiagnostics.org,+1 (858) 555-7729,"10200 Torrey Pines Rd, La Jolla, CA 92037",3200.00,active
Amina Al-Mansoor,Gulf Green Energies,amina@gulfgreenenergies.com,+971 4 555 8900,"DIFC Gate Tower 4, Level 18, Dubai, UAE",0.00,active`
  },
  employees: {
    filename: 'apex_employees_import_template.csv',
    content: `emp_id,name,email,phone,role,department,salary,status,join_date
EMP-1081,Nadia Kowalski,n.kowalski@apexcorp.internal,+1 (512) 555-8120,Senior Embedded Systems Architect,Engineering,148000,active,2026-03-01
EMP-1082,Julian Martinez,j.martinez@apexcorp.internal,+1 (512) 555-8121,Enterprise Account Executive,Sales & Marketing,98000,active,2026-03-15
EMP-1083,Priya Sharma,p.sharma@apexcorp.internal,+1 (512) 555-8122,Supply Chain Logistics Analyst,Operations,78000,active,2026-04-01
EMP-1084,Liam Henderson,l.henderson@apexcorp.internal,+1 (512) 555-8123,Cost Accounting & Audit Lead,Finance,92000,active,2026-02-15
EMP-1085,Chloe Bennett,c.bennett@apexcorp.internal,+1 (512) 555-8124,Talent Acquisition Partner,Human Resources,74000,active,2026-01-10`
  }
};
