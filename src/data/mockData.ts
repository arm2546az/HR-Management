import { 
  Company, Department, Position, User, Employee, UnifiedRequest, 
  AttendanceRecord, Holiday, PayrollCycle, SystemNotification, 
  AuditLog, CompanyAnnouncement, LeaveType 
} from '../types';

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'c1',
    name: 'โรงเรียนสอนขับรถวีเอ็น (สาขาเมืองกำแพงเพชร)',
    shortName: 'VN กำแพงเพชร',
    code: 'VN-KPP',
    address: '128 หมู่ 6 ต.สระแก้ว อ.เมืองกำแพงเพชร จ.กำแพงเพชร 62000',
    phone: '055-711-889',
    taxId: '0625561001234',
    status: 'ACTIVE',
    location: {
      lat: 16.4828,
      lng: 99.5227,
      radiusMeters: 250,
    },
    policies: [
      { id: 'pol-1', companyId: 'c1', title: 'นโยบายความปลอดภัยของยานพาหนะฝึกสอน', content: 'ครูฝึกสอนต้องตรวจเช็คลมยาง น้ำมันเครื่อง และเบรกทุกวันก่อนเริ่มสอน', effectiveDate: '2026-01-01' },
      { id: 'pol-2', companyId: 'c1', title: 'นโยบายการบันทึกเวลาและการลางาน', content: 'การลากิจต้องยื่นล่วงหน้าอย่างน้อย 1 วันทำการ และเข้างานสายเกิน 08:15 น. จะงดเบี้ยขยันประจำเดือน', effectiveDate: '2026-01-01' },
    ],
  },
  {
    id: 'c2',
    name: 'โรงเรียนสอนขับรถวีเอ็น (สาขาท่ามะเขือ)',
    shortName: 'VN ท่ามะเขือ',
    code: 'VN-TMK',
    address: '45/2 หมู่ 2 ต.ท่ามะเขือ อ.คลองขลุง จ.กำแพงเพชร 62120',
    phone: '055-781-456',
    taxId: '0625561001235',
    status: 'ACTIVE',
    location: {
      lat: 16.3211,
      lng: 99.7892,
      radiusMeters: 250,
    },
    policies: [
      { id: 'pol-3', companyId: 'c2', title: 'นโยบายการบริการลูกค้าและนักเรียนขับรถสาขาท่ามะเขือ', content: 'เน้นความสุภาพและความปลอดภัย 100% ในสนามฝึกสอนท่ามะเขือ', effectiveDate: '2026-01-01' },
    ],
  },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'd1', companyId: 'c1', name: 'ฝ่ายบริหารและธุรการ', code: 'ADM' },
  { id: 'd2', companyId: 'c1', name: 'ฝ่ายครูฝึกสอนขับรถยนต์และจักรยานยนต์', code: 'INS' },
  { id: 'd3', companyId: 'c1', name: 'ฝ่ายอบรมและสอบใบขับขี่', code: 'EXM' },
  { id: 'd4', companyId: 'c1', name: 'ฝ่ายซ่อมบำรุงและดูแลยานพาหนะ', code: 'MNT' },
  { id: 'd5', companyId: 'c2', name: 'ฝ่ายบริหารและธุรการ (สาขาท่ามะเขือ)', code: 'TMK-ADM' },
  { id: 'd6', companyId: 'c2', name: 'ฝ่ายครูฝึกสอนขับรถ (สาขาท่ามะเขือ)', code: 'TMK-INS' },
];

export const INITIAL_POSITIONS: Position[] = [
  { id: 'p1', departmentId: 'd1', name: 'ประธานกรรมการ / ผู้จัดการใหญ่', level: 'Executive', baseSalaryMin: 60000, baseSalaryMax: 100000 },
  { id: 'p2', departmentId: 'd1', name: 'ผู้จัดการฝ่ายทรัพยากรบุคคล', level: 'Manager', baseSalaryMin: 35000, baseSalaryMax: 50000 },
  { id: 'p3', departmentId: 'd1', name: 'เจ้าหน้าที่ธุรการและต้อนรับ', level: 'Staff', baseSalaryMin: 16000, baseSalaryMax: 22000 },
  { id: 'p4', departmentId: 'd2', name: 'หัวหน้าฝ่ายครูฝึกสอน', level: 'Supervisor', baseSalaryMin: 28000, baseSalaryMax: 40000 },
  { id: 'p5', departmentId: 'd2', name: 'ครูฝึกสอนขับรถยนต์', level: 'Senior Staff', baseSalaryMin: 20000, baseSalaryMax: 28000 },
  { id: 'p6', departmentId: 'd2', name: 'ครูฝึกสอนขับรถจักรยานยนต์', level: 'Staff', baseSalaryMin: 18000, baseSalaryMax: 25000 },
  { id: 'p7', departmentId: 'd3', name: 'เจ้าหน้าที่ทดสอบภาคทฤษฎีและปฏิบัติ', level: 'Staff', baseSalaryMin: 18000, baseSalaryMax: 24000 },
  { id: 'p8', departmentId: 'd4', name: 'ช่างเทคนิคซ่อมบำรุงยานยนต์', level: 'Staff', baseSalaryMin: 18000, baseSalaryMax: 26000 },
  { id: 'p9', departmentId: 'd6', name: 'หัวหน้าครูฝึกสอน (สาขาท่ามะเขือ)', level: 'Supervisor', baseSalaryMin: 28000, baseSalaryMax: 38000 },
  { id: 'p10', departmentId: 'd6', name: 'ครูฝึกสอนขับรถ (สาขาท่ามะเขือ)', level: 'Staff', baseSalaryMin: 19000, baseSalaryMax: 26000 },
];

const createDefaultLeaveQuotas = (): Record<LeaveType, any> => ({
  SICK: { leaveType: 'SICK', entitledDays: 30, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 30 },
  PERSONAL: { leaveType: 'PERSONAL', entitledDays: 6, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 6 },
  ANNUAL: { leaveType: 'ANNUAL', entitledDays: 10, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 10 },
  MATERNITY: { leaveType: 'MATERNITY', entitledDays: 98, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 98 },
  MILITARY: { leaveType: 'MILITARY', entitledDays: 60, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 60 },
  TRAINING: { leaveType: 'TRAINING', entitledDays: 7, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 7 },
});

// No mock employees - User adds employees manually
export const INITIAL_EMPLOYEES: Employee[] = [];

// Initial Users for the 4 core roles to sign in
export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    employeeId: '',
    username: 'superadmin',
    password: '01092569',
    role: 'SUPER_ADMIN',
    isActive: true,
    assignedCompanyIds: ['c1', 'c2'],
    lastLogin: '2026-10-06 08:30:12',
  },
  {
    id: 'u2',
    employeeId: '',
    username: 'hrmanager',
    password: '02092569',
    role: 'HR_MANAGER',
    isActive: true,
    assignedCompanyIds: ['c1', 'c2'],
    lastLogin: '2026-10-06 08:45:00',
  },
  {
    id: 'u3',
    employeeId: '',
    username: 'depthead',
    password: '25691313',
    role: 'DEPARTMENT_HEAD',
    isActive: true,
    assignedCompanyIds: ['c1'],
    allowedDepartments: ['d2'],
    lastLogin: '2026-10-06 08:15:22',
  },
  {
    id: 'u4',
    employeeId: '',
    username: 'employee',
    password: '1313131313',
    role: 'EMPLOYEE',
    isActive: true,
    assignedCompanyIds: ['c1'],
    lastLogin: '2026-10-06 07:55:10',
  },
];

export const INITIAL_REQUESTS: UnifiedRequest[] = [];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_HOLIDAYS: Holiday[] = [
  { id: 'h1', companyId: 'ALL', date: '2026-01-01', name: 'วันขึ้นปีใหม่', isTraditional: true },
  { id: 'h2', companyId: 'ALL', date: '2026-03-03', name: 'วันมาฆบูชา', isTraditional: true },
  { id: 'h3', companyId: 'ALL', date: '2026-04-06', name: 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราชและวันที่ระลึกมหาจักรีบรมราชวงศ์', isTraditional: true },
  { id: 'h4', companyId: 'ALL', date: '2026-04-13', name: 'วันสงกรานต์', isTraditional: true },
  { id: 'h5', companyId: 'ALL', date: '2026-04-14', name: 'วันสงกรานต์', isTraditional: true },
  { id: 'h6', companyId: 'ALL', date: '2026-04-15', name: 'วันสงกรานต์', isTraditional: true },
  { id: 'h7', companyId: 'ALL', date: '2026-05-01', name: 'วันแรงงานแห่งชาติ', isTraditional: true },
  { id: 'h8', companyId: 'ALL', date: '2026-05-04', name: 'วันฉัตรมงคล', isTraditional: true },
  { id: 'h9', companyId: 'ALL', date: '2026-07-28', name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว', isTraditional: true },
  { id: 'h10', companyId: 'ALL', date: '2026-08-12', name: 'วันแม่แห่งชาติ', isTraditional: true },
  { id: 'h11', companyId: 'ALL', date: '2026-10-13', name: 'วันนวมินทรมหาราช', isTraditional: true },
  { id: 'h12', companyId: 'ALL', date: '2026-10-23', name: 'วันปิยมหาราช', isTraditional: true },
  { id: 'h13', companyId: 'ALL', date: '2026-12-05', name: 'วันพ่อแห่งชาติ', isTraditional: true },
  { id: 'h14', companyId: 'ALL', date: '2026-12-10', name: 'วันรัฐธรรมนูญ', isTraditional: true },
  { id: 'h15', companyId: 'ALL', date: '2026-12-31', name: 'วันสิ้นปี', isTraditional: true },
];

export const INITIAL_PAYROLL_CYCLES: PayrollCycle[] = [];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [];

export const INITIAL_ANNOUNCEMENTS: CompanyAnnouncement[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

