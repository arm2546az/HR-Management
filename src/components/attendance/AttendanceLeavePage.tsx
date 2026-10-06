import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHR } from '../../context/HRContext';
import { DataTable, Column } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { AttendanceRecord, Holiday } from '../../types';
import { formatThaiDate, getStatusBadge, Alert } from '../../utils/helpers';

export const AttendanceLeavePage: React.FC = () => {
  const { currentEmployee, role } = useAuth();
  const {
    attendance,
    holidays,
    addHoliday,
    deleteHoliday,
    clockIn,
    clockOut,
    requestAttendanceCorrection,
    approveAttendanceCorrection,
    companies,
    selectedCompanyId,
  } = useHR();

  // Tabs: 'ATTENDANCE' | 'CALENDAR' | 'HOLIDAYS'
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'CALENDAR' | 'HOLIDAYS'>('ATTENDANCE');

  // Modals
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [targetAttForCorrection, setTargetAttForCorrection] = useState<AttendanceRecord | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [newClockIn, setNewClockIn] = useState('08:00:00');
  const [newClockOut, setNewClockOut] = useState('17:00:00');

  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('2026-11-25');
  const [holidayCompanyId, setHolidayCompanyId] = useState('ALL');

  // Interactive Live Clock In Panel
  const empId = currentEmployee?.id || '';
  const todayStr = '2026-10-05';
  const myTodayAtt = empId ? attendance.find(a => a.employeeId === empId && a.date === todayStr) : undefined;
  const myBranch = companies.find(c => c.id === currentEmployee?.companyId) || companies[0];

  // Selected Calendar Month for Calendar view
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

  // Handle Add Holiday
  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayName.trim()) {
      Alert.warning('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อวันหยุด');
      return;
    }
    // Prevent duplicate
    const exists = holidays.some(h => h.date === holidayDate && (h.companyId === holidayCompanyId || holidayCompanyId === 'ALL'));
    if (exists) {
      Alert.warning('วันหยุดซ้ำซ้อน', 'มีรายการวันหยุดในวันที่นี้อยู่แล้ว');
      return;
    }

    addHoliday(holidayName, holidayDate, holidayCompanyId);
    Alert.success('เพิ่มวันหยุดเรียบร้อย', `บันทึกวันหยุด ${holidayName} (${holidayDate})`);
    setShowHolidayModal(false);
    setHolidayName('');
  };

  // Calendar calculations for current month (Oct 2026)
  const calendarDays = useMemo(() => {
    const [yearStr, monthStr] = calMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayHolidays = holidays.filter(h => h.date === dateString);
      const dayAttendance = attendance.filter(a => a.date === dateString);
      days.push({
        dayNumber: day,
        date: dateString,
        holidays: dayHolidays,
        attendanceCount: dayAttendance.length,
      });
    }
    return days;
  }, [calMonth, holidays, attendance]);

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
              className="px-2 py-1 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700"
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
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#064a8b] hover:bg-slate-100"
              title="ขอแก้ไขเวลา"
            >
              <i className="fa-solid fa-pen-to-square"></i>
            </button>
          )}
        </div>
      ),
    },
  ];

  // Custom Card Renderer for Attendance Logs
  const renderAttendanceCard = (att: AttendanceRecord) => {
    const badge = getStatusBadge(att.status);

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-[#064a8b] transition-all flex flex-col justify-between group">
        <div>
          {/* Card Top: Date & Status */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                <i className="fa-regular fa-calendar-check text-[#064a8b]"></i>
                <span>{formatThaiDate(att.date)}</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                กะงาน: {att.workShift}
              </span>
            </div>

            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${badge.bgClass} ${badge.textClass}`}>
              <i className={`fa-solid ${badge.icon} text-[9px]`}></i>
              {badge.label}
            </span>
          </div>

          {/* Employee Info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
              {att.employeeName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-800 text-xs truncate">
                {att.employeeName}
              </h4>
              <p className="text-[11px] font-mono text-slate-500">
                {att.employeeCode}
              </p>
            </div>
          </div>

          {/* Time Check-in/Check-out Grid */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 mb-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
                เวลาเข้างาน (In)
              </span>
              {att.clockIn ? (
                <span className="font-black text-sm text-emerald-700 flex items-center gap-1">
                  <i className="fa-solid fa-arrow-right-to-bracket text-xs text-emerald-600"></i>
                  {att.clockIn}
                </span>
              ) : (
                <span className="font-semibold text-xs text-rose-500">
                  ยังไม่ลงเวลา
                </span>
              )}
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
                เวลาออกงาน (Out)
              </span>
              {att.clockOut ? (
                <span className="font-black text-sm text-emerald-700 flex items-center gap-1">
                  <i className="fa-solid fa-arrow-right-from-bracket text-xs text-emerald-600"></i>
                  {att.clockOut}
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
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span className="text-slate-400 truncate max-w-[150px]">
                <i className="fa-solid fa-location-dot mr-1 text-slate-400"></i>
                {att.locationName}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">
                {att.isSimulatedLocation ? 'ข้อมูลจำลอง' : 'GPS จริง'}
                {att.distanceMeters ? ` (${att.distanceMeters} ม.)` : ''}
              </span>
            </div>

            {att.note && (
              <p className="text-[11px] text-amber-700 bg-amber-50/70 p-2 rounded-lg border border-amber-200 mt-2">
                <i className="fa-solid fa-circle-exclamation mr-1"></i> {att.note}
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-100 mt-3">
          {att.correctionRequested && (role === 'SUPER_ADMIN' || role === 'HR_MANAGER') ? (
            <button
              onClick={() => {
                approveAttendanceCorrection(att.id);
                Alert.success('อนุมัติแก้ไขเวลาสำเร็จ', 'ปรับปรุงเวลาลงงานเรียบร้อยแล้ว');
              }}
              className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
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
              className="w-full py-1.5 px-3 bg-slate-100 hover:bg-[#064a8b] hover:text-white text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <i className="fa-solid fa-pen-to-square"></i>
              <span>ขอแก้ไขเวลา</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Interactive Clock In/Out Live Bar for Current User */}
      <div className="bg-gradient-to-r from-[#022247] to-[#064a8b] rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#c3a138] text-slate-900 flex items-center justify-center font-black text-xl shadow-sm">
            <i className="fa-solid fa-fingerprint"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                ลงเวลาปฏิบัติงานเรียลไทม์
              </span>
              <span className="text-xs text-[#a4b3d3]">
                {myBranch.name}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              สถานะของคุณวันนี้ ({formatThaiDate(todayStr)}):{' '}
              {myTodayAtt?.clockIn ? (
                <span className="text-emerald-300 font-black">
                  เข้างานแล้ว ({myTodayAtt.clockIn} น.) {myTodayAtt.clockOut ? `| ออกงานแล้ว (${myTodayAtt.clockOut} น.)` : ''}
                </span>
              ) : (
                <span className="text-amber-300 font-bold">ยังไม่ลงเวลาเข้างาน</span>
              )}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickClockIn}
            disabled={Boolean(myTodayAtt?.clockIn)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#c3a138] hover:bg-[#d4b348] text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1.5"
          >
            <i className="fa-solid fa-arrow-right-to-bracket"></i>
            {myTodayAtt?.clockIn ? 'ลงเวลาเข้าแล้ว' : 'ลงเวลาเข้างาน'}
          </button>
          <button
            onClick={handleQuickClockOut}
            disabled={!myTodayAtt?.clockIn || Boolean(myTodayAtt?.clockOut)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            {myTodayAtt?.clockOut ? 'ลงเวลาออกแล้ว' : 'ลงเวลาออกงาน'}
          </button>
        </div>
      </div>

      {/* Main Tabs: ตารางลงเวลา | ปฏิทินวันลา & วันทำงาน | วันหยุดบริษัท */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ATTENDANCE'
              ? 'bg-[#064a8b] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <i className="fa-solid fa-clipboard-user"></i>
          <span>ประวัติการลงเวลาทำงาน</span>
          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
            activeTab === 'ATTENDANCE' ? 'bg-[#c3a138] text-slate-900' : 'bg-slate-200 text-slate-700'
          }`}>
            {filteredAttendance.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CALENDAR')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'CALENDAR'
              ? 'bg-[#064a8b] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <i className="fa-solid fa-calendar-days"></i>
          <span>ปฏิทินวันทำงานและวันหยุด</span>
        </button>

        <button
          onClick={() => setActiveTab('HOLIDAYS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'HOLIDAYS'
              ? 'bg-[#064a8b] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <i className="fa-solid fa-umbrella-beach"></i>
          <span>กำหนดวันหยุดประจำปี</span>
          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
            activeTab === 'HOLIDAYS' ? 'bg-[#c3a138] text-slate-900' : 'bg-slate-200 text-slate-700'
          }`}>
            {holidays.length}
          </span>
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

      {/* Tab 2: Monthly Calendar View */}
      {activeTab === 'CALENDAR' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-calendar-days text-[#064a8b]"></i>
                ปฏิทินรอบเดือนตุลาคม 2569
              </h3>
              <p className="text-xs text-slate-500">แสดงวันหยุดประเพณีและสถิติการลงเวลาของทีม</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">เลือกเดือน:</span>
              <input
                type="month"
                value={calMonth}
                onChange={e => setCalMonth(e.target.value)}
                className="text-xs p-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map((dayName, idx) => (
              <div key={dayName} className={`p-2 font-bold rounded-lg ${idx === 0 || idx === 6 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                {dayName}
              </div>
            ))}

            {calendarDays.map(item => {
              const hasHoliday = item.holidays.length > 0;
              const isToday = item.date === todayStr;
              return (
                <div
                  key={item.date}
                  className={`min-h-[90px] p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isToday ? 'border-[#064a8b] bg-blue-50/40 ring-2 ring-[#064a8b]/20' :
                    hasHoliday ? 'border-purple-200 bg-purple-50/30' :
                    'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      isToday ? 'bg-[#064a8b] text-white' : 'text-slate-800'
                    }`}>
                      {item.dayNumber}
                    </span>
                    {isToday && (
                      <span className="text-[9px] bg-blue-100 text-[#064a8b] px-1 rounded font-bold">
                        วันนี้
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1">
                    {item.holidays.map(h => (
                      <div key={h.id} className="text-[10px] p-1 bg-purple-100 text-purple-800 rounded font-bold truncate" title={h.name}>
                        🏖️ {h.name}
                      </div>
                    ))}
                    {item.attendanceCount > 0 && (
                      <div className="text-[10px] text-emerald-700 font-semibold">
                        <i className="fa-solid fa-users text-[9px] mr-1"></i>
                        ลงเวลา {item.attendanceCount} คน
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Holidays Management */}
      {activeTab === 'HOLIDAYS' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-umbrella-beach text-purple-600"></i>
                กำหนดวันหยุดตามประเพณี VN Group (ปี 2569)
              </h3>
              <p className="text-xs text-slate-500">วันหยุดประจำปีสำหรับคำนวณวันทำงานและวันลา</p>
            </div>
            {(role === 'SUPER_ADMIN' || role === 'HR_MANAGER') && (
              <button
                onClick={() => setShowHolidayModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#064a8b] text-white hover:bg-[#022247] flex items-center gap-1.5"
              >
                <i className="fa-solid fa-plus text-[#c3a138]"></i>
                เพิ่มวันหยุดใหม่
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {holidays.map(h => (
              <div
                key={h.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-bold text-slate-800 text-xs">{h.name}</p>
                  <p className="text-[11px] text-purple-700 font-semibold mt-0.5">
                    {formatThaiDate(h.date)}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {h.companyId === 'ALL' ? 'ทุกสาขา' : companies.find(c => c.id === h.companyId)?.shortName}
                  </span>
                </div>

                {(role === 'SUPER_ADMIN' || role === 'HR_MANAGER') && (
                  <button
                    onClick={() => {
                      deleteHoliday(h.id);
                      Alert.success('ลบวันหยุดแล้ว');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="ลบวันหยุด"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Request Attendance Correction */}
      <Modal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        title="ขอแก้ไขเวลาการลงงาน (Attendance Correction)"
        subtitle={`พนักงาน: ${targetAttForCorrection?.employeeName} (วันที่ ${formatThaiDate(targetAttForCorrection?.date)})`}
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowCorrectionModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleCorrectionSubmit}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] text-white hover:bg-[#022247]"
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

      {/* Modal: Add Holiday */}
      <Modal
        isOpen={showHolidayModal}
        onClose={() => setShowHolidayModal(false)}
        title="เพิ่มวันหยุดประจำปีบริษัท"
        subtitle="วันหยุดตามประเพณี VN Group"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowHolidayModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleAddHoliday}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] text-white hover:bg-[#022247]"
            >
              บันทึกวันหยุด
            </button>
          </>
        }
      >
        <form onSubmit={handleAddHoliday} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ชื่อวันหยุด: *</label>
            <input
              type="text"
              value={holidayName}
              onChange={e => setHolidayName(e.target.value)}
              placeholder="เช่น วันหยุดพิเศษประจำสาขา"
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              required
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">วันที่: *</label>
            <input
              type="date"
              value={holidayDate}
              onChange={e => setHolidayDate(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              required
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">สาขาที่บังคับใช้:</label>
            <select
              value={holidayCompanyId}
              onChange={e => setHolidayCompanyId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="ALL">ทุกสาขา (ทั่วทั้งเครือ)</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};
