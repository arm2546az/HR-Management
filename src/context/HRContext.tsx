import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Company, Department, Employee, UnifiedRequest, AttendanceRecord,
  Holiday, PayrollCycle, SystemNotification, AuditLog,
  CompanyAnnouncement, LeaveType, RequestType, RequestStatus,
  EmployeePayrollSnapshot, PayrollItemEntry
} from '../types';
import {
  INITIAL_COMPANIES, INITIAL_DEPARTMENTS, INITIAL_EMPLOYEES,
  INITIAL_REQUESTS, INITIAL_ATTENDANCE, INITIAL_HOLIDAYS,
  INITIAL_PAYROLL_CYCLES, INITIAL_NOTIFICATIONS, INITIAL_AUDIT_LOGS,
  INITIAL_ANNOUNCEMENTS
} from '../data/mockData';
import { useAuth } from './AuthContext';

interface HRContextType {
  // Master Data
  companies: Company[];
  departments: Department[];
  employees: Employee[];
  requests: UnifiedRequest[];
  attendance: AttendanceRecord[];
  holidays: Holiday[];
  payrollCycles: PayrollCycle[];
  notifications: SystemNotification[];
  auditLogs: AuditLog[];
  announcements: CompanyAnnouncement[];

  // Global Filter
  selectedCompanyId: string; // 'ALL' or specific id
  setSelectedCompanyId: (companyId: string) => void;

  // Employee Methods
  addEmployee: (employeeData: Partial<Employee>) => Employee;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  clearAllEmployees: () => void;
  updateEmployeeStatus: (id: string, status: Employee['employmentStatus'], resignationReason?: string) => void;
  transferEmployeeDepartment: (id: string, toDeptId: string, toPosName: string, reason: string) => void;
  addEmployeeWarning: (employeeId: string, warning: { level: 'VERBAL' | 'WRITTEN' | 'FINAL'; reason: string }) => void;
  uploadEmployeeDocument: (employeeId: string, doc: { title: string; fileName: string; type: any; fileSize: string }) => void;

  // Company & Department Methods
  addCompany: (companyData: Partial<Company>) => Company;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  addCompanyPolicy: (companyId: string, title: string, content: string) => void;
  deleteCompanyPolicy: (companyId: string, policyId: string) => void;
  addDepartment: (deptData: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;

  // Request Methods
  submitLeaveRequest: (data: {
    employeeId: string;
    leaveType: LeaveType;
    isHalfDay: boolean;
    halfDayPeriod?: 'MORNING' | 'AFTERNOON';
    startDate: string;
    endDate: string;
    daysCount: number;
    reason: string;
    attachmentName?: string;
  }) => { success: boolean; message: string };
  submitOTRequest: (data: {
    employeeId: string;
    startDate: string;
    endDate: string;
    otHours: number;
    otMultiplier: number;
    reason: string;
  }) => { success: boolean; message: string };
  approveRequest: (requestId: string, comment?: string) => { success: boolean; message: string };
  rejectRequest: (requestId: string, reason: string) => { success: boolean; message: string };
  cancelRequest: (requestId: string, reason: string) => { success: boolean; message: string };

  // Attendance Methods
  clockIn: (employeeId: string, options?: { isSimulated?: boolean; lat?: number; lng?: number; companyId?: string }) => { success: boolean; message: string };
  clockOut: (employeeId: string) => { success: boolean; message: string };
  requestAttendanceCorrection: (attId: string, reason: string, newClockIn: string, newClockOut: string) => void;
  approveAttendanceCorrection: (attId: string) => void;

  // Payroll Methods
  createPayrollCycle: (name: string, month: number, year: number, companyId: string) => PayrollCycle;
  calculatePayrollCycle: (cycleId: string) => void;
  updateEmployeeSnapshot: (cycleId: string, snapshotId: string, updates: Partial<EmployeePayrollSnapshot>) => void;
  approvePayrollCycle: (cycleId: string) => void;
  payPayrollCycle: (cycleId: string) => void;
  cancelPayrollCycle: (cycleId: string) => void;

  // Holidays & Announcements
  addHoliday: (name: string, date: string, companyId?: string) => void;
  deleteHoliday: (id: string) => void;
  addAnnouncement: (title: string, content: string, priority: 'NORMAL' | 'HIGH' | 'URGENT') => void;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Export Utility
  exportToCsv: (fileName: string, headers: string[], rows: (string | number)[][]) => void;
  resetAllData: () => void;
}

const HRContext = createContext<HRContextType | undefined>(undefined);

export const HRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentEmployee, currentUser } = useAuth();

  // Selected company filter
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('ALL');

  // Persistence helpers
  const VERSION_KEY = 'vn_empty_employees_v7_clean';
  if (typeof window !== 'undefined' && !localStorage.getItem(VERSION_KEY)) {
    localStorage.removeItem('vn_employees');
    localStorage.removeItem('vn_requests');
    localStorage.removeItem('vn_attendance');
    localStorage.removeItem('vn_payrolls');
    localStorage.removeItem('vn_announcements');
    localStorage.setItem(VERSION_KEY, 'true');
  }

  const getStored = <T,>(key: string, defaultVal: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const [companies, setCompanies] = useState<Company[]>(() => getStored('vn_companies', INITIAL_COMPANIES));
  const [departments, setDepartments] = useState<Department[]>(() => getStored('vn_departments', INITIAL_DEPARTMENTS));
  const [employees, setEmployees] = useState<Employee[]>(() => getStored('vn_employees', INITIAL_EMPLOYEES));
  const [requests, setRequests] = useState<UnifiedRequest[]>(() => getStored('vn_requests', INITIAL_REQUESTS));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => getStored('vn_attendance', INITIAL_ATTENDANCE));
  const [holidays, setHolidays] = useState<Holiday[]>(() => getStored('vn_holidays', INITIAL_HOLIDAYS));
  const [payrollCycles, setPayrollCycles] = useState<PayrollCycle[]>(() => getStored('vn_payrolls', INITIAL_PAYROLL_CYCLES));
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => getStored('vn_notifications', INITIAL_NOTIFICATIONS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getStored('vn_audit_logs', INITIAL_AUDIT_LOGS));
  const [announcements, setAnnouncements] = useState<CompanyAnnouncement[]>(() => getStored('vn_announcements', INITIAL_ANNOUNCEMENTS));

  // Sync state to local storage
  useEffect(() => { localStorage.setItem('vn_companies', JSON.stringify(companies)); }, [companies]);
  useEffect(() => { localStorage.setItem('vn_departments', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem('vn_employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('vn_requests', JSON.stringify(requests)); }, [requests]);
  useEffect(() => { localStorage.setItem('vn_attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('vn_holidays', JSON.stringify(holidays)); }, [holidays]);
  useEffect(() => { localStorage.setItem('vn_payrolls', JSON.stringify(payrollCycles)); }, [payrollCycles]);
  useEffect(() => { localStorage.setItem('vn_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('vn_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('vn_announcements', JSON.stringify(announcements)); }, [announcements]);

  const addAuditLog = useCallback((action: string, module: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: currentUser?.id || 'guest',
      userName: currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : (currentUser?.username || 'System'),
      userRole: currentUser?.role || 'SYSTEM',
      action,
      module,
      ipAddress: '127.0.0.1 (Web Demo)',
      details,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser, currentEmployee]);

  const addNotification = useCallback((notif: Omit<SystemNotification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotif: SystemNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      isRead: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  // Company & Department Methods
  const addCompany = (companyData: Partial<Company>): Company => {
    const newCompany: Company = {
      id: `c-${Date.now()}`,
      name: companyData.name || 'บริษัทใหม่ ในเครือ VN Group',
      shortName: companyData.shortName || companyData.name || 'สาขาใหม่',
      code: companyData.code || `VN-0${companies.length + 1}`,
      address: companyData.address || 'จ.กำแพงเพชร',
      phone: companyData.phone || '055-000-000',
      taxId: companyData.taxId || '0555562000000',
      status: companyData.status || 'ACTIVE',
      location: companyData.location || { lat: 16.48, lng: 99.52, radiusMeters: 500 },
      policies: companyData.policies || [],
    };
    setCompanies(prev => [...prev, newCompany]);
    addAuditLog('ADD_COMPANY', 'ตั้งค่า', `เพิ่มบริษัท/สาขาใหม่: ${newCompany.name}`);
    return newCompany;
  };

  const updateCompany = (id: string, updates: Partial<Company>) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    addAuditLog('UPDATE_COMPANY', 'ตั้งค่า', `แก้ไขข้อมูลบริษัท ID: ${id}`);
  };

  const deleteCompany = (id: string) => {
    setCompanies(prev => prev.filter(c => c.id !== id));
    addAuditLog('DELETE_COMPANY', 'ตั้งค่า', `ลบบริษัท ID: ${id}`);
  };

  const addCompanyPolicy = (companyId: string, title: string, content: string) => {
    const newPol = {
      id: `pol-${Date.now()}`,
      companyId,
      title,
      content,
      effectiveDate: new Date().toISOString().split('T')[0],
    };
    setCompanies(prev => prev.map(c => {
      if (c.id !== companyId && companyId !== 'ALL') return c;
      const existing = c.policies || [];
      return {
        ...c,
        policies: [...existing, newPol],
      };
    }));
    addAuditLog('ADD_POLICY', 'ตั้งค่า', `เพิ่มนโยบาย: ${title} ให้บริษัท ID: ${companyId}`);
  };

  const deleteCompanyPolicy = (companyId: string, policyId: string) => {
    setCompanies(prev => prev.map(c => {
      if (c.id !== companyId && companyId !== 'ALL') return c;
      return {
        ...c,
        policies: (c.policies || []).filter(p => p.id !== policyId),
      };
    }));
    addAuditLog('DELETE_POLICY', 'ตั้งค่า', `ลบนโยบาย ID: ${policyId}`);
  };

  const addDepartment = (deptData: Partial<Department>) => {
    const newDept: Department = {
      id: `d-${Date.now()}`,
      companyId: deptData.companyId || (companies[0]?.id || 'c1'),
      name: deptData.name || 'แผนกงานใหม่',
      code: deptData.code || `DEP-0${departments.length + 1}`,
      managerId: deptData.managerId,
    };
    setDepartments(prev => [...prev, newDept]);
    addAuditLog('ADD_DEPARTMENT', 'ตั้งค่า', `เพิ่มแผนกงานใหม่: ${newDept.name}`);
  };

  const deleteDepartment = (id: string) => {
    setDepartments(prev => prev.filter(d => d.id !== id));
    addAuditLog('DELETE_DEPARTMENT', 'ตั้งค่า', `ลบแผนก ID: ${id}`);
  };

  // Employee Methods
  const addEmployee = (empData: Partial<Employee>): Employee => {
    const count = employees.length + 1;
    const newCode = `VN-${String(count).padStart(3, '0')}`;
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      employeeCode: empData.employeeCode || newCode,
      firstName: empData.firstName || 'พนักงานใหม่',
      lastName: empData.lastName || '',
      nickname: empData.nickname || '',
      email: empData.email || `employee${count}@vngroup.co.th`,
      phone: empData.phone || '080-000-0000',
      idCardNumber: empData.idCardNumber || '1-0000-00000-00-0',
      birthDate: empData.birthDate || '1995-01-01',
      companyId: empData.companyId || (companies[0]?.id || 'c1'),
      departmentId: empData.departmentId || (departments[0]?.id || 'd1'),
      positionId: empData.positionId || 'p3',
      positionName: empData.positionName || 'เจ้าหน้าที่ธุรการ',
      hireDate: empData.hireDate || new Date().toISOString().split('T')[0],
      probationEndDate: empData.probationEndDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      employmentStatus: empData.employmentStatus || 'PROBATION',
      workShift: empData.workShift || '08:00 - 17:00 (จันทร์-ศุกร์)',
      approverId: empData.approverId || (employees[0]?.id || 'emp-001'),
      baseSalary: empData.baseSalary || 18000,
      positionAllowance: empData.positionAllowance || 0,
      bankAccount: empData.bankAccount || { bankName: 'ธนาคารกสิกรไทย', accountNumber: '000-0-00000-0' },
      leaveQuotas: empData.leaveQuotas || {
        SICK: { leaveType: 'SICK', entitledDays: 30, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 30 },
        PERSONAL: { leaveType: 'PERSONAL', entitledDays: 6, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 6 },
        ANNUAL: { leaveType: 'ANNUAL', entitledDays: 6, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 6 },
        MATERNITY: { leaveType: 'MATERNITY', entitledDays: 98, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 98 },
        MILITARY: { leaveType: 'MILITARY', entitledDays: 60, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 60 },
        TRAINING: { leaveType: 'TRAINING', entitledDays: 7, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 7 },
      },
      documents: [],
      warnings: [],
      departmentHistory: [],
    };

    setEmployees(prev => [newEmployee, ...prev]);
    addAuditLog('ADD_EMPLOYEE', 'จัดการพนักงาน', `เพิ่มพนักงานใหม่: ${newEmployee.firstName} ${newEmployee.lastName} (${newEmployee.employeeCode})`);
    return newEmployee;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updates } : emp));
    addAuditLog('UPDATE_EMPLOYEE', 'จัดการพนักงาน', `แก้ไขข้อมูลพนักงาน ID: ${id}`);
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    addAuditLog('DELETE_EMPLOYEE', 'จัดการพนักงาน', `ลบพนักงาน ID: ${id}`);
  };

  const clearAllEmployees = () => {
    localStorage.removeItem('vn_employees');
    setEmployees([]);
    addAuditLog('CLEAR_EMPLOYEES', 'จัดการพนักงาน', 'ล้างข้อมูลรายชื่อพนักงานทั้งหมดออกจากระบบ');
  };

  const updateEmployeeStatus = (id: string, status: Employee['employmentStatus'], resignationReason?: string) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== id) return emp;
      return {
        ...emp,
        employmentStatus: status,
        resignationDate: (status === 'RESIGNED' || status === 'TERMINATED') ? new Date().toISOString().split('T')[0] : emp.resignationDate,
        resignationReason: resignationReason || emp.resignationReason,
      };
    }));
    addAuditLog('UPDATE_EMPLOYEE_STATUS', 'จัดการพนักงาน', `เปลี่ยนสถานะพนักงาน ID: ${id} เป็น ${status}`);
  };

  const transferEmployeeDepartment = (id: string, toDeptId: string, toPosName: string, reason: string) => {
    const targetEmp = employees.find(e => e.id === id);
    if (!targetEmp) return;
    const fromDept = departments.find(d => d.id === targetEmp.departmentId)?.name || targetEmp.departmentId;
    const toDept = departments.find(d => d.id === toDeptId)?.name || toDeptId;

    const historyEntry = {
      id: `dh-${Date.now()}`,
      effectiveDate: new Date().toISOString().split('T')[0],
      fromDepartment: fromDept,
      toDepartment: toDept,
      fromPosition: targetEmp.positionName,
      toPosition: toPosName,
      reason,
      approvedBy: currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : 'ผู้บริหาร',
    };

    setEmployees(prev => prev.map(emp => {
      if (emp.id !== id) return emp;
      return {
        ...emp,
        departmentId: toDeptId,
        positionName: toPosName,
        departmentHistory: [historyEntry, ...(emp.departmentHistory || [])],
      };
    }));
    addAuditLog('TRANSFER_DEPARTMENT', 'จัดการพนักงาน', `ย้ายแผนกพนักงาน ${targetEmp.firstName}: ${fromDept} -> ${toDept}`);
  };

  const addEmployeeWarning = (employeeId: string, warning: { level: 'VERBAL' | 'WRITTEN' | 'FINAL'; reason: string }) => {
    const warningObj = {
      id: `w-${Date.now()}`,
      issueDate: new Date().toISOString().split('T')[0],
      level: warning.level,
      reason: warning.reason,
      issuedBy: currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : 'ฝ่ายบุคคล',
    };
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== employeeId) return emp;
      return {
        ...emp,
        warnings: [warningObj, ...(emp.warnings || [])],
      };
    }));
    addAuditLog('ISSUE_WARNING', 'จัดการพนักงาน', `ออกใบเตือน (${warning.level}) ให้พนักงาน ID: ${employeeId}`);
  };

  const uploadEmployeeDocument = (employeeId: string, doc: { title: string; fileName: string; type: any; fileSize: string }) => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      title: doc.title,
      fileName: doc.fileName,
      type: doc.type,
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedBy: currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : 'HR Admin',
      fileSize: doc.fileSize,
    };
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== employeeId) return emp;
      return {
        ...emp,
        documents: [newDoc, ...(emp.documents || [])],
      };
    }));
    addAuditLog('UPLOAD_DOC', 'จัดการพนักงาน', `อัปโหลดเอกสาร ${doc.title} สำหรับพนักงาน ID: ${employeeId}`);
  };

  // Request Methods
  const submitLeaveRequest = (data: {
    employeeId: string;
    leaveType: LeaveType;
    isHalfDay: boolean;
    halfDayPeriod?: 'MORNING' | 'AFTERNOON';
    startDate: string;
    endDate: string;
    daysCount: number;
    reason: string;
    attachmentName?: string;
  }): { success: boolean; message: string } => {
    const emp = employees.find(e => e.id === data.employeeId);
    if (!emp) return { success: false, message: 'ไม่พบข้อมูลพนักงาน' };

    const quota = emp.leaveQuotas[data.leaveType];
    const availableDays = (quota?.remainingDays || 0) - (quota?.pendingDays || 0);

    if (data.daysCount > availableDays) {
      return {
        success: false,
        message: `วันลาประเภทนี้คงเหลือไม่เพียงพอ (คงเหลือใช้งานได้ ${availableDays} วัน แต่ขอลา ${data.daysCount} วัน)`
      };
    }

    // Check overlapping requests
    const hasOverlap = requests.some(r =>
      r.employeeId === data.employeeId &&
      r.status !== 'REJECTED' &&
      r.status !== 'CANCELLED' &&
      ((data.startDate >= r.startDate && data.startDate <= r.endDate) ||
       (data.endDate >= r.startDate && data.endDate <= r.endDate))
    );
    if (hasOverlap) {
      return { success: false, message: 'มีคำขอลาที่วันที่ทับซ้อนกับช่วงเวลาดังกล่าวอยู่แล้ว' };
    }

    const approver = employees.find(e => e.id === emp.approverId) || employees[0];
    const dept = departments.find(d => d.id === emp.departmentId);

    const requestCode = `REQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(requests.length + 1).padStart(3, '0')}`;

    const newRequest: UnifiedRequest = {
      id: `req-${Date.now()}`,
      requestCode,
      requestType: 'LEAVE',
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      departmentId: emp.departmentId,
      departmentName: dept?.name || 'ฝ่ายงาน',
      companyId: emp.companyId,
      leaveType: data.leaveType,
      isHalfDay: data.isHalfDay,
      halfDayPeriod: data.halfDayPeriod,
      startDate: data.startDate,
      endDate: data.endDate,
      daysCount: data.daysCount,
      reason: data.reason,
      attachmentName: data.attachmentName,
      approverId: approver.id,
      approverName: `${approver.firstName} ${approver.lastName}`,
      status: 'PENDING',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actionLogs: [
        {
          actionBy: emp.id,
          actionByName: `${emp.firstName} ${emp.lastName}`,
          actionRole: 'EMPLOYEE',
          actionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
          action: 'SUBMITTED',
          comment: `ยื่นคำขอลา ${data.daysCount} วัน`,
        },
      ],
    };

    // Update quota: increment pending days
    setEmployees(prev => prev.map(e => {
      if (e.id !== emp.id) return e;
      const q = e.leaveQuotas[data.leaveType];
      return {
        ...e,
        leaveQuotas: {
          ...e.leaveQuotas,
          [data.leaveType]: {
            ...q,
            pendingDays: (q.pendingDays || 0) + data.daysCount,
          },
        },
      };
    }));

    setRequests(prev => [newRequest, ...prev]);

    // Send notification to approver
    addNotification({
      userId: approver.id,
      targetRole: 'DEPARTMENT_HEAD',
      title: 'มีคำขอลาใหม่รออนุมัติ',
      message: `${emp.firstName} ${emp.lastName} ยื่นคำขอลา ${data.daysCount} วัน (${data.startDate})`,
      type: 'REQUEST',
      linkTarget: 'requests',
      linkId: newRequest.id,
    });

    addAuditLog('SUBMIT_LEAVE', 'คำขอและอนุมัติ', `ยื่นคำขอลา ${requestCode} โดย ${emp.firstName}`);
    return { success: true, message: 'ส่งคำขอลาสำเร็จ รอหัวหน้างานอนุมัติ' };
  };

  const submitOTRequest = (data: {
    employeeId: string;
    startDate: string;
    endDate: string;
    otHours: number;
    otMultiplier: number;
    reason: string;
  }): { success: boolean; message: string } => {
    const emp = employees.find(e => e.id === data.employeeId);
    if (!emp) return { success: false, message: 'ไม่พบข้อมูลพนักงาน' };

    const approver = employees.find(e => e.id === emp.approverId) || employees[0];
    const dept = departments.find(d => d.id === emp.departmentId);
    const requestCode = `REQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(requests.length + 1).padStart(3, '0')}`;

    const newRequest: UnifiedRequest = {
      id: `req-${Date.now()}`,
      requestCode,
      requestType: 'OT',
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      departmentId: emp.departmentId,
      departmentName: dept?.name || 'ฝ่ายงาน',
      companyId: emp.companyId,
      startDate: data.startDate,
      endDate: data.endDate,
      otHours: data.otHours,
      otMultiplier: data.otMultiplier,
      reason: data.reason,
      approverId: approver.id,
      approverName: `${approver.firstName} ${approver.lastName}`,
      status: 'PENDING',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actionLogs: [
        {
          actionBy: emp.id,
          actionByName: `${emp.firstName} ${emp.lastName}`,
          actionRole: 'EMPLOYEE',
          actionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
          action: 'SUBMITTED',
          comment: `ขอทำ OT ${data.otHours} ชั่วโมง`,
        },
      ],
    };

    setRequests(prev => [newRequest, ...prev]);

    addNotification({
      userId: approver.id,
      targetRole: 'DEPARTMENT_HEAD',
      title: 'มีคำขอ OT ใหม่รออนุมัติ',
      message: `${emp.firstName} ${emp.lastName} ขอทำ OT ${data.otHours} ชม.`,
      type: 'REQUEST',
      linkTarget: 'requests',
      linkId: newRequest.id,
    });

    addAuditLog('SUBMIT_OT', 'คำขอและอนุมัติ', `ยื่นคำขอ OT ${requestCode} โดย ${emp.firstName}`);
    return { success: true, message: 'ส่งคำขอทำ OT สำเร็จ รอหัวหน้างานอนุมัติ' };
  };

  const approveRequest = (requestId: string, comment?: string): { success: boolean; message: string } => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'ไม่พบคำขอ' };
    if (req.status !== 'PENDING') return { success: false, message: 'คำขอนี้ไม่ได้อยู่ในสถานะรออนุมัติ' };

    // Prevent approving own request
    if (currentEmployee && currentEmployee.id === req.employeeId) {
      return { success: false, message: 'ไม่อนุญาตให้อนุมัติคำขอของตัวเอง กรุณาให้หัวหน้างานหรือผู้มีสิทธิ์อื่นเป็นผู้อนุมัติ' };
    }

    const actionLogEntry = {
      actionBy: currentEmployee?.id || 'admin',
      actionByName: currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : 'ผู้อนุมัติ',
      actionRole: currentUser?.role || 'APPROVER',
      actionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'APPROVED' as const,
      comment: comment || 'อนุมัติเรียบร้อย',
    };

    // If leave request, update leave quota: transfer from pendingDays to usedDays, subtract remainingDays
    if (req.requestType === 'LEAVE' && req.leaveType && req.daysCount) {
      setEmployees(prev => prev.map(emp => {
        if (emp.id !== req.employeeId) return emp;
        const q = emp.leaveQuotas[req.leaveType!];
        if (!q) return emp;
        return {
          ...emp,
          leaveQuotas: {
            ...emp.leaveQuotas,
            [req.leaveType!]: {
              ...q,
              pendingDays: Math.max(0, (q.pendingDays || 0) - req.daysCount!),
              usedDays: (q.usedDays || 0) + req.daysCount!,
              remainingDays: Math.max(0, (q.remainingDays || 0) - req.daysCount!),
            },
          },
        };
      }));
    }

    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        status: 'APPROVED',
        actionLogs: [...r.actionLogs, actionLogEntry],
      };
    }));

    // Notify requesting employee
    addNotification({
      userId: req.employeeId,
      title: 'คำขอของคุณได้รับการอนุมัติแล้ว',
      message: `คำขอ ${req.requestCode} (${req.requestType === 'LEAVE' ? 'วันลา' : 'OT'}) ได้รับการอนุมัติแล้ว`,
      type: 'APPROVAL',
      linkTarget: 'emp-requests',
    });

    addAuditLog('APPROVE_REQUEST', 'คำขอและอนุมัติ', `อนุมัติคำขอ ${req.requestCode} สำหรับ ${req.employeeName}`);
    return { success: true, message: `อนุมัติคำขอ ${req.requestCode} เรียบร้อยแล้ว` };
  };

  const rejectRequest = (requestId: string, reason: string): { success: boolean; message: string } => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'ไม่พบคำขอ' };
    if (req.status !== 'PENDING') return { success: false, message: 'คำขอนี้ไม่ได้อยู่ในสถานะรออนุมัติ' };

    // If leave request, release pendingDays back
    if (req.requestType === 'LEAVE' && req.leaveType && req.daysCount) {
      setEmployees(prev => prev.map(emp => {
        if (emp.id !== req.employeeId) return emp;
        const q = emp.leaveQuotas[req.leaveType!];
        if (!q) return emp;
        return {
          ...emp,
          leaveQuotas: {
            ...emp.leaveQuotas,
            [req.leaveType!]: {
              ...q,
              pendingDays: Math.max(0, (q.pendingDays || 0) - req.daysCount!),
            },
          },
        };
      }));
    }

    const actionLogEntry = {
      actionBy: currentEmployee?.id || 'admin',
      actionByName: currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : 'ผู้อนุมัติ',
      actionRole: currentUser?.role || 'APPROVER',
      actionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'REJECTED' as const,
      comment: reason,
    };

    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        status: 'REJECTED',
        rejectionReason: reason,
        actionLogs: [...r.actionLogs, actionLogEntry],
      };
    }));

    addNotification({
      userId: req.employeeId,
      title: 'คำขอของคุณไม่ได้รับอนุมัติ',
      message: `คำขอ ${req.requestCode} ไม่ผ่านการอนุมัติ เหตุผล: ${reason}`,
      type: 'APPROVAL',
      linkTarget: 'emp-requests',
    });

    addAuditLog('REJECT_REQUEST', 'คำขอและอนุมัติ', `ปฏิเสธคำขอ ${req.requestCode} เหตุผล: ${reason}`);
    return { success: true, message: `ปฏิเสธคำขอ ${req.requestCode} เรียบร้อยแล้ว` };
  };

  const cancelRequest = (requestId: string, reason: string): { success: boolean; message: string } => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'ไม่พบคำขอ' };
    if (req.status === 'CANCELLED' || req.status === 'REJECTED') {
      return { success: false, message: 'คำขอนี้ถูกยกเลิกหรือปฏิเสธไปแล้ว' };
    }

    // Revert leave quota:
    // If was pending: decrement pendingDays
    // If was approved: decrement usedDays and increment remainingDays!
    if (req.requestType === 'LEAVE' && req.leaveType && req.daysCount) {
      setEmployees(prev => prev.map(emp => {
        if (emp.id !== req.employeeId) return emp;
        const q = emp.leaveQuotas[req.leaveType!];
        if (!q) return emp;
        if (req.status === 'PENDING') {
          return {
            ...emp,
            leaveQuotas: {
              ...emp.leaveQuotas,
              [req.leaveType!]: {
                ...q,
                pendingDays: Math.max(0, (q.pendingDays || 0) - req.daysCount!),
              },
            },
          };
        } else if (req.status === 'APPROVED') {
          return {
            ...emp,
            leaveQuotas: {
              ...emp.leaveQuotas,
              [req.leaveType!]: {
                ...q,
                usedDays: Math.max(0, (q.usedDays || 0) - req.daysCount!),
                remainingDays: (q.remainingDays || 0) + req.daysCount!,
              },
            },
          };
        }
        return emp;
      }));
    }

    const actionLogEntry = {
      actionBy: currentEmployee?.id || 'user',
      actionByName: currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : 'ผู้ยกเลิก',
      actionRole: currentUser?.role || 'EMPLOYEE',
      actionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'CANCELLED' as const,
      comment: reason,
    };

    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        status: 'CANCELLED',
        cancellationReason: reason,
        actionLogs: [...r.actionLogs, actionLogEntry],
      };
    }));

    addAuditLog('CANCEL_REQUEST', 'คำขอและอนุมัติ', `ยกเลิกคำขอ ${req.requestCode} เหตุผล: ${reason}`);
    return { success: true, message: `ยกเลิกคำขอ ${req.requestCode} เรียบร้อยแล้ว คืนยอดวันลาถูกต้อง` };
  };

  // Attendance Methods
  const clockIn = (employeeId: string, options?: { isSimulated?: boolean; lat?: number; lng?: number; companyId?: string }): { success: boolean; message: string } => {
    const today = new Date().toISOString().split('T')[0];
    const existing = attendance.find(a => a.employeeId === employeeId && a.date === today && a.clockIn);

    if (existing) {
      return { success: false, message: `คุณได้ลงเวลาเข้างานของวันนี้แล้ว เมื่อเวลา ${existing.clockIn}` };
    }

    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return { success: false, message: 'ไม่พบพนักงาน' };

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // Work shift check: standard 08:00
    const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 0);
    const targetComp = companies.find(c => c.id === (options?.companyId || emp.companyId)) || companies[0];

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      employeeCode: emp.employeeCode,
      companyId: targetComp.id,
      date: today,
      clockIn: timeStr,
      status: isLate ? 'LATE' : 'ON_TIME',
      workShift: emp.workShift || '08:00 - 17:00',
      locationName: targetComp.name,
      isSimulatedLocation: options?.isSimulated ?? true,
      distanceMeters: Math.floor(Math.random() * 45) + 10,
      clockInLat: options?.lat || targetComp.location.lat,
      clockInLng: options?.lng || targetComp.location.lng,
      note: isLate ? 'เข้างานสายเกินกำหนดเวลา 08:00 น.' : undefined,
    };

    setAttendance(prev => [newRecord, ...prev]);
    addAuditLog('CLOCK_IN', 'เวลางานและวันลา', `ลงเวลาเข้างาน: ${emp.firstName} ${emp.lastName} เวลา ${timeStr} (${isLate ? 'สาย' : 'ตรงเวลา'})`);

    return {
      success: true,
      message: `ลงเวลาเข้างานสำเร็จ (${timeStr}) ${isLate ? '⚠️ สายเกินเวลา 08:00' : '✅ ตรงเวลา'}`
    };
  };

  const clockOut = (employeeId: string): { success: boolean; message: string } => {
    const today = new Date().toISOString().split('T')[0];
    const recordIndex = attendance.findIndex(a => a.employeeId === employeeId && a.date === today);

    if (recordIndex === -1 || !attendance[recordIndex].clockIn) {
      return { success: false, message: 'ไม่พบรายการลงเวลาเข้างานของวันนี้ กรุณาลงเวลาเข้างานก่อน' };
    }

    if (attendance[recordIndex].clockOut) {
      return { success: false, message: `คุณได้ลงเวลาออกงานแล้ว เมื่อเวลา ${attendance[recordIndex].clockOut}` };
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const isEarly = now.getHours() < 17;

    setAttendance(prev => {
      const copy = [...prev];
      copy[recordIndex] = {
        ...copy[recordIndex],
        clockOut: timeStr,
        status: isEarly ? 'EARLY_LEAVE' : copy[recordIndex].status,
      };
      return copy;
    });

    addAuditLog('CLOCK_OUT', 'เวลางานและวันลา', `ลงเวลาออกงาน: ${attendance[recordIndex].employeeName} เวลา ${timeStr}`);
    return { success: true, message: `ลงเวลาออกงานสำเร็จ (${timeStr})` };
  };

  const requestAttendanceCorrection = (attId: string, reason: string, newClockIn: string, newClockOut: string) => {
    setAttendance(prev => prev.map(a => {
      if (a.id !== attId) return a;
      return {
        ...a,
        correctionRequested: true,
        correctionReason: reason,
        originalClockIn: a.clockIn,
        originalClockOut: a.clockOut,
        note: `คำขอแก้ไขเวลา: เข้า ${newClockIn} / ออก ${newClockOut} (เหตุผล: ${reason})`,
      };
    }));
    addAuditLog('REQUEST_ATT_CORRECTION', 'เวลางานและวันลา', `ยื่นขอแก้ไขเวลา ID: ${attId} เหตุผล: ${reason}`);
  };

  const approveAttendanceCorrection = (attId: string) => {
    setAttendance(prev => prev.map(a => {
      if (a.id !== attId) return a;
      return {
        ...a,
        correctionRequested: false,
        status: 'ON_TIME',
        note: 'การขอแก้ไขเวลาได้รับการตรวจสอบและอนุมัติแล้ว',
      };
    }));
    addAuditLog('APPROVE_ATT_CORRECTION', 'เวลางานและวันลา', `อนุมัติแก้ไขเวลา ID: ${attId}`);
  };

  // Payroll Methods
  const createPayrollCycle = (name: string, month: number, year: number, companyId: string): PayrollCycle => {
    const cycleCode = `PAY-${year}-${String(month).padStart(2, '0')}`;
    const newCycle: PayrollCycle = {
      id: `pay-${Date.now()}`,
      cycleCode,
      name,
      month,
      year,
      startDate: `${year - 543}-${String(month).padStart(2, '0')}-01`,
      endDate: `${year - 543}-${String(month).padStart(2, '0')}-28`,
      paymentDate: `${year - 543}-${String(month).padStart(2, '0')}-28`,
      companyId,
      status: 'DRAFT',
      totalEmployees: 0,
      totalGrossAmount: 0,
      totalDeductions: 0,
      totalNetAmount: 0,
      snapshots: [],
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setPayrollCycles(prev => [newCycle, ...prev]);
    addAuditLog('CREATE_PAYROLL_CYCLE', 'เงินเดือนและสลิป', `สร้างรอบเงินเดือน: ${name} (${cycleCode})`);
    return newCycle;
  };

  const calculatePayrollCycle = (cycleId: string) => {
    const cycle = payrollCycles.find(c => c.id === cycleId);
    if (!cycle) return;

    // Filter employees by company if not ALL
    const eligibleEmployees = employees.filter(e =>
      (cycle.companyId === 'ALL' || e.companyId === cycle.companyId) &&
      (e.employmentStatus === 'ACTIVE' || e.employmentStatus === 'PROBATION')
    );

    let sumGross = 0;
    let sumDeductions = 0;
    let sumNet = 0;

    const snapshots: EmployeePayrollSnapshot[] = eligibleEmployees.map(emp => {
      const dept = departments.find(d => d.id === emp.departmentId);

      // Check attendance for this month: late records
      const empAttendance = attendance.filter(a => a.employeeId === emp.id);
      const lateCount = empAttendance.filter(a => a.status === 'LATE').length;
      const attendanceBonus = lateCount === 0 ? 1000 : 0; // เบี้ยขยัน 1,000 หากไม่สาย

      // Calculate OT from approved OT requests
      const approvedOT = requests.filter(r =>
        r.employeeId === emp.id &&
        r.requestType === 'OT' &&
        r.status === 'APPROVED'
      );
      const totalOtHours = approvedOT.reduce((acc, r) => acc + (r.otHours || 0), 0);
      const hourlyRate = (emp.baseSalary / 30 / 8);
      const otPay = Math.round(totalOtHours * hourlyRate * 1.5);

      // Other fixed/standard earnings
      const otherEarnings = 0;
      const totalGrossIncome = emp.baseSalary + (emp.positionAllowance || 0) + attendanceBonus + otPay + otherEarnings;

      // Social security: 5% of base salary capped at 750
      const socialSecurity = Math.min(750, Math.round(emp.baseSalary * 0.05));

      // Withholding tax simulation (monthly estimate)
      let withholdingTax = 0;
      if (totalGrossIncome > 40000) {
        withholdingTax = Math.round((totalGrossIncome - 40000) * 0.10 + 1000);
      } else if (totalGrossIncome > 26000) {
        withholdingTax = Math.round((totalGrossIncome - 26000) * 0.05 + 200);
      }

      const absenceDeduction = 0;
      const otherDeductions = 0;
      const totalDeductions = socialSecurity + withholdingTax + absenceDeduction + otherDeductions;
      const netPay = totalGrossIncome - totalDeductions;

      sumGross += totalGrossIncome;
      sumDeductions += totalDeductions;
      sumNet += netPay;

      const itemizedEarnings: PayrollItemEntry[] = [
        { id: `e1-${emp.id}`, name: 'เงินเดือนพื้นฐาน', type: 'EARNING', amount: emp.baseSalary, isTaxable: true, isSocialSecurityBase: true },
      ];
      if (emp.positionAllowance > 0) {
        itemizedEarnings.push({ id: `e2-${emp.id}`, name: 'เงินประจำตำแหน่ง', type: 'EARNING', amount: emp.positionAllowance, isTaxable: true, isSocialSecurityBase: true });
      }
      if (attendanceBonus > 0) {
        itemizedEarnings.push({ id: `e3-${emp.id}`, name: 'เบี้ยขยันประจำเดือน (ไม่ขาด/ไม่สาย)', type: 'EARNING', amount: attendanceBonus, isTaxable: true, isSocialSecurityBase: false });
      }
      if (otPay > 0) {
        itemizedEarnings.push({ id: `e4-${emp.id}`, name: `ค่าล่วงเวลา (${totalOtHours} ชม. x 1.5)`, type: 'EARNING', amount: otPay, isTaxable: true, isSocialSecurityBase: false });
      }

      const itemizedDeductions: PayrollItemEntry[] = [
        { id: `d1-${emp.id}`, name: 'เงินสมทบกองทุนประกันสังคม (5% สูงสุด 750)', type: 'DEDUCTION', amount: socialSecurity, isTaxable: false, isSocialSecurityBase: false },
        { id: `d2-${emp.id}`, name: 'ภาษีหัก ณ ที่จ่าย (ประมาณการ)', type: 'DEDUCTION', amount: withholdingTax, isTaxable: false, isSocialSecurityBase: false },
      ];

      return {
        id: `snp-${cycle.id}-${emp.id}`,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        departmentName: dept?.name || 'ฝ่ายงาน',
        positionName: emp.positionName,
        companyId: emp.companyId,
        baseSalary: emp.baseSalary,
        positionAllowance: emp.positionAllowance,
        attendanceBonus,
        otPay,
        otHours: totalOtHours,
        otherEarnings,
        totalGrossIncome,
        socialSecurity,
        studentLoanDeduction: 0,
        withholdingTax,
        absenceDeduction,
        otherDeductions,
        totalDeductions,
        netPay,
        itemizedEarnings,
        itemizedDeductions,
        isLocked: false,
      };
    });

    setPayrollCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      return {
        ...c,
        status: 'CALCULATED',
        totalEmployees: eligibleEmployees.length,
        totalGrossAmount: sumGross,
        totalDeductions: sumDeductions,
        totalNetAmount: sumNet,
        snapshots,
      };
    }));

    addAuditLog('CALCULATE_PAYROLL', 'เงินเดือนและสลิป', `คำนวณเงินเดือนรอบ ${cycle.cycleCode} รวม ${eligibleEmployees.length} คน รวมสุทธิ ${sumNet.toLocaleString()} บาท`);
  };

  const updateEmployeeSnapshot = (cycleId: string, snapshotId: string, updates: Partial<EmployeePayrollSnapshot>) => {
    setPayrollCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      const updatedSnapshots = c.snapshots.map(s => {
        if (s.id !== snapshotId) return s;
        const merged = { ...s, ...updates };
        const baseSalary = Number(merged.baseSalary) || 0;
        const positionAllowance = Number(merged.positionAllowance) || 0;
        const attendanceBonus = Number(merged.attendanceBonus) || 0;
        const otPay = Number(merged.otPay) || 0;
        const otherEarnings = Number(merged.otherEarnings) || 0;
        const totalGrossIncome = baseSalary + positionAllowance + attendanceBonus + otPay + otherEarnings;

        const socialSecurity = Number(merged.socialSecurity) || 0;
        const studentLoanDeduction = Number(merged.studentLoanDeduction) || 0;
        const withholdingTax = Number(merged.withholdingTax) || 0;
        const absenceDeduction = Number(merged.absenceDeduction) || 0;
        const otherDeductions = Number(merged.otherDeductions) || 0;
        const totalDeductions = socialSecurity + studentLoanDeduction + withholdingTax + absenceDeduction + otherDeductions;

        const netPay = Math.max(0, totalGrossIncome - totalDeductions);

        return {
          ...merged,
          baseSalary,
          positionAllowance,
          attendanceBonus,
          otPay,
          otherEarnings,
          totalGrossIncome,
          socialSecurity,
          studentLoanDeduction,
          withholdingTax,
          absenceDeduction,
          otherDeductions,
          totalDeductions,
          netPay,
        };
      });

      const sumGross = updatedSnapshots.reduce((acc, s) => acc + s.totalGrossIncome, 0);
      const sumDeductions = updatedSnapshots.reduce((acc, s) => acc + s.totalDeductions, 0);
      const sumNet = updatedSnapshots.reduce((acc, s) => acc + s.netPay, 0);

      return {
        ...c,
        totalGrossAmount: sumGross,
        totalDeductions: sumDeductions,
        totalNetAmount: sumNet,
        snapshots: updatedSnapshots,
      };
    }));

    addAuditLog('UPDATE_SNAPSHOT', 'เงินเดือนและสลิป', `แก้ไขยอดเงินเดือนรายบุคคลแบบแมนนวล ID: ${snapshotId}`);
  };

  const approvePayrollCycle = (cycleId: string) => {
    setPayrollCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      return {
        ...c,
        status: 'APPROVED',
        approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        approvedBy: currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : 'ผู้บริหาร',
        snapshots: c.snapshots.map(s => ({ ...s, isLocked: true })), // Lock snapshots!
      };
    }));
    addAuditLog('APPROVE_PAYROLL', 'เงินเดือนและสลิป', `อนุมัติรอบเงินเดือน ID: ${cycleId}`);
  };

  const payPayrollCycle = (cycleId: string) => {
    setPayrollCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      return {
        ...c,
        status: 'PAID',
        paidAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        paidBy: currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : 'ฝ่ายการเงิน',
      };
    }));

    // Broadcast notification to employees that payslips are ready
    addNotification({
      userId: 'ALL',
      targetRole: 'EMPLOYEE',
      title: 'สลิปเงินเดือนเผยแพร่แล้ว',
      message: 'รอบเงินเดือนล่าสุดผ่านการอนุมัติและจ่ายแล้ว สามารถตรวจสอบสลิปของท่านได้',
      type: 'PAYROLL',
      linkTarget: 'emp-payslip',
    });

    addAuditLog('PAY_PAYROLL', 'เงินเดือนและสลิป', `บันทึกจ่ายเงินเดือนและเผยแพร่สลิปรอบ ID: ${cycleId}`);
  };

  const cancelPayrollCycle = (cycleId: string) => {
    setPayrollCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      return { ...c, status: 'CANCELLED' };
    }));
    addAuditLog('CANCEL_PAYROLL', 'เงินเดือนและสลิป', `ยกเลิกรอบเงินเดือน ID: ${cycleId}`);
  };

  // Holidays
  const addHoliday = (name: string, date: string, companyId = 'ALL') => {
    const newHol: Holiday = {
      id: `h-${Date.now()}`,
      name,
      date,
      companyId,
      isTraditional: true,
    };
    setHolidays(prev => [...prev, newHol]);
    addAuditLog('ADD_HOLIDAY', 'ตั้งค่า', `เพิ่มวันหยุด: ${name} (${date})`);
  };

  const deleteHoliday = (id: string) => {
    setHolidays(prev => prev.filter(h => h.id !== id));
    addAuditLog('DELETE_HOLIDAY', 'ตั้งค่า', `ลบวันหยุด ID: ${id}`);
  };

  // Announcements
  const addAnnouncement = (title: string, content: string, priority: 'NORMAL' | 'HIGH' | 'URGENT') => {
    const newAnn: CompanyAnnouncement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      date: new Date().toISOString().split('T')[0],
      companyId: 'ALL',
      author: currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : 'ฝ่ายบริหาร',
      priority,
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    addAuditLog('ADD_ANNOUNCEMENT', 'ภาพรวม', `เพิ่มประกาศ: ${title}`);
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Safe CSV Export with protection against CSV Formula Injection
  const exportToCsv = (fileName: string, headers: string[], rows: (string | number)[][]) => {
    const sanitizeCell = (cell: string | number): string => {
      let str = String(cell ?? '');
      // CSV Formula Injection mitigation: If starts with =, +, -, @, prepend single quote
      if (/^[=+\-@]/.test(str)) {
        str = `'${str}`;
      }
      // Escape double quotes
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerLine = headers.map(sanitizeCell).join(',');
    const bodyLines = rows.map(row => row.map(sanitizeCell).join(',')).join('\n');
    const csvContent = '\uFEFF' + headerLine + '\n' + bodyLines; // Include BOM for Excel Thai language support!

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addAuditLog('EXPORT_CSV', 'รายงาน', `ส่งออกไฟล์รายงาน CSV: ${fileName}`);
  };

  const resetAllData = () => {
    localStorage.clear();
    setCompanies(INITIAL_COMPANIES);
    setDepartments(INITIAL_DEPARTMENTS);
    setEmployees(INITIAL_EMPLOYEES);
    setRequests(INITIAL_REQUESTS);
    setAttendance(INITIAL_ATTENDANCE);
    setHolidays(INITIAL_HOLIDAYS);
    setPayrollCycles(INITIAL_PAYROLL_CYCLES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    window.location.reload();
  };

  return (
    <HRContext.Provider
      value={{
        companies,
        departments,
        employees,
        requests,
        attendance,
        holidays,
        payrollCycles,
        notifications,
        auditLogs,
        announcements,
        selectedCompanyId,
        setSelectedCompanyId,
        addCompany,
        updateCompany,
        deleteCompany,
        addCompanyPolicy,
        deleteCompanyPolicy,
        addDepartment,
        deleteDepartment,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        clearAllEmployees,
        updateEmployeeStatus,
        transferEmployeeDepartment,
        addEmployeeWarning,
        uploadEmployeeDocument,
        submitLeaveRequest,
        submitOTRequest,
        approveRequest,
        rejectRequest,
        cancelRequest,
        clockIn,
        clockOut,
        requestAttendanceCorrection,
        approveAttendanceCorrection,
        createPayrollCycle,
        calculatePayrollCycle,
        updateEmployeeSnapshot,
        approvePayrollCycle,
        payPayrollCycle,
        cancelPayrollCycle,
        addHoliday,
        deleteHoliday,
        addAnnouncement,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        exportToCsv,
        resetAllData,
      }}
    >
      {children}
    </HRContext.Provider>
  );
};

export const useHR = () => {
  const context = useContext(HRContext);
  if (!context) {
    throw new Error('useHR must be used within an HRProvider');
  }
  return context;
};
