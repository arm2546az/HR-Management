import React, { useState } from 'react';
import { useHR } from '../../context/HRContext';
import { DataTable, Column } from '../common/DataTable';
import { formatThaiDate, formatCurrency, getLeaveTypeName, getStatusBadge, Alert } from '../../utils/helpers';

export const ReportsPage: React.FC = () => {
  const {
    employees,
    requests,
    attendance,
    payrollCycles,
    companies,
    departments,
    exportToCsv,
    selectedCompanyId,
  } = useHR();

  // Active Report Tab:
  // 1: 'EMP_STATUS' (จำนวนและสถานะพนักงาน)
  // 2: 'LEAVE_BAL' (วันลาคงเหลือ)
  // 3: 'ATTENDANCE_SUMMARY' (เวลาเข้า-ออก และสรุปสาย)
  // 4: 'APPROVED_OT' (OT ที่อนุมัติ)
  // 5: 'PAYROLL_REPORT' (เงินเดือนตามรอบ)
  const [reportType, setReportType] = useState<
    'EMP_STATUS' | 'LEAVE_BAL' | 'ATTENDANCE_SUMMARY' | 'APPROVED_OT' | 'PAYROLL_REPORT'
  >('EMP_STATUS');

  // Filter employees
  const filteredEmployees = employees.filter(e => {
    if (selectedCompanyId !== 'ALL' && e.companyId !== selectedCompanyId) return false;
    return true;
  });

  // Report 1: Employees Status
  const empStatusColumns: Column<any>[] = [
    { key: 'employeeCode', header: 'รหัสพนักงาน' },
    { key: 'name', header: 'ชื่อ - นามสกุล', render: r => `${r.firstName} ${r.lastName}` },
    { key: 'company', header: 'สาขา', render: r => companies.find(c => c.id === r.companyId)?.shortName || '-' },
    { key: 'department', header: 'แผนก', render: r => departments.find(d => d.id === r.departmentId)?.name || '-' },
    { key: 'positionName', header: 'ตำแหน่ง' },
    {
      key: 'employmentStatus',
      header: 'สถานะ',
      render: r => {
        const badge = getStatusBadge(r.employmentStatus);
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badge.bgClass} ${badge.textClass}`}>{badge.label}</span>;
      },
    },
    { key: 'hireDate', header: 'วันเริ่มงาน', render: r => formatThaiDate(r.hireDate) },
  ];

  // Report 2: Leave Balances
  const leaveBalColumns: Column<any>[] = [
    { key: 'employeeCode', header: 'รหัสพนักงาน' },
    { key: 'name', header: 'ชื่อพนักงาน', render: r => `${r.firstName} ${r.lastName}` },
    { key: 'department', header: 'แผนก', render: r => departments.find(d => d.id === r.departmentId)?.name || '-' },
    { key: 'sickLeave', header: 'ลาป่วยคงเหลือ', render: r => `${r.leaveQuotas?.SICK?.remainingDays || 0} วัน` },
    { key: 'personalLeave', header: 'ลากิจคงเหลือ', render: r => `${r.leaveQuotas?.PERSONAL?.remainingDays || 0} วัน` },
    { key: 'annualLeave', header: 'พักร้อนคงเหลือ', render: r => `${r.leaveQuotas?.ANNUAL?.remainingDays || 0} วัน` },
    { key: 'usedTotal', header: 'ใช้วันลารวม', render: r => `${(r.leaveQuotas?.SICK?.usedDays || 0) + (r.leaveQuotas?.PERSONAL?.usedDays || 0) + (r.leaveQuotas?.ANNUAL?.usedDays || 0)} วัน` },
  ];

  // Report 3: Attendance Summary
  const attendanceFiltered = attendance.filter(a => selectedCompanyId === 'ALL' || a.companyId === selectedCompanyId);
  const attendanceColumns: Column<any>[] = [
    { key: 'date', header: 'วันที่', render: r => formatThaiDate(r.date) },
    { key: 'employeeName', header: 'พนักงาน' },
    { key: 'clockIn', header: 'เวลาเข้า', render: r => r.clockIn || 'ไม่ลงเวลา' },
    { key: 'clockOut', header: 'เวลาออก', render: r => r.clockOut || '-' },
    {
      key: 'status',
      header: 'สถานะ',
      render: r => {
        const badge = getStatusBadge(r.status);
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badge.bgClass} ${badge.textClass}`}>{badge.label}</span>;
      },
    },
    { key: 'locationName', header: 'สาขา' },
  ];

  // Report 4: Approved OT
  const approvedOT = requests.filter(r => r.requestType === 'OT' && r.status === 'APPROVED');
  const otColumns: Column<any>[] = [
    { key: 'requestCode', header: 'เลขที่คำขอ' },
    { key: 'employeeName', header: 'พนักงาน' },
    { key: 'departmentName', header: 'แผนก' },
    { key: 'startDate', header: 'วันที่ทำ OT' },
    { key: 'otHours', header: 'จำนวน ชม.', render: r => `${r.otHours} ชม.` },
    { key: 'otMultiplier', header: 'อัตราคูณ', render: r => `x${r.otMultiplier || 1.5}` },
    { key: 'approverName', header: 'ผู้อนุมัติ' },
  ];

  // Report 5: Payroll by Cycle
  const latestPaidCycle = payrollCycles.find(c => c.status === 'PAID') || payrollCycles[0];
  const payrollRows = latestPaidCycle?.snapshots || [];
  const payrollColumns: Column<any>[] = [
    { key: 'employeeCode', header: 'รหัส' },
    { key: 'employeeName', header: 'ชื่อพนักงาน' },
    { key: 'departmentName', header: 'แผนก' },
    { key: 'baseSalary', header: 'เงินเดือนฐาน', align: 'right', render: r => formatCurrency(r.baseSalary) },
    { key: 'totalGrossIncome', header: 'รวมรายได้', align: 'right', render: r => formatCurrency(r.totalGrossIncome) },
    { key: 'socialSecurity', header: 'ประกันสังคม', align: 'right', render: r => formatCurrency(r.socialSecurity) },
    { key: 'withholdingTax', header: 'ภาษีหัก ณ ที่จ่าย', align: 'right', render: r => formatCurrency(r.withholdingTax) },
    { key: 'netPay', header: 'สุทธิ', align: 'right', render: r => formatCurrency(r.netPay) },
  ];

  // Card Renderers for Reports
  const renderEmpStatusCard = (r: any) => {
    const badge = getStatusBadge(r.employmentStatus);
    const comp = companies.find(c => c.id === r.companyId);
    const dept = departments.find(d => d.id === r.departmentId);

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs hover:border-[#064a8b] transition-all space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="font-mono text-xs font-bold text-slate-500">{r.employeeCode}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bgClass} ${badge.textClass}`}>
            {badge.label}
          </span>
        </div>
        <div>
          <h4 className="font-black text-slate-800 text-sm">{r.firstName} {r.lastName}</h4>
          <p className="text-xs text-slate-500">{dept?.name} • {r.positionName}</p>
          <p className="text-[11px] text-slate-400">สาขา: {comp?.shortName}</p>
        </div>
        <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-100 flex justify-between">
          <span>เริ่มงาน: <strong>{formatThaiDate(r.hireDate)}</strong></span>
          <span>อายุงาน: <strong>{r.employmentStatus === 'PROBATION' ? 'ทดลองงาน' : 'บรรจุแล้ว'}</strong></span>
        </div>
      </div>
    );
  };

  const renderLeaveBalCard = (r: any) => {
    const totalUsed = (r.leaveQuotas?.SICK?.usedDays || 0) + (r.leaveQuotas?.PERSONAL?.usedDays || 0) + (r.leaveQuotas?.ANNUAL?.usedDays || 0);

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs hover:border-[#064a8b] transition-all space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">{r.firstName} {r.lastName}</h4>
            <span className="text-[11px] text-slate-500">{r.employeeCode}</span>
          </div>
          <span className="text-[10px] font-bold bg-blue-50 text-[#064a8b] px-2 py-0.5 rounded-full">
            ใช้รวม {totalUsed} วัน
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-blue-50/60 rounded-xl">
            <span className="text-[10px] text-slate-400 block">ลาป่วย</span>
            <span className="font-black text-[#064a8b] text-base">{r.leaveQuotas?.SICK?.remainingDays || 0}</span>
          </div>
          <div className="p-2 bg-amber-50/60 rounded-xl">
            <span className="text-[10px] text-slate-400 block">ลากิจ</span>
            <span className="font-black text-amber-800 text-base">{r.leaveQuotas?.PERSONAL?.remainingDays || 0}</span>
          </div>
          <div className="p-2 bg-emerald-50/60 rounded-xl">
            <span className="text-[10px] text-slate-400 block">พักร้อน</span>
            <span className="font-black text-emerald-800 text-base">{r.leaveQuotas?.ANNUAL?.remainingDays || 0}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderAttendanceCard = (r: any) => {
    const badge = getStatusBadge(r.status);
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-700">{formatThaiDate(r.date)}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bgClass} ${badge.textClass}`}>
            {badge.label}
          </span>
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-sm">{r.employeeName}</h4>
          <p className="text-[11px] text-slate-500">{r.locationName}</p>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl text-xs flex justify-between">
          <span>เข้า: <strong className="text-emerald-700">{r.clockIn || '-'}</strong></span>
          <span>ออก: <strong className="text-slate-700">{r.clockOut || '-'}</strong></span>
        </div>
      </div>
    );
  };

  const renderOTCard = (r: any) => {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="font-mono text-xs font-bold text-[#064a8b]">{r.requestCode}</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
            {r.otHours} ชม. (x{r.otMultiplier || 1.5})
          </span>
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-sm">{r.employeeName}</h4>
          <p className="text-[11px] text-slate-500">{r.departmentName}</p>
        </div>
        <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 flex justify-between">
          <span>วันที่: {r.startDate}</span>
          <span>ผู้อนุมัติ: {r.approverName}</span>
        </div>
      </div>
    );
  };

  const renderPayrollCard = (r: any) => {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="font-mono text-xs font-bold text-slate-500">{r.employeeCode}</span>
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
            สุทธิ {formatCurrency(r.netPay)} บ.
          </span>
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-sm">{r.employeeName}</h4>
          <p className="text-[11px] text-slate-500">{r.departmentName}</p>
        </div>
        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl space-y-1">
          <div className="flex justify-between">
            <span>ฐานเงินเดือน:</span>
            <span>{formatCurrency(r.baseSalary)} บ.</span>
          </div>
          <div className="flex justify-between">
            <span>รายรับรวม:</span>
            <span className="font-bold text-slate-800">{formatCurrency(r.totalGrossIncome)} บ.</span>
          </div>
          <div className="flex justify-between text-rose-600 text-[11px]">
            <span>ปกส. / ภาษี:</span>
            <span>-{formatCurrency((r.socialSecurity || 0) + (r.withholdingTax || 0))} บ.</span>
          </div>
        </div>
      </div>
    );
  };

  // Export CSV Handler (with formula sanitization)
  const handleExport = () => {
    if (reportType === 'EMP_STATUS') {
      const headers = ['รหัสพนักงาน', 'ชื่อ', 'นามสกุล', 'สาขา', 'แผนก', 'ตำแหน่ง', 'สถานะ', 'วันเริ่มงาน'];
      const rows = filteredEmployees.map(e => [
        e.employeeCode,
        e.firstName,
        e.lastName,
        companies.find(c => c.id === e.companyId)?.shortName || '',
        departments.find(d => d.id === e.departmentId)?.name || '',
        e.positionName,
        getStatusBadge(e.employmentStatus).label,
        e.hireDate,
      ]);
      exportToCsv('รายงานสถานะพนักงาน_VNGroup', headers, rows);
    } else if (reportType === 'LEAVE_BAL') {
      const headers = ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ลาป่วยคงเหลือ', 'ลากิจคงเหลือ', 'พักร้อนคงเหลือ', 'ใช้วันลารวม'];
      const rows = filteredEmployees.map(e => [
        e.employeeCode,
        `${e.firstName} ${e.lastName}`,
        e.leaveQuotas?.SICK?.remainingDays || 0,
        e.leaveQuotas?.PERSONAL?.remainingDays || 0,
        e.leaveQuotas?.ANNUAL?.remainingDays || 0,
        (e.leaveQuotas?.SICK?.usedDays || 0) + (e.leaveQuotas?.PERSONAL?.usedDays || 0) + (e.leaveQuotas?.ANNUAL?.usedDays || 0),
      ]);
      exportToCsv('รายงานวันลาคงเหลือ_VNGroup', headers, rows);
    } else if (reportType === 'ATTENDANCE_SUMMARY') {
      const headers = ['วันที่', 'พนักงาน', 'เวลาเข้า', 'เวลาออก', 'สถานะ', 'สถานที่'];
      const rows = attendanceFiltered.map(a => [
        a.date,
        a.employeeName,
        a.clockIn || 'ไม่ลงเวลา',
        a.clockOut || '-',
        getStatusBadge(a.status).label,
        a.locationName,
      ]);
      exportToCsv('รายงานการลงเวลา_VNGroup', headers, rows);
    } else if (reportType === 'APPROVED_OT') {
      const headers = ['เลขที่คำขอ', 'พนักงาน', 'แผนก', 'วันที่', 'ชั่วโมง OT', 'อัตราคูณ', 'ผู้อนุมัติ'];
      const rows = approvedOT.map(o => [
        o.requestCode,
        o.employeeName,
        o.departmentName,
        o.startDate,
        o.otHours || 0,
        o.otMultiplier || 1.5,
        o.approverName,
      ]);
      exportToCsv('รายงานOTที่อนุมัติ_VNGroup', headers, rows);
    } else if (reportType === 'PAYROLL_REPORT') {
      const headers = ['รหัส', 'ชื่อพนักงาน', 'แผนก', 'เงินเดือนฐาน', 'รวมรายรับ', 'ประกันสังคม', 'ภาษี', 'สุทธิ'];
      const rows = payrollRows.map(p => [
        p.employeeCode,
        p.employeeName,
        p.departmentName,
        p.baseSalary,
        p.totalGrossIncome,
        p.socialSecurity,
        p.withholdingTax,
        p.netPay,
      ]);
      exportToCsv(`รายงานเงินเดือน_${latestPaidCycle?.cycleCode || 'รอบล่าสุด'}`, headers, rows);
    }

    Alert.success('ส่งออกข้อมูลสำเร็จ', 'ระบบสร้างไฟล์ CSV ป้องกัน Formula Injection เรียบร้อยแล้ว');
  };

  return (
    <div className="space-y-6">
      {/* Header and Export Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#022247] flex items-center gap-2">
            <i className="fa-solid fa-file-chart-column text-[#064a8b]"></i>
            รายงานสารสนเทศและส่งออกข้อมูล (Reports & Export)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            รายงานเชิงลึกทุกมิติ พร้อมฟังก์ชันส่งออกไฟล์ CSV มาตรฐานรองรับภาษาไทย ป้องกัน CSV Injection
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white shadow-sm transition-all flex items-center gap-2"
        >
          <i className="fa-solid fa-file-csv text-[#c3a138] text-base"></i>
          <span>ส่งออกไฟล์ CSV รายงานนี้</span>
        </button>
      </div>

      {/* Report Selection Pills */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        {[
          { key: 'EMP_STATUS', label: '1) สถานะพนักงาน', icon: 'fa-users' },
          { key: 'LEAVE_BAL', label: '2) วันลาคงเหลือ', icon: 'fa-calendar-check' },
          { key: 'ATTENDANCE_SUMMARY', label: '3) เวลาเข้า-ออกและสาย', icon: 'fa-clock' },
          { key: 'APPROVED_OT', label: '4) OT ที่อนุมัติ', icon: 'fa-business-time' },
          { key: 'PAYROLL_REPORT', label: '5) เงินเดือนตามรอบ', icon: 'fa-money-bill-transfer' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setReportType(tab.key as any)}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              reportType === tab.key
                ? 'bg-[#064a8b] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <i className={`fa-solid ${tab.icon} text-xs`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Render Selected DataTable Report */}
      {reportType === 'EMP_STATUS' && (
        <DataTable
          columns={empStatusColumns}
          data={filteredEmployees}
          searchPlaceholder="ค้นหารายชื่อพนักงาน..."
          renderCard={renderEmpStatusCard}
          defaultViewMode="card"
        />
      )}

      {reportType === 'LEAVE_BAL' && (
        <DataTable
          columns={leaveBalColumns}
          data={filteredEmployees}
          searchPlaceholder="ค้นหาวันลาคงเหลือพนักงาน..."
          renderCard={renderLeaveBalCard}
          defaultViewMode="card"
        />
      )}

      {reportType === 'ATTENDANCE_SUMMARY' && (
        <DataTable
          columns={attendanceColumns}
          data={attendanceFiltered}
          searchPlaceholder="ค้นหารายการลงเวลา..."
          renderCard={renderAttendanceCard}
          defaultViewMode="card"
        />
      )}

      {reportType === 'APPROVED_OT' && (
        <DataTable
          columns={otColumns}
          data={approvedOT}
          searchPlaceholder="ค้นหาคำขอ OT ที่อนุมัติ..."
          renderCard={renderOTCard}
          defaultViewMode="card"
        />
      )}

      {reportType === 'PAYROLL_REPORT' && (
        <div className="space-y-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
            <span className="font-bold text-slate-800">
              รายงานรอบ: {latestPaidCycle?.name} ({latestPaidCycle?.cycleCode})
            </span>
            <span className="text-emerald-700 font-bold">
              ยอดจ่ายสุทธิ: {formatCurrency(latestPaidCycle?.totalNetAmount || 0)} บาท
            </span>
          </div>
          <DataTable
            columns={payrollColumns}
            data={payrollRows}
            searchPlaceholder="ค้นหาข้อมูลเงินเดือนพนักงาน..."
            renderCard={renderPayrollCard}
            defaultViewMode="card"
          />
        </div>
      )}
    </div>
  );
};
