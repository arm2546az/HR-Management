import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHR } from '../../context/HRContext';
import { DataTable, Column } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { Employee, EmploymentStatus, Holiday, UnifiedRequest } from '../../types';
import { formatThaiDate, formatCurrency, getStatusBadge, getLeaveTypeName, Alert } from '../../utils/helpers';

export const HRManagementWorkspace: React.FC = () => {
  const { role, canApproveFor, currentEmployee } = useAuth();
  const {
    employees,
    companies,
    departments,
    requests,
    holidays,
    addEmployee,
    updateEmployeeStatus,
    transferEmployeeDepartment,
    addEmployeeWarning,
    uploadEmployeeDocument,
    approveRequest,
    rejectRequest,
    addHoliday,
    deleteHoliday,
    selectedCompanyId,
    clearAllEmployees,
  } = useHR();

  // 4 Core Sub-tabs for HR Workspace
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'STATUS_TRACKING' | 'LEAVE_APPROVALS' | 'HOLIDAYS'>('DIRECTORY');

  // Directory Filters
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modals & Drawers
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [profileTab, setProfileTab] = useState<'PERSONAL' | 'EMPLOYMENT' | 'LEAVE' | 'DOCUMENTS' | 'HISTORY'>('PERSONAL');

  // Transfer Dept Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferDeptId, setTransferDeptId] = useState(departments[0]?.id || 'd1');
  const [transferPosName, setTransferPosName] = useState('ครูฝึกสอนขับรถยนต์อาวุโส');
  const [transferReason, setTransferReason] = useState('');

  // Warning Modal
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningLevel, setWarningLevel] = useState<'VERBAL' | 'WRITTEN' | 'FINAL'>('WRITTEN');
  const [warningReason, setWarningReason] = useState('');

  // Doc Upload Modal
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<any>('CONTRACT');

  // Add Holiday Modal
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('2026-11-20');
  const [newHolidayCompanyId, setNewHolidayCompanyId] = useState('ALL');

  // Approvals sub-tab: 'PENDING' | 'HISTORY'
  const [approvalSubTab, setApprovalSubTab] = useState<'PENDING' | 'HISTORY'>('PENDING');

  // Add Employee Form State (Manual Entry)
  const [newEmp, setNewEmp] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    phone: '',
    email: '',
    idCardNumber: '',
    birthDate: '1995-05-15',
    companyId: companies[0]?.id || 'c1',
    departmentId: departments[0]?.id || 'd1',
    positionName: 'ครูฝึกสอนขับรถยนต์',
    baseSalary: 22000,
    positionAllowance: 2000,
    hireDate: '2026-10-01',
    probationEndDate: '2027-01-01',
    employmentStatus: 'PROBATION' as EmploymentStatus,
    workShift: '08:00 - 17:00 (อังคาร-อาทิตย์)',
    approverId: employees[0]?.id || '',
  });

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (selectedCompanyId !== 'ALL' && emp.companyId !== selectedCompanyId) return false;
      if (filterDept !== 'ALL' && emp.departmentId !== filterDept) return false;
      if (filterStatus !== 'ALL' && emp.employmentStatus !== filterStatus) return false;
      return true;
    });
  }, [employees, selectedCompanyId, filterDept, filterStatus]);

  // Probation Ending soon (within 45 days)
  const todayStr = '2026-10-05';
  const todayTime = new Date(todayStr).getTime();
  const probationList = useMemo(() => {
    return employees.filter(e => {
      if (e.employmentStatus !== 'PROBATION' || !e.probationEndDate) return false;
      const end = new Date(e.probationEndDate).getTime();
      const diffDays = Math.ceil((end - todayTime) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 45;
    });
  }, [employees, todayTime]);

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      PROBATION: employees.filter(e => e.employmentStatus === 'PROBATION').length,
      ACTIVE: employees.filter(e => e.employmentStatus === 'ACTIVE').length,
      PENDING_START: employees.filter(e => e.employmentStatus === 'PENDING_START').length,
      RESIGNED: employees.filter(e => e.employmentStatus === 'RESIGNED' || e.employmentStatus === 'TERMINATED').length,
    };
  }, [employees]);

  // Leave Requests for Approvals tab
  const leaveRequests = useMemo(() => {
    return requests.filter(r => {
      if (r.requestType !== 'LEAVE') return false;
      if (selectedCompanyId !== 'ALL' && r.companyId !== selectedCompanyId) return false;
      if (approvalSubTab === 'PENDING') return r.status === 'PENDING';
      return r.status === 'APPROVED' || r.status === 'REJECTED' || r.status === 'CANCELLED';
    });
  }, [requests, selectedCompanyId, approvalSubTab]);

  const pendingLeaveCount = useMemo(() => {
    return requests.filter(r => r.requestType === 'LEAVE' && r.status === 'PENDING').length;
  }, [requests]);

  // Handle Add Employee (Manual Entry)
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.firstName.trim() || !newEmp.lastName.trim()) {
      Alert.warning('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุชื่อและนามสกุลพนักงาน');
      return;
    }

    const created = addEmployee(newEmp);
    Alert.success('เพิ่มพนักงานสำเร็จ', `สร้างพนักงาน ${created.firstName} ${created.lastName} (${created.employeeCode}) เรียบร้อยแล้ว`);
    setShowAddEmployeeModal(false);
    setNewEmp({
      firstName: '',
      lastName: '',
      nickname: '',
      phone: '',
      email: '',
      idCardNumber: '',
      birthDate: '1995-05-15',
      companyId: companies[0]?.id || 'c1',
      departmentId: departments[0]?.id || 'd1',
      positionName: 'ครูฝึกสอนขับรถยนต์',
      baseSalary: 22000,
      positionAllowance: 2000,
      hireDate: '2026-10-01',
      probationEndDate: '2027-01-01',
      employmentStatus: 'PROBATION',
      workShift: '08:00 - 17:00 (อังคาร-อาทิตย์)',
      approverId: employees[0]?.id || 'emp-001',
    });
  };

  // Status Change (Pass probation, Resign, etc.)
  const handleStatusChange = async (emp: Employee, newStatus: EmploymentStatus) => {
    let reason: string | undefined = undefined;
    if (newStatus === 'RESIGNED' || newStatus === 'TERMINATED') {
      const prompt = await Alert.promptReason(
        `บันทึกการสิ้นสุดการจ้างงาน (${newStatus === 'RESIGNED' ? 'ลาออก' : 'เลิกจ้าง'})`,
        'ระบุสาเหตุการสิ้นสุดการจ้างงาน...'
      );
      if (!prompt.confirmed || !prompt.reason.trim()) return;
      reason = prompt.reason;
    } else {
      const confirmed = await Alert.confirm(
        'เปลี่ยนสถานะพนักงาน',
        `ต้องการเปลี่ยนสถานะของ ${emp.firstName} ${emp.lastName} เป็น "${getStatusBadge(newStatus).label}" หรือไม่?`
      );
      if (!confirmed) return;
    }

    updateEmployeeStatus(emp.id, newStatus, reason);
    Alert.success('อัปเดตสถานะสำเร็จ', `เปลี่ยนสถานะเป็น ${getStatusBadge(newStatus).label} เรียบร้อย`);
    if (selectedEmployee) {
      setSelectedEmployee({ ...selectedEmployee, employmentStatus: newStatus });
    }
  };

  // Handle Transfer Department
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !transferReason.trim()) {
      Alert.warning('ข้อมูลไม่ครบ', 'กรุณาระบุเหตุผลการย้ายแผนก');
      return;
    }
    transferEmployeeDepartment(selectedEmployee.id, transferDeptId, transferPosName, transferReason);
    Alert.success('บันทึกการย้ายแผนกสำเร็จ', 'ย้ายพนักงานไปยังฝ่ายงานใหม่เรียบร้อยแล้ว');
    setShowTransferModal(false);
    setTransferReason('');
    const updated = employees.find(e => e.id === selectedEmployee.id);
    if (updated) setSelectedEmployee(updated);
  };

  // Handle Warning
  const handleWarningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !warningReason.trim()) {
      Alert.warning('ข้อมูลไม่ครบ', 'กรุณาระบุสาเหตุการออกใบเตือน');
      return;
    }
    addEmployeeWarning(selectedEmployee.id, {
      level: warningLevel,
      reason: warningReason,
    });
    Alert.success('ออกใบเตือนสำเร็จ', 'บันทึกประวัติใบเตือนในระบบเรียบร้อย');
    setShowWarningModal(false);
    setWarningReason('');
    const updated = employees.find(e => e.id === selectedEmployee.id);
    if (updated) setSelectedEmployee(updated);
  };

  // Handle Doc Upload
  const handleDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !docTitle.trim()) {
      Alert.warning('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อเอกสาร');
      return;
    }
    uploadEmployeeDocument(selectedEmployee.id, {
      title: docTitle,
      fileName: `${docTitle.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`,
      type: docType,
      fileSize: '1.2 MB',
    });
    Alert.success('อัปโหลดเอกสารสำเร็จ', 'บันทึกไฟล์เอกสารลงในโปรไฟล์พนักงานเรียบร้อย');
    setShowDocUploadModal(false);
    setDocTitle('');
    const updated = employees.find(e => e.id === selectedEmployee.id);
    if (updated) setSelectedEmployee(updated);
  };

  // Handle Add Holiday
  const handleAddHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayName.trim()) {
      Alert.warning('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อวันหยุด');
      return;
    }
    addHoliday(newHolidayName, newHolidayDate, newHolidayCompanyId);
    Alert.success('เพิ่มวันหยุดสำเร็จ', `บันทึก "${newHolidayName}" (${newHolidayDate}) เรียบร้อยแล้ว`);
    setShowAddHolidayModal(false);
    setNewHolidayName('');
  };

  // Handle Quick Approval
  const handleApprove = (req: UnifiedRequest) => {
    const res = approveRequest(req.id, 'อนุมัติโดยฝ่ายบุคคล');
    if (res.success) {
      Alert.success('อนุมัติคำขอสำเร็จ', res.message);
    } else {
      Alert.error('ไม่สามารถอนุมัติได้', res.message);
    }
  };

  // Handle Quick Reject
  const handleReject = async (req: UnifiedRequest) => {
    const prompt = await Alert.promptReason('ปฏิเสธคำขอลา', 'ระบุเหตุผลการไม่อนุมัติ...');
    if (!prompt.confirmed || !prompt.reason.trim()) return;
    const res = rejectRequest(req.id, prompt.reason);
    if (res.success) {
      Alert.success('ปฏิเสธคำขอเรียบร้อย', res.message);
    } else {
      Alert.error('เกิดข้อผิดพลาด', res.message);
    }
  };

  // Render Employee Card
  const renderEmployeeCard = (emp: Employee) => {
    const comp = companies.find(c => c.id === emp.companyId);
    const dept = departments.find(d => d.id === emp.departmentId);
    const badge = getStatusBadge(emp.employmentStatus);

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-[#064a8b] transition-all flex flex-col justify-between group">
        <div>
          {/* Card Top: Avatar, Name, Code & Status */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#022247] to-[#064a8b] text-[#c3a138] font-black text-lg flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                {emp.firstName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-black text-slate-800 text-sm leading-tight">
                    {emp.firstName} {emp.lastName}
                  </h4>
                  {emp.nickname && (
                    <span className="text-[11px] text-[#064a8b] font-bold">
                      ({emp.nickname})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    {emp.employeeCode}
                  </span>
                  <span className="text-[10px] text-slate-400">•</span>
                  <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                    {comp?.shortName}
                  </span>
                </div>
              </div>
            </div>

            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${badge.bgClass} ${badge.textClass}`}>
              <i className={`fa-solid ${badge.icon} text-[9px]`}></i>
              {badge.label}
            </span>
          </div>

          {/* Department & Position Info */}
          <div className="space-y-1.5 text-xs text-slate-600 mb-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">แผนก:</span>
              <span className="font-bold text-slate-700">{dept?.name || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">ตำแหน่ง:</span>
              <span className="font-semibold text-slate-700">{emp.positionName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">เบอร์โทร:</span>
              <span className="font-mono text-slate-600">{emp.phone}</span>
            </div>
          </div>

          {/* Leave Quota Pills */}
          <div className="flex items-center gap-1.5 text-[11px] mb-3">
            <span className="text-slate-400 text-[10px] font-semibold shrink-0">วันลาคงเหลือ:</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#064a8b] font-bold text-[10px]" title="ลาป่วย">
              ป่วย {emp.leaveQuotas?.SICK?.remainingDays || 0}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[10px]" title="ลากิจ">
              กิจ {emp.leaveQuotas?.PERSONAL?.remainingDays || 0}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[10px]" title="พักร้อน">
              พักร้อน {emp.leaveQuotas?.ANNUAL?.remainingDays || 0}
            </span>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              setSelectedEmployee(emp);
              setProfileTab('PERSONAL');
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-[#064a8b] hover:text-white text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <i className="fa-regular fa-id-card"></i>
            <span>ดูโปรไฟล์</span>
          </button>

          {emp.employmentStatus === 'PROBATION' && (
            <button
              onClick={() => handleStatusChange(emp, 'ACTIVE')}
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
              title="ประเมินผ่านทดลองงาน"
            >
              ผ่านโปร
            </button>
          )}
        </div>
      </div>
    );
  };

  // Columns for Table mode fallback
  const employeeColumns: Column<Employee>[] = [
    {
      key: 'employeeCode',
      header: 'รหัสพนักงาน',
      render: emp => (
        <button
          onClick={() => setSelectedEmployee(emp)}
          className="font-bold text-[#064a8b] hover:underline"
        >
          {emp.employeeCode}
        </button>
      ),
    },
    {
      key: 'name',
      header: 'ชื่อ - นามสกุล',
      render: emp => `${emp.firstName} ${emp.lastName} ${emp.nickname ? `(${emp.nickname})` : ''}`,
    },
    {
      key: 'dept',
      header: 'แผนก / ตำแหน่ง',
      render: emp => `${departments.find(d => d.id === emp.departmentId)?.name || '-'} • ${emp.positionName}`,
    },
    {
      key: 'status',
      header: 'สถานะ',
      align: 'center',
      render: emp => {
        const badge = getStatusBadge(emp.employmentStatus);
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.bgClass} ${badge.textClass}`}>{badge.label}</span>;
      },
    },
    {
      key: 'actions',
      header: 'โปรไฟล์',
      align: 'center',
      render: emp => (
        <button
          onClick={() => setSelectedEmployee(emp)}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-[#064a8b] hover:text-white"
        >
          ดูโปรไฟล์
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#022247] flex items-center gap-2">
            <i className="fa-solid fa-users text-[#064a8b]"></i>
            บริหารงานบุคคล (HR Management Workspace)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ศูนย์รวมการจัดการพนักงาน ติดตามสถานะทดลองงาน คำขอลาและการอนุมัติ และปฏิทินวันหยุดบริษัท
          </p>
        </div>

        <div className="flex items-center gap-2">
          {employees.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('คุณต้องการนำรายชื่อพนักงานทั้งหมดออกจากระบบใช่หรือไม่? ข้อมูลพนักงานจะถูกล้างออกจากระบบ')) {
                  clearAllEmployees();
                  Alert.success('นำรายชื่อพนักงานออกสำเร็จ', 'ล้างข้อมูลรายชื่อพนักงานทั้งหมดออกจากระบบเรียบร้อยแล้ว');
                }
              }}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all flex items-center gap-1.5 shrink-0"
              title="เอารายชื่อพนักงานทั้งหมดออก"
            >
              <i className="fa-solid fa-trash-can text-rose-500"></i>
              เอารายชื่อพนักงานออก
            </button>
          )}

          <button
            onClick={() => setShowAddEmployeeModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <i className="fa-solid fa-user-plus text-[#c3a138]"></i>
            เพิ่มพนักงานแบบแมนนวล
          </button>
        </div>
      </div>

      {/* 4 Workspace Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        {[
          { key: 'DIRECTORY', label: '1) หน้าพนักงาน', icon: 'fa-address-book', count: employees.length },
          { key: 'STATUS_TRACKING', label: '2) ติดตามสถานะพนักงาน', icon: 'fa-user-clock', count: probationList.length, badgeColor: 'bg-amber-500 text-white' },
          { key: 'LEAVE_APPROVALS', label: '3) ขอลา & อนุมัติ & ประวัติ', icon: 'fa-envelope-open-text', count: pendingLeaveCount, badgeColor: 'bg-rose-500 text-white' },
          { key: 'HOLIDAYS', label: '4) ปฏิทินวันหยุดประเทศไทย', icon: 'fa-calendar-days', count: holidays.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.key
                ? 'bg-[#064a8b] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <i className={`fa-solid ${tab.icon} text-xs`}></i>
            <span>{tab.label}</span>
            {Boolean(tab.count) && tab.count! > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${tab.badgeColor || 'bg-[#c3a138] text-slate-900'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ==========================================
          TAB 1: EMPLOYEE DIRECTORY
         ========================================== */}
      {activeTab === 'DIRECTORY' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">แผนก:</span>
                <select
                  value={filterDept}
                  onChange={e => setFilterDept(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-800"
                >
                  <option value="ALL">ทุกแผนกงาน</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">สถานะ:</span>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-800"
                >
                  <option value="ALL">ทุกสถานะ</option>
                  <option value="ACTIVE">พนักงานประจำ</option>
                  <option value="PROBATION">ทดลองงาน</option>
                  <option value="PENDING_START">รอเริ่มงาน</option>
                  <option value="RESIGNED">ลาออก / เลิกจ้าง</option>
                </select>
              </div>
            </div>

            <span className="text-slate-500 text-xs font-semibold">
              แสดงพนักงาน {filteredEmployees.length} คน
            </span>
          </div>

          {/* Empty State when no employees in system */}
          {employees.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-10 sm:p-14 text-center shadow-xs">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#064a8b] text-3xl mb-4 shadow-xs">
                <i className="fa-solid fa-users-slash"></i>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">
                ยังไม่มีรายชื่อพนักงานในระบบ
              </h3>
              <p className="text-slate-500 text-sm max-w-lg mx-auto mb-6 leading-relaxed">
                รายชื่อพนักงานถูกนำออกเรียบร้อยแล้ว ท่านสามารถเริ่มต้นบันทึกข้อมูลพนักงานใหม่เข้าสู่ระบบได้ด้วยการคลิกปุ่มด้านล่าง
              </p>
              <button
                onClick={() => setShowAddEmployeeModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#064a8b] to-[#022247] hover:from-[#085aab] hover:to-[#043265] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all hover:scale-102"
              >
                <i className="fa-solid fa-user-plus text-[#c3a138]"></i>
                <span>+ เพิ่มพนักงานคนแรกเข้าสู่ระบบ</span>
              </button>
            </div>
          ) : (
            /* Directory DataTable with Card View default */
            <DataTable
              columns={employeeColumns}
              data={filteredEmployees}
              searchPlaceholder="ค้นหาชื่อ, รหัสพนักงาน, เบอร์โทร..."
              renderCard={renderEmployeeCard}
              defaultViewMode="card"
              emptyText="ไม่พบข้อมูลพนักงานที่ตรงกับเงื่อนไข"
            />
          )}
        </div>
      )}

      {/* ==========================================
          TAB 2: EMPLOYEE STATUS TRACKING
         ========================================== */}
      {activeTab === 'STATUS_TRACKING' && (
        <div className="space-y-6">
          {/* Status Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-xs text-amber-800 font-bold block">ทดลองงาน (Probation)</span>
              <span className="text-2xl font-black text-amber-900 mt-1 block">{statusCounts.PROBATION} คน</span>
              <span className="text-[10px] text-amber-700 mt-0.5 block">ใกล้ครบกำหนด {probationList.length} คน</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs text-emerald-800 font-bold block">พนักงานประจำ (Active)</span>
              <span className="text-2xl font-black text-emerald-900 mt-1 block">{statusCounts.ACTIVE} คน</span>
              <span className="text-[10px] text-emerald-700 mt-0.5 block">ปฏิบัติงานปกติ</span>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-xs text-[#064a8b] font-bold block">รอเริ่มงาน (Pending)</span>
              <span className="text-2xl font-black text-[#022247] mt-1 block">{statusCounts.PENDING_START} คน</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">เตรียมเอกสารสัญญา</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
              <span className="text-xs text-slate-700 font-bold block">พ้นสภาพ (Resigned)</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">{statusCounts.RESIGNED} คน</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">ลาออก / เลิกจ้าง</span>
            </div>
          </div>

          {/* Probation Ending Soon Highlight Section */}
          <div className="bg-white rounded-2xl border border-amber-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div>
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                  <i className="fa-solid fa-hourglass-half text-amber-600"></i>
                  พนักงานใกล้ครบกำหนดทดลองงาน (ภายใน 45 วัน)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  รายชื่อพนักงานที่ฝ่ายบุคคลและหัวหน้างานต้องทำการประเมินเพื่อบรรจุเป็นพนักงานประจำ
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200">
                {probationList.length} คน
              </span>
            </div>

            {probationList.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center italic">
                ไม่มีพนักงานที่ใกล้ครบกำหนดทดลองงานในขณะนี้
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {probationList.map(emp => {
                  const end = new Date(emp.probationEndDate!).getTime();
                  const diffDays = Math.ceil((end - todayTime) / (1000 * 60 * 60 * 24));
                  const comp = companies.find(c => c.id === emp.companyId);
                  const dept = departments.find(d => d.id === emp.departmentId);

                  return (
                    <div key={emp.id} className="bg-amber-50/40 rounded-xl border border-amber-200 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-500">{emp.employeeCode}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                          เหลืออีก {diffDays} วัน
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-800 text-sm">{emp.firstName} {emp.lastName}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{dept?.name} • {emp.positionName}</p>
                        <p className="text-[11px] text-slate-400">สาขา: {comp?.shortName}</p>
                      </div>

                      <div className="text-xs text-slate-600 border-t border-amber-200/60 pt-2 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">วันเริ่มงาน:</span>
                          <span className="font-semibold">{formatThaiDate(emp.hireDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">วันครบโปร:</span>
                          <span className="font-bold text-amber-800">{formatThaiDate(emp.probationEndDate)}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => handleStatusChange(emp, 'ACTIVE')}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                        >
                          <i className="fa-solid fa-check"></i>
                          <span>ผ่านทดลองงาน</span>
                        </button>
                        <button
                          onClick={() => setSelectedEmployee(emp)}
                          className="py-1.5 px-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                        >
                          โปรไฟล์
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: LEAVE REQUESTS & APPROVALS & HISTORY
         ========================================== */}
      {activeTab === 'LEAVE_APPROVALS' && (
        <div className="space-y-4">
          {/* Sub-tab switcher */}
          <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setApprovalSubTab('PENDING')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  approvalSubTab === 'PENDING'
                    ? 'bg-[#064a8b] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <i className="fa-solid fa-clock"></i>
                <span>รอการอนุมัติ (Pending)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
                  {pendingLeaveCount}
                </span>
              </button>

              <button
                onClick={() => setApprovalSubTab('HISTORY')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  approvalSubTab === 'HISTORY'
                    ? 'bg-[#064a8b] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <i className="fa-solid fa-clock-rotate-left"></i>
                <span>ประวัติการอนุมัติ (History)</span>
              </button>
            </div>

            <span className="text-slate-400 text-xs font-medium hidden sm:inline">
              คลิกอนุมัติหรือปฏิเสธเพื่ออัปเดตโควตาและสถานะทันที
            </span>
          </div>

          {/* Requests Cards Grid */}
          {leaveRequests.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              <i className="fa-solid fa-inbox text-3xl mb-2 text-slate-300 block"></i>
              {approvalSubTab === 'PENDING' ? 'ไม่มีรายการคำขอลาที่รอการอนุมัติในขณะนี้' : 'ยังไม่มีประวัติการอนุมัติ'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaveRequests.map(req => {
                const badge = getStatusBadge(req.status);
                const isPending = req.status === 'PENDING';

                return (
                  <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      {/* Top: Code & Badge */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                        <span className="font-mono text-xs font-bold text-[#064a8b] flex items-center gap-1">
                          <i className="fa-solid fa-file-invoice text-slate-400"></i>
                          {req.requestCode}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${badge.bgClass} ${badge.textClass}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Requester Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#022247] to-[#064a8b] text-[#c3a138] font-bold text-sm flex items-center justify-center shrink-0">
                          {req.employeeName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">{req.employeeName}</h4>
                          <p className="text-[11px] text-slate-500">{req.departmentName} ({req.employeeCode})</p>
                        </div>
                      </div>

                      {/* Leave Type and Dates Box */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-3 space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-[#064a8b]">
                            {getLeaveTypeName(req.leaveType)}
                          </span>
                          <span className="font-black text-slate-800">{req.daysCount} วัน</span>
                        </div>
                        <div className="text-slate-600 font-medium text-[11px] pt-1">
                          <i className="fa-regular fa-calendar text-slate-400 mr-1"></i>
                          {formatThaiDate(req.startDate)} {req.startDate !== req.endDate ? `ถึง ${formatThaiDate(req.endDate)}` : ''}
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-600 italic mb-3">
                        "{req.reason}"
                      </div>
                    </div>

                    {/* Action buttons */}
                    {isPending ? (
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(req)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                        >
                          <i className="fa-solid fa-check"></i>
                          <span>อนุมัติคำขอ</span>
                        </button>
                        <button
                          onClick={() => handleReject(req)}
                          className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <i className="fa-solid fa-xmark"></i>
                          <span>ปฏิเสธ</span>
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-right">
                        ผู้อนุมัติ: {req.approverName || 'ฝ่ายบุคคล'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 4: THAILAND PUBLIC HOLIDAYS CALENDAR
         ========================================== */}
      {activeTab === 'HOLIDAYS' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <i className="fa-solid fa-calendar-days text-[#064a8b]"></i>
                ปฏิทินวันหยุดตามประเพณีและวันหยุดบริษัท (Thailand Public Holidays 2026)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                วันหยุดประจำปีอย่างเป็นทางการของประเทศไทยสำหรับใช้คำนวณวันทำงานและวันลา
              </p>
            </div>

            <button
              onClick={() => setShowAddHolidayModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white shadow-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              <i className="fa-solid fa-plus text-[#c3a138]"></i>
              เพิ่มวันหยุดแบบแมนนวล
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {holidays.map(hol => {
              const comp = companies.find(c => c.id === hol.companyId);
              return (
                <div key={hol.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3 group hover:border-[#064a8b] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#064a8b] flex flex-col items-center justify-center font-bold shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {hol.date.split('-')[1]}
                      </span>
                      <span className="text-base font-black leading-none text-[#022247]">
                        {hol.date.split('-')[2]}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">{hol.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{formatThaiDate(hol.date)}</p>
                      <span className="text-[10px] text-slate-400 block">
                        สาขา: {hol.companyId === 'ALL' ? 'ทุกสาขาในเครือ' : comp?.shortName}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      Alert.confirm('ลบวันหยุด', `ต้องการลบวันหยุด "${hol.name}" หรือไม่?`).then(yes => {
                        if (yes) deleteHoliday(hol.id);
                      });
                    }}
                    className="p-2 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="ลบวันหยุด"
                  >
                    <i className="fa-solid fa-trash-can text-xs"></i>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ADD EMPLOYEE (MANUAL ENTRY)
         ========================================== */}
      <Modal
        isOpen={showAddEmployeeModal}
        onClose={() => setShowAddEmployeeModal(false)}
        title="เพิ่มพนักงานใหม่แบบแมนนวล"
        subtitle="กรอกข้อมูลพนักงานเพื่อบันทึกเข้าสู่ฐานข้อมูล VN Group"
        size="2xl"
        footer={
          <>
            <button
              onClick={() => setShowAddEmployeeModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleAddSubmit}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white shadow-xs"
            >
              บันทึกข้อมูลพนักงาน
            </button>
          </>
        }
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ชื่อจริง *</label>
              <input
                type="text"
                required
                value={newEmp.firstName}
                onChange={e => setNewEmp({ ...newEmp, firstName: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                placeholder="เช่น สมชาย"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">นามสกุล *</label>
              <input
                type="text"
                required
                value={newEmp.lastName}
                onChange={e => setNewEmp({ ...newEmp, lastName: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                placeholder="เช่น ใจดี"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">ชื่อเล่น</label>
              <input
                type="text"
                value={newEmp.nickname}
                onChange={e => setNewEmp({ ...newEmp, nickname: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                placeholder="เช่น ชาย"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
              <input
                type="text"
                value={newEmp.phone}
                onChange={e => setNewEmp({ ...newEmp, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                placeholder="08X-XXX-XXXX"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">อีเมล</label>
              <input
                type="email"
                value={newEmp.email}
                onChange={e => setNewEmp({ ...newEmp, email: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                placeholder="somchai@vngroup.co.th"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">สาขาบริษัท</label>
              <select
                value={newEmp.companyId}
                onChange={e => setNewEmp({ ...newEmp, companyId: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">แผนก</label>
              <select
                value={newEmp.departmentId}
                onChange={e => setNewEmp({ ...newEmp, departmentId: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">ตำแหน่ง</label>
              <input
                type="text"
                value={newEmp.positionName}
                onChange={e => setNewEmp({ ...newEmp, positionName: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                placeholder="เช่น ครูฝึกสอนขับรถยนต์"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">เงินเดือนพื้นฐาน (บาท)</label>
              <input
                type="number"
                value={newEmp.baseSalary}
                onChange={e => setNewEmp({ ...newEmp, baseSalary: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">ค่าตำแหน่ง (บาท)</label>
              <input
                type="number"
                value={newEmp.positionAllowance}
                onChange={e => setNewEmp({ ...newEmp, positionAllowance: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">สถานะการจ้างงาน</label>
              <select
                value={newEmp.employmentStatus}
                onChange={e => setNewEmp({ ...newEmp, employmentStatus: e.target.value as any })}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                <option value="PROBATION">อยู่ระหว่างทดลองงาน (Probation)</option>
                <option value="ACTIVE">พนักงานประจำ (Active)</option>
                <option value="PENDING_START">รอเริ่มงาน (Pending Start)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">วันเริ่มงาน</label>
              <input
                type="date"
                value={newEmp.hireDate}
                onChange={e => setNewEmp({ ...newEmp, hireDate: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">วันครบกำหนดทดลองงาน</label>
              <input
                type="date"
                value={newEmp.probationEndDate}
                onChange={e => setNewEmp({ ...newEmp, probationEndDate: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* ==========================================
          MODAL: ADD HOLIDAY
         ========================================== */}
      <Modal
        isOpen={showAddHolidayModal}
        onClose={() => setShowAddHolidayModal(false)}
        title="เพิ่มวันหยุดบริษัทแบบแมนนวล"
        subtitle="บันทึกวันหยุดเพิ่มเติมในปฏิทิน"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowAddHolidayModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleAddHolidaySubmit}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white"
            >
              บันทึกวันหยุด
            </button>
          </>
        }
      >
        <form onSubmit={handleAddHolidaySubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ชื่อวันหยุด *</label>
            <input
              type="text"
              required
              value={newHolidayName}
              onChange={e => setNewHolidayName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="เช่น วันหยุดพิเศษประจำปีบริษัท"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">วันที่หยุด *</label>
            <input
              type="date"
              required
              value={newHolidayDate}
              onChange={e => setNewHolidayDate(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">สาขาที่บังคับใช้</label>
            <select
              value={newHolidayCompanyId}
              onChange={e => setNewHolidayCompanyId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="ALL">ทุกสาขาในเครือ VN Group</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* ==========================================
          MODAL: EMPLOYEE PROFILE DRAWER
         ========================================== */}
      {selectedEmployee && (
        <Modal
          isOpen={Boolean(selectedEmployee)}
          onClose={() => setSelectedEmployee(null)}
          title={`โปรไฟล์พนักงาน: ${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
          subtitle={`${selectedEmployee.employeeCode} • ${selectedEmployee.positionName}`}
          size="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  <i className="fa-solid fa-arrows-split-up-and-left mr-1"></i> ย้ายแผนก
                </button>
                <button
                  onClick={() => setShowWarningModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200"
                >
                  <i className="fa-solid fa-triangle-exclamation mr-1"></i> ออกใบเตือน
                </button>
              </div>

              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-900"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#022247] to-[#064a8b] text-[#c3a138] font-black text-xl flex items-center justify-center shrink-0">
                {selectedEmployee.firstName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-800 text-base">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                    {selectedEmployee.nickname && <span className="text-[#064a8b] ml-1.5">({selectedEmployee.nickname})</span>}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(selectedEmployee.employmentStatus).bgClass} ${getStatusBadge(selectedEmployee.employmentStatus).textClass}`}>
                    {getStatusBadge(selectedEmployee.employmentStatus).label}
                  </span>
                </div>
                <p className="text-slate-500 mt-0.5">
                  รหัส: <strong>{selectedEmployee.employeeCode}</strong> • แผนก: <strong>{departments.find(d => d.id === selectedEmployee.departmentId)?.name}</strong>
                </p>
                <p className="text-slate-500">
                  สาขา: <strong>{companies.find(c => c.id === selectedEmployee.companyId)?.name}</strong>
                </p>
              </div>
            </div>

            {/* Profile Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
              {[
                { key: 'PERSONAL', label: 'ข้อมูลส่วนตัว' },
                { key: 'EMPLOYMENT', label: 'ข้อมูลการจ้างงาน' },
                { key: 'LEAVE', label: 'โควตาวันลา' },
                { key: 'DOCUMENTS', label: 'เอกสารแนบ' },
                { key: 'HISTORY', label: 'ประวัติการย้าย/ใบเตือน' },
              ].map(pt => (
                <button
                  key={pt.key}
                  onClick={() => setProfileTab(pt.key as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    profileTab === pt.key ? 'bg-[#064a8b] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pt.label}
                </button>
              ))}
            </div>

            {profileTab === 'PERSONAL' && (
              <div className="grid grid-cols-2 gap-3 p-2 bg-white rounded-xl">
                <div><span className="text-slate-400">เลขบัตรประชาชน:</span> <p className="font-mono font-bold text-slate-700">{selectedEmployee.idCardNumber || '-'}</p></div>
                <div><span className="text-slate-400">วันเดือนปีเกิด:</span> <p className="font-semibold text-slate-700">{formatThaiDate(selectedEmployee.birthDate)}</p></div>
                <div><span className="text-slate-400">เบอร์โทรศัพท์:</span> <p className="font-mono font-semibold text-slate-700">{selectedEmployee.phone}</p></div>
                <div><span className="text-slate-400">อีเมล:</span> <p className="font-semibold text-slate-700">{selectedEmployee.email}</p></div>
              </div>
            )}

            {profileTab === 'EMPLOYMENT' && (
              <div className="grid grid-cols-2 gap-3 p-2 bg-white rounded-xl">
                <div><span className="text-slate-400">วันเริ่มงาน:</span> <p className="font-semibold text-slate-700">{formatThaiDate(selectedEmployee.hireDate)}</p></div>
                <div><span className="text-slate-400">วันครบโปร:</span> <p className="font-semibold text-slate-700">{formatThaiDate(selectedEmployee.probationEndDate)}</p></div>
                <div><span className="text-slate-400">เงินเดือนพื้นฐาน:</span> <p className="font-black text-[#064a8b]">{formatCurrency(selectedEmployee.baseSalary)} บาท</p></div>
                <div><span className="text-slate-400">ค่าตำแหน่ง:</span> <p className="font-semibold text-slate-700">{formatCurrency(selectedEmployee.positionAllowance || 0)} บาท</p></div>
                <div><span className="text-slate-400">กะการทำงาน:</span> <p className="font-semibold text-slate-700">{selectedEmployee.workShift}</p></div>
                <div><span className="text-slate-400">บัญชีธนาคาร:</span> <p className="font-mono font-semibold text-slate-700">{selectedEmployee.bankAccount?.bankName} ({selectedEmployee.bankAccount?.accountNumber})</p></div>
              </div>
            )}

            {profileTab === 'LEAVE' && (
              <div className="grid grid-cols-3 gap-3 p-2">
                {Object.entries(selectedEmployee.leaveQuotas || {}).map(([typeKey, quota]: [string, any]) => (
                  <div key={typeKey} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-bold text-slate-700 block">{getLeaveTypeName(typeKey as any)}</span>
                    <div className="text-xs text-slate-500">สิทธิ์ทั้งหมด: {quota.entitledDays} วัน</div>
                    <div className="text-xs text-rose-600">ใช้ไปแล้ว: {quota.usedDays} วัน</div>
                    <div className="text-xs font-black text-emerald-700">คงเหลือ: {quota.remainingDays} วัน</div>
                  </div>
                ))}
              </div>
            )}

            {profileTab === 'DOCUMENTS' && (
              <div className="space-y-3 p-2">
                <button
                  onClick={() => setShowDocUploadModal(true)}
                  className="px-3 py-1.5 bg-[#064a8b] text-white rounded-xl font-bold flex items-center gap-1"
                >
                  <i className="fa-solid fa-upload"></i> อัปโหลดเอกสารใหม่
                </button>
                {(selectedEmployee.documents || []).length === 0 ? (
                  <p className="text-slate-400 italic">ไม่มีเอกสารที่แนบไว้</p>
                ) : (
                  <div className="space-y-2">
                    {selectedEmployee.documents?.map(doc => (
                      <div key={doc.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-700">{doc.title}</p>
                          <p className="text-[10px] text-slate-400">{doc.fileName} • {doc.fileSize}</p>
                        </div>
                        <span className="text-[10px] bg-blue-100 text-[#064a8b] px-2 py-0.5 rounded font-bold">{doc.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {profileTab === 'HISTORY' && (
              <div className="space-y-4 p-2">
                <div>
                  <h4 className="font-bold text-slate-700 mb-2">ประวัติการย้ายแผนก</h4>
                  {(selectedEmployee.departmentHistory || []).length === 0 ? (
                    <p className="text-slate-400 italic text-xs">ไม่มีประวัติการย้ายแผนก</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedEmployee.departmentHistory?.map(dh => (
                        <div key={dh.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                          <span className="font-bold">{formatThaiDate(dh.effectiveDate)}:</span> {dh.fromDepartment} ➔ {dh.toDepartment} ({dh.reason})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 mb-2">ประวัติใบเตือน</h4>
                  {(selectedEmployee.warnings || []).length === 0 ? (
                    <p className="text-slate-400 italic text-xs">ไม่มีประวัติใบเตือน</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedEmployee.warnings?.map(w => (
                        <div key={w.id} className="p-2 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-800">
                          <span className="font-bold">{formatThaiDate(w.issueDate)} [{w.level}]:</span> {w.reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL: Transfer Dept */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="บันทึกการย้ายแผนกพนักงาน"
        subtitle={selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : ''}
        size="md"
        footer={
          <>
            <button onClick={() => setShowTransferModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200">ยกเลิก</button>
            <button onClick={handleTransferSubmit} className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white">ยืนยันการย้าย</button>
          </>
        }
      >
        <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">แผนกปลายทาง *</label>
            <select
              value={transferDeptId}
              onChange={e => setTransferDeptId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">ตำแหน่งงานใหม่ *</label>
            <input
              type="text"
              required
              value={transferPosName}
              onChange={e => setTransferPosName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">เหตุผลการย้าย *</label>
            <textarea
              required
              rows={2}
              value={transferReason}
              onChange={e => setTransferReason(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="ระบุสาเหตุการปรับเปลี่ยนตำแหน่ง..."
            />
          </div>
        </form>
      </Modal>

      {/* MODAL: Warning */}
      <Modal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        title="ออกใบเตือนพนักงาน"
        subtitle={selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : ''}
        size="md"
        footer={
          <>
            <button onClick={() => setShowWarningModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200">ยกเลิก</button>
            <button onClick={handleWarningSubmit} className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white">บันทึกใบเตือน</button>
          </>
        }
      >
        <form onSubmit={handleWarningSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ระดับใบเตือน *</label>
            <select
              value={warningLevel}
              onChange={e => setWarningLevel(e.target.value as any)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="VERBAL">ตักเตือนด้วยวาจา (Verbal Warning)</option>
              <option value="WRITTEN">ตักเตือนเป็นลายลักษณ์อักษร (Written Warning)</option>
              <option value="FINAL">ตักเตือนขั้นเด็ดขาด / ทัณฑ์บน (Final Warning)</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">สาเหตุความผิด *</label>
            <textarea
              required
              rows={3}
              value={warningReason}
              onChange={e => setWarningReason(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="ระบุรายละเอียดการกระทำความผิดและระเบียบบริษัทที่ฝ่าฝืน..."
            />
          </div>
        </form>
      </Modal>

      {/* MODAL: Doc Upload */}
      <Modal
        isOpen={showDocUploadModal}
        onClose={() => setShowDocUploadModal(false)}
        title="อัปโหลดเอกสารพนักงาน"
        subtitle="เพิ่มเอกสารสัญญาหรือประวัติเข้าสู่ระบบ"
        size="md"
        footer={
          <>
            <button onClick={() => setShowDocUploadModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200">ยกเลิก</button>
            <button onClick={handleDocSubmit} className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white">อัปโหลด</button>
          </>
        }
      >
        <form onSubmit={handleDocSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ชื่อเอกสาร *</label>
            <input
              type="text"
              required
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="เช่น สัญญาจ้างงานฉบับต่ออายุ 2569"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">ประเภทเอกสาร</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value as any)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="CONTRACT">สัญญาจ้างงาน (Employment Contract)</option>
              <option value="ID_COPY">สำเนาบัตรประชาชน / ทะเบียนบ้าน</option>
              <option value="CERTIFICATE">ใบรับรองการอบรม / ขับขี่</option>
              <option value="WARNING_LETTER">หนังสือเตือน</option>
              <option value="OTHER">อื่นๆ</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};
