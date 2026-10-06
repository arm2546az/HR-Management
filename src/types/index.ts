export type Role = 'SUPER_ADMIN' | 'HR_MANAGER' | 'DEPARTMENT_HEAD' | 'EMPLOYEE';

export type EmploymentStatus = 'PROBATION' | 'ACTIVE' | 'PENDING_START' | 'RESIGNED' | 'TERMINATED';

export type RequestStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type RequestType = 'LEAVE' | 'OT';

export type LeaveType = 
  | 'SICK'        // ลาป่วย
  | 'PERSONAL'    // ลากิจ
  | 'ANNUAL'      // ลาพักร้อน
  | 'MATERNITY'   // ลาคลอด
  | 'MILITARY'    // ลารับราชการทหาร
  | 'TRAINING';   // ลาฝึกอบรม

export type AttendanceStatus = 'ON_TIME' | 'LATE' | 'EARLY_LEAVE' | 'NEEDS_CHECK' | 'INCOMPLETE';

export type PayrollStatus = 'DRAFT' | 'CALCULATED' | 'PENDING_REVIEW' | 'APPROVED' | 'PAID' | 'CANCELLED';

export interface CompanyPolicy {
  id: string;
  companyId: string;
  title: string;
  content: string;
  effectiveDate: string;
}

export interface Company {
  id: string;
  name: string;
  shortName: string;
  code: string;
  address: string;
  phone: string;
  taxId: string;
  status?: 'ACTIVE' | 'INACTIVE';
  location: {
    lat: number;
    lng: number;
    radiusMeters: number;
  };
  policies?: CompanyPolicy[];
}

export interface Department {
  id: string;
  companyId: string;
  name: string;
  code: string;
  managerId?: string;
}

export interface Position {
  id: string;
  departmentId: string;
  name: string;
  level: string;
  baseSalaryMin: number;
  baseSalaryMax: number;
}

export interface User {
  id: string;
  employeeId: string;
  username: string;
  password?: string;
  avatarUrl?: string | null;
  role: Role;
  isActive: boolean;
  assignedCompanyIds: string[]; // Companies user has access to
  allowedDepartments?: string[];
  lastLogin?: string;
}

export interface EmployeeDocument {
  id: string;
  type: 'CONTRACT' | 'WARNING_LETTER' | 'RESIGNATION' | 'ID_COPY' | 'CERTIFICATE' | 'OTHER';
  title: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize: string;
  url?: string;
}

export interface EmployeeWarning {
  id: string;
  issueDate: string;
  level: 'VERBAL' | 'WRITTEN' | 'FINAL';
  reason: string;
  issuedBy: string;
  documentId?: string;
}

export interface DepartmentHistory {
  id: string;
  effectiveDate: string;
  fromDepartment: string;
  toDepartment: string;
  fromPosition: string;
  toPosition: string;
  reason: string;
  approvedBy: string;
}

export interface LeaveQuota {
  leaveType: LeaveType;
  entitledDays: number;
  usedDays: number;
  pendingDays: number;
  carriedOverDays: number;
  remainingDays: number;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  nickname: string;
  avatarUrl?: string;
  email: string;
  phone: string;
  idCardNumber: string;
  birthDate: string;
  companyId: string;
  departmentId: string;
  positionId: string;
  positionName: string;
  hireDate: string;
  probationEndDate: string;
  employmentStatus: EmploymentStatus;
  workShift: string;
  approverId: string; // Line manager / Approver
  baseSalary: number;
  positionAllowance: number;
  studentLoanMonthlyDeduction?: number; // กยศ.
  bankAccount: {
    bankName: string;
    accountNumber: string;
  };
  leaveQuotas: Record<LeaveType, LeaveQuota>;
  documents: EmployeeDocument[];
  warnings: EmployeeWarning[];
  departmentHistory: DepartmentHistory[];
  resignationDate?: string;
  resignationReason?: string;
  systemUserId?: string;
}

export interface ApprovalActionLog {
  actionBy: string;
  actionByName: string;
  actionRole: string;
  actionDate: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  comment?: string;
}

export interface UnifiedRequest {
  id: string;
  requestCode: string;
  requestType: RequestType;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  companyId: string;
  leaveType?: LeaveType;
  isHalfDay?: boolean;
  halfDayPeriod?: 'MORNING' | 'AFTERNOON';
  startDate: string;
  endDate: string;
  daysCount?: number;
  otHours?: number;
  otMultiplier?: number; // 1.5, 2.0, 3.0
  reason: string;
  attachmentName?: string;
  approverId: string;
  approverName: string;
  status: RequestStatus;
  submittedAt: string;
  rejectionReason?: string;
  cancellationReason?: string;
  actionLogs: ApprovalActionLog[];
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  companyId: string;
  date: string; // YYYY-MM-DD
  clockIn?: string; // HH:mm:ss
  clockOut?: string; // HH:mm:ss
  status: AttendanceStatus;
  workShift: string;
  locationName: string;
  isSimulatedLocation: boolean;
  distanceMeters?: number;
  clockInLat?: number;
  clockInLng?: number;
  clockOutLat?: number;
  clockOutLng?: number;
  note?: string;
  correctionRequested?: boolean;
  correctionReason?: string;
  originalClockIn?: string;
  originalClockOut?: string;
}

export interface Holiday {
  id: string;
  companyId: string; // 'ALL' or specific company
  date: string; // YYYY-MM-DD
  name: string;
  isTraditional: boolean;
}

export interface PayrollItemEntry {
  id: string;
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  amount: number;
  isTaxable: boolean;
  isSocialSecurityBase: boolean;
}

export interface EmployeePayrollSnapshot {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  positionName: string;
  companyId: string;
  baseSalary: number;
  positionAllowance: number;
  attendanceBonus: number; // เบี้ยขยัน
  otPay: number;
  otHours: number;
  otherEarnings: number;
  totalGrossIncome: number;
  socialSecurity: number; // ประกันสังคม (คำนวณตามจริงหรือแก้ไขแมนนวลได้)
  studentLoanDeduction: number; // กยศ. (กองทุนเงินให้กู้ยืมเพื่อการศึกษา)
  withholdingTax: number; // ภาษีหัก ณ ที่จ่าย
  absenceDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  itemizedEarnings: PayrollItemEntry[];
  itemizedDeductions: PayrollItemEntry[];
  isLocked: boolean;
}

export interface PayrollCycle {
  id: string;
  cycleCode: string;
  name: string;
  month: number;
  year: number; // พ.ศ. or ค.ศ.
  startDate: string;
  endDate: string;
  paymentDate: string;
  companyId: string; // or 'ALL'
  status: PayrollStatus;
  totalEmployees: number;
  totalGrossAmount: number;
  totalDeductions: number;
  totalNetAmount: number;
  snapshots: EmployeePayrollSnapshot[];
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  paidBy?: string;
}

export interface SystemNotification {
  id: string;
  userId: string;
  targetRole?: Role;
  title: string;
  message: string;
  type: 'REQUEST' | 'APPROVAL' | 'PROBATION' | 'PAYROLL' | 'ANNOUNCEMENT';
  linkTarget?: string; // Tab to navigate to
  linkId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  ipAddress: string;
  details: string;
}

export interface CompanyAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  companyId: string; // or 'ALL'
  author: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
}
