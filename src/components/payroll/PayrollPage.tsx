import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHR } from '../../context/HRContext';
import { DataTable, Column } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { PayrollCycle, EmployeePayrollSnapshot } from '../../types';
import { formatCurrency, formatThaiDate, getStatusBadge, Alert } from '../../utils/helpers';

export const PayrollPage: React.FC = () => {
  const { role, currentEmployee } = useAuth();
  const {
    payrollCycles,
    createPayrollCycle,
    calculatePayrollCycle,
    approvePayrollCycle,
    payPayrollCycle,
    cancelPayrollCycle,
    companies,
    selectedCompanyId,
  } = useHR();

  // Selected Cycle for Viewing Detail / Breakdown
  const [selectedCycle, setSelectedCycle] = useState<PayrollCycle | null>(payrollCycles[0] || null);

  // Selected Payslip for Printing / Detailed View Modal
  const [selectedPayslip, setSelectedPayslip] = useState<EmployeePayrollSnapshot | null>(null);

  // Create Cycle Modal
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
    Alert.success('คำนวณเงินเดือนเรียบร้อย', 'ดึงข้อมูลเงินเดือน เบี้ยขยัน ขาด/สาย และค่าล่วงเวลา (OT) ที่อนุมัติมาคำนวณและบันทึก Snapshot แล้ว');
    // update view
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

  const handlePrint = () => {
    window.print();
  };

  // Snapshot Columns for DataTable in current cycle
  const snapshotColumns: Column<EmployeePayrollSnapshot>[] = [
    {
      key: 'employeeCode',
      header: 'รหัส / ชื่อพนักงาน',
      render: (s) => (
        <div>
          <button
            onClick={() => setSelectedPayslip(s)}
            className="font-bold text-[#064a8b] hover:underline flex items-center gap-1"
          >
            <span>{s.employeeName}</span>
            <i className="fa-solid fa-receipt text-xs"></i>
          </button>
          <span className="text-[11px] text-slate-500">{s.employeeCode} • {s.departmentName}</span>
        </div>
      ),
    },
    {
      key: 'baseSalary',
      header: 'เงินเดือนฐาน',
      align: 'right',
      render: (s) => <span className="font-semibold text-slate-700">{formatCurrency(s.baseSalary)}</span>,
    },
    {
      key: 'attendanceBonus',
      header: 'เบี้ยขยัน',
      align: 'right',
      render: (s) => (
        <span className={s.attendanceBonus > 0 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
          {formatCurrency(s.attendanceBonus)}
        </span>
      ),
    },
    {
      key: 'otPay',
      header: 'ค่าล่วงเวลา (OT)',
      align: 'right',
      render: (s) => (
        <span className={s.otPay > 0 ? 'text-[#064a8b] font-bold' : 'text-slate-400'}>
          {formatCurrency(s.otPay)}
        </span>
      ),
    },
    {
      key: 'totalGrossIncome',
      header: 'รวมรายได้ (Gross)',
      align: 'right',
      render: (s) => <span className="font-black text-slate-800">{formatCurrency(s.totalGrossIncome)}</span>,
    },
    {
      key: 'socialSecurity',
      header: 'ประกันสังคม',
      align: 'right',
      render: (s) => <span className="text-slate-600">-{formatCurrency(s.socialSecurity)}</span>,
    },
    {
      key: 'withholdingTax',
      header: 'ภาษีหัก ณ ที่จ่าย',
      align: 'right',
      render: (s) => <span className="text-slate-600">-{formatCurrency(s.withholdingTax)}</span>,
    },
    {
      key: 'netPay',
      header: 'สุทธิ (Net Pay)',
      align: 'right',
      render: (s) => (
        <span className="font-black text-emerald-700 text-sm bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {formatCurrency(s.netPay)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'สลิป',
      align: 'center',
      render: (s) => (
        <button
          onClick={() => setSelectedPayslip(s)}
          className="px-2.5 py-1 bg-[#064a8b] text-white hover:bg-[#022247] rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
          title="ดูและพิมพ์สลิปเงินเดือน"
        >
          <i className="fa-solid fa-print text-[10px]"></i>
          <span>สลิป</span>
        </button>
      ),
    },
  ];

  // Custom Card Renderer for Payroll Snapshots
  const renderPayrollCard = (s: EmployeePayrollSnapshot) => {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-[#064a8b] transition-all flex flex-col justify-between group">
        <div>
          {/* Card Top: Employee Info & Net Pay Badge */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#022247] to-[#064a8b] text-[#c3a138] font-black text-base flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
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
                ยอดสุทธิ (Net)
              </span>
              <span className="font-black text-emerald-700 text-sm bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 inline-block mt-0.5">
                {formatCurrency(s.netPay)} บ.
              </span>
            </div>
          </div>

          {/* Earnings & Deductions Details Box */}
          <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3 space-y-2 text-xs">
            {/* Earnings Row */}
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
                  <span className="text-[11px]">เบี้ยขยัน (ไม่ขาด/สาย):</span>
                  <span className="font-bold">+{formatCurrency(s.attendanceBonus)} บ.</span>
                </div>
              )}
              {s.otPay > 0 && (
                <div className="flex justify-between text-[#064a8b]">
                  <span className="text-[11px]">ค่าล่วงเวลา ({s.otHours} ชม.):</span>
                  <span className="font-bold">+{formatCurrency(s.otPay)} บ.</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-200/40">
                <span>รวมรายรับ (Gross):</span>
                <span>{formatCurrency(s.totalGrossIncome)} บ.</span>
              </div>
            </div>

            {/* Deductions Row */}
            <div className="space-y-1 pt-0.5">
              <div className="flex justify-between text-rose-600 text-[11px]">
                <span>เงินสมทบประกันสังคม:</span>
                <span>-{formatCurrency(s.socialSecurity)} บ.</span>
              </div>
              {s.withholdingTax > 0 && (
                <div className="flex justify-between text-rose-600 text-[11px]">
                  <span>ภาษีหัก ณ ที่จ่าย:</span>
                  <span>-{formatCurrency(s.withholdingTax)} บ.</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-rose-700 text-xs pt-1 border-t border-slate-200/40">
                <span>รวมรายการหัก:</span>
                <span>-{formatCurrency(s.totalDeductions)} บ.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-100 mt-3">
          <button
            onClick={() => setSelectedPayslip(s)}
            className="w-full py-2 px-3 rounded-xl bg-[#064a8b] hover:bg-[#022247] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <i className="fa-solid fa-print"></i>
            <span>ดูและพิมพ์สลิปเงินเดือน (Payslip)</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Simulation Disclaimer */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#022247] flex items-center gap-2">
              <i className="fa-solid fa-money-check-dollar text-[#064a8b]"></i>
              ระบบบริหารเงินเดือนและสลิป (Payroll System)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              ค่าจำลอง (Demo Formula)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            คำนวณเงินเดือนฐาน ค่าล่วงเวลาที่อนุมัติ เบี้ยขยัน ประกันสังคม (สูงสุด 750 บ.) ภาษี และสร้างสลิปเงินเดือน Snapshot
          </p>
        </div>

        {(role === 'SUPER_ADMIN' || role === 'HR_MANAGER') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <i className="fa-solid fa-plus text-[#c3a138]"></i>
            สร้างรอบเงินเดือนใหม่
          </button>
        )}
      </div>

      {/* Legal & System Simulation Notice */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-[#064a8b] flex items-start gap-2.5">
        <i className="fa-solid fa-circle-info text-base shrink-0 mt-0.5"></i>
        <div>
          <span className="font-bold">หมายเหตุการประมวลผล:</span> การคำนวณภาษีหัก ณ ที่จ่ายและประกันสังคมในระบบนี้เป็นค่าจำลองเพื่อสาธิตการทำงานของโปรโตไทป์ ยังไม่ใช่เครื่องคำนวณเพื่อยื่นภาษีจริงต่อกรมสรรพากร และไม่มีการเชื่อมต่อ API การโอนเงินธนาคารจริง
        </div>
      </div>

      {/* Cycle Selector & Cycle Status Ribbon */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
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

              {/* Action buttons based on status */}
              {(role === 'SUPER_ADMIN' || role === 'HR_MANAGER') && (
                <>
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
                      ตรวจสอบ & อนุมัติรอบ
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
                </>
              )}
            </div>
          )}
        </div>

        {/* Cycle Summary Metrics Cards */}
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

      {/* Snapshots Table */}
      {selectedCycle && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-users-viewfinder text-[#064a8b]"></i>
              รายละเอียดเงินเดือนรายบุคคล (Snapshot: {selectedCycle.snapshots.length} คน)
            </h3>
            {selectedCycle.status === 'DRAFT' && (
              <span className="text-xs text-amber-600 font-bold">
                ⚠️ กดปุ่ม "คำนวณเงินเดือน" เพื่อประมวลผลข้อมูล
              </span>
            )}
          </div>

          <DataTable
            columns={snapshotColumns}
            data={selectedCycle.snapshots}
            searchPlaceholder="ค้นหาชื่อพนักงานในรอบเงินเดือน..."
            emptyText="ยังไม่ได้ทำการคำนวณรอบเงินเดือนนี้ กรุณากดปุ่ม 'คำนวณเงินเดือน' ด้านบน"
            renderCard={renderPayrollCard}
            defaultViewMode="card"
          />
        </div>
      )}

      {/* Modal: Create Payroll Cycle */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="สร้างรอบการจ่ายเงินเดือนใหม่"
        subtitle="กำหนดงวดเดือนและสาขาที่ต้องการประมวลผล"
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
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] text-white hover:bg-[#022247]"
            >
              สร้างรอบ
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ชื่อรอบเงินเดือน: *</label>
            <input
              type="text"
              value={cycleName}
              onChange={e => setCycleName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ประจำเดือน: *</label>
              <select
                value={cycleMonth}
                onChange={e => setCycleMonth(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    เดือนที่ {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">ปี (พ.ศ.): *</label>
              <input
                type="number"
                value={cycleYear}
                onChange={e => setCycleYear(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                required
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">สาขาที่ประมวลผล: *</label>
            <select
              value={cycleCompId}
              onChange={e => setCycleCompId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="ALL">ทุกสาขา (ภาพรวมทั้งเครือ)</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Modal: Printable Official Thai Payslip */}
      {selectedPayslip && (
        <Modal
          isOpen={Boolean(selectedPayslip)}
          onClose={() => setSelectedPayslip(null)}
          title={`ใบแจ้งยอดเงินเดือน (Payslip) - ${selectedPayslip.employeeName}`}
          subtitle={`รหัส: ${selectedPayslip.employeeCode} • ${selectedCycle?.name}`}
          size="2xl"
          footer={
            <div className="w-full flex items-center justify-between no-print">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-[#064a8b] text-white rounded-xl text-xs font-bold hover:bg-[#022247] shadow-sm flex items-center gap-1.5"
              >
                <i className="fa-solid fa-print"></i> พิมพ์สลิปเงินเดือน (Print)
              </button>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          }
        >
          {/* Printable Payslip Layout */}
          <div className="payslip-container p-6 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 space-y-4 font-sans">
            {/* Header */}
            <div className="text-center border-b-2 border-[#022247] pb-3">
              <h2 className="text-base font-black text-[#022247]">
                บริษัท วีเอ็น กรุ๊ป (โรงเรียนสอนขับรถวีเอ็น)
              </h2>
              <p className="text-[11px] text-slate-600">
                128 หมู่ 6 ต.สระแก้ว อ.เมืองกำแพงเพชร จ.กำแพงเพชร • โทร. 055-711-889
              </p>
              <h3 className="text-sm font-bold text-slate-900 mt-2 bg-slate-100 py-1 rounded">
                ใบจ่ายเงินเดือนและค่าจ้าง (PAYSLIP)
              </h3>
            </div>

            {/* Employee Meta Details */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <p><span className="text-slate-500">รหัสพนักงาน:</span> <strong>{selectedPayslip.employeeCode}</strong></p>
                <p className="mt-1"><span className="text-slate-500">ชื่อ-นามสกุล:</span> <strong>{selectedPayslip.employeeName}</strong></p>
                <p className="mt-1"><span className="text-slate-500">ตำแหน่ง:</span> {selectedPayslip.positionName}</p>
              </div>
              <div className="text-right">
                <p><span className="text-slate-500">งวดการจ่าย:</span> <strong>{selectedCycle?.name}</strong></p>
                <p className="mt-1"><span className="text-slate-500">แผนก:</span> {selectedPayslip.departmentName}</p>
                <p className="mt-1"><span className="text-slate-500">วันที่จ่าย:</span> {selectedCycle?.paymentDate ? formatThaiDate(selectedCycle.paymentDate) : 'สิ้นเดือน'}</p>
              </div>
            </div>

            {/* Income & Deduction Table */}
            <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg overflow-hidden">
              {/* Left: Earnings */}
              <div className="border-r border-slate-300">
                <div className="bg-slate-100 p-2 font-bold text-center border-b border-slate-300 text-slate-800">
                  รายการรายรับ (Earnings)
                </div>
                <div className="p-3 space-y-2">
                  {selectedPayslip.itemizedEarnings.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-slate-700">{item.name}</span>
                      <span className="font-bold">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Deductions */}
              <div>
                <div className="bg-slate-100 p-2 font-bold text-center border-b border-slate-300 text-slate-800">
                  รายการรายจ่าย / หัก (Deductions)
                </div>
                <div className="p-3 space-y-2">
                  {selectedPayslip.itemizedDeductions.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-slate-700">{item.name}</span>
                      <span className="font-bold text-rose-700">-{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary Totals */}
            <div className="grid grid-cols-2 gap-4 border-t border-slate-300 pt-3 text-xs">
              <div className="flex justify-between font-bold">
                <span>รวมรายรับทั้งหมด (Gross):</span>
                <span>{formatCurrency(selectedPayslip.totalGrossIncome)} บาท</span>
              </div>
              <div className="flex justify-between font-bold text-rose-700">
                <span>รวมรายการหักทั้งหมด:</span>
                <span>-{formatCurrency(selectedPayslip.totalDeductions)} บาท</span>
              </div>
            </div>

            {/* Net Amount Box */}
            <div className="p-3.5 bg-emerald-50 border-2 border-emerald-500 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block text-xs">เงินได้สุทธิ (Net Payment):</span>
                <span className="text-[10px] text-slate-500">โอนเข้าบัญชีธนาคารพนักงาน</span>
              </div>
              <span className="text-xl font-black text-emerald-800">
                {formatCurrency(selectedPayslip.netPay)} บาท
              </span>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 text-center text-[11px] text-slate-600">
              <div>
                <div className="border-b border-slate-400 w-40 mx-auto pb-6"></div>
                <p className="mt-1.5 font-bold">ผู้อนุมัติจ่าย / ฝ่ายการเงิน</p>
              </div>
              <div>
                <div className="border-b border-slate-400 w-40 mx-auto pb-6"></div>
                <p className="mt-1.5 font-bold">พนักงานผู้รับเงิน</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
