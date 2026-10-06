import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHR } from '../../context/HRContext';
import { DataTable, Column } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { Employee, EmploymentStatus } from '../../types';
import { formatThaiDate, formatCurrency, getStatusBadge, Alert } from '../../utils/helpers';
import { UserAvatar } from '../common/UserAvatar';

export const EmployeesPage: React.FC = () => {
  const { role } = useAuth();
  const {
    employees,
    companies,
    departments,
    addEmployee,
    updateEmployeeStatus,
    transferEmployeeDepartment,
    addEmployeeWarning,
    uploadEmployeeDocument,
    selectedCompanyId,
  } = useHR();

  // Tab: 'DIRECTORY' | 'TRACKER' (ทดลองงาน & วันเกิด)
  const [viewTab, setViewTab] = useState<'DIRECTORY' | 'TRACKER'>('DIRECTORY');

  // Filter states
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<
    'PERSONAL' | 'EMPLOYMENT' | 'APPROVER' | 'LEAVE' | 'DOCUMENTS' | 'HISTORY'
  >('PERSONAL');

  // Sub-actions modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferDeptId, setTransferDeptId] = useState(departments[0]?.id || 'd1');
  const [transferPosName, setTransferPosName] = useState('ครูฝึกสอนขับรถยนต์อาวุโส');
  const [transferReason, setTransferReason] = useState('');

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningLevel, setWarningLevel] = useState<'VERBAL' | 'WRITTEN' | 'FINAL'>('WRITTEN');
  const [warningReason, setWarningReason] = useState('');

  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<any>('CONTRACT');

  // Add Employee Form State
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

  // Filtered employees for directory
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (selectedCompanyId !== 'ALL' && emp.companyId !== selectedCompanyId) return false;
      if (filterDept !== 'ALL' && emp.departmentId !== filterDept) return false;
      if (filterStatus !== 'ALL' && emp.employmentStatus !== filterStatus) return false;
      return true;
    });
  }, [employees, selectedCompanyId, filterDept, filterStatus]);

  // Tracker: Probation Ending soon (within 45 days)
  const todayTime = new Date('2026-10-05').getTime();
  const probationList = useMemo(() => {
    return employees.filter(e => {
      if (e.employmentStatus !== 'PROBATION' || !e.probationEndDate) return false;
      const end = new Date(e.probationEndDate).getTime();
      const diffDays = Math.ceil((end - todayTime) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 45;
    });
  }, [employees, todayTime]);

  // Tracker: Birthdays in current month (October = month index 9)
  const birthdayList = useMemo(() => {
    return employees.filter(e => {
      if (!e.birthDate) return false;
      const month = parseInt(e.birthDate.split('-')[1], 10);
      return month === 10;
    });
  }, [employees]);

  // Handle Add Employee
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.firstName.trim() || !newEmp.lastName.trim()) {
      Alert.warning('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุชื่อและนามสกุลพนักงาน');
      return;
    }

    const created = addEmployee(newEmp);
    Alert.success('เพิ่มพนักงานสำเร็จ', `สร้างรหัสพนักงาน ${created.employeeCode} เรียบร้อยแล้ว`);
    setShowAddModal(false);
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

  // Status Change (Pass probation, Resign, Terminate)
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
    Alert.success('บันทึกการย้ายแผนกสำเร็จ', `ย้ายพนักงานไปยังฝ่ายงานใหม่เรียบร้อยแล้ว`);
    setShowTransferModal(false);
    setTransferReason('');
    // refresh selectedEmployee in place
    const updated = employees.find(e => e.id === selectedEmployee.id);
    if (updated) setSelectedEmployee(updated);
  };

  // Handle Issue Warning
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
    Alert.success('ออกใบเตือนสำเร็จ', `บันทึกประวัติใบเตือนในระบบเรียบร้อย`);
    setShowWarningModal(false);
    setWarningReason('');
    const updated = employees.find(e => e.id === selectedEmployee.id);
    if (updated) setSelectedEmployee(updated);
  };

  // Handle Doc Upload Simulation
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
      fileSize: '1.4 MB',
    });
    Alert.success('อัปโหลดเอกสารสำเร็จ', `บันทึกไฟล์เอกสารลงในโปรไฟล์พนักงานเรียบร้อย`);
    setShowDocUploadModal(false);
    setDocTitle('');
    const updated = employees.find(e => e.id === selectedEmployee.id);
    if (updated) setSelectedEmployee(updated);
  };

  const columns: Column<Employee>[] = [
    {
      key: 'employeeCode',
      header: 'รหัสพนักงาน',
      render: (emp) => (
        <button
          onClick={() => setSelectedEmployee(emp)}
          className="font-bold text-[#064a8b] hover:underline flex items-center gap-1"
        >
          <span>{emp.employeeCode}</span>
          <i className="fa-solid fa-address-card text-xs text-slate-400"></i>
        </button>
      ),
    },
    {
      key: 'fullName',
      header: 'ชื่อ - นามสกุล',
      render: (emp) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar
            userId={emp.id}
            avatarUrl={emp.avatarUrl}
            size="sm"
            alt={emp.firstName}
            className="shrink-0"
          />
          <div>
            <p className="font-bold text-slate-800 text-xs leading-tight">
              {emp.firstName} {emp.lastName} {emp.nickname ? `(${emp.nickname})` : ''}
            </p>
            <p className="text-[11px] text-slate-500">{emp.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'companyId',
      header: 'สาขา / แผนก',
      render: (emp) => {
        const comp = companies.find(c => c.id === emp.companyId);
        const dept = departments.find(d => d.id === emp.departmentId);
        return (
          <div>
            <p className="text-xs font-semibold text-slate-800">{comp?.shortName || '-'}</p>
            <p className="text-[11px] text-slate-500">{dept?.name || '-'}</p>
          </div>
        );
      },
    },
    {
      key: 'positionName',
      header: 'ตำแหน่ง',
      render: (emp) => (
        <span className="text-xs font-medium text-slate-700">
          {emp.positionName}
        </span>
      ),
    },
    {
      key: 'employmentStatus',
      header: 'สถานะการจ้าง',
      align: 'center',
      render: (emp) => {
        const badge = getStatusBadge(emp.employmentStatus);
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.bgClass} ${badge.textClass}`}>
            <i className={`fa-solid ${badge.icon} text-[10px]`}></i>
            {badge.label}
          </span>
        );
      },
    },
    {
      key: 'hireDate',
      header: 'วันเริ่มงาน',
      render: (emp) => (
        <span className="text-xs text-slate-600">
          {formatThaiDate(emp.hireDate)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'center',
      render: (emp) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => setSelectedEmployee(emp)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-[#064a8b] hover:text-white text-slate-700 transition-colors flex items-center gap-1"
          >
            <i className="fa-regular fa-id-card"></i>
            <span>โปรไฟล์</span>
          </button>
        </div>
      ),
    },
  ];

  // Custom Card Renderer for Employees
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
              <UserAvatar
                userId={emp.id}
                avatarUrl={emp.avatarUrl}
                size="md"
                alt={emp.firstName}
                className="shrink-0 group-hover:scale-105 transition-transform"
              />
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

          {/* Details list */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 bg-slate-50/70 p-2 rounded-xl">
              <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <i className="fa-solid fa-briefcase text-slate-400"></i> ตำแหน่ง:
              </span>
              <span className="font-bold text-slate-800 text-right truncate max-w-[60%]">
                {emp.positionName}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 px-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <i className="fa-solid fa-sitemap text-slate-400"></i> แผนก:
              </span>
              <span className="font-semibold text-slate-700 truncate max-w-[60%]">
                {dept?.name}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 px-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <i className="fa-solid fa-phone text-slate-400"></i> เบอร์โทร:
              </span>
              <span className="font-semibold text-slate-700">
                {emp.phone}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 px-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <i className="fa-solid fa-calendar text-slate-400"></i> วันเริ่มงาน:
              </span>
              <span className="font-semibold text-slate-700">
                {formatThaiDate(emp.hireDate)}
              </span>
            </div>

            {/* Leave balance quick pills */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">สิทธิ์วันลาคงเหลือ:</span>
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#064a8b] font-bold" title="ลาป่วย">
                  ป: {emp.leaveQuotas?.SICK?.remainingDays || 0}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold" title="ลากิจ">
                  ก: {emp.leaveQuotas?.PERSONAL?.remainingDays || 0}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold" title="ลาพักร้อน">
                  พ: {emp.leaveQuotas?.ANNUAL?.remainingDays || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Action Buttons */}
        <div className="pt-3 border-t border-slate-100 mt-3 flex items-center gap-2">
          <button
            onClick={() => setSelectedEmployee(emp)}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-[#064a8b] hover:text-white text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <i className="fa-regular fa-id-card"></i>
            <span>ดูโปรไฟล์ & เอกสาร</span>
          </button>

          {emp.employmentStatus === 'PROBATION' && (
            <button
              onClick={() => handleStatusChange(emp, 'ACTIVE')}
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
              title="ประเมินผ่านทดลองงาน"
            >
              <i className="fa-solid fa-check"></i>
              <span>ผ่านโปร</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#022247] flex items-center gap-2">
            <i className="fa-solid fa-users text-[#064a8b]"></i>
            ระบบจัดการพนักงาน (Employee Management)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ข้อมูลพนักงานทุกสาขา สัญญาจ้าง ประวัติการย้ายแผนก และการติดตามผลการทดลองงาน
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Employee Button is explicitly placed here inside directory! */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white shadow-sm transition-all flex items-center gap-1.5"
          >
            <i className="fa-solid fa-user-plus text-[#c3a138]"></i>
            เพิ่มพนักงานใหม่
          </button>
        </div>
      </div>

      {/* Tabs: รายชื่อพนักงาน vs แท็บติดตามพนักงาน (ทดลองงาน & วันเกิด) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setViewTab('DIRECTORY')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            viewTab === 'DIRECTORY'
              ? 'bg-[#064a8b] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <i className="fa-solid fa-address-book"></i>
          <span>รายชื่อพนักงานทั้งหมด</span>
          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
            viewTab === 'DIRECTORY' ? 'bg-[#c3a138] text-slate-900' : 'bg-slate-200 text-slate-700'
          }`}>
            {employees.length}
          </span>
        </button>

        <button
          onClick={() => setViewTab('TRACKER')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            viewTab === 'TRACKER'
              ? 'bg-[#064a8b] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <i className="fa-solid fa-bell"></i>
          <span>แท็บติดตามพนักงาน (ทดลองงาน & วันเกิด)</span>
          {(probationList.length > 0 || birthdayList.length > 0) && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* View 1: Main Employee Directory */}
      {viewTab === 'DIRECTORY' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-slate-700">ตัวกรองข้อมูล:</span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">แผนก:</span>
              <select
                value={filterDept}
                onChange={e => setFilterDept(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
              >
                <option value="ALL">ทุกแผนก</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">สถานะ:</span>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
              >
                <option value="ALL">ทุกสถานะ</option>
                <option value="ACTIVE">ทำงานอยู่</option>
                <option value="PROBATION">ทดลองงาน</option>
                <option value="PENDING_START">รอเริ่มงาน</option>
                <option value="RESIGNED">ลาออก</option>
                <option value="TERMINATED">เลิกจ้าง</option>
              </select>
            </div>

            {(filterDept !== 'ALL' || filterStatus !== 'ALL') && (
              <button
                onClick={() => { setFilterDept('ALL'); setFilterStatus('ALL'); }}
                className="text-xs text-[#064a8b] hover:underline font-bold"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>

          {/* DataTable with Card view support */}
          <DataTable
            columns={columns}
            data={filteredEmployees}
            searchPlaceholder="ค้นหาชื่อ, สกุล, รหัสพนักงาน, เบอร์โทร..."
            emptyText="ไม่พบรายชื่อพนักงานที่ตรงกับเงื่อนไข"
            renderCard={renderEmployeeCard}
            defaultViewMode="card"
          />
        </div>
      )}

      {/* View 2: Tracker (ทดลองงาน & วันเกิด) */}
      {viewTab === 'TRACKER' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: พนักงานใกล้ครบทดลองงาน */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <i className="fa-solid fa-user-clock text-lg"></i>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    ติดตามการประเมินทดลองงาน (Probation Tracker)
                  </h3>
                  <p className="text-xs text-slate-500">พนักงานที่ใกล้ครบกำหนดทดลองงานใน 45 วัน</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {probationList.length} คน
              </span>
            </div>

            <div className="space-y-3">
              {probationList.length > 0 ? (
                probationList.map(emp => {
                  const end = new Date(emp.probationEndDate).getTime();
                  const diffDays = Math.ceil((end - todayTime) / (1000 * 60 * 60 * 24));
                  return (
                    <div
                      key={emp.id}
                      className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs">
                            {emp.firstName} {emp.lastName} ({emp.employeeCode})
                          </span>
                          <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.2 rounded font-bold">
                            เหลืออีก {diffDays} วัน
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          ตำแหน่ง: {emp.positionName} • ครบกำหนด: {formatThaiDate(emp.probationEndDate)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleStatusChange(emp, 'ACTIVE')}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-xs"
                          title="ผ่านการทดลองงานเป็นพนักงานประจำ"
                        >
                          <i className="fa-solid fa-check mr-1"></i> ผ่านทดลองงาน
                        </button>
                        <button
                          onClick={() => setSelectedEmployee(emp)}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
                        >
                          ดูประวัติ
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <i className="fa-solid fa-circle-check text-3xl text-emerald-400 mb-2"></i>
                  <p className="text-xs">ไม่มีพนักงานที่ใกล้ครบกำหนดทดลองงานในช่วงนี้</p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: วันเกิดพนักงานประจำเดือน */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold">
                  <i className="fa-solid fa-cake-candles text-lg"></i>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    วันเกิดพนักงานประจำเดือนตุลาคม (Birthday Tracker)
                  </h3>
                  <p className="text-xs text-slate-500">ร่วมส่งคำอวยพรและจัดสวัสดิการวันเกิด</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800">
                {birthdayList.length} คน
              </span>
            </div>

            <div className="space-y-3">
              {birthdayList.length > 0 ? (
                birthdayList.map(emp => (
                  <div
                    key={emp.id}
                    className="p-4 rounded-xl border border-pink-200 bg-pink-50/40 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-200 text-pink-800 flex items-center justify-center font-bold text-sm">
                        {emp.firstName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs">
                          {emp.firstName} {emp.lastName} ({emp.nickname ? `ครู${emp.nickname}` : ''})
                        </p>
                        <p className="text-xs text-slate-600">
                          {emp.positionName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-pink-700 bg-pink-100 px-2.5 py-1 rounded-full inline-block">
                        🎂 {formatThaiDate(emp.birthDate)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <i className="fa-solid fa-cake-candles text-3xl text-slate-300 mb-2"></i>
                  <p className="text-xs">ไม่มีพนักงานที่เกิดในเดือนนี้</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Employee */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="เพิ่มข้อมูลพนักงานใหม่ (Add Employee)"
        subtitle="กรอกข้อมูลประวัติการจ้างงานพนักงานใหม่ VN Group"
        size="2xl"
        footer={
          <>
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleAddSubmit}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#064a8b] text-white hover:bg-[#022247] shadow-sm flex items-center gap-1.5"
            >
              <i className="fa-solid fa-check"></i>
              บันทึกพนักงานใหม่
            </button>
          </>
        }
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ชื่อจริง: *</label>
              <input
                type="text"
                value={newEmp.firstName}
                onChange={e => setNewEmp({ ...newEmp, firstName: e.target.value })}
                placeholder="เช่น ชัยวัฒน์"
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">นามสกุล: *</label>
              <input
                type="text"
                value={newEmp.lastName}
                onChange={e => setNewEmp({ ...newEmp, lastName: e.target.value })}
                placeholder="เช่น สว่างวงศ์"
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">ชื่อเล่น:</label>
              <input
                type="text"
                value={newEmp.nickname}
                onChange={e => setNewEmp({ ...newEmp, nickname: e.target.value })}
                placeholder="เช่น ครูวัฒน์"
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์: *</label>
              <input
                type="text"
                value={newEmp.phone}
                onChange={e => setNewEmp({ ...newEmp, phone: e.target.value })}
                placeholder="08X-XXX-XXXX"
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">อีเมล:</label>
              <input
                type="email"
                value={newEmp.email}
                onChange={e => setNewEmp({ ...newEmp, email: e.target.value })}
                placeholder="email@vngroup.co.th"
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">เลขบัตรประชาชน:</label>
              <input
                type="text"
                value={newEmp.idCardNumber}
                onChange={e => setNewEmp({ ...newEmp, idCardNumber: e.target.value })}
                placeholder="X-XXXX-XXXXX-XX-X"
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">สาขาบริษัท: *</label>
              <select
                value={newEmp.companyId}
                onChange={e => setNewEmp({ ...newEmp, companyId: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">แผนกงาน: *</label>
              <select
                value={newEmp.departmentId}
                onChange={e => setNewEmp({ ...newEmp, departmentId: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ตำแหน่งงาน: *</label>
              <input
                type="text"
                value={newEmp.positionName}
                onChange={e => setNewEmp({ ...newEmp, positionName: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">เงินเดือนพื้นฐาน (บาท): *</label>
              <input
                type="number"
                value={newEmp.baseSalary}
                onChange={e => setNewEmp({ ...newEmp, baseSalary: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-[#064a8b]"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">ค่าตำแหน่ง (บาท):</label>
              <input
                type="number"
                value={newEmp.positionAllowance}
                onChange={e => setNewEmp({ ...newEmp, positionAllowance: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">วันเริ่มงาน: *</label>
              <input
                type="date"
                value={newEmp.hireDate}
                onChange={e => setNewEmp({ ...newEmp, hireDate: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">วันสิ้นสุดทดลองงาน:</label>
              <input
                type="date"
                value={newEmp.probationEndDate}
                onChange={e => setNewEmp({ ...newEmp, probationEndDate: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">หัวหน้างานผู้อนุมัติ: *</label>
              <select
                value={newEmp.approverId}
                onChange={e => setNewEmp({ ...newEmp, approverId: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.positionName})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Full Employee Profile (Tabs: Personal, Employment, Approver, Leave, Documents, History) */}
      {selectedEmployee && (
        <Modal
          isOpen={Boolean(selectedEmployee)}
          onClose={() => setSelectedEmployee(null)}
          title={`โปรไฟล์พนักงาน: ${selectedEmployee.firstName} ${selectedEmployee.lastName} (${selectedEmployee.employeeCode})`}
          subtitle={`ตำแหน่ง: ${selectedEmployee.positionName} • สถานะ: ${getStatusBadge(selectedEmployee.employmentStatus).label}`}
          size="4xl"
          footer={
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Status action buttons */}
                {selectedEmployee.employmentStatus === 'PROBATION' && (
                  <button
                    onClick={() => handleStatusChange(selectedEmployee, 'ACTIVE')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs flex items-center gap-1"
                  >
                    <i className="fa-solid fa-check"></i> บันทึกผ่านทดลองงาน
                  </button>
                )}
                {selectedEmployee.employmentStatus === 'ACTIVE' && (
                  <button
                    onClick={() => handleStatusChange(selectedEmployee, 'RESIGNED')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-600 text-white hover:bg-slate-700 flex items-center gap-1"
                  >
                    <i className="fa-solid fa-user-minus"></i> บันทึกการลาออก
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Profile Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
              {[
                { key: 'PERSONAL', label: '1) ข้อมูลส่วนตัว', icon: 'fa-user' },
                { key: 'EMPLOYMENT', label: '2) ข้อมูลการจ้างงาน', icon: 'fa-briefcase' },
                { key: 'APPROVER', label: '3) สิทธิ์และผู้อนุมัติ', icon: 'fa-sitemap' },
                { key: 'LEAVE', label: '4) โควต้าวันลา', icon: 'fa-calendar-check' },
                { key: 'DOCUMENTS', label: '5) เอกสาร & ใบเตือน', icon: 'fa-file-lines' },
                { key: 'HISTORY', label: '6) ประวัติเปลี่ยนแปลง', icon: 'fa-timeline' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setProfileActiveTab(tab.key as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    profileActiveTab === tab.key
                      ? 'bg-[#064a8b] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <i className={`fa-solid ${tab.icon} text-[11px]`}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab 1: Personal Info */}
            {profileActiveTab === 'PERSONAL' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">ชื่อ - นามสกุล:</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedEmployee.firstName} {selectedEmployee.lastName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ชื่อเล่น:</span>
                  <span className="font-bold text-slate-800">{selectedEmployee.nickname || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">เบอร์โทรศัพท์:</span>
                  <span className="font-bold text-slate-800">{selectedEmployee.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">อีเมล:</span>
                  <span className="font-bold text-slate-800">{selectedEmployee.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">เลขประจำตัวประชาชน:</span>
                  <span className="font-bold text-slate-800">{selectedEmployee.idCardNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">วันเดือนปีเกิด:</span>
                  <span className="font-bold text-slate-800">{formatThaiDate(selectedEmployee.birthDate)}</span>
                </div>
              </div>
            )}

            {/* Tab 2: Employment */}
            {profileActiveTab === 'EMPLOYMENT' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">สาขาที่สังกัด:</span>
                  <span className="font-bold text-slate-800">
                    {companies.find(c => c.id === selectedEmployee.companyId)?.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">แผนกงาน:</span>
                  <span className="font-bold text-slate-800">
                    {departments.find(d => d.id === selectedEmployee.departmentId)?.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">ตำแหน่งงาน:</span>
                  <span className="font-bold text-slate-800">{selectedEmployee.positionName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">กะการทำงาน:</span>
                  <span className="font-bold text-slate-800">{selectedEmployee.workShift}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">วันเริ่มงาน:</span>
                  <span className="font-bold text-slate-800">{formatThaiDate(selectedEmployee.hireDate)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">วันสิ้นสุดทดลองงาน:</span>
                  <span className="font-bold text-slate-800">{formatThaiDate(selectedEmployee.probationEndDate)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">เงินเดือนพื้นฐาน:</span>
                  <span className="font-bold text-[#064a8b] text-sm">{formatCurrency(selectedEmployee.baseSalary)} บาท</span>
                </div>
                <div>
                  <span className="text-slate-500 block">เงินประจำตำแหน่ง:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(selectedEmployee.positionAllowance)} บาท</span>
                </div>
                <div className="sm:col-span-2 border-t border-slate-200 pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block">การย้ายแผนก / ปรับตำแหน่ง:</span>
                    <span className="text-slate-600">บันทึกการโยกย้ายสาขาหรือเลื่อนตำแหน่งงาน</span>
                  </div>
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="px-3 py-1.5 bg-[#064a8b] text-white rounded-lg font-bold hover:bg-[#022247]"
                  >
                    <i className="fa-solid fa-arrows-split-up-and-left mr-1"></i> ย้ายแผนก/ตำแหน่ง
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Approver & Line Manager */}
            {profileActiveTab === 'APPROVER' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block">สายอนุมัติคำขอลาและ OT:</span>
                  <div className="mt-2 p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <i className="fa-solid fa-user-check"></i>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {employees.find(e => e.id === selectedEmployee.approverId)?.firstName}{' '}
                        {employees.find(e => e.id === selectedEmployee.approverId)?.lastName}
                      </p>
                      <p className="text-slate-500">
                        ตำแหน่ง: {employees.find(e => e.id === selectedEmployee.approverId)?.positionName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Leave Quotas */}
            {profileActiveTab === 'LEAVE' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.values(selectedEmployee.leaveQuotas).map((q: any) => (
                    <div key={q.leaveType} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <span className="font-bold text-slate-700 block">{q.leaveType}</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-black text-[#064a8b]">{q.remainingDays}</span>
                        <span className="text-slate-500 text-[10px]">/ {q.entitledDays} วัน</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        ใช้แล้ว {q.usedDays} วัน (รออนุมัติ {q.pendingDays || 0} วัน)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 5: Documents & Warnings */}
            {profileActiveTab === 'DOCUMENTS' && (
              <div className="space-y-4">
                {/* Documents List */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <i className="fa-solid fa-folder-open text-[#064a8b]"></i>
                      เอกสารประจำตัวและสัญญาจ้าง
                    </h4>
                    <button
                      onClick={() => setShowDocUploadModal(true)}
                      className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100"
                    >
                      <i className="fa-solid fa-plus mr-1"></i> อัปโหลดเอกสาร
                    </button>
                  </div>

                  <div className="space-y-2">
                    {selectedEmployee.documents?.length > 0 ? (
                      selectedEmployee.documents.map(doc => (
                        <div key={doc.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-file-pdf text-rose-500 text-base"></i>
                            <div>
                              <p className="font-bold text-slate-800">{doc.title}</p>
                              <p className="text-[10px] text-slate-400">อัปโหลดเมื่อ {formatThaiDate(doc.uploadedAt)} ({doc.fileSize})</p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                            {doc.type}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-400 text-xs py-4">ยังไม่มีเอกสารแนบ</p>
                    )}
                  </div>
                </div>

                {/* Warnings List */}
                <div className="p-4 bg-rose-50/40 rounded-2xl border border-rose-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-xs text-rose-800 flex items-center gap-1.5">
                      <i className="fa-solid fa-triangle-exclamation text-rose-600"></i>
                      บันทึกใบเตือนและทางวินัย (Disciplinary Warnings)
                    </h4>
                    <button
                      onClick={() => setShowWarningModal(true)}
                      className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 shadow-xs"
                    >
                      <i className="fa-solid fa-plus mr-1"></i> ออกใบเตือน
                    </button>
                  </div>

                  <div className="space-y-2">
                    {selectedEmployee.warnings?.length > 0 ? (
                      selectedEmployee.warnings.map(w => (
                        <div key={w.id} className="p-3 bg-white rounded-xl border border-rose-200 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-rose-700">
                              ระดับ: {w.level === 'VERBAL' ? 'ตักเตือนด้วยวาจา' : w.level === 'WRITTEN' ? 'หนังสือเตือนเป็นลายลักษณ์อักษร' : 'เตือนครั้งสุดท้าย'}
                            </span>
                            <span className="text-[10px] text-slate-400">{formatThaiDate(w.issueDate)}</span>
                          </div>
                          <p className="text-slate-700">{w.reason}</p>
                          <p className="text-[10px] text-slate-400 mt-1">ผู้ออก: {w.issuedBy}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-400 text-xs py-4">ไม่มีประวัติการกระทำผิดหรือใบเตือน</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 6: Department Transfer & Audit History */}
            {profileActiveTab === 'HISTORY' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <i className="fa-solid fa-timeline text-[#064a8b]"></i>
                  ประวัติการเปลี่ยนแปลงตำแหน่งและแผนก
                </h4>

                <div className="space-y-2">
                  {selectedEmployee.departmentHistory?.length > 0 ? (
                    selectedEmployee.departmentHistory.map(dh => (
                      <div key={dh.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>{dh.fromDepartment} ➜ {dh.toDepartment}</span>
                          <span className="text-[10px] text-slate-400">{formatThaiDate(dh.effectiveDate)}</span>
                        </div>
                        <p className="text-slate-600 mt-1">ตำแหน่ง: {dh.fromPosition} ➜ {dh.toPosition}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">เหตุผล: {dh.reason}</p>
                        <p className="text-[10px] text-slate-400 mt-1">ผู้อนุมัติ: {dh.approvedBy}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-400 text-xs py-4">ไม่มีประวัติการย้ายแผนก</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal: Transfer Department */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="โยกย้ายแผนก / เลื่อนตำแหน่ง"
        subtitle={`พนักงาน: ${selectedEmployee?.firstName} ${selectedEmployee?.lastName}`}
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowTransferModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleTransferSubmit}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] text-white hover:bg-[#022247]"
            >
              บันทึกการโยกย้าย
            </button>
          </>
        }
      >
        <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">แผนกปลายทาง: *</label>
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
            <label className="block font-bold text-slate-700 mb-1">ตำแหน่งใหม่: *</label>
            <input
              type="text"
              value={transferPosName}
              onChange={e => setTransferPosName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              required
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">เหตุผลการโยกย้าย: *</label>
            <textarea
              value={transferReason}
              onChange={e => setTransferReason(e.target.value)}
              placeholder="ระบุเหตุผล เช่น ขยายสาขาท่ามะเขือ, ปรับโครงสร้าง..."
              rows={3}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              required
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Issue Warning */}
      <Modal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        title="ออกใบเตือนทางวินัย"
        subtitle={`พนักงาน: ${selectedEmployee?.firstName} ${selectedEmployee?.lastName}`}
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowWarningModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleWarningSubmit}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
            >
              ออกหนังสือเตือน
            </button>
          </>
        }
      >
        <form onSubmit={handleWarningSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ระดับความผิด: *</label>
            <select
              value={warningLevel}
              onChange={e => setWarningLevel(e.target.value as any)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="VERBAL">ตักเตือนด้วยวาจา (Verbal Warning)</option>
              <option value="WRITTEN">หนังสือเตือนเป็นลายลักษณ์อักษร (Written Warning)</option>
              <option value="FINAL">หนังสือเตือนครั้งสุดท้าย (Final Warning)</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">รายละเอียดข้อผิดพลาด: *</label>
            <textarea
              value={warningReason}
              onChange={e => setWarningReason(e.target.value)}
              placeholder="ระบุข้อเท็จจริงและข้อบังคับการทำงานที่ฝ่าฝืน..."
              rows={3}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              required
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Upload Document */}
      <Modal
        isOpen={showDocUploadModal}
        onClose={() => setShowDocUploadModal(false)}
        title="อัปโหลดเอกสารพนักงาน"
        subtitle={`พนักงาน: ${selectedEmployee?.firstName} ${selectedEmployee?.lastName}`}
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowDocUploadModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleDocSubmit}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] text-white hover:bg-[#022247]"
            >
              บันทึกเอกสาร
            </button>
          </>
        }
      >
        <form onSubmit={handleDocSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ชื่อเอกสาร: *</label>
            <input
              type="text"
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              placeholder="เช่น สัญญาจ้างต่ออายุ_2569.pdf"
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              required
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">ประเภทเอกสาร: *</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value as any)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="CONTRACT">สัญญาจ้างงาน</option>
              <option value="ID_COPY">สำเนาบัตรประชาชน/ทะเบียนบ้าน</option>
              <option value="CERTIFICATE">ใบรับรองครูฝึกสอน/ใบขับขี่</option>
              <option value="WARNING_LETTER">หนังสือเตือน</option>
              <option value="OTHER">เอกสารอื่นๆ</option>
            </select>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-[#064a8b]">
            <i className="fa-solid fa-shield-halved mr-1"></i>
            ระบบจำลองการตรวจสอบ MIME Type และขีดจำกัดไฟล์ 5 MB เพื่อความปลอดภัย
          </div>
        </form>
      </Modal>
    </div>
  );
};
