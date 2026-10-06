import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHR } from '../../context/HRContext';
import { formatCurrency, formatThaiDate } from '../../utils/helpers';
import { EmployeePayrollSnapshot, PayrollCycle } from '../../types';

export const EmployeePayslipView: React.FC = () => {
  const { currentEmployee } = useAuth();
  const { payrollCycles, companies } = useHR();

  // Find all payslip snapshots belonging to currentEmployee in cycles that are PAID
  const paidCycles = payrollCycles.filter(c => c.status === 'PAID');

  const mySnapshotsWithCycle: { snapshot: EmployeePayrollSnapshot; cycle: PayrollCycle }[] = [];
  paidCycles.forEach(cycle => {
    const snp = cycle.snapshots.find(s => s.employeeId === currentEmployee?.id);
    if (snp) {
      mySnapshotsWithCycle.push({ snapshot: snp, cycle });
    }
  });

  const [selectedItem, setSelectedItem] = useState<{
    snapshot: EmployeePayrollSnapshot;
    cycle: PayrollCycle;
  } | null>(mySnapshotsWithCycle[0] || null);

  const handlePrint = () => {
    window.print();
  };

  if (!currentEmployee) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#022247] flex items-center gap-2">
            <i className="fa-solid fa-receipt text-[#064a8b]"></i>
            สลิปเงินเดือนของฉัน (My Payslips)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ตรวจสอบยอดรายรับ รายการหัก ประกันสังคม ภาษี และพิมพ์สลิปเงินเดือนอย่างเป็นทางการ
          </p>
        </div>

        {selectedItem && (
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white shadow-sm transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-print"></i>
            พิมพ์สลิปเงินเดือน (Print)
          </button>
        )}
      </div>

      {mySnapshotsWithCycle.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Cycle Selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
              เลือกรอบเงินเดือนที่จ่ายแล้ว
            </h3>
            <div className="space-y-2">
              {mySnapshotsWithCycle.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedItem?.cycle.id === item.cycle.id
                      ? 'border-[#064a8b] bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{item.cycle.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                      จ่ายแล้ว
                    </span>
                  </div>
                  <p className="text-[11px] text-[#064a8b] font-black mt-1">
                    ยอดสุทธิ: {formatCurrency(item.snapshot.netPay)} บาท
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    วันที่จ่าย: {formatThaiDate(item.cycle.paymentDate)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Printable Payslip Card */}
          {selectedItem && (
            <div className="lg:col-span-2">
              <div className="payslip-container p-6 bg-white border border-slate-300 rounded-2xl shadow-sm text-xs text-slate-800 space-y-4 font-sans">
                {/* Header */}
                <div className="text-center border-b-2 border-[#022247] pb-3">
                  <h2 className="text-base font-black text-[#022247]">
                    บริษัท วีเอ็น กรุ๊ป (โรงเรียนสอนขับรถวีเอ็น)
                  </h2>
                  <p className="text-[11px] text-slate-600">
                    {companies.find(c => c.id === currentEmployee.companyId)?.address} • โทร. 055-711-889
                  </p>
                  <h3 className="text-sm font-bold text-slate-900 mt-2 bg-slate-100 py-1 rounded">
                    ใบจ่ายเงินเดือนและค่าจ้าง (PAYSLIP)
                  </h3>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <p><span className="text-slate-500">รหัสพนักงาน:</span> <strong>{selectedItem.snapshot.employeeCode}</strong></p>
                    <p className="mt-1"><span className="text-slate-500">ชื่อ-นามสกุล:</span> <strong>{selectedItem.snapshot.employeeName}</strong></p>
                    <p className="mt-1"><span className="text-slate-500">ตำแหน่ง:</span> {selectedItem.snapshot.positionName}</p>
                  </div>
                  <div className="text-right">
                    <p><span className="text-slate-500">งวดการจ่าย:</span> <strong>{selectedItem.cycle.name}</strong></p>
                    <p className="mt-1"><span className="text-slate-500">แผนก:</span> {selectedItem.snapshot.departmentName}</p>
                    <p className="mt-1"><span className="text-slate-500">วันที่จ่าย:</span> {formatThaiDate(selectedItem.cycle.paymentDate)}</p>
                  </div>
                </div>

                {/* Earnings & Deductions */}
                <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg overflow-hidden">
                  <div className="border-r border-slate-300">
                    <div className="bg-slate-100 p-2 font-bold text-center border-b border-slate-300 text-slate-800">
                      รายการรายรับ (Earnings)
                    </div>
                    <div className="p-3 space-y-2">
                      {selectedItem.snapshot.itemizedEarnings.map(item => (
                        <div key={item.id} className="flex justify-between">
                          <span className="text-slate-700">{item.name}</span>
                          <span className="font-bold">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="bg-slate-100 p-2 font-bold text-center border-b border-slate-300 text-slate-800">
                      รายการรายจ่าย / หัก (Deductions)
                    </div>
                    <div className="p-3 space-y-2">
                      {selectedItem.snapshot.itemizedDeductions.map(item => (
                        <div key={item.id} className="flex justify-between">
                          <span className="text-slate-700">{item.name}</span>
                          <span className="font-bold text-rose-700">-{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subtotals */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-300 pt-3 text-xs">
                  <div className="flex justify-between font-bold">
                    <span>รวมรายรับ (Gross):</span>
                    <span>{formatCurrency(selectedItem.snapshot.totalGrossIncome)} บาท</span>
                  </div>
                  <div className="flex justify-between font-bold text-rose-700">
                    <span>รวมรายการหัก:</span>
                    <span>-{formatCurrency(selectedItem.snapshot.totalDeductions)} บาท</span>
                  </div>
                </div>

                {/* Net Pay */}
                <div className="p-3.5 bg-emerald-50 border-2 border-emerald-500 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">เงินได้สุทธิ (Net Payment):</span>
                    <span className="text-[10px] text-slate-500">โอนเข้าบัญชีธนาคาร</span>
                  </div>
                  <span className="text-xl font-black text-emerald-800">
                    {formatCurrency(selectedItem.snapshot.netPay)} บาท
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
          <i className="fa-solid fa-receipt text-4xl mb-3 text-slate-300"></i>
          <p className="text-sm font-semibold">ยังไม่มีสลิปเงินเดือนที่เผยแพร่ในรอบปัจจุบัน</p>
          <p className="text-xs text-slate-400 mt-1">สลิปเงินเดือนจะแสดงเมื่อฝ่ายบุคคลและผู้บริหารอนุมัติและบันทึกจ่ายเงินเรียบร้อย</p>
        </div>
      )}
    </div>
  );
};
