import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHR } from '../../context/HRContext';
import { formatThaiDate, getStatusBadge, Alert } from '../../utils/helpers';
import { Announcements } from '../employee/Announcements';
import { UserAvatar } from '../common/UserAvatar';

interface EmployeeDashboardProps {
  onNavigate: (tab: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onNavigate }) => {
  const { currentEmployee, currentUser, role } = useAuth();
  const {
    attendance,
    requests,
    holidays,
    clockIn,
    clockOut,
    companies,
  } = useHR();

  const [isSubmittingClock, setIsSubmittingClock] = useState(false);

  const empId = currentEmployee?.id || '';
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Today attendance
  const todayAtt = attendance.find(a => a.employeeId === empId && a.date === todayDateStr);

  // Leave Quotas
  const quotas = currentEmployee?.leaveQuotas;
  const annualRemaining = quotas?.ANNUAL?.remainingDays ?? 0;
  const annualTotal = quotas?.ANNUAL?.entitledDays ?? 0;
  const sickRemaining = quotas?.SICK?.remainingDays ?? 0;
  const sickTotal = quotas?.SICK?.entitledDays ?? 0;
  const personalRemaining = quotas?.PERSONAL?.remainingDays ?? 0;
  const personalTotal = quotas?.PERSONAL?.entitledDays ?? 0;

  // Recent requests for this employee
  const myRequests = currentEmployee
    ? requests.filter(r => r.employeeId === currentEmployee.id)
    : [];
  const pendingCount = myRequests.filter(r => r.status === 'PENDING').length;

  // Upcoming holidays
  const upcomingHolidays = holidays
    .filter(h => h.date >= todayDateStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  // Employee Branch
  const myBranch = companies.find(c => c.id === currentEmployee?.companyId) || companies[0];

  const employeeDisplayName = currentEmployee
    ? `${currentEmployee.firstName} ${currentEmployee.lastName}`
    : (currentUser?.username ? `บัญชี ${currentUser.username}` : 'พนักงาน');

  const employeePositionName = currentEmployee?.positionName || 'พนักงาน';

  const handleClockIn = async () => {
    if (!currentEmployee) {
      Alert.warning('ไม่มีข้อมูลพนักงาน', 'กรุณาเพิ่มหรือผูกข้อมูลพนักงานในระบบก่อนลงเวลา');
      return;
    }
    setIsSubmittingClock(true);
    try {
      const res = clockIn(currentEmployee.id, {
        isSimulated: true,
        companyId: myBranch?.id,
      });
      if (res.success) {
        Alert.success('ลงเวลาเข้างานสำเร็จ!', res.message);
      } else {
        Alert.warning('ไม่สามารถลงเวลาได้', res.message);
      }
    } finally {
      setIsSubmittingClock(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentEmployee) {
      Alert.warning('ไม่มีข้อมูลพนักงาน', 'กรุณาเพิ่มหรือผูกข้อมูลพนักงานในระบบก่อนลงเวลา');
      return;
    }
    setIsSubmittingClock(true);
    try {
      const res = clockOut(currentEmployee.id);
      if (res.success) {
        Alert.success('ลงเวลาออกงานสำเร็จ!', res.message);
      } else {
        Alert.warning('ไม่สามารถลงเวลาได้', res.message);
      }
    } finally {
      setIsSubmittingClock(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#022247] via-[#064a8b] to-[#022247] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar
              size="xl"
              allowUpload={true}
              showBadge={true}
              className="shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                {currentEmployee?.employeeCode && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#c3a138] text-slate-900 font-bold">
                    {currentEmployee.employeeCode}
                  </span>
                )}
                <span className="text-xs text-slate-200">
                  {myBranch?.name || 'โรงเรียนสอนขับรถวีเอ็น'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1">
                สวัสดี, {employeeDisplayName}
              </h2>
              <p className="text-xs text-[#a4b3d3] mt-0.5">
                ตำแหน่ง: {employeePositionName} {currentEmployee?.workShift ? `• กะการทำงาน: ${currentEmployee.workShift}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onNavigate('emp-attendance')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-clock-rotate-left"></i>
              <span>ประวัติเวลาและวันลา</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Clock In/Out & Leave Balance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Check-in/out Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-clock text-[#064a8b]"></i>
                <span>ลงเวลาปฏิบัติงานวันนี้ ({formatThaiDate(todayDateStr)})</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-[#064a8b] font-bold">
                GPS Check-in
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">สถานที่ปฏิบัติงาน:</span>
                <span className="font-bold text-slate-800 text-right">{myBranch?.shortName || 'สาขาหลัก'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">เวลาเข้างาน:</span>
                <span className="font-bold text-slate-800">
                  {todayAtt?.clockIn ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <i className="fa-solid fa-check mr-1"></i> {todayAtt.clockIn} น.
                    </span>
                  ) : (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">ยังไม่ลงเวลาเข้า</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">เวลาออกงาน:</span>
                <span className="font-bold text-slate-800">
                  {todayAtt?.clockOut ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <i className="fa-solid fa-check mr-1"></i> {todayAtt.clockOut} น.
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-2">
                <span className="text-slate-500">สถานะ:</span>
                {todayAtt?.status ? (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${getStatusBadge(todayAtt.status).bgClass} ${getStatusBadge(todayAtt.status).textClass}`}>
                    {getStatusBadge(todayAtt.status).label}
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">พร้อมลงเวลา</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleClockIn}
              disabled={isSubmittingClock || Boolean(todayAtt?.clockIn)}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-arrow-right-to-bracket"></i>
              <span>{todayAtt?.clockIn ? 'เข้างานแล้ว' : 'ลงเวลาเข้างาน'}</span>
            </button>
            <button
              onClick={handleClockOut}
              disabled={isSubmittingClock || !todayAtt?.clockIn || Boolean(todayAtt?.clockOut)}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              <span>{todayAtt?.clockOut ? 'ออกงานแล้ว' : 'ลงเวลาออกงาน'}</span>
            </button>
          </div>
        </div>

        {/* Leave Balances Summary Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-calendar-check text-[#c3a138]"></i>
                <span>สรุปวันลาคงเหลือประจำปี</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* ลาพักร้อน */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-700">วันลาพักร้อนคงเหลือ</span>
                <div className="text-2xl font-bold text-indigo-600 mt-2">
                  {annualRemaining}{' '}
                  <span className="text-xs text-slate-400 font-normal">/ {annualTotal} วัน</span>
                </div>
              </div>

              {/* ลาป่วย */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-700">วันลาป่วยคงเหลือ</span>
                <div className="text-2xl font-bold text-emerald-600 mt-2">
                  {sickRemaining}{' '}
                  <span className="text-xs text-slate-400 font-normal">/ {sickTotal} วัน</span>
                </div>
              </div>

              {/* ลากิจ */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-700">วันลากิจคงเหลือ</span>
                <div className="text-2xl font-bold text-amber-600 mt-2">
                  {personalRemaining}{' '}
                  <span className="text-xs text-slate-400 font-normal">/ {personalTotal} วัน</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>คำขอลาที่รออนุมัติในขณะนี้: <strong>{pendingCount}</strong> รายการ</span>
            <span className="text-slate-400 text-[11px]">(จัดการได้ที่เมนูคำขอของฉัน)</span>
          </div>
        </div>
      </div>

      {/* Announcements Component: Only visible to Employees */}
      {role === 'EMPLOYEE' && (
        <Announcements />
      )}

      {/* Upcoming Holidays & Quick Links */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b pb-2 border-slate-100">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-umbrella-beach text-[#064a8b]"></i>
            <span>วันหยุดตามประเพณีที่กำลังจะมาถึง</span>
          </h3>
          <span className="text-xs text-slate-400">ปฏิทินวันหยุด VN Group</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {upcomingHolidays.length === 0 ? (
            <p className="text-xs text-slate-400 col-span-3 text-center py-4">ไม่มีวันหยุดในระยะนี้</p>
          ) : (
            upcomingHolidays.map(h => (
              <div key={h.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                <span className="text-xs font-bold text-slate-800 block truncate">{h.name}</span>
                <span className="text-xs text-indigo-600 font-semibold block">{formatThaiDate(h.date)}</span>
                <span className="text-[10px] text-slate-400 block">วันหยุดบริษัท</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
