import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHR } from '../../context/HRContext';
import { LeaveStatisticsCard } from './LeaveStatisticsCard';
import { Modal } from '../common/Modal';
import { formatThaiDate, getLeaveTypeName, Alert } from '../../utils/helpers';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { role } = useAuth();
  const {
    employees,
    requests,
    attendance,
    payrollCycles,
    selectedCompanyId,
    companies,
    departments,
    announcements,
    approveRequest,
    rejectRequest,
    updateEmployeeStatus,
    addCompanyPolicy,
    deleteCompanyPolicy,
  } = useHR();

  // Selected company for policy management
  const [policyCompanyId, setPolicyCompanyId] = useState<string>(companies[0]?.id || 'c1');
  const [showAddPolicyModal, setShowAddPolicyModal] = useState(false);
  const [policyTitle, setPolicyTitle] = useState('');
  const [policyContent, setPolicyContent] = useState('');

  // Today's date
  const todayStr = '2026-10-05';
  const todayTime = new Date(todayStr).getTime();

  // Filter employees by company
  const filteredEmployees = useMemo(() => {
    if (selectedCompanyId === 'ALL') return employees;
    return employees.filter(e => e.companyId === selectedCompanyId);
  }, [employees, selectedCompanyId]);

  const activeEmployeesCount = filteredEmployees.filter(
    e => e.employmentStatus === 'ACTIVE' || e.employmentStatus === 'PROBATION'
  ).length;

  // Pending requests for approval
  const pendingRequests = useMemo(() => {
    return requests.filter(r => {
      const matchComp = selectedCompanyId === 'ALL' || r.companyId === selectedCompanyId;
      return matchComp && r.status === 'PENDING';
    });
  }, [requests, selectedCompanyId]);

  // Who is on leave today?
  const onLeaveTodayList = useMemo(() => {
    return requests.filter(r => {
      const matchComp = selectedCompanyId === 'ALL' || r.companyId === selectedCompanyId;
      return matchComp && r.status === 'APPROVED' && r.requestType === 'LEAVE' &&
        r.startDate <= todayStr && r.endDate >= todayStr;
    });
  }, [requests, selectedCompanyId, todayStr]);

  // Attendance issues today
  const attendanceIssues = useMemo(() => {
    return attendance.filter(a => {
      const matchComp = selectedCompanyId === 'ALL' || a.companyId === selectedCompanyId;
      return matchComp && a.date === todayStr && (a.status === 'NEEDS_CHECK' || a.status === 'LATE' || a.status === 'INCOMPLETE');
    });
  }, [attendance, selectedCompanyId]);

  // Probation ending in <= 45 days
  const probationEmployees = useMemo(() => {
    return filteredEmployees.filter(e => {
      if (e.employmentStatus !== 'PROBATION' || !e.probationEndDate) return false;
      const end = new Date(e.probationEndDate).getTime();
      const diffDays = Math.ceil((end - todayTime) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 45;
    });
  }, [filteredEmployees, todayTime]);

  // Latest payroll status
  const latestPayroll = payrollCycles[0];

  // Quick Approval handler
  const handleQuickApprove = (reqId: string, reqCode: string) => {
    const res = approveRequest(reqId, 'อนุมัติโดย Super Admin');
    if (res.success) {
      Alert.success('อนุมัติเรียบร้อย', `อนุมัติคำขอ ${reqCode} สำเร็จแล้ว`);
    } else {
      Alert.error('ไม่สำเร็จ', res.message);
    }
  };

  const handleQuickReject = async (reqId: string, reqCode: string) => {
    const prompt = await Alert.promptReason(`ปฏิเสธคำขอ ${reqCode}`, 'ระบุเหตุผลการไม่อนุมัติ...');
    if (!prompt.confirmed || !prompt.reason.trim()) return;
    const res = rejectRequest(reqId, prompt.reason);
    if (res.success) {
      Alert.success('ปฏิเสธคำขอเรียบร้อย', res.message);
    } else {
      Alert.error('ไม่สำเร็จ', res.message);
    }
  };

  // Pass probation handler
  const handlePassProbation = async (empId: string, empName: string) => {
    const ok = await Alert.confirm('ประเมินผ่านทดลองงาน', `ยืนยันการปรับสถานะของ ${empName} เป็น "พนักงานประจำ" หรือไม่?`);
    if (!ok) return;
    updateEmployeeStatus(empId, 'ACTIVE');
    Alert.success('ปรับสถานะสำเร็จ', `${empName} ได้รับการบรรจุเป็นพนักงานประจำเรียบร้อยแล้ว`);
  };

  // Add Policy Submit
  const handleAddPolicySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyTitle.trim() || !policyContent.trim()) {
      Alert.warning('ข้อมูลไม่ครบ', 'กรุณาระบุหัวข้อนโยบายและรายละเอียด');
      return;
    }
    addCompanyPolicy(policyCompanyId, policyTitle, policyContent);
    Alert.success('เพิ่มนโยบายสำเร็จ', `บันทึกนโยบาย "${policyTitle}" สำหรับบริษัทเรียบร้อย`);
    setShowAddPolicyModal(false);
    setPolicyTitle('');
    setPolicyContent('');
  };

  const currentPolicyCompany = companies.find(c => c.id === policyCompanyId) || companies[0];

  return (
    <div className="space-y-6">
      {/* Super Admin Welcome Banner */}
      <div className="bg-gradient-to-r from-[#022247] to-[#064a8b] rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#c3a138] text-slate-900 flex items-center gap-1">
              <i className="fa-solid fa-crown text-[10px]"></i> Super Admin Executive View
            </span>
            <span className="text-xs text-blue-200">
              {formatThaiDate(todayStr)}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
            แดชบอร์ดภาพรวมผู้บริหาร VN Group
          </h2>
          <p className="text-xs text-[#a4b3d3] mt-0.5">
            เข้าถึงทุกโมดูลในระบบ ติดตามพนักงานที่ลาวันนี้ พนักงานใกล้ครบทดลองงาน และจัดการนโยบายสาขา
          </p>
        </div>

        {/* Quick Nav Shortcut Buttons for mobile/desktop */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => onNavigate('requests')}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <i className="fa-solid fa-check-to-slot text-[#c3a138]"></i>
            อนุมัติคำขอ ({pendingRequests.length})
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="px-3 py-2 rounded-xl bg-[#c3a138] text-slate-900 text-xs font-black hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <i className="fa-solid fa-sliders"></i>
            ตั้งค่าระบบ
          </button>
        </div>
      </div>

      {/* 6 Summary Metric Cards (Mobile Touch Friendly) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1 */}
        <div
          onClick={() => onNavigate('employees')}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-[#064a8b] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[11px] font-semibold text-slate-500">พนักงานพร้อมทำงาน</span>
          <div className="my-2">
            <span className="text-2xl font-black text-[#022247]">{activeEmployeesCount}</span>
            <span className="text-xs text-slate-500 ml-1">คน</span>
          </div>
          <span className="text-[10px] text-[#064a8b] font-bold">ดูพนักงาน ➔</span>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => onNavigate('requests')}
          className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs hover:border-amber-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[11px] font-semibold text-amber-800">รอการอนุมัติ</span>
          <div className="my-2">
            <span className="text-2xl font-black text-amber-700">{pendingRequests.length}</span>
            <span className="text-xs text-slate-500 ml-1">คำขอ</span>
          </div>
          <span className="text-[10px] text-amber-800 font-bold">คลิกเพื่ออนุมัติ ➔</span>
        </div>

        {/* Card 3 */}
        <div
          className="bg-white rounded-2xl p-4 border border-blue-200 shadow-xs hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[11px] font-semibold text-[#064a8b]">ผู้ลาวันนี้</span>
          <div className="my-2">
            <span className="text-2xl font-black text-[#064a8b]">{onLeaveTodayList.length}</span>
            <span className="text-xs text-slate-500 ml-1">คน</span>
          </div>
          <span className="text-[10px] text-blue-700 font-bold">ดูรายชื่อด้านล่าง ➔</span>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => onNavigate('attendance-leave')}
          className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs hover:border-rose-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[11px] font-semibold text-rose-700">ลงเวลาต้องตรวจ</span>
          <div className="my-2">
            <span className="text-2xl font-black text-rose-600">{attendanceIssues.length}</span>
            <span className="text-xs text-slate-500 ml-1">รายการ</span>
          </div>
          <span className="text-[10px] text-rose-700 font-bold">ตรวจเวลาสาย ➔</span>
        </div>

        {/* Card 5 */}
        <div
          onClick={() => onNavigate('employees')}
          className="bg-white rounded-2xl p-4 border border-sky-200 shadow-xs hover:border-sky-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[11px] font-semibold text-sky-800">ใกล้ครบโปร</span>
          <div className="my-2">
            <span className="text-2xl font-black text-sky-700">{probationEmployees.length}</span>
            <span className="text-xs text-slate-500 ml-1">คน</span>
          </div>
          <span className="text-[10px] text-sky-800 font-bold">ประเมินบรรจุ ➔</span>
        </div>

        {/* Card 6 */}
        <div
          onClick={() => onNavigate('payroll')}
          className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[11px] font-semibold text-emerald-800">รอบเงินเดือน</span>
          <div className="my-2">
            <span className="text-base font-black text-emerald-700 truncate block">
              {latestPayroll?.cycleCode || 'รอบเงินเดือน'}
            </span>
          </div>
          <span className="text-[10px] text-emerald-800 font-bold">ดูรายละเอียด ➔</span>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: แดชของผู้ลาวันนี้ (ON LEAVE TODAY CARDS)
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <i className="fa-solid fa-calendar-day text-[#064a8b]"></i>
              ผู้ลาวันนี้ (On Leave Today - {formatThaiDate(todayStr)})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              รายชื่อพนักงานที่ได้รับอนุมัติวันลาและไม่อยู่ปฏิบัติงานในวันนี้
            </p>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-[#064a8b]">
            {onLeaveTodayList.length} คน
          </span>
        </div>

        {onLeaveTodayList.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-500 text-xs flex flex-col items-center justify-center">
            <i className="fa-solid fa-users text-2xl text-emerald-500 mb-2"></i>
            <span className="font-bold text-slate-700">วันนี้ไม่มีพนักงานลา</span>
            <span className="text-slate-400 mt-0.5">พนักงานทุกคนพร้อมปฏิบัติงานตามปกติ</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {onLeaveTodayList.map(req => {
              const emp = employees.find(e => e.id === req.employeeId);
              const dept = departments.find(d => d.id === req.departmentId);
              const comp = companies.find(c => c.id === req.companyId);

              return (
                <div key={req.id} className="bg-blue-50/40 rounded-xl border border-blue-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#064a8b] text-white">
                      {getLeaveTypeName(req.leaveType)}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {req.daysCount} วัน
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#022247] to-[#064a8b] text-[#c3a138] font-bold text-sm flex items-center justify-center shrink-0">
                      {req.employeeName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">{req.employeeName}</h4>
                      <p className="text-[11px] text-slate-500">{dept?.name || req.departmentName}</p>
                      <p className="text-[10px] text-slate-400">{comp?.shortName}</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 border-t border-blue-200/60 pt-2 space-y-1">
                    <p>ช่วงเวลา: <strong>{formatThaiDate(req.startDate)} - {formatThaiDate(req.endDate)}</strong></p>
                    {emp?.phone && <p>เบอร์ติดต่อฉุกเฉิน: <strong>{emp.phone}</strong></p>}
                    <p className="italic text-slate-500">"{req.reason}"</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 2: พนักงานใกล้ครบทดลองงาน (APPROACHING PROBATION END CARDS)
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <i className="fa-solid fa-user-clock text-amber-600"></i>
              พนักงานใกล้ครบกำหนดทดลองงาน (Approaching End of Probation)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              พนักงานที่มีกำหนดครบระยะทดลองงานภายใน 45 วัน สามารถกดประเมินบรรจุเป็นพนักงานประจำได้ทันที
            </p>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200">
            {probationEmployees.length} คน
          </span>
        </div>

        {probationEmployees.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
            ไม่มีพนักงานที่ใกล้ครบกำหนดทดลองงานในระยะนี้
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {probationEmployees.map(emp => {
              const end = new Date(emp.probationEndDate!).getTime();
              const diffDays = Math.ceil((end - todayTime) / (1000 * 60 * 60 * 24));
              const comp = companies.find(c => c.id === emp.companyId);
              const dept = departments.find(d => d.id === emp.departmentId);

              return (
                <div key={emp.id} className="bg-amber-50/50 rounded-2xl border border-amber-200 p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-500">{emp.employeeCode}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs">
                        เหลืออีก {diffDays} วัน
                      </span>
                    </div>

                    <div className="mt-2">
                      <h4 className="font-black text-slate-800 text-sm">{emp.firstName} {emp.lastName}</h4>
                      <p className="text-xs text-slate-600">{dept?.name} • {emp.positionName}</p>
                      <p className="text-[11px] text-slate-400">สาขา: {comp?.shortName}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-amber-200/60 text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">วันเริ่มงาน:</span>
                        <span>{formatThaiDate(emp.hireDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">วันครบโปร:</span>
                        <span className="font-bold text-amber-800">{formatThaiDate(emp.probationEndDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handlePassProbation(emp.id, `${emp.firstName} ${emp.lastName}`)}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <i className="fa-solid fa-check"></i>
                      <span>ผ่านการทดลองงาน (บรรจุประจำ)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 3: นโยบายของแต่ละบริษัท (COMPANY POLICY MANAGER)
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <i className="fa-solid fa-file-shield text-[#064a8b]"></i>
              จัดการนโยบายประจำสาขา (Company Policies)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Super Admin สามารถกำหนดและเพิ่มระเบียบนโยบายเฉพาะของบริษัทและสาขานั้นๆ ได้โดยตรง
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={policyCompanyId}
              onChange={e => setPolicyCompanyId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-800"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button
              onClick={() => setShowAddPolicyModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white shadow-xs transition-all flex items-center gap-1 shrink-0"
            >
              <i className="fa-solid fa-plus text-[#c3a138]"></i>
              เพิ่มนโยบายบริษัทนี้
            </button>
          </div>
        </div>

        {/* Policies List for selected company */}
        <div className="space-y-3">
          {(!currentPolicyCompany.policies || currentPolicyCompany.policies.length === 0) ? (
            <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
              ยังไม่มีการระบุนโยบายเฉพาะสำหรับสาขานี้ กดปุ่ม <strong>"+ เพิ่มนโยบายบริษัทนี้"</strong> เพื่อสร้างใหม่
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPolicyCompany.policies.map(pol => (
                <div key={pol.id} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#064a8b]"></span>
                      {pol.title}
                    </h4>
                    <button
                      onClick={() => {
                        Alert.confirm('ลบนโยบาย', `ต้องการลบนโยบาย "${pol.title}" หรือไม่?`).then(yes => {
                          if (yes) deleteCompanyPolicy(currentPolicyCompany.id, pol.id);
                        });
                      }}
                      className="text-slate-400 hover:text-rose-600 text-xs"
                      title="ลบนโยบาย"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                  <p className="text-xs text-slate-600">{pol.content}</p>
                  <span className="text-[10px] text-slate-400 block pt-1 border-t border-slate-200">
                    วันที่มีผลบังคับใช้: {formatThaiDate(pol.effectiveDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: PENDING APPROVALS OVERVIEW & ONE-CLICK APPROVAL
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <i className="fa-solid fa-envelope-open-text text-amber-500"></i>
              คำขอรอการอนุมัติทั่วทั้งองค์กร ({pendingRequests.length} รายการ)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Super Admin สามารถพิจารณาอนุมัติหรือปฏิเสธคำขอได้ทันทีโดยไม่ต้องส่งคำขอของตนเอง
            </p>
          </div>

          <button
            onClick={() => onNavigate('requests')}
            className="text-xs font-bold text-[#064a8b] hover:underline"
          >
            ดูศูนย์คำขอทั้งหมด ➔
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
            <i className="fa-solid fa-circle-check text-2xl text-emerald-500 mb-2 block"></i>
            ไม่มีคำขอรอการอนุมัติค้างในระบบ ทุกรายการได้รับการดำเนินการเรียบร้อย
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.slice(0, 6).map(req => (
              <div key={req.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#064a8b]">{req.requestCode}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {req.requestType === 'LEAVE' ? `วันลา (${getLeaveTypeName(req.leaveType)})` : 'ล่วงเวลา (OT)'}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-xs mt-2">{req.employeeName}</h4>
                  <p className="text-[11px] text-slate-500">{req.departmentName} ({req.employeeCode})</p>
                  <p className="text-xs text-slate-600 mt-1 italic">"{req.reason}"</p>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                  <button
                    onClick={() => handleQuickApprove(req.id, req.requestCode)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    อนุมัติ
                  </button>
                  <button
                    onClick={() => handleQuickReject(req.id, req.requestCode)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all"
                  >
                    ปฏิเสธ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave Statistics Breakdown Section */}
      <LeaveStatisticsCard />

      {/* Modal: Add Policy */}
      <Modal
        isOpen={showAddPolicyModal}
        onClose={() => setShowAddPolicyModal(false)}
        title={`เพิ่มนโยบายใหม่: ${currentPolicyCompany.name}`}
        subtitle="กำหนดระเบียบและข้อบังคับเฉพาะสำหรับสาขานี้"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowAddPolicyModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleAddPolicySubmit}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white"
            >
              บันทึกนโยบาย
            </button>
          </>
        }
      >
        <form onSubmit={handleAddPolicySubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">หัวข้อนโยบาย *</label>
            <input
              type="text"
              required
              value={policyTitle}
              onChange={e => setPolicyTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="เช่น ระเบียบการแต่งกายและเวลาอบรมครูฝึก"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">รายละเอียดนโยบาย *</label>
            <textarea
              required
              rows={4}
              value={policyContent}
              onChange={e => setPolicyContent(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="ระบุข้อกำหนด เงื่อนไข และบทลงโทษหรือสวัสดิการ..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
