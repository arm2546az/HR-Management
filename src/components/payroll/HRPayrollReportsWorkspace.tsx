import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHR } from '../../context/HRContext';
import { Modal } from '../common/Modal';
import { PayrollCycle, EmployeePayrollSnapshot } from '../../types';
import { formatCurrency, formatThaiDate, getStatusBadge, Alert } from '../../utils/helpers';

export const HRPayrollReportsWorkspace: React.FC = () => {
  const { role } = useAuth();
  const {
    payrollCycles,
    createPayrollCycle,
    calculatePayrollCycle,
    updateEmployeeSnapshot,
    approvePayrollCycle,
    payPayrollCycle,
    employees,
    attendance,
    requests,
    companies,
    departments,
    exportToCsv,
    selectedCompanyId,
  } = useHR();

  // 2 Core Sub-tabs in this workspace
  const [workspaceTab, setWorkspaceTab] = useState<'PAYROLL' | 'REPORTS'>('PAYROLL');

  // Reports sub-tab: 'LEAVE_BAL' | 'LATE_ATTENDANCE' | 'OT_APPROVED' | 'CYCLE_SUMMARY'
  const [reportSubTab, setReportSubTab] = useState<'LEAVE_BAL' | 'LATE_ATTENDANCE' | 'OT_APPROVED' | 'CYCLE_SUMMARY'>('LEAVE_BAL');

  // Selected Cycle for Viewing Detail
  const [selectedCycle, setSelectedCycle] = useState<PayrollCycle | null>(payrollCycles[0] || null);

  // Selected Payslip for Printing / Detailed View Modal
  const [selectedPayslip, setSelectedPayslip] = useState<EmployeePayrollSnapshot | null>(null);

  // Manual Edit Snapshot Modal State
  const [editingSnapshot, setEditingSnapshot] = useState<EmployeePayrollSnapshot | null>(null);
  const [manualForm, setManualForm] = useState({
    baseSalary: 0,
    positionAllowance: 0,
    attendanceBonus: 0,
    otPay: 0,
    socialSecurity: 0,
    studentLoanDeduction: 0,
    withholdingTax: 0,
    otherDeductions: 0,
  });

  // Create Cycle Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cycleName, setCycleName] = useState('รอบเงินเดือน ประจำเดือนพฤศจิกายน 2569');
  const [cycleMonth, setCycleMonth] = useState(11);
  const [cycleYear, setCycleYear] = useState(2569);
  const [cycleCompId, setCycleCompId] = useState('c1');

  // Filter cycles
  const filteredCycles = payrollCycles.filter(c => {
    if (selectedCompanyId !== 'ALL' && c.companyId !== selectedCompanyId && c.companyId !== 'ALL') {
      return false;
    }
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleName.trim()) {
      Alert.warning('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อรอบเงินเดือน');
      return;
    }
    const created = createPayrollCycle(cycleName, cycleMonth, cycleYear, cycleCompId);
    Alert.success('สร้างรอบเงินเดือนสำเร็จ', `สร้าง ${created.name} (${created.cycleCode}) สถานะร่าง`);
    setSelectedCycle(created);
    setShowCreateModal(false);
  };

  const handleCalculate = (cycleId: string) => {
    calculatePayrollCycle(cycleId);
    Alert.success('คำนวณเงินเดือนเรียบร้อย', 'ดึงข้อมูลเงินเดือน เบี้ยขยัน ขาด/สาย และค่าล่วงเวลา (OT) ที่อนุมัติมาคำนวณแล้ว');
    const updated = payrollCycles.find(c => c.id === cycleId);
    if (updated) setSelectedCycle(updated);
  };

  const handleApprove = async (cycleId: string) => {
    const confirmed = await Alert.confirm(
      'อนุมัติรอบเงินเดือน',
      'เมื่ออนุมัติแล้ว ข้อมูล Snapshot จะถูกล็อก (Lock) เพื่อป้องกันการเปลี่ยนแปลงย้อนหลัง คุณต้องการดำเนินการต่อหรือไม่?'
    );
    if (!confirmed) return;

    approvePayrollCycle(cycleId);
    Alert.success('อนุมัติรอบเงินเดือนสำเร็จ', 'ล็อกยอดเงินเดือนเรียบร้อย พร้อมสำหรับบันทึกจ่ายเงิน');
  };

  const handlePay = async (cycleId: string) => {
    const confirmed = await Alert.confirm(
      'บันทึกการจ่ายเงินเดือน',
      'บันทึกจ่ายเงินเดือนและเผยแพร่สลิปเงินเดือนให้พนักงานทุกคนสามารถตรวจสอบได้ทันที ใช่หรือไม่?'
    );
    if (!confirmed) return;

    payPayrollCycle(cycleId);
    Alert.success('บันทึกการจ่ายสำเร็จ', 'เผยแพร่สลิปเงินเดือนให้พนักงานเรียบร้อย');
  };

  // Open Manual Edit Modal
  const handleOpenEditManual = (s: EmployeePayrollSnapshot) => {
    setEditingSnapshot(s);
    setManualForm({
      baseSalary: s.baseSalary,
      positionAllowance: s.positionAllowance,
      attendanceBonus: s.attendanceBonus,
      otPay: s.otPay,
      socialSecurity: s.socialSecurity,
      studentLoanDeduction: s.studentLoanDeduction || 0,
      withholdingTax: s.withholdingTax,
      otherDeductions: s.otherDeductions || 0,
    });
  };

  // Submit Manual Edit
  const handleSaveManualEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycle || !editingSnapshot) return;

    updateEmployeeSnapshot(selectedCycle.id, editingSnapshot.id, manualForm);
    Alert.success('บันทึกยอดเงินเดือนแมนนวลสำเร็จ', `อัปเดตยอดของ ${editingSnapshot.employeeName} เรียบร้อยแล้ว`);
    setEditingSnapshot(null);

    // Refresh selected cycle in view
    const updated = payrollCycles.find(c => c.id === selectedCycle.id);
    if (updated) setSelectedCycle(updated);
  };

  // Live calculation of preview net pay during manual edit
  const previewGross = manualForm.baseSalary + manualForm.positionAllowance + manualForm.attendanceBonus + manualForm.otPay;
  const previewDeductions = manualForm.socialSecurity + manualForm.studentLoanDeduction + manualForm.withholdingTax + manualForm.otherDeductions;
  const previewNet = Math.max(0, previewGross - previewDeductions);

  // Report Data Preparations
  // 1. Leave Balances
  const leaveBalanceEmployees = employees.filter(e => selectedCompanyId === 'ALL' || e.companyId === selectedCompanyId);

  // 2. Late Attendance Records
  const lateAttendanceRecords = attendance.filter(a => {
    const matchComp = selectedCompanyId === 'ALL' || a.companyId === selectedCompanyId;
    return matchComp && (a.status === 'LATE' || (a.status === 'NEEDS_CHECK' && a.clockIn && a.clockIn > '08:15:00'));
  });

  // 3. Approved OT Records
  const approvedOTRequests = requests.filter(r => {
    const matchComp = selectedCompanyId === 'ALL' || r.companyId === selectedCompanyId;
    return matchComp && r.requestType === 'OT' && r.status === 'APPROVED';
  });

  // CSV Export Handlers
  const handleExportLeave = () => {
    const headers = ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'แผนก', 'ลาป่วยคงเหลือ', 'ลากิจคงเหลือ', 'พักร้อนคงเหลือ', 'ใช้วันลารวม'];
    const rows = leaveBalanceEmployees.map(e => [
      e.employeeCode,
      `${e.firstName} ${e.lastName}`,
      departments.find(d => d.id === e.departmentId)?.name || '-',
      e.leaveQuotas?.SICK?.remainingDays || 0,
      e.leaveQuotas?.PERSONAL?.remainingDays || 0,
      e.leaveQuotas?.ANNUAL?.remainingDays || 0,
      (e.leaveQuotas?.SICK?.usedDays || 0) + (e.leaveQuotas?.PERSONAL?.usedDays || 0) + (e.leaveQuotas?.ANNUAL?.usedDays || 0),
    ]);
    exportToCsv('รายงานวันลาคงเหลือ_VNGroup', headers, rows);
  };

  const handleExportLate = () => {
    const headers = ['วันที่', 'รหัสพนักงาน', 'ชื่อพนักงาน', 'เวลาเข้างาน', 'เวลาออกงาน', 'สถานะ', 'สาขา'];
    const rows = lateAttendanceRecords.map(a => [
      a.date,
      a.employeeCode,
      a.employeeName,
      a.clockIn || '-',
      a.clockOut || '-',
      a.status === 'LATE' ? 'มาสาย' : 'ต้องตรวจสอบ',
      a.locationName,
    ]);
    exportToCsv('รายงานการเข้างานสาย_VNGroup', headers, rows);
  };

  const handleExportOT = () => {
    const headers = ['เลขที่คำขอ', 'รหัสพนักงาน', 'ชื่อพนักงาน', 'แผนก', 'วันที่ทำ OT', 'จำนวนชั่วโมง', 'อัตราคูณ', 'ผู้อนุมัติ'];
    const rows = approvedOTRequests.map(r => [
      r.requestCode,
      r.employeeCode,
      r.employeeName,
      r.departmentName,
      r.startDate,
      r.otHours || 0,
      r.otMultiplier || 1.5,
      r.approverName,
    ]);
    exportToCsv('รายงานการอนุมัติOT_VNGroup', headers, rows);
  };

  const handleExportCycle = () => {
    if (!selectedCycle) return;
    const headers = ['รหัสพนักงาน', 'ชื่อพนักงาน', 'แผนก', 'เงินเดือนฐาน', 'ค่าตำแหน่ง', 'เบี้ยขยัน', 'OT', 'รวมรายรับ', 'ประกันสังคม', 'กยศ.', 'ภาษี', 'รวมหัก', 'สุทธิ'];
    const rows = selectedCycle.snapshots.map(s => [
      s.employeeCode,
      s.employeeName,
      s.departmentName,
      s.baseSalary,
      s.positionAllowance,
      s.attendanceBonus,
      s.otPay,
      s.totalGrossIncome,
      s.socialSecurity,
      s.studentLoanDeduction || 0,
      s.withholdingTax,
      s.totalDeductions,
      s.netPay,
    ]);
    exportToCsv(`รายงานเงินเดือนรอบ_${selectedCycle.cycleCode}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#022247] flex items-center gap-2">
            <i className="fa-solid fa-money-check-dollar text-[#064a8b]"></i>
            เงินเดือนและรายงาน (Payroll & Reports Workspace)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            คำนวณเงินเดือน ประกันสังคม กยศ. ภาษี แก้ไขยอดแบบแมนนวล พิมพ์สลิป และรายงานสารสนเทศ
          </p>
        </div>

        {workspaceTab === 'PAYROLL' && (role === 'SUPER_ADMIN' || role === 'HR_MANAGER') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <i className="fa-solid fa-plus text-[#c3a138]"></i>
            สร้างรอบเงินเดือนใหม่
          </button>
        )}
      </div>

      {/* 2 Core Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setWorkspaceTab('PAYROLL')}
          className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
            workspaceTab === 'PAYROLL'
              ? 'bg-[#064a8b] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <i className="fa-solid fa-receipt"></i>
          <span>1) เงินเดือนและสลิป (Payroll & Payslips)</span>
        </button>

        <button
          onClick={() => setWorkspaceTab('REPORTS')}
          className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
            workspaceTab === 'REPORTS'
              ? 'bg-[#064a8b] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <i className="fa-solid fa-file-chart-column"></i>
          <span>2) โซนบริหารหน้ารายงาน (Reports & Analytics)</span>
        </button>
      </div>

      {/* ==========================================
          SECTION 1: PAYROLL & PAYSLIPS
         ========================================== */}
      {workspaceTab === 'PAYROLL' && (
        <div className="space-y-6">
          {/* Cycle Selector & Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-600">เลือกรอบเงินเดือน:</span>
                <select
                  value={selectedCycle?.id}
                  onChange={e => {
                    const found = payrollCycles.find(c => c.id === e.target.value);
                    if (found) setSelectedCycle(found);
                  }}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-800"
                >
                  {filteredCycles.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.cycleCode} - {c.name} ({getStatusBadge(c.status).label})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCycle && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${getStatusBadge(selectedCycle.status).bgClass} ${getStatusBadge(selectedCycle.status).textClass}`}>
                    สถานะ: {getStatusBadge(selectedCycle.status).label}
                  </span>

                  {(selectedCycle.status === 'DRAFT' || selectedCycle.status === 'CALCULATED') && (
                    <button
                      onClick={() => handleCalculate(selectedCycle.id)}
                      className="px-3.5 py-1.5 bg-[#064a8b] text-white rounded-xl text-xs font-bold hover:bg-[#022247] shadow-xs flex items-center gap-1"
                    >
                      <i className="fa-solid fa-calculator"></i>
                      {selectedCycle.status === 'CALCULATED' ? 'คำนวณใหม่' : 'คำนวณเงินเดือน'}
                    </button>
                  )}

                  {selectedCycle.status === 'CALCULATED' && (
                    <button
                      onClick={() => handleApprove(selectedCycle.id)}
                      className="px-3.5 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 shadow-xs flex items-center gap-1"
                    >
                      <i className="fa-solid fa-lock"></i>
                      อนุมัติรอบเงินเดือน
                    </button>
                  )}

                  {selectedCycle.status === 'APPROVED' && (
                    <button
                      onClick={() => handlePay(selectedCycle.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-xs flex items-center gap-1"
                    >
                      <i className="fa-solid fa-money-bill-wave"></i>
                      บันทึกจ่ายเงิน & เผยแพร่สลิป
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Cycle Metrics Bar */}
            {selectedCycle && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold block">พนักงานในรอบ</span>
                  <span className="text-xl font-black text-slate-800 mt-0.5 block">
                    {selectedCycle.totalEmployees || selectedCycle.snapshots.length} คน
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
                  <span className="text-[11px] text-[#064a8b] font-semibold block">ยอดรวมรายได้ (Gross)</span>
                  <span className="text-xl font-black text-[#064a8b] mt-0.5 block">
                    {formatCurrency(selectedCycle.totalGrossAmount)} บ.
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200">
                  <span className="text-[11px] text-rose-700 font-semibold block">ยอดหักรวม (Deductions)</span>
                  <span className="text-xl font-black text-rose-700 mt-0.5 block">
                    {formatCurrency(selectedCycle.totalDeductions)} บ.
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-semibold block">ยอดจ่ายสุทธิ (Net Total)</span>
                  <span className="text-xl font-black text-emerald-700 mt-0.5 block">
                    {formatCurrency(selectedCycle.totalNetAmount)} บ.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Payroll Employee Cards Grid */}
          {selectedCycle && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <i className="fa-solid fa-users text-[#064a8b]"></i>
                    พนักงานรายบุคคลในรอบ ({selectedCycle.snapshots.length} คน)
                  </h3>
                  <p className="text-xs text-slate-500">
                    สามารถกดปุ่ม "แก้ไขยอดแบบแมนนวล" เพื่อพิมพ์ปรับเปลี่ยนตัวเลขประกันสังคม กยศ. หรือภาษีได้ทันที
                  </p>
                </div>

                <button
                  onClick={handleExportCycle}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-file-excel text-emerald-600"></i>
                  ส่งออกรอบนี้ (CSV)
                </button>
              </div>

              {selectedCycle.snapshots.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                  ยังไม่ได้คำนวณเงินเดือนสำหรับรอบนี้ กรุณากดปุ่ม <strong>"คำนวณเงินเดือน"</strong> ด้านบน
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedCycle.snapshots.map(s => {
                    const isLocked = selectedCycle.status === 'APPROVED' || selectedCycle.status === 'PAID';

                    return (
                      <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-[#064a8b] transition-all flex flex-col justify-between group">
                        <div>
                          {/* Card Top: Employee Info & Net Pay Badge */}
                          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#022247] to-[#064a8b] text-[#c3a138] font-black text-base flex items-center justify-center shadow-xs shrink-0">
                                {s.employeeName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-800 text-sm truncate">
                                  {s.employeeName}
                                </h4>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {s.employeeCode} • {s.departmentName}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {s.positionName}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                                สุทธิ (Net)
                              </span>
                              <span className="font-black text-emerald-700 text-sm bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 inline-block mt-0.5">
                                {formatCurrency(s.netPay)} บ.
                              </span>
                            </div>
                          </div>

                          {/* Earnings & Deductions Breakdown Box */}
                          <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3 space-y-2 text-xs">
                            {/* Earnings */}
                            <div className="space-y-1 border-b border-slate-200/60 pb-2">
                              <div className="flex justify-between text-slate-600">
                                <span className="text-[11px] text-slate-500">เงินเดือนพื้นฐาน:</span>
                                <span className="font-semibold text-slate-700">{formatCurrency(s.baseSalary)} บ.</span>
                              </div>
                              {s.positionAllowance > 0 && (
                                <div className="flex justify-between text-slate-600">
                                  <span className="text-[11px] text-slate-500">ค่าตำแหน่ง:</span>
                                  <span className="font-semibold text-slate-700">{formatCurrency(s.positionAllowance)} บ.</span>
                                </div>
                              )}
                              {s.attendanceBonus > 0 && (
                                <div className="flex justify-between text-emerald-700">
                                  <span className="text-[11px]">เบี้ยขยัน:</span>
                                  <span className="font-bold">+{formatCurrency(s.attendanceBonus)} บ.</span>
                                </div>
                              )}
                              {s.otPay > 0 && (
                                <div className="flex justify-between text-[#064a8b]">
                                  <span className="text-[11px]">ค่าล่วงเวลา OT ({s.otHours} ชม.):</span>
                                  <span className="font-bold">+{formatCurrency(s.otPay)} บ.</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-200/40">
                                <span>รวมรายรับ (Gross):</span>
                                <span>{formatCurrency(s.totalGrossIncome)} บ.</span>
                              </div>
                            </div>

                            {/* Deductions with SSO, Student Loan (กยศ), and Tax */}
                            <div className="space-y-1 pt-0.5">
                              <div className="flex justify-between text-rose-600 text-[11px]">
                                <span>ประกันสังคม (SSO 5%):</span>
                                <span>-{formatCurrency(s.socialSecurity)} บ.</span>
                              </div>
                              {(s.studentLoanDeduction || 0) > 0 && (
                                <div className="flex justify-between text-amber-700 text-[11px] font-semibold">
                                  <span>กู้ยืมเพื่อการศึกษา (กยศ.):</span>
                                  <span>-{formatCurrency(s.studentLoanDeduction)} บ.</span>
                                </div>
                              )}
                              {s.withholdingTax > 0 && (
                                <div className="flex justify-between text-rose-600 text-[11px]">
                                  <span>ภาษีหัก ณ ที่จ่าย:</span>
                                  <span>-{formatCurrency(s.withholdingTax)} บ.</span>
                                </div>
                              )}
                              {s.otherDeductions > 0 && (
                                <div className="flex justify-between text-rose-600 text-[11px]">
                                  <span>หักอื่นๆ:</span>
                                  <span>-{formatCurrency(s.otherDeductions)} บ.</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-rose-700 text-xs pt-1 border-t border-slate-200/40">
                                <span>รวมรายการหัก:</span>
                                <span>-{formatCurrency(s.totalDeductions)} บ.</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions: Manual Edit & Print Payslip */}
                        <div className="pt-3 border-t border-slate-100 mt-3 flex items-center gap-2">
                          {!isLocked && (
                            <button
                              onClick={() => handleOpenEditManual(s)}
                              className="flex-1 py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-1"
                              title="แก้แบบแมนนวลโดยตรง"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                              <span>แก้แมนนวล</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedPayslip(s)}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-[#064a8b] hover:bg-[#022247] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                          >
                            <i className="fa-solid fa-print"></i>
                            <span>พิมพ์สลิป</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          SECTION 2: REPORTS & ANALYTICS ZONE
         ========================================== */}
      {workspaceTab === 'REPORTS' && (
        <div className="space-y-6">
          {/* Reports Subtabs Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setReportSubTab('LEAVE_BAL')}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  reportSubTab === 'LEAVE_BAL' ? 'bg-[#064a8b] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <i className="fa-solid fa-calendar-check"></i>
                <span>วันลาคงเหลือของพนักงาน</span>
              </button>

              <button
                onClick={() => setReportSubTab('LATE_ATTENDANCE')}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  reportSubTab === 'LATE_ATTENDANCE' ? 'bg-[#064a8b] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <i className="fa-solid fa-clock"></i>
                <span>ระบบการเข้างานสาย</span>
              </button>

              <button
                onClick={() => setReportSubTab('OT_APPROVED')}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  reportSubTab === 'OT_APPROVED' ? 'bg-[#064a8b] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <i className="fa-solid fa-stopwatch"></i>
                <span>การอนุมัติ OT</span>
              </button>

              <button
                onClick={() => setReportSubTab('CYCLE_SUMMARY')}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  reportSubTab === 'CYCLE_SUMMARY' ? 'bg-[#064a8b] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <i className="fa-solid fa-timeline"></i>
                <span>เงินเดือนตามรอบ</span>
              </button>
            </div>

            {/* Quick Export Button */}
            <div>
              {reportSubTab === 'LEAVE_BAL' && (
                <button onClick={handleExportLeave} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-xs">
                  <i className="fa-solid fa-file-csv"></i> ส่งออกรายงานวันลา (CSV)
                </button>
              )}
              {reportSubTab === 'LATE_ATTENDANCE' && (
                <button onClick={handleExportLate} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-xs">
                  <i className="fa-solid fa-file-csv"></i> ส่งออกรายงานการสาย (CSV)
                </button>
              )}
              {reportSubTab === 'OT_APPROVED' && (
                <button onClick={handleExportOT} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-xs">
                  <i className="fa-solid fa-file-csv"></i> ส่งออกรายงาน OT (CSV)
                </button>
              )}
            </div>
          </div>

          {/* Report 1: Remaining Leave Cards */}
          {reportSubTab === 'LEAVE_BAL' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaveBalanceEmployees.map(emp => {
                const totalRemaining = (emp.leaveQuotas?.SICK?.remainingDays ?? 30) + (emp.leaveQuotas?.PERSONAL?.remainingDays ?? 6) + (emp.leaveQuotas?.ANNUAL?.remainingDays ?? 6);
                const totalEntitled = (emp.leaveQuotas?.SICK?.entitledDays || 30) + (emp.leaveQuotas?.PERSONAL?.entitledDays || 6) + (emp.leaveQuotas?.ANNUAL?.entitledDays || 6);

                return (
                  <div key={emp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-[#064a8b] transition-all space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{emp.firstName} {emp.lastName}</h4>
                        <p className="text-[11px] text-slate-500">{emp.employeeCode} • {departments.find(d => d.id === emp.departmentId)?.name}</p>
                      </div>
                      <span className="text-[11px] font-bold text-[#064a8b] bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                        {totalRemaining} / {totalEntitled} วัน
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-xl">
                        <span className="text-[10px] text-slate-500 block font-semibold">ลาป่วย</span>
                        <div className="mt-0.5 flex items-baseline justify-center gap-1">
                          <span className="text-base font-black text-[#064a8b]">
                            {emp.leaveQuotas?.SICK?.remainingDays ?? 30}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            / {emp.leaveQuotas?.SICK?.entitledDays ?? 30} วัน
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                        <span className="text-[10px] text-slate-500 block font-semibold">ลากิจ</span>
                        <div className="mt-0.5 flex items-baseline justify-center gap-1">
                          <span className="text-base font-black text-amber-800">
                            {emp.leaveQuotas?.PERSONAL?.remainingDays ?? 6}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            / {emp.leaveQuotas?.PERSONAL?.entitledDays ?? 6} วัน
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl">
                        <span className="text-[10px] text-slate-500 block font-semibold">พักร้อน</span>
                        <div className="mt-0.5 flex items-baseline justify-center gap-1">
                          <span className="text-base font-black text-emerald-800">
                            {emp.leaveQuotas?.ANNUAL?.remainingDays ?? 6}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            / {emp.leaveQuotas?.ANNUAL?.entitledDays ?? 6} วัน
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Report 2: Late Attendance Cards */}
          {reportSubTab === 'LATE_ATTENDANCE' && (
            <div className="space-y-4">
              {lateAttendanceRecords.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                  <i className="fa-solid fa-clock text-3xl mb-2 text-emerald-500 block"></i>
                  ไม่มีประวัติการมาสายในรอบนี้ พนักงานทุกคนเข้างานตรงเวลา
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lateAttendanceRecords.map(att => (
                    <div key={att.id} className="bg-white rounded-2xl border border-rose-200 p-4 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                        <span className="text-xs font-bold text-slate-600">{formatThaiDate(att.date)}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          เข้างานสาย
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{att.employeeName}</h4>
                        <p className="text-[11px] text-slate-500">{att.employeeCode} • {att.locationName}</p>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs flex justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block">เวลาเข้างานจริง:</span>
                          <span className="font-mono font-bold text-rose-600">{att.clockIn || '-'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">กะทำงาน:</span>
                          <span className="font-semibold text-slate-700">{att.workShift}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        <i className="fa-solid fa-circle-exclamation mr-1"></i>
                        กระทบสิทธิ์เบี้ยขยันประจำเดือน
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Report 3: Approved OT Summary Cards */}
          {reportSubTab === 'OT_APPROVED' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedOTRequests.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-mono text-xs font-bold text-[#064a8b]">{r.requestCode}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      อนุมัติแล้ว
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{r.employeeName}</h4>
                    <p className="text-[11px] text-slate-500">{r.departmentName} ({r.employeeCode})</p>
                  </div>

                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block">ชั่วโมงทำ OT:</span>
                      <span className="text-base font-black text-[#064a8b]">{r.otHours} ชั่วโมง</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">อัตราค่าจ้าง:</span>
                      <span className="font-bold text-slate-700">x{r.otMultiplier || 1.5}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <p>วันที่: <strong>{r.startDate}</strong></p>
                    <p>ผู้อนุมัติ: <strong>{r.approverName}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Report 4: Cycle Summary Cards */}
          {reportSubTab === 'CYCLE_SUMMARY' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {payrollCycles.map(c => (
                <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-black text-slate-800 text-sm">{c.cycleCode}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(c.status).bgClass} ${getStatusBadge(c.status).textClass}`}>
                      {getStatusBadge(c.status).label}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-xs">{c.name}</h4>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">พนักงาน:</span>
                      <span className="font-bold text-slate-700">{c.totalEmployees} คน</span>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <span className="text-[10px] text-[#064a8b] block">ยอดรวมรายรับ:</span>
                      <span className="font-bold text-[#064a8b]">{formatCurrency(c.totalGrossAmount)} บ.</span>
                    </div>
                    <div className="p-2 bg-rose-50 rounded-lg">
                      <span className="text-[10px] text-rose-700 block">ยอดรวมรายการหัก:</span>
                      <span className="font-bold text-rose-700">-{formatCurrency(c.totalDeductions)} บ.</span>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <span className="text-[10px] text-emerald-800 block">ยอดจ่ายสุทธิ:</span>
                      <span className="font-black text-emerald-700">{formatCurrency(c.totalNetAmount)} บ.</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          MODAL: MANUAL AMOUNT EDIT (DIRECT NUMBERS)
         ========================================== */}
      {editingSnapshot && (
        <Modal
          isOpen={Boolean(editingSnapshot)}
          onClose={() => setEditingSnapshot(null)}
          title={`แก้ไขยอดเงินเดือนแบบแมนนวล: ${editingSnapshot.employeeName}`}
          subtitle={`${editingSnapshot.employeeCode} • ${editingSnapshot.departmentName}`}
          size="xl"
          footer={
            <>
              <button
                onClick={() => setEditingSnapshot(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveManualEdit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white shadow-xs"
              >
                บันทึกการปรับยอดแมนนวล
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveManualEdit} className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[#064a8b]">
              <i className="fa-solid fa-circle-info mr-1"></i>
              <strong>พิมพ์ตัวเลขเพื่อแก้ไขโดยตรง:</strong> คุณสามารถแก้ไขตัวเลขประกันสังคม, กยศ., ภาษี หรือเบี้ยขยันได้ทันทีโดยไม่ต้องเลื่อนสไลเดอร์ ระบบจะคำนวณยอดสุทธิ (Net Pay) อัตโนมัติ
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Earnings */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-black text-slate-800 text-xs border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>รายการรายได้ (Earnings)</span>
                  <span className="text-emerald-700 font-bold">รวม {formatCurrency(previewGross)} บ.</span>
                </h4>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">เงินเดือนพื้นฐาน (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={manualForm.baseSalary}
                    onChange={e => setManualForm({ ...manualForm, baseSalary: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">เงินประจำตำแหน่ง (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={manualForm.positionAllowance}
                    onChange={e => setManualForm({ ...manualForm, positionAllowance: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">เบี้ยขยัน (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={manualForm.attendanceBonus}
                    onChange={e => setManualForm({ ...manualForm, attendanceBonus: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ค่าล่วงเวลา OT (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={manualForm.otPay}
                    onChange={e => setManualForm({ ...manualForm, otPay: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                  />
                </div>
              </div>

              {/* Right Column: Deductions (SSO, Student Loan, Tax) */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-black text-rose-800 text-xs border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>รายการหัก (Deductions)</span>
                  <span className="text-rose-700 font-bold">รวม -{formatCurrency(previewDeductions)} บ.</span>
                </h4>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    เงินสมทบประกันสังคม (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="750"
                    value={manualForm.socialSecurity}
                    onChange={e => setManualForm({ ...manualForm, socialSecurity: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-rose-700 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">คำนวณตามจริง 5% สูงสุด 750 บ.</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={manualForm.studentLoanDeduction}
                    onChange={e => setManualForm({ ...manualForm, studentLoanDeduction: Number(e.target.value) })}
                    className="w-full p-2.5 border border-amber-300 rounded-xl font-bold text-amber-800 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">ระบุจำนวนเงินที่หักชำระหนี้ กยศ. ตามแจ้ง</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ภาษีเงินได้หัก ณ ที่จ่าย (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={manualForm.withholdingTax}
                    onChange={e => setManualForm({ ...manualForm, withholdingTax: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-rose-700 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">รายการหักอื่นๆ (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={manualForm.otherDeductions}
                    onChange={e => setManualForm({ ...manualForm, otherDeductions: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Net Pay Summary Callout */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 font-bold block">ยอดเงินได้สุทธิใหม่ (Calculated Net Pay):</span>
                <span className="text-[11px] text-slate-500">คำนวณจาก รายได้รวม - รายการหักทั้งหมด</span>
              </div>
              <span className="text-2xl font-black text-emerald-700">
                {formatCurrency(previewNet)} บาท
              </span>
            </div>
          </form>
        </Modal>
      )}

      {/* ==========================================
          MODAL: CREATE PAYROLL CYCLE
         ========================================== */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="สร้างรอบเงินเดือนใหม่"
        subtitle="กำหนดเดือนและสาขาเพื่อประมวลผลเงินเดือน"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleCreateSubmit}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white shadow-xs"
            >
              สร้างรอบเงินเดือน
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ชื่อรอบเงินเดือน *</label>
            <input
              type="text"
              required
              value={cycleName}
              onChange={e => setCycleName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ประจำเดือน</label>
              <select
                value={cycleMonth}
                onChange={e => setCycleMonth(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                {[
                  '1 - มกราคม', '2 - กุมภาพันธ์', '3 - มีนาคม', '4 - เมษายน',
                  '5 - พฤษภาคม', '6 - มิถุนายน', '7 - กรกฎาคม', '8 - สิงหาคม',
                  '9 - กันยายน', '10 - ตุลาคม', '11 - พฤศจิกายน', '12 - ธันวาคม',
                ].map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">ปี (พ.ศ.)</label>
              <input
                type="number"
                value={cycleYear}
                onChange={e => setCycleYear(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">สาขา</label>
            <select
              value={cycleCompId}
              onChange={e => setCycleCompId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="ALL">ทุกสาขา (รวมทั้งเครือ)</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* ==========================================
          MODAL: VIEW & PRINT PAYSLIP
         ========================================== */}
      {selectedPayslip && (
        <Modal
          isOpen={Boolean(selectedPayslip)}
          onClose={() => setSelectedPayslip(null)}
          title="ใบจ่ายเงินเดือน (Payslip Voucher)"
          subtitle={`พนักงาน: ${selectedPayslip.employeeName} (${selectedPayslip.employeeCode})`}
          size="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-slate-400">
                เอกสารสำหรับใช้ภายในองค์กร VN Group
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#064a8b] hover:bg-[#022247] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <i className="fa-solid fa-print"></i>
                  <span>พิมพ์สลิปเงินเดือน (Print)</span>
                </button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  ปิด
                </button>
              </div>
            </div>
          }
        >
          <div className="bg-white p-6 border border-slate-300 rounded-xl text-slate-800 space-y-4 print:border-none print:p-0">
            {/* Payslip Header */}
            <div className="text-center border-b border-slate-300 pb-3">
              <h3 className="font-black text-lg text-[#022247]">
                บริษัท โรงเรียนสอนขับรถวีเอ็น จำกัด (VN GROUP)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                ใบแจ้งยอดเงินเดือนและค่าตอบแทน (Pay Slip Voucher)
              </p>
              <p className="text-[11px] text-slate-500">
                {selectedCycle?.name || 'รอบเงินเดือนปัจจุบัน'}
              </p>
            </div>

            {/* Employee Information */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div><span>ชื่อ-นามสกุล:</span> <strong>{selectedPayslip.employeeName}</strong></div>
              <div><span>รหัสพนักงาน:</span> <strong>{selectedPayslip.employeeCode}</strong></div>
              <div><span>แผนก:</span> <strong>{selectedPayslip.departmentName}</strong></div>
              <div><span>ตำแหน่ง:</span> <strong>{selectedPayslip.positionName}</strong></div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Earnings */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 flex justify-between">
                  <span>รายการได้ (Income)</span>
                  <span>จำนวนเงิน</span>
                </div>
                <div className="p-3 space-y-1.5">
                  <div className="flex justify-between"><span>เงินเดือนพื้นฐาน</span><span>{formatCurrency(selectedPayslip.baseSalary)}</span></div>
                  {selectedPayslip.positionAllowance > 0 && <div className="flex justify-between"><span>ค่าตำแหน่ง</span><span>{formatCurrency(selectedPayslip.positionAllowance)}</span></div>}
                  {selectedPayslip.attendanceBonus > 0 && <div className="flex justify-between"><span>เบี้ยขยัน</span><span>{formatCurrency(selectedPayslip.attendanceBonus)}</span></div>}
                  {selectedPayslip.otPay > 0 && <div className="flex justify-between"><span>ค่าล่วงเวลา ({selectedPayslip.otHours} ชม.)</span><span>{formatCurrency(selectedPayslip.otPay)}</span></div>}
                </div>
                <div className="bg-slate-50 px-3 py-1.5 font-black flex justify-between border-t border-slate-200">
                  <span>รวมเงินได้</span>
                  <span>{formatCurrency(selectedPayslip.totalGrossIncome)} บ.</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 flex justify-between">
                  <span>รายการหัก (Deduction)</span>
                  <span>จำนวนเงิน</span>
                </div>
                <div className="p-3 space-y-1.5">
                  <div className="flex justify-between"><span>ประกันสังคม (SSO)</span><span>{formatCurrency(selectedPayslip.socialSecurity)}</span></div>
                  {(selectedPayslip.studentLoanDeduction || 0) > 0 && <div className="flex justify-between font-semibold text-amber-800"><span>เงินกู้ กยศ.</span><span>{formatCurrency(selectedPayslip.studentLoanDeduction)}</span></div>}
                  {selectedPayslip.withholdingTax > 0 && <div className="flex justify-between"><span>ภาษีหัก ณ ที่จ่าย</span><span>{formatCurrency(selectedPayslip.withholdingTax)}</span></div>}
                  {(selectedPayslip.otherDeductions || 0) > 0 && <div className="flex justify-between"><span>หักอื่นๆ</span><span>{formatCurrency(selectedPayslip.otherDeductions)}</span></div>}
                </div>
                <div className="bg-slate-50 px-3 py-1.5 font-black text-rose-700 flex justify-between border-t border-slate-200">
                  <span>รวมเงินหัก</span>
                  <span>-{formatCurrency(selectedPayslip.totalDeductions)} บ.</span>
                </div>
              </div>
            </div>

            {/* Net Pay Highlight */}
            <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl flex items-center justify-between text-emerald-900">
              <span className="font-bold text-xs">เงินรับสุทธิ (Net Payable):</span>
              <span className="font-black text-xl">{formatCurrency(selectedPayslip.netPay)} บาท</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
