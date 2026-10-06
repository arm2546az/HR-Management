import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HRProvider, useHR } from './context/HRContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './components/auth/LoginPage';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { EmployeeDashboard } from './components/dashboard/EmployeeDashboard';
import { RequestsPage } from './components/requests/RequestsPage';
import { HRManagementWorkspace } from './components/employees/HRManagementWorkspace';
import { HRPayrollReportsWorkspace } from './components/payroll/HRPayrollReportsWorkspace';
import { AttendanceLeavePage } from './components/attendance/AttendanceLeavePage';
import { SettingsPage } from './components/settings/SettingsPage';
import { EmployeeProfileView } from './components/employee/EmployeeProfileView';
import { EmployeeRequestsPage } from './components/employee/EmployeeRequestsPage';

const MainLayout: React.FC = () => {
  const { currentUser, role } = useAuth();
  const { selectedCompanyId, companies } = useHR();

  // Sidebar open state (for mobile & toggle)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Active Tab state based on user role
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (role === 'EMPLOYEE') return 'emp-home';
    if (role === 'HR_MANAGER') return 'hr-management';
    return 'dashboard';
  });

  // If role changes, ensure active tab is appropriate
  React.useEffect(() => {
    if (role === 'EMPLOYEE') {
      if (!['emp-home', 'emp-requests', 'emp-attendance', 'emp-profile'].includes(activeTab)) {
        setActiveTab('emp-home');
      }
    } else if (role === 'HR_MANAGER') {
      if (!['hr-management', 'hr-payroll-reports'].includes(activeTab)) {
        setActiveTab('hr-management');
      }
    } else if (role === 'DEPARTMENT_HEAD') {
      if (!['dashboard', 'requests', 'attendance-leave'].includes(activeTab)) {
        setActiveTab('dashboard');
      }
    } else {
      // Super Admin
      if (['emp-home', 'emp-profile'].includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [role, activeTab]);

  if (!currentUser) {
    return <LoginPage />;
  }

  // Breadcrumb titles
  const tabTitles: Record<string, string> = {
    dashboard: 'ภาพรวมผู้บริหาร',
    requests: 'ศูนย์คำขอและการอนุมัติ',
    'hr-management': 'บริหารงานบุคคล (HR Management)',
    'hr-payroll-reports': 'เงินเดือนและรายงาน (Payroll & Reports)',
    employees: 'บริหารงานบุคคล',
    'attendance-leave': 'เวลางานและวันลา',
    payroll: 'เงินเดือนและรายงาน',
    reports: 'เงินเดือนและรายงาน',
    settings: 'การตั้งค่าระบบองค์กร',

    'emp-home': 'หน้าหลัก & ลงเวลา',
    'emp-requests': 'คำขอของฉัน & สลิปเงินเดือน (My Requests & e-Slip)',
    'emp-attendance': 'เวลางานและวันลา',
    'emp-profile': 'โปรไฟล์ของฉัน',
  };

  const branchName = selectedCompanyId === 'ALL'
    ? 'ทุกสาขาในเครือ'
    : companies.find(c => c.id === selectedCompanyId)?.shortName || 'สาขา';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Sidebar Component */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 transition-all duration-300">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          currentTab={activeTab}
          onNavigate={setActiveTab}
        />

        {/* Breadcrumb Header without redundant duplicate text */}
        <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-bold text-[#022247]">VN Group HRMS</span>
            <i className="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>
            <span className="text-[#064a8b] font-bold">{tabTitles[activeTab] || activeTab}</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">สาขาที่แสดง:</span>
            <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
              📍 {branchName}
            </span>
          </div>
        </div>

        {/* Page Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {/* Workspaces & Modules */}
          {activeTab === 'dashboard' && <AdminDashboard onNavigate={setActiveTab} />}
          {activeTab === 'requests' && <RequestsPage />}
          {activeTab === 'hr-management' && <HRManagementWorkspace />}
          {activeTab === 'hr-payroll-reports' && <HRPayrollReportsWorkspace />}
          {activeTab === 'employees' && <HRManagementWorkspace />}
          {activeTab === 'attendance-leave' && <AttendanceLeavePage />}
          {activeTab === 'payroll' && <HRPayrollReportsWorkspace />}
          {activeTab === 'reports' && <HRPayrollReportsWorkspace />}
          {activeTab === 'settings' && <SettingsPage />}

          {/* Employee Pages - Single 'emp-requests' route for both leave requests and payslips */}
          {activeTab === 'emp-home' && <EmployeeDashboard onNavigate={setActiveTab} />}
          {activeTab === 'emp-requests' && <EmployeeRequestsPage onNavigate={setActiveTab} />}
          {activeTab === 'emp-attendance' && <AttendanceLeavePage />}
          {activeTab === 'emp-profile' && <EmployeeProfileView />}
        </main>

        {/* Global Footer */}
        <footer className="mt-auto bg-white border-t border-slate-200 px-4 sm:px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">© 2026 VN Group</span>
            <span>• โรงเรียนสอนขับรถวีเอ็น (กำแพงเพชร & ท่ามะเขือ)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              ระบบออนไลน์
            </span>
            <span>เวอร์ชัน 1.0.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <HRProvider>
        <MainLayout />
      </HRProvider>
    </AuthProvider>
  );
}
