import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Employee, Role } from '../types';
import { INITIAL_USERS, INITIAL_EMPLOYEES } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  currentEmployee: Employee | null;
  role: Role;
  login: (username: string, password?: string, branchId?: string) => boolean;
  logout: () => void;
  switchRole: (role: Role) => void;
  canAccessMenu: (menuKey: string) => boolean;
  canApproveFor: (targetEmployeeId: string) => boolean;
  updateUserAvatar: (avatarUrl: string | null) => void;
  isSuperAdmin: boolean;
  isHRManager: boolean;
  isDepartmentHead: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'vn_hrms_auth_user_v3';

const createDefaultLeaveQuotas = () => ({
  SICK: { leaveType: 'SICK' as const, entitledDays: 30, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 30 },
  PERSONAL: { leaveType: 'PERSONAL' as const, entitledDays: 6, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 6 },
  ANNUAL: { leaveType: 'ANNUAL' as const, entitledDays: 10, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 10 },
  MATERNITY: { leaveType: 'MATERNITY' as const, entitledDays: 98, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 98 },
  MILITARY: { leaveType: 'MILITARY' as const, entitledDays: 60, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 60 },
  TRAINING: { leaveType: 'TRAINING' as const, entitledDays: 7, usedDays: 0, pendingDays: 0, carriedOverDays: 0, remainingDays: 7 },
});

const getDefaultEmployeeForUser = (user: User): Employee => {
  const companyId = user.assignedCompanyIds[0] || 'c1';
  const isTmk = companyId === 'c2';
  const branchShort = isTmk ? 'ท่ามะเขือ' : 'เมืองกำแพงเพชร';

  let positionName = 'พนักงาน';
  let firstName = 'พนักงาน';
  let lastName = `สาขา${branchShort}`;
  let departmentId = isTmk ? 'd6' : 'd2';

  if (user.role === 'SUPER_ADMIN') {
    positionName = 'ผู้ดูแลระบบสูงสุด (Super Admin)';
    firstName = 'ผู้ดูแลระบบ';
    lastName = 'VN Group';
    departmentId = 'd1';
  } else if (user.role === 'HR_MANAGER') {
    positionName = 'ผู้จัดการฝ่ายทรัพยากรบุคคล';
    firstName = 'ผู้จัดการฝ่ายบุคคล';
    lastName = 'VN Group';
    departmentId = 'd1';
  } else if (user.role === 'DEPARTMENT_HEAD') {
    positionName = isTmk ? 'หัวหน้าครูฝึกสอน (สาขาท่ามะเขือ)' : 'หัวหน้าฝ่ายครูฝึกสอน';
    firstName = 'หัวหน้าแผนก';
    lastName = `สาขา${branchShort}`;
    departmentId = isTmk ? 'd6' : 'd2';
  } else {
    positionName = isTmk ? 'ครูฝึกสอนขับรถ (สาขาท่ามะเขือ)' : 'ครูฝึกสอนขับรถยนต์';
    firstName = 'พนักงาน';
    lastName = `สาขา${branchShort}`;
    departmentId = isTmk ? 'd6' : 'd2';
  }

  return {
    id: user.employeeId || `emp-${user.id}`,
    employeeCode: isTmk
      ? (user.role === 'DEPARTMENT_HEAD' ? 'VN-TMK-M01' : 'VN-TMK-E01')
      : (user.role === 'DEPARTMENT_HEAD' ? 'VN-KPP-M01' : 'VN-KPP-E01'),
    firstName,
    lastName,
    nickname: user.role === 'DEPARTMENT_HEAD' ? 'หัวหน้า' : 'เจ้าหน้าที่',
    avatarUrl: user.avatarUrl || undefined,
    email: `${user.username.replace(/[^a-zA-Z0-9]/g, '') || 'user'}@vngroup.local`,
    phone: isTmk ? '055-781-456' : '055-711-889',
    idCardNumber: '1-6201-00000-00-1',
    birthDate: '1992-04-12',
    companyId,
    departmentId,
    positionId: isTmk ? 'p9' : 'p4',
    positionName,
    baseSalary: user.role === 'DEPARTMENT_HEAD' ? 28000 : 20000,
    positionAllowance: 0,
    hireDate: '2024-01-15',
    probationEndDate: '2024-04-15',
    employmentStatus: 'ACTIVE',
    workShift: '08:00 - 17:00 (อังคาร-อาทิตย์)',
    approverId: '',
    bankAccount: {
      bankName: 'ธนาคารกสิกรไทย',
      accountNumber: '123-4-56789-0',
    },
    leaveQuotas: createDefaultLeaveQuotas(),
    documents: [],
    warnings: [],
    departmentHistory: [],
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'ADMIN_HR') parsed.role = 'HR_MANAGER';
        if (parsed.role === 'APPROVER') parsed.role = 'DEPARTMENT_HEAD';
        return parsed;
      } catch {
        return null;
      }
    }
    return null; // Require login only
  });

  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(() => {
    if (currentUser) {
      const found = INITIAL_EMPLOYEES.find(e => e.id === currentUser.employeeId);
      return found || getDefaultEmployeeForUser(currentUser);
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
      const found = INITIAL_EMPLOYEES.find(e => e.id === currentUser.employeeId);
      setCurrentEmployee(found || getDefaultEmployeeForUser(currentUser));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
      setCurrentEmployee(null);
    }
  }, [currentUser]);

  const login = (username: string, password?: string, branchId?: string): boolean => {
    const rawTerm = username.trim().toLowerCase();
    const pass = (password || '').trim();

    // Check branch intent from password, username or branchId
    const isTmk =
      pass === '62120' ||
      pass === '01470' ||
      rawTerm.includes('ท่ามะเขือ') ||
      rawTerm.includes('tmk') ||
      branchId === 'c2';

    const isKpp =
      pass === '62000' ||
      pass === '963852' ||
      rawTerm.includes('กำแพงเพชร') ||
      rawTerm.includes('kpp') ||
      branchId === 'c1';

    const foundUser = INITIAL_USERS.find(u => {
      const uName = u.username.toLowerCase();
      let matchUsername = false;

      if (u.role === 'SUPER_ADMIN') {
        matchUsername =
          uName === rawTerm ||
          rawTerm === 'superadmin' ||
          rawTerm === 'super admin';
      } else if (u.role === 'HR_MANAGER') {
        matchUsername =
          uName === rawTerm ||
          rawTerm === 'hr manager' ||
          rawTerm === 'hrmanager' ||
          rawTerm === 'hr';
      } else if (u.role === 'DEPARTMENT_HEAD') {
        const isDeptHeadKeyword =
          rawTerm === 'หัวหน้าแผนก' ||
          rawTerm === 'depthead' ||
          rawTerm === 'dept head' ||
          rawTerm.startsWith('หัวหน้าแผนก') ||
          rawTerm.startsWith('depthead');

        if (isDeptHeadKeyword || uName === rawTerm) {
          if (u.assignedCompanyIds.includes('c2')) {
            matchUsername = isTmk || (!isKpp && branchId === 'c2');
          } else if (u.assignedCompanyIds.includes('c1')) {
            matchUsername = isKpp || (!isTmk && branchId === 'c1') || (!isTmk && !isKpp && !branchId);
          }
        }
      } else if (u.role === 'EMPLOYEE') {
        const isEmployeeKeyword =
          rawTerm === 'พนักงาน' ||
          rawTerm === 'employee' ||
          rawTerm === 'staff' ||
          rawTerm.startsWith('พนักงาน') ||
          rawTerm.startsWith('employee');

        if (isEmployeeKeyword || uName === rawTerm) {
          if (u.assignedCompanyIds.includes('c2')) {
            matchUsername = isTmk || (!isKpp && branchId === 'c2');
          } else if (u.assignedCompanyIds.includes('c1')) {
            matchUsername = isKpp || (!isTmk && branchId === 'c1') || (!isTmk && !isKpp && !branchId);
          }
        }
      }

      if (!matchUsername) return false;
      return u.password === pass;
    });

    if (foundUser && foundUser.isActive) {
      const storedAvatar = localStorage.getItem(`vn_user_avatar_${foundUser.id}`);
      const userWithAvatar = storedAvatar ? { ...foundUser, avatarUrl: storedAvatar } : foundUser;
      setCurrentUser(userWithAvatar);
      return true;
    }
    return false;
  };

  const updateUserAvatar = (avatarUrl: string | null) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, avatarUrl };
      setCurrentUser(updatedUser);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      if (avatarUrl) {
        localStorage.setItem(`vn_user_avatar_${currentUser.id}`, avatarUrl);
      } else {
        localStorage.removeItem(`vn_user_avatar_${currentUser.id}`);
      }
    }
    if (currentEmployee) {
      setCurrentEmployee({ ...currentEmployee, avatarUrl: avatarUrl || undefined });
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchRole = (newRole: Role) => {
    const matchingUser = INITIAL_USERS.find(u => u.role === newRole) || INITIAL_USERS[0];
    setCurrentUser(matchingUser);
  };

  const role = currentUser?.role || 'EMPLOYEE';

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isHRManager = role === 'HR_MANAGER';
  const isDepartmentHead = role === 'DEPARTMENT_HEAD';
  const isEmployee = role === 'EMPLOYEE';

  // Permission check per menu item
  const canAccessMenu = (menuKey: string): boolean => {
    if (!currentUser) return false;

    // Super Admin has access to all pages
    if (isSuperAdmin) return true;

    // HR Manager:
    if (isHRManager) {
      return [
        'hr-management',      // Integrated HR Workspace (Employees, Leaves, Approvals, Calendar)
        'hr-payroll-reports', // Integrated Payroll & Reports Workspace
        'dashboard',
        'requests',
        'employees',
        'attendance-leave',
        'payroll',
        'reports',
      ].includes(menuKey);
    }

    // Department Head:
    if (isDepartmentHead) {
      return ['dashboard', 'requests', 'attendance-leave', 'employees'].includes(menuKey);
    }

    // Employee:
    return ['emp-home', 'emp-requests', 'emp-attendance', 'emp-profile', 'emp-payslip'].includes(menuKey);
  };

  const canApproveFor = (targetEmployeeId: string): boolean => {
    if (!currentEmployee) return false;
    // Cannot approve own request
    if (currentEmployee.id === targetEmployeeId) return false;

    if (isSuperAdmin || isHRManager) return true;
    if (isDepartmentHead) {
      const target = INITIAL_EMPLOYEES.find(e => e.id === targetEmployeeId);
      return target?.approverId === currentEmployee.id;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentEmployee,
        role,
        login,
        logout,
        switchRole,
        canAccessMenu,
        canApproveFor,
        updateUserAvatar,
        isSuperAdmin,
        isHRManager,
        isDepartmentHead,
        isEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
