import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHR } from '../../context/HRContext';
import { DataTable, Column } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { AttendanceRecord } from '../../types';
import { formatThaiDate, getStatusBadge, Alert } from '../../utils/helpers';

export const AttendanceLeavePage: React.FC = () => {
  const { currentEmployee, role } = useAuth();
  const {
    attendance,
    holidays,
    clockIn,
    clockOut,
    requestAttendanceCorrection,
    approveAttendanceCorrection,
    companies,
    selectedCompanyId,
  } = useHR();

  // Tabs: 'ATTENDANCE' | 'CALENDAR' (Holidays management tab removed per user request)
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'CALENDAR'>('ATTENDANCE');

  // Modals for Attendance Correction
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [targetAttForCorrection, setTargetAttForCorrection] = useState<AttendanceRecord | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [newClockIn, setNewClockIn] = useState('08:00:00');
  const [newClockOut, setNewClockOut] = useState('17:00:00');

  // Interactive Live Clock In Panel
  const empId = currentEmployee?.id || '';
  const todayStr = '2026-10-05';
  const myTodayAtt = empId ? attendance.find(a => a.employeeId === empId && a.date === todayStr) : undefined;
  const myBranch = companies.find(c => c.id === currentEmployee?.companyId) || companies[0];

  // Selected Calendar Month for Calendar view (defaults to Oct 2026)
  const [calMonth, setCalMonth] = useState('2026-10');

  // Filter attendance by company
  const filteredAttendance = useMemo(() => {
    return attendance.filter(a => {
      if (selectedCompanyId !== 'ALL' && a.companyId !== selectedCompanyId) return false;
      return true;
    });
  }, [attendance, selectedCompanyId]);

  // Handle Quick Clock In
  const handleQuickClockIn = () => {
    if (!empId) {
      Alert.warning('ไม่มีข้อมูลพนักงาน', 'กรุณาเพิ่มข้อมูลพนักงานในระบบก่อนลงเวลาปฏิบัติงาน');
      return;
    }
    const res = clockIn(empId, { isSimulated: true, companyId: myBranch.id });
    if (res.success) {
      Alert.success('ลงเวลาเข้างานสำเร็จ', res.message);
    } else {
      Alert.warning('ไม่สามารถลงเวลาได้', res.message);
    }
  };

  // Handle Quick Clock Out
  const handleQuickClockOut = () => {
    if (!empId) {
      Alert.warning('ไม่มีข้อมูลพนักงาน', 'กรุณาเพิ่มข้อมูลพนักงานในระบบก่อนลงเวลาปฏิบัติงาน');
      return;
    }
    const res = clockOut(empId);
    if (res.success) {
      Alert.success('ลงเวลาออกงานสำเร็จ', res.message);
    } else {
      Alert.warning('ไม่สามารถลงเวลาได้', res.message);
    }
  };

  // Handle Submit Attendance Correction
  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAttForCorrection || !correctionReason.trim()) {
      Alert.warning('ข้อมูลไม่ครบ', 'กรุณาระบุเหตุผลการขอแก้ไขเวลา');
      return;
    }

    requestAttendanceCorrection(
      targetAttForCorrection.id,
      correctionReason,
      newClockIn,
      newClockOut
    );
    Alert.success('ส่งคำขอแก้ไขเวลาแล้ว', 'รอฝ่ายบุคคลหรือหัวหน้างานตรวจสอบและอนุมัติ');
    setShowCorrectionModal(false);
    setCorrectionReason('');
  };

  // Thai Month details for Calendar
  const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const [calYearStr, calMonthNumStr] = calMonth.split('-');
  const calYear = parseInt(calYearStr, 10) || 2026;
  const calMonthNum = parseInt(calMonthNumStr, 10) || 10;
  const thaiMonthName = THAI_MONTHS[calMonthNum - 1] || 'ตุลาคม';
  const thaiYear = calYear + 543;

  // Previous and next month handlers
  const handlePrevMonth = () => {
    const prevDate = new Date(calYear, calMonthNum - 2, 1);
    setCalMonth(`${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(calYear, calMonthNum, 1);
    setCalMonth(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`);
  };

  // Calendar calculations for selected month with day-of-week alignment
  const { calendarDays, firstDayOfWeek, monthHolidays } = useMemo(() => {
    const daysInMonth = new Date(calYear, calMonthNum, 0).getDate();
    const firstDay = new Date(calYear, calMonthNum - 1, 1).getDay(); // 0 = Sun, 1 = Mon ...

    const days = [];
    const thisMonthHolidays: typeof holidays = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${calYear}-${String(calMonthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayHolidays = holidays.filter(h => h.date === dateString);
      const dayAttendance = attendance.filter(a => a.date === dateString);
      const dayOfWeek = new Date(calYear, calMonthNum - 1, day).getDay();

      if (dayHolidays.length > 0) {
        dayHolidays.forEach(dh => {
          if (!thisMonthHolidays.some(th => th.id === dh.id)) {
            thisMonthHolidays.push(dh);
          }
        });
      }

      days.push({
        dayNumber: day,
        date: dateString,
        dayOfWeek,
        holidays: dayHolidays,
        attendanceCount: dayAttendance.length,
      });
    }

    return {
      calendarDays: days,
      firstDayOfWeek: firstDay,
      monthHolidays: thisMonthHolidays,
    };
  }, [calYear, calMonthNum, holidays, attendance]);

  // Columns for Attendance Table View
  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'date',
      header: 'วันที่',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{formatThaiDate(row.date)}</span>
          <span className="text-[10px] text-slate-400">{row.workShift}</span>
        </div>
      ),
    },
    {
      key: 'employeeName',
      header: 'พนักงาน',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 text-xs">{row.employeeName}</p>
          <p className="text-[11px] text-slate-500">{row.employeeCode}</p>
        </div>
      ),
    },
    {
      key: 'clockIn',
      header: 'เวลาเข้างาน',
      align: 'center',
      render: (row) => (
        <span className="font-bold text-slate-800 text-xs">
          {row.clockIn ? (
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {row.clockIn}
            </span>
          ) : (
            <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              ยังไม่ลงเวลา
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'clockOut',
      header: 'เวลาออกงาน',
      align: 'center',
      render: (row) => (
        <span className="text-xs">
          {row.clockOut ? (
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {row.clockOut}
            </span>
          ) : (
            <span className="text-slate-400 italic">-</span>
          )}
        </span>
      ),
    },
    {
      key: 'locationName',
      header: 'สถานที่ / GPS',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-slate-700 truncate max-w-[180px]">{row.locationName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-medium">
              <i className="fa-solid fa-location-crosshairs mr-1"></i>
              {row.isSimulatedLocation ? 'ข้อมูลจำลอง' : 'GPS จริง'}
            </span>
            {row.distanceMeters && (
              <span className="text-[10px] text-slate-400">ห่าง {row.distanceMeters} ม.</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'สถานะ',
      align: 'center',
      render: (row) => {
        const badge = getStatusBadge(row.status);
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.bgClass} ${badge.textClass}`}>
            <i className={`fa-solid ${badge.icon} text-[10px]`}></i>
            {badge.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          {row.correctionRequested && (role === 'SUPER_ADMIN' || role === 'HR_MANAGER') ? (
            <button
              onClick={() => {
                approveAttendanceCorrection(row.id);
                Alert.success('อนุมัติแก้ไขเวลาสำเร็จ', 'ปรับปรุงเวลาลงงานเรียบร้อยแล้ว');
              }}
              className="px-2 py-1 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 cursor-pointer"
              title="อนุมัติคำขอแก้ไขเวลา"
            >
              อนุมัติแก้เวลา
            </button>
          ) : (
            <button
              onClick={() => {
                setTargetAttForCorrection(row);
                setNewClockIn(row.clockIn || '08:00:00');
                setNewClockOut(row.clockOut || '17:00:00');
                setShowCorrectionModal(true);
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#064a8b] hover:bg-slate-100 cursor-pointer"
              title="ขอแก้ไขเวลา"
            >
              <i className="fa-solid fa-pen-to-square"></i>
            </button>
          )}
        </div>
      ),
    },
  ];

  // Custom Card Renderer for Attendance Logs (Optimized fit for mobile & desktop)
  const renderAttendanceCard = (att: AttendanceRecord) => {
    const badge = getStatusBadge(att.status);

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4.5 shadow-xs hover:shadow-md hover:border-[#064a8b] transition-all flex flex-col justify-between group">
        <div>
          {/* Card Top: Date & Status */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5 gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
                <i className="fa-regular fa-calendar-check text-[#064a8b] shrink-0"></i>
                <span className="truncate">{formatThaiDate(att.date)}</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                กะงาน: {att.workShift}
              </span>
            </div>

            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold shrink-0 ${badge.bgClass} ${badge.textClass}`}>
              <i className={`fa-solid ${badge.icon} text-[9px]`}></i>
              <span>{badge.label}</span>
            </span>
          </div>

          {/* Employee Info */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
              {att.employeeName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                {att.employeeName}
              </h4>
              <p className="text-[10px] sm:text-[11px] font-mono text-slate-500 truncate">
                {att.employeeCode}
              </p>
            </div>
          </div>

          {/* Time Check-in/Check-out Grid */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-2.5 sm:p-3 rounded-xl border border-slate-200/80 mb-3">
            <div>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
                เวลาเข้างาน (In)
              </span>
              {att.clockIn ? (
                <span className="font-black text-xs sm:text-sm text-emerald-700 flex items-center gap-1">
                  <i className="fa-solid fa-arrow-right-to-bracket text-[10px] text-emerald-600"></i>
                  <span>{att.clockIn}</span>
                </span>
              ) : (
                <span className="font-semibold text-xs text-rose-500">
                  ยังไม่ลงเวลา
                </span>
              )}
            </div>

            <div>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
                เวลาออกงาน (Out)
              </span>
              {att.clockOut ? (
                <span className="font-black text-xs sm:text-sm text-emerald-700 flex items-center gap-1">
                  <i className="fa-solid fa-arrow-right-from-bracket text-[10px] text-emerald-600"></i>
                  <span>{att.clockOut}</span>
                </span>
              ) : (
                <span className="font-semibold text-xs text-slate-400 italic">
                  ยังไม่ลงเวลาออก
                </span>
              )}
            </div>
          </div>

          {/* Location & GPS Info */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600 gap-1">
              <span className="text-slate-500 truncate max-w-[160px] sm:max-w-[200px]">
                <i className="fa-solid fa-location-dot mr-1 text-slate-400"></i>
                {att.locationName}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[9px] sm:text-[10px] font-semibold shrink-0">
                {att.isSimulatedLocation ? 'จำลอง' : 'GPS จริง'}
                {att.distanceMeters ? ` (${att.distanceMeters}ม.)` : ''}
              </span>
            </div>

            {att.note && (
              <p className="text-[10px] sm:text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200 mt-2 line-clamp-2">
                <i className="fa-solid fa-circle-exclamation mr-1 text-amber-600"></i> {att.note}
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2.5 border-t border-slate-100 mt-2.5">
          {att.correctionRequested && (role === 'SUPER_ADMIN' || role === 'HR_MANAGER') ? (
            <button
              onClick={() => {
                approveAttendanceCorrection(att.id);
                Alert.success('อนุมัติแก้ไขเวลาสำเร็จ', 'ปรับปรุงเวลาลงงานเรียบร้อยแล้ว');
              }}
              className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer"
            >
              <i className="fa-solid fa-check"></i>
              <span>อนุมัติคำขอแก้เวลา</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setTargetAttForCorrection(att);
                setNewClockIn(att.clockIn || '08:00:00');
                setNewClockOut(att.clockOut || '17:00:00');
                setShowCorrectionModal(true);
              }}
              className="w-full py-1.5 px-3 bg-slate-100 hover:bg-[#064a8b] hover:text-white text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-pen-to-square"></i>
              <span>ขอแก้ไขเวลา</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // Day header array with short names for mobile and full names for desktop
  const dayHeaders = [
    { short: 'อา.', full: 'อาทิตย์', isWeekend: true },
    { short: 'จ.', full: 'จันทร์', isWeekend: false },
    { short: 'อ.', full: 'อังคาร', isWeekend: false },
    { short: 'พ.', full: 'พุธ', isWeekend: false },
    { short: 'พฤ.', full: 'พฤหัสบดี', isWeekend: false },
    { short: 'ศ.', full: 'ศุกร์', isWeekend: false },
    { short: 'ส.', full: 'เสาร์', isWeekend: true },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Interactive Clock In/Out Live Bar for Current User */}
      <div className="bg-gradient-to-r from-[#022247] to-[#064a8b] rounded-2xl p-3.5 sm:p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#c3a138] text-slate-900 flex items-center justify-center font-black text-lg sm:text-xl shrink-0 shadow-sm">
            <i className="fa-solid fa-fingerprint"></i>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                ลงเวลาปฏิบัติงานเรียลไทม์
              </span>
              <span className="text-[10px] sm:text-xs text-[#a4b3d3] truncate">
                📍 {myBranch.name}
              </span>
            </div>
            <h3 className="text-xs sm:text-sm md:text-base font-bold text-white mt-1 leading-snug">
              สถานะวันนี้ ({formatThaiDate(todayStr)}):{' '}
              {myTodayAtt?.clockIn ? (
                <span className="text-emerald-300 font-black">
                  เข้างาน ({myTodayAtt.clockIn} น.) {myTodayAtt.clockOut ? `| ออกงาน (${myTodayAtt.clockOut} น.)` : ''}
                </span>
              ) : (
                <span className="text-amber-300 font-bold">ยังไม่ลงเวลาเข้างาน</span>
              )}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center shrink-0 w-full md:w-auto">
          <button
            onClick={handleQuickClockIn}
            disabled={Boolean(myTodayAtt?.clockIn)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold bg-[#c3a138] hover:bg-[#d4b348] text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-arrow-right-to-bracket"></i>
            <span>{myTodayAtt?.clockIn ? 'ลงเวลาเข้าแล้ว' : 'ลงเวลาเข้างาน'}</span>
          </button>
          <button
            onClick={handleQuickClockOut}
            disabled={!myTodayAtt?.clockIn || Boolean(myTodayAtt?.clockOut)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span>{myTodayAtt?.clockOut ? 'ลงเวลาออกแล้ว' : 'ลงเวลาออกงาน'}</span>
          </button>
        </div>
      </div>

      {/* Main Tabs: 2 Tabs - Adjusted for perfect frame & text sizing */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            activeTab === 'ATTENDANCE'
              ? 'bg-[#064a8b] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <i className="fa-solid fa-clipboard-user text-xs sm:text-sm shrink-0"></i>
          <span className="truncate">ประวัติการลงเวลาทำงาน</span>
          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold shrink-0 ${
            activeTab === 'ATTENDANCE' ? 'bg-[#c3a138] text-slate-900' : 'bg-slate-200 text-slate-700'
          }`}>
            {filteredAttendance.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CALENDAR')}
          className={`py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            activeTab === 'CALENDAR'
              ? 'bg-[#064a8b] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <i className="fa-solid fa-calendar-days text-xs sm:text-sm shrink-0"></i>
          <span className="truncate">ปฏิทินวันทำงานและวันหยุด</span>
        </button>
      </div>

      {/* Tab 1: Attendance Logs (Card & Table View) */}
      {activeTab === 'ATTENDANCE' && (
        <DataTable
          columns={columns}
          data={filteredAttendance}
          searchPlaceholder="ค้นหาชื่อพนักงาน, วันที่, สถานะ..."
          emptyText="ไม่พบประวัติการลงเวลา"
          renderCard={renderAttendanceCard}
          defaultViewMode="card"
        />
      )}

      {/* Tab 2: Monthly Calendar View (Perfect grid & font scaling) */}
      {activeTab === 'CALENDAR' && (
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
          {/* Header Bar with Month Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-calendar-days text-[#064a8b]"></i>
                <span>ปฏิทินรอบเดือน{thaiMonthName} {thaiYear}</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                แสดงวันหยุดประเพณีและสถิติการลงเวลาทำงานของทีม
              </p>
            </div>

            {/* Month Switcher Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="เดือนก่อนหน้า"
              >
                <i className="fa-solid fa-chevron-left text-xs"></i>
              </button>

              <input
                type="month"
                value={calMonth}
                onChange={e => setCalMonth(e.target.value)}
                className="text-xs p-1.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#064a8b]"
              />

              <button
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="เดือนถัดไป"
              >
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </button>
            </div>
          </div>

          {/* Quick Color Legend */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] text-slate-600 pt-1 pb-1 border-y border-slate-100">
            <span className="font-bold text-slate-700">สัญลักษณ์:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#064a8b] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#064a8b]"></span> วันนี้
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 font-semibold">
              🏖️ วันหยุดประเพณี
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
              <i className="fa-solid fa-users text-[9px]"></i> มีบันทึกเวลา
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
              วันหยุดสุดสัปดาห์
            </span>
          </div>

          {/* Calendar Grid: 7 Columns with optimized day headings & cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs">
            {/* Day Header Row */}
            {dayHeaders.map((h, idx) => (
              <div
                key={idx}
                className={`py-1.5 px-0.5 sm:p-2 font-bold rounded-lg text-[10px] sm:text-xs ${
                  h.isWeekend ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <span className="sm:hidden">{h.short}</span>
                <span className="hidden sm:inline">{h.full}</span>
              </div>
            ))}

            {/* Empty Spacer Cells for Day-of-Week offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div
                key={`empty-start-${idx}`}
                className="min-h-[58px] sm:min-h-[85px] p-1 sm:p-2 rounded-lg sm:rounded-xl bg-slate-50/40 border border-slate-100/60 opacity-40"
              />
            ))}

            {/* Calendar Day Cells */}
            {calendarDays.map(item => {
              const hasHoliday = item.holidays.length > 0;
              const isToday = item.date === todayStr;
              const isWeekend = item.dayOfWeek === 0 || item.dayOfWeek === 6;

              return (
                <div
                  key={item.date}
                  className={`min-h-[58px] sm:min-h-[85px] p-1 sm:p-2 rounded-lg sm:rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isToday
                      ? 'border-[#064a8b] bg-blue-50/60 ring-2 ring-[#064a8b]/20 shadow-xs'
                      : hasHoliday
                      ? 'border-purple-300 bg-purple-50/50'
                      : isWeekend
                      ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  {/* Day Number and Today badge */}
                  <div className="flex items-center justify-between gap-0.5">
                    <span
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 ${
                        isToday
                          ? 'bg-[#064a8b] text-white shadow-xs'
                          : isWeekend
                          ? 'text-rose-600 font-semibold'
                          : 'text-slate-800'
                      }`}
                    >
                      {item.dayNumber}
                    </span>
                    {isToday && (
                      <span className="text-[8px] sm:text-[9px] bg-blue-100 text-[#064a8b] px-1 py-0.2 rounded font-bold shrink-0">
                        วันนี้
                      </span>
                    )}
                  </div>

                  {/* Holidays & Attendance Info */}
                  <div className="space-y-0.5 sm:space-y-1 mt-0.5 sm:mt-1 overflow-hidden">
                    {item.holidays.map(h => (
                      <div
                        key={h.id}
                        className="text-[8px] sm:text-[10px] p-0.5 sm:p-1 bg-purple-100 text-purple-900 rounded font-semibold truncate leading-tight"
                        title={h.name}
                      >
                        🏖️ {h.name}
                      </div>
                    ))}
                    {item.attendanceCount > 0 && (
                      <div className="text-[8px] sm:text-[10px] text-emerald-700 font-bold truncate leading-tight flex items-center gap-0.5">
                        <i className="fa-solid fa-users text-[7px] sm:text-[9px] shrink-0"></i>
                        <span>{item.attendanceCount} คน</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Monthly Holidays Summary Badge List (Clean, non-intrusive) */}
          {monthHolidays.length > 0 && (
            <div className="bg-purple-50/40 rounded-xl p-3 border border-purple-100 space-y-2 mt-2">
              <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <i className="fa-solid fa-umbrella-beach text-purple-600"></i>
                <span>วันหยุดตามประเพณีในเดือนนี้ ({thaiMonthName} {thaiYear}):</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                {monthHolidays.map(h => (
                  <div
                    key={h.id}
                    className="text-[11px] bg-white p-2 rounded-lg border border-purple-200/70 flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <span className="font-semibold text-slate-800 truncate">🏖️ {h.name}</span>
                    <span className="text-[10px] text-purple-700 font-bold shrink-0">{formatThaiDate(h.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Request Attendance Correction */}
      <Modal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        title="ขอแก้ไขเวลาการลงงาน (Attendance Correction)"
        subtitle={`พนักงาน: ${targetAttForCorrection?.employeeName} (วันที่ ${formatThaiDate(targetAttForCorrection?.date || '')})`}
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowCorrectionModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleCorrectionSubmit}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] text-white hover:bg-[#022247] cursor-pointer"
            >
              ส่งคำขอแก้ไขเวลา
            </button>
          </>
        }
      >
        <form onSubmit={handleCorrectionSubmit} className="space-y-3 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
            <p className="font-bold">ข้อมูลการลงเวลาปัจจุบัน:</p>
            <p className="mt-0.5">
              เข้างาน: {targetAttForCorrection?.clockIn || 'ไม่มีข้อมูล'} | ออกงาน: {targetAttForCorrection?.clockOut || 'ไม่มีข้อมูล'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">เวลาเข้างานใหม่: *</label>
              <input
                type="text"
                value={newClockIn}
                onChange={e => setNewClockIn(e.target.value)}
                placeholder="08:00:00"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-[#064a8b]"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">เวลาออกงานใหม่: *</label>
              <input
                type="text"
                value={newClockOut}
                onChange={e => setNewClockOut(e.target.value)}
                placeholder="17:00:00"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-[#064a8b]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">เหตุผลการขอแก้ไขเวลา: *</label>
            <textarea
              value={correctionReason}
              onChange={e => setCorrectionReason(e.target.value)}
              placeholder="ระบุสาเหตุ เช่น ลืมสแกนนิ้วเนื่องจากติดนำรถตรวจสภาพ, อุปกรณ์ขัดข้อง..."
              rows={3}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
