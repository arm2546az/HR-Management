import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHR } from '../../context/HRContext';
import { LeaveType } from '../../types';
import { formatThaiDate, getLeaveTypeName, Alert, formatCurrency } from '../../utils/helpers';

interface EmployeeRequestsPageProps {
  onNavigate?: (tab: string) => void;
  initialTab?: 'leave' | 'payroll';
}

export const EmployeeRequestsPage: React.FC<EmployeeRequestsPageProps> = ({
  initialTab = 'leave',
}) => {
  const { currentEmployee, currentUser } = useAuth();
  const {
    requests,
    submitLeaveRequest,
    submitOTRequest,
    payrollCycles,
  } = useHR();

  // Active sub-tab: 'leave' vs 'payroll'
  const [activeTab, setActiveTab] = useState<'leave' | 'payroll'>(initialTab);

  const todayDateStr = new Date().toISOString().split('T')[0];

  // Leave Form State
  const [leaveType, setLeaveType] = useState<LeaveType>('ANNUAL');
  const [startDate, setStartDate] = useState<string>(todayDateStr);
  const [endDate, setEndDate] = useState<string>(todayDateStr);
  const [leaveReason, setLeaveReason] = useState<string>('');

  // OT Request Modal
  const [showOTModal, setShowOTModal] = useState(false);
  const [otStartDate, setOtStartDate] = useState(`${todayDateStr} 17:00`);
  const [otEndDate, setOtEndDate] = useState(`${todayDateStr} 20:00`);
  const [otHours, setOtHours] = useState(3);
  const [otMultiplier, setOtMultiplier] = useState(1.5);
  const [otReason, setOtReason] = useState('');

  // Selected slip for PDF preview modal
  const [selectedSlip, setSelectedSlip] = useState<{
    id: string;
    month: string;
    payDate: string;
    totalEarnings: number;
    totalDeductions: number;
    netPay: number;
    baseSalary: number;
    allowance: number;
    ot: number;
    socialSecurity: number;
    tax: number;
    studentLoan?: number;
    employeeName?: string;
    positionName?: string;
  } | null>(null);

  // Employee display name derived strictly from authenticated user / employee
  const employeeDisplayName = currentEmployee
    ? `${currentEmployee.firstName} ${currentEmployee.lastName}`
    : (currentUser?.username ? `บัญชี ${currentUser.username}` : 'พนักงาน');

  const employeePositionName = currentEmployee?.positionName || 'พนักงาน';

  // Leave Quotas (Real data from current employee, defaults to 0 if not yet set)
  const quotas = currentEmployee?.leaveQuotas;
  const annualRemaining = quotas?.ANNUAL?.remainingDays ?? 0;
  const annualTotal = quotas?.ANNUAL?.entitledDays ?? 0;
  const sickRemaining = quotas?.SICK?.remainingDays ?? 0;
  const sickTotal = quotas?.SICK?.entitledDays ?? 0;
  const personalRemaining = quotas?.PERSONAL?.remainingDays ?? 0;
  const personalTotal = quotas?.PERSONAL?.entitledDays ?? 0;

  // Real requests belonging strictly to this employee
  const employeeRequests = currentEmployee
    ? requests.filter(r => r.employeeId === currentEmployee.id)
    : [];

  const pendingRequestsCount = employeeRequests.filter(r => r.status === 'PENDING').length;

  // Real payslips derived strictly from actual PAID payroll cycles in HRContext
  const paidCycles = payrollCycles.filter(c => c.status === 'PAID');
  const realPayslips = paidCycles.flatMap(cycle => {
    const snaps = currentEmployee
      ? cycle.snapshots.filter(s => s.employeeId === currentEmployee.id)
      : cycle.snapshots;

    return snaps.map(snp => ({
      id: `${cycle.id}-${snp.id}`,
      month: cycle.name,
      payDate: formatThaiDate(cycle.paymentDate),
      totalEarnings: snp.totalGrossIncome,
      totalDeductions: snp.totalDeductions,
      netPay: snp.netPay,
      baseSalary: snp.baseSalary,
      allowance: snp.positionAllowance,
      ot: snp.otPay,
      socialSecurity: snp.socialSecurity,
      tax: snp.withholdingTax,
      studentLoan: snp.studentLoanDeduction,
      employeeName: snp.employeeName,
      positionName: snp.positionName,
    }));
  });

  // Handle Leave Form Submit
  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!leaveReason.trim()) {
      Alert.warning('กรุณาระบุเหตุผล', 'กรุณาระบุเหตุผลการขอลาก่อนส่งคำขอ');
      return;
    }

    if (!currentEmployee) {
      Alert.warning('ไม่มีข้อมูลพนักงาน', 'กรุณาเพิ่มหรือผูกข้อมูลพนักงานในระบบก่อนยื่นคำขอลา');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const res = submitLeaveRequest({
      employeeId: currentEmployee.id,
      leaveType,
      isHalfDay: false,
      startDate,
      endDate,
      daysCount: days,
      reason: leaveReason,
    });

    if (res.success) {
      Alert.success('ส่งคำขอลาสำเร็จ!', 'ระบบส่งคำขอลาไปยังหัวหน้าแผนกเพื่อพิจารณาอนุมัติเรียบร้อยแล้ว');
      setLeaveReason('');
      setStartDate(todayDateStr);
      setEndDate(todayDateStr);
    } else {
      Alert.error('ไม่สามารถส่งคำขอได้', res.message);
    }
  };

  // Handle OT Submit
  const handleOTSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee) {
      Alert.warning('ไม่มีข้อมูลพนักงาน', 'กรุณาเพิ่มหรือผูกข้อมูลพนักงานในระบบก่อนยื่นคำขอ OT');
      return;
    }
    if (!otReason.trim()) {
      Alert.warning('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุเหตุผลการขอทำ OT');
      return;
    }

    const res = submitOTRequest({
      employeeId: currentEmployee.id,
      startDate: otStartDate,
      endDate: otEndDate,
      otHours,
      otMultiplier,
      reason: otReason,
    });

    if (res.success) {
      Alert.success('ยื่นคำขอ OT สำเร็จ', res.message);
      setShowOTModal(false);
      setOtReason('');
    } else {
      Alert.error('ไม่สามารถส่งคำขอได้', res.message);
    }
  };

  const handleResetForm = () => {
    setLeaveReason('');
    setStartDate(todayDateStr);
    setEndDate(todayDateStr);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation Switcher: Leave Request vs e-Slip in one single page */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 mb-6 gap-3">
        <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('leave')}
            className={`pb-3 text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'leave'
                ? 'font-semibold border-b-2 border-indigo-600 text-indigo-600'
                : 'font-medium text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className="fa-regular fa-calendar-check text-base"></i>
            <span>ระบบยื่นคำขอลา (Leave Request)</span>
          </button>

          <button
            onClick={() => setActiveTab('payroll')}
            className={`pb-3 text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'payroll'
                ? 'font-semibold border-b-2 border-indigo-600 text-indigo-600'
                : 'font-medium text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className="fa-solid fa-file-invoice-dollar text-base"></i>
            <span>สลิปเงินเดือนของฉัน (e-Slip)</span>
          </button>
        </div>

        <div className="pb-2">
          <button
            onClick={() => setShowOTModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-business-time text-amber-600"></i>
            <span>ขอทำ OT</span>
          </button>
        </div>
      </div>

      {/* ==============================================================
          VIEW 1: LEAVE REQUEST MODULE
         ============================================================== */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          {/* Leave Quota Summary Cards (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: พักร้อน */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500">วันลาพักร้อนคงเหลือ</span>
              <div className="text-2xl font-bold text-indigo-600 mt-1">
                {annualRemaining}{' '}
                <span className="text-xs text-slate-400 font-normal">/ {annualTotal} วัน</span>
              </div>
            </div>

            {/* Card 2: ลาป่วย */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500">วันลาป่วยคงเหลือ</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {sickRemaining}{' '}
                <span className="text-xs text-slate-400 font-normal">/ {sickTotal} วัน</span>
              </div>
            </div>

            {/* Card 3: ลากิจ */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500">วันลากิจคงเหลือ</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {personalRemaining}{' '}
                <span className="text-xs text-slate-400 font-normal">/ {personalTotal} วัน</span>
              </div>
            </div>

            {/* Card 4: คำขอรออนุมัติ */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500">คำขอรออนุมัติ</span>
              <div className="text-2xl font-bold text-slate-700 mt-1">
                {pendingRequestsCount}{' '}
                <span className="text-xs text-slate-400 font-normal">รายการ</span>
              </div>
            </div>
          </div>

          {/* Leave Form Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl">
            <h3 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>แบบฟอร์มยื่นคำขอลาออนไลน์</span>
            </h3>

            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ประเภทการลา <span className="text-red-500">*</span>
                </label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value as LeaveType)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="ANNUAL">ลาพักร้อน (Annual Leave)</option>
                  <option value="SICK">ลาป่วย (Sick Leave)</option>
                  <option value="PERSONAL">ลากิจ (Personal Leave)</option>
                  <option value="MILITARY">ลาไม่รับค่าจ้าง (Leave Without Pay)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ตั้งแต่วันที่ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ถึงวันที่ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  เหตุผลการลา <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={leaveReason}
                  onChange={e => setLeaveReason(e.target.value)}
                  placeholder="ระบุเหตุผลการลา..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors font-medium cursor-pointer"
                >
                  ส่งคำขออนุมัติ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          VIEW 2: PAYROLL E-SLIP MODULE
         ============================================================== */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  ประวัติสลิปเงินเดือน (e-Slip)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  เอกสาร PDF เข้ารหัสความปลอดภัยด้วยวันเดือนปีเกิด (ววดดปปปป)
                </p>
              </div>

              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                สถานะ: รอบปกติ
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">รอบงวดเดือน</th>
                    <th className="py-3 px-4">วันที่จ่าย</th>
                    <th className="py-3 px-4 text-right">รายได้รวม</th>
                    <th className="py-3 px-4 text-right">รายการหักรวม</th>
                    <th className="py-3 px-4 text-right">ยอดรับสุทธิ (Net Pay)</th>
                    <th className="py-3 px-4 text-center">ดาวน์โหลด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {realPayslips.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-xl">
                            <i className="fa-regular fa-folder-open"></i>
                          </div>
                          <span className="font-bold text-slate-700 text-sm">ยังไม่มีประวัติสลิปเงินเดือนในระบบ</span>
                          <span className="text-slate-400 text-xs">รอบเงินเดือนจะปรากฏที่นี่เมื่อฝ่ายบุคคลจัดทำรอบและบันทึกจ่ายแล้ว</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    realPayslips.map((slip) => (
                      <tr key={slip.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {slip.month}
                        </td>
                        <td className="py-3.5 px-4">
                          {slip.payDate}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-700 font-mono">
                          {formatCurrency(slip.totalEarnings)} ฿
                        </td>
                        <td className="py-3.5 px-4 text-right text-rose-600 font-mono">
                          -{formatCurrency(slip.totalDeductions)} ฿
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600 font-mono">
                          {formatCurrency(slip.netPay)} ฿
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setSelectedSlip(slip)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <i className="fa-regular fa-file-pdf"></i>
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* OT Request Modal */}
      {showOTModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-business-time text-amber-600"></i>
                <span>แบบฟอร์มขอทำงานล่วงเวลา (OT)</span>
              </h3>
              <button
                onClick={() => setShowOTModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleOTSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ช่วงเวลาเริ่ม OT:
                </label>
                <input
                  type="text"
                  value={otStartDate}
                  onChange={e => setOtStartDate(e.target.value)}
                  placeholder="2026-10-16 17:00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ช่วงเวลาสิ้นสุด OT:
                </label>
                <input
                  type="text"
                  value={otEndDate}
                  onChange={e => setOtEndDate(e.target.value)}
                  placeholder="2026-10-16 20:00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    จำนวนชั่วโมง:
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={otHours}
                    onChange={e => setOtHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    อัตราคูณ OT:
                  </label>
                  <select
                    value={otMultiplier}
                    onChange={e => setOtMultiplier(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value={1.5}>1.5 เท่า (วันธรรมดา)</option>
                    <option value={2}>2.0 เท่า (วันหยุด)</option>
                    <option value={3}>3.0 เท่า (วันหยุดพิเศษ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เหตุผลความจำเป็น:
                </label>
                <textarea
                  rows={2}
                  value={otReason}
                  onChange={e => setOtReason(e.target.value)}
                  placeholder="ระบุเหตุผล เช่น ฝึกสอนขับรถรอบพิเศษ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOTModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700"
                >
                  ส่งคำขอ OT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Preview & Print Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-300 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-sm">
                  VN
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">สลิปเงินเดือนอิเล็กทรอนิกส์ (e-Slip)</h3>
                  <span className="text-[11px] text-slate-500">รหัสผ่านสำหรับเปิดไฟล์: วันเดือนปีเกิด (ววดดปปปป) เช่น 15052538</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSlip(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* Official Slip Content */}
            <div className="border border-slate-300 rounded-xl p-5 space-y-4 bg-slate-50/30 text-xs text-slate-800 font-sans">
              <div className="text-center border-b pb-3 border-slate-200">
                <h4 className="font-black text-sm text-[#022247]">บริษัท วีเอ็น กรุ๊ป (โรงเรียนสอนขับรถวีเอ็น)</h4>
                <p className="text-[11px] text-slate-500">สาขาเมืองกำแพงเพชร และ สาขาท่ามะเขือ</p>
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded font-bold text-xs mt-2 border border-indigo-200">
                  ใบแจ้งยอดเงินเดือนประจำงวด {selectedSlip.month}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <p><span className="text-slate-500">ชื่อพนักงาน:</span> <strong>{selectedSlip.employeeName || employeeDisplayName}</strong></p>
                  <p className="mt-1"><span className="text-slate-500">ตำแหน่ง:</span> {selectedSlip.positionName || employeePositionName}</p>
                </div>
                <div className="text-right">
                  <p><span className="text-slate-500">วันที่จ่าย:</span> <strong>{selectedSlip.payDate}</strong></p>
                  <p className="mt-1"><span className="text-slate-500">สถานะ:</span> <span className="text-emerald-700 font-bold">ชำระแล้ว</span></p>
                </div>
              </div>

              {/* Earnings & Deductions Breakdowns */}
              <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg overflow-hidden bg-white">
                <div className="border-r border-slate-300 p-3 space-y-2">
                  <div className="font-bold text-slate-800 pb-1 border-b border-slate-200">
                    รายการรายรับ (Earnings)
                  </div>
                  <div className="flex justify-between">
                    <span>เงินเดือนประจำ</span>
                    <span className="font-mono">{formatCurrency(selectedSlip.baseSalary)} ฿</span>
                  </div>
                  <div className="flex justify-between">
                    <span>เงินประจำตำแหน่ง</span>
                    <span className="font-mono">{formatCurrency(selectedSlip.allowance)} ฿</span>
                  </div>
                  {selectedSlip.ot > 0 && (
                    <div className="flex justify-between">
                      <span>ค่าล่วงเวลา (OT)</span>
                      <span className="font-mono">{formatCurrency(selectedSlip.ot)} ฿</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-bold text-indigo-700">
                    <span>รวมรายได้</span>
                    <span className="font-mono">{formatCurrency(selectedSlip.totalEarnings)} ฿</span>
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <div className="font-bold text-slate-800 pb-1 border-b border-slate-200">
                    รายการหัก (Deductions)
                  </div>
                  <div className="flex justify-between">
                    <span>ประกันสังคม</span>
                    <span className="font-mono text-rose-600">-{formatCurrency(selectedSlip.socialSecurity)} ฿</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ภาษีหัก ณ ที่จ่าย</span>
                    <span className="font-mono text-rose-600">-{formatCurrency(selectedSlip.tax)} ฿</span>
                  </div>
                  {Boolean(selectedSlip.studentLoan) && (
                    <div className="flex justify-between">
                      <span>เงินกู้ กยศ.</span>
                      <span className="font-mono text-rose-600">-{formatCurrency(selectedSlip.studentLoan || 0)} ฿</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-bold text-rose-700">
                    <span>รวมรายการหัก</span>
                    <span className="font-mono">-{formatCurrency(selectedSlip.totalDeductions)} ฿</span>
                  </div>
                </div>
              </div>

              {/* Net Pay Callout */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">ยอดเงินโอนสุทธิเข้าบัญชี (Net Pay)</span>
                  <span className="text-[11px] text-emerald-700">โอนเข้าบัญชีเงินเดือนพนักงาน</span>
                </div>
                <div className="text-xl font-black text-emerald-700 font-mono">
                  {formatCurrency(selectedSlip.netPay)} ฿
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedSlip(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <i className="fa-solid fa-print"></i>
                <span>พิมพ์สลิปเงินเดือน / บันทึก PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
