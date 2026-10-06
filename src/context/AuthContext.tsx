import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Employee, Role } from '../types';
import { INITIAL_USERS, INITIAL_EMPLOYEES } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  currentEmployee: Employee | null;
  role: Role;
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  switchRole: (role: Role) => void;
  canAccessMenu: (menuKey: string) => boolean;
  canApproveFor: (targetEmployeeId: string) => boolean;
  isSuperAdmin: boolean;
  isHRManager: boolean;
  isDepartmentHead: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'vn_hrms_auth_user_v2';

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
    if (currentUser && currentUser.employeeId) {
      return INITIAL_EMPLOYEES.find(e => e.id === currentUser.employeeId) || null;
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
      const emp = INITIAL_EMPLOYEES.find(e => e.id === currentUser.employeeId);
      setCurrentEmployee(emp || null);
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
      setCurrentEmployee(null);
    }
  }, [currentUser]);

  const login = (username: string, password?: string): boolean => {
    const term = username.trim().toLowerCase();
    const pass = (password || '').trim();

    const foundUser = INITIAL_USERS.find(u => {
      const uName = u.username.toLowerCase();
      const matchUsername =
        uName === term ||
        (u.role === 'SUPER_ADMIN' && (term === 'superadmin' || term === 'super admin')) ||
        (u.role === 'HR_MANAGER' && (term === 'hr manager' || term === 'hrmanager' || term === 'hr')) ||
        (u.role === 'DEPARTMENT_HEAD' && (term === 'หัวหน้าแผนก' || term === 'depthead' || term === 'dept head')) ||
        (u.role === 'EMPLOYEE' && (term === 'พนักงาน' || term === 'employee' || term === 'staff'));

      if (!matchUsername) return false;
      return u.password === pass;
    });

    if (foundUser && foundUser.isActive) {
      setCurrentUser(foundUser);
      return true;
    }
    return false;
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
      return ['dashboard', 'requests', 'attendance-leave'].includes(menuKey);
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
