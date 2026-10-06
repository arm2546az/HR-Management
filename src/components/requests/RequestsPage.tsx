import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHR } from '../../context/HRContext';
import { DataTable, Column } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { UnifiedRequest, LeaveType } from '../../types';
import { formatThaiDate, getLeaveTypeName, getStatusBadge, Alert } from '../../utils/helpers';

export const RequestsPage: React.FC = () => {
  const { currentEmployee, currentUser, role, canApproveFor } = useAuth();
  const {
    requests,
    submitLeaveRequest,
    submitOTRequest,
    approveRequest,
    rejectRequest,
    cancelRequest,
    employees,
    selectedCompanyId,
  } = useHR();

  // Tabs: 'PENDING' (รออนุมัติ) | 'ALL' (คำขอทั้งหมด) | 'HISTORY' (ประวัติการอนุมัติ)
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ALL' | 'HISTORY'>('PENDING');

  // Modals
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showOTModal, setShowOTModal] = useState(false);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState<UnifiedRequest | null>(null);

  // Leave Form State
  const [leaveEmployeeId, setLeaveEmployeeId] = useState(currentEmployee?.id || employees[0]?.id || '');
  const [leaveType, setLeaveType] = useState<LeaveType>('ANNUAL');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<'MORNING' | 'AFTERNOON'>('MORNING');
  const [startDate, setStartDate] = useState('2026-10-15');
  const [endDate, setEndDate] = useState('2026-10-15');
  const [daysCount, setDaysCount] = useState(1);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveAttachment, setLeaveAttachment] = useState('');

  // OT Form State
  const [otEmployeeId, setOtEmployeeId] = useState(currentEmployee?.id || employees[0]?.id || '');
  const [otStartDate, setOtStartDate] = useState('2026-10-16 17:00');
  const [otEndDate, setOtEndDate] = useState('2026-10-16 20:00');
  const [otHours, setOtHours] = useState(3);
  const [otMultiplier, setOtMultiplier] = useState(1.5);
  const [otReason, setOtReason] = useState('');

  // Filter requests based on selected company and role
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      // Company filter
      if (selectedCompanyId !== 'ALL' && r.companyId !== selectedCompanyId) {
        return false;
      }
      // If role is EMPLOYEE, only show own requests
      if (role === 'EMPLOYEE' && r.employeeId !== currentEmployee?.id) {
        return false;
      }
      // Tab filter
      if (activeTab === 'PENDING') {
        return r.status === 'PENDING';
      }
      if (activeTab === 'HISTORY') {
        return r.status === 'APPROVED' || r.status === 'REJECTED' || r.status === 'CANCELLED';
      }
      return true; // ALL
    });
  }, [requests, selectedCompanyId, role, currentEmployee, activeTab]);

  // Handle Leave Submission
  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveEmployeeId) {
      Alert.warning('ไม่มีข้อมูลพนักงาน', 'กรุณาเพิ่มข้อมูลพนักงานในระบบก่อนยื่นคำขอลา');
      return;
    }
    if (!leaveReason.trim()) {
      Alert.warning('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุเหตุผลการขอลา');
      return;
    }
    const finalDays = isHalfDay ? 0.5 : daysCount;
    const res = submitLeaveRequest({
      employeeId: leaveEmployeeId,
      leaveType,
      isHalfDay,
      halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
      startDate,
      endDate: isHalfDay ? startDate : endDate,
      daysCount: finalDays,
      reason: leaveReason,
      attachmentName: leaveAttachment || undefined,
    });

    if (res.success) {
      Alert.success('ยื่นคำขอสำเร็จ', res.message);
      setShowLeaveModal(false);
      setLeaveReason('');
      setLeaveAttachment('');
    } else {
      Alert.error('ไม่สามารถส่งคำขอได้', res.message);
    }
  };

  // Handle OT Submission
  const handleOTSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otEmployeeId) {
      Alert.warning('ไม่มีข้อมูลพนักงาน', 'กรุณาเพิ่มข้อมูลพนักงานในระบบก่อนยื่นคำขอ OT');
      return;
    }
    if (!otReason.trim()) {
      Alert.warning('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุเหตุผลการขอทำ OT');
      return;
    }
    const res = submitOTRequest({
      employeeId: otEmployeeId,
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

  // Action: Approve
  const handleApprove = async (req: UnifiedRequest) => {
    // Check permission: Cannot approve own request!
    if (currentEmployee && currentEmployee.id === req.employeeId) {
      Alert.error('ไม่อนุญาต', 'ห้ามอนุมัติคำขอของตัวเอง กรุณาให้หัวหน้างานหรือผู้บริหารเป็นผู้อนุมัติ');
      return;
    }

    const confirmed = await Alert.confirm(
      `ยืนยันการอนุมัติคำขอ`,
      `คุณต้องการอนุมัติคำขอ ${req.requestCode} (${req.employeeName}) ใช่หรือไม่?`,
      'อนุมัติคำขอ'
    );
    if (!confirmed) return;

    const res = approveRequest(req.id, 'อนุมัติเรียบร้อยโดย ' + (currentEmployee?.firstName || 'หัวหน้า'));
    if (res.success) {
      Alert.success('ดำเนินการสำเร็จ', res.message);
      if (selectedRequestDetail) setSelectedRequestDetail(null);
    } else {
      Alert.error('เกิดข้อผิดพลาด', res.message);
    }
  };

  // Action: Reject
  const handleReject = async (req: UnifiedRequest) => {
    const { confirmed, reason } = await Alert.promptReason(
      `ปฏิเสธคำขอ ${req.requestCode}`,
      'ระบุเหตุผลในการไม่อนุมัติ (จำเป็น)...'
    );
    if (!confirmed || !reason.trim()) return;

    const res = rejectRequest(req.id, reason);
    if (res.success) {
      Alert.success('ปฏิเสธคำขอแล้ว', res.message);
      if (selectedRequestDetail) setSelectedRequestDetail(null);
    } else {
      Alert.error('เกิดข้อผิดพลาด', res.message);
    }
  };

  // Action: Cancel
  const handleCancel = async (req: UnifiedRequest) => {
    const { confirmed, reason } = await Alert.promptReason(
      `ยกเลิกคำขอ ${req.requestCode}`,
      'ระบุเหตุผลในการขอยกเลิกคำขอ...'
    );
    if (!confirmed || !reason.trim()) return;

    const res = cancelRequest(req.id, reason);
    if (res.success) {
      Alert.success('ยกเลิกคำขอแล้ว', res.message);
      if (selectedRequestDetail) setSelectedRequestDetail(null);
    } else {
      Alert.error('เกิดข้อผิดพลาด', res.message);
    }
  };

  // Check quota for selected employee in modal
  const selectedEmpForLeave = employees.find(e => e.id === leaveEmployeeId);
  const currentQuota = selectedEmpForLeave?.leaveQuotas[leaveType];

  const columns: Column<UnifiedRequest>[] = [
    {
      key: 'requestCode',
      header: 'เลขที่คำขอ',
      render: (row) => (
        <div>
          <button
            onClick={() => setSelectedRequestDetail(row)}
            className="font-bold text-[#064a8b] hover:underline flex items-center gap-1.5"
          >
            <span>{row.requestCode}</span>
            <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
          </button>
          <span className="text-[11px] text-slate-400 block">{row.submittedAt?.split(' ')[0]}</span>
        </div>
      ),
    },
    {
      key: 'employeeName',
      header: 'ผู้ขอ / แผนก',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 leading-tight">{row.employeeName}</p>
          <p className="text-[11px] text-slate-500">{row.departmentName} ({row.employeeCode})</p>
        </div>
      ),
    },
    {
      key: 'requestType',
      header: 'ประเภทคำขอ',
      align: 'center',
      render: (row) => (
        <div className="flex flex-col items-center">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            row.requestType === 'LEAVE'
              ? 'bg-blue-100 text-[#064a8b] border border-blue-200'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {row.requestType === 'LEAVE' ? `วันลา (${getLeaveTypeName(row.leaveType)})` : 'ล่วงเวลา (OT)'}
          </span>
          {row.isHalfDay && (
            <span className="text-[10px] text-purple-700 font-medium mt-0.5">
              ครึ่งวัน ({row.halfDayPeriod === 'MORNING' ? 'ช่วงเช้า' : 'ช่วงบ่าย'})
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'startDate',
      header: 'วันที่ / ช่วงเวลา',
      render: (row) => (
        <div>
          {row.requestType === 'LEAVE' ? (
            <p className="font-medium text-slate-800 text-xs">
              {formatThaiDate(row.startDate)} {row.startDate !== row.endDate ? `ถึง ${formatThaiDate(row.endDate)}` : ''}
            </p>
          ) : (
            <p className="font-medium text-slate-800 text-xs">{row.startDate} - {row.endDate.split(' ')[1] || row.endDate}</p>
          )}
          <span className="text-[11px] font-bold text-slate-600">
            {row.requestType === 'LEAVE' ? `จำนวน ${row.daysCount} วัน` : `จำนวน ${row.otHours} ชม. (x${row.otMultiplier || 1.5})`}
          </span>
        </div>
      ),
    },
    {
      key: 'approverName',
      header: 'ผู้อนุมัติ',
      render: (row) => (
        <span className="text-xs text-slate-700">
          <i className="fa-solid fa-user-check text-slate-400 mr-1 text-[10px]"></i>
          {row.approverName}
        </span>
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
      render: (row) => {
        const canApproveThis = (role === 'SUPER_ADMIN' || canApproveFor(row.employeeId)) && row.status === 'PENDING';
        const isOwn = currentEmployee?.id === row.employeeId;
        const canCancelThis = isOwn && (row.status === 'PENDING' || row.status === 'APPROVED');

        return (
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => setSelectedRequestDetail(row)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-[#064a8b] hover:bg-slate-100 transition-colors"
              title="ดูรายละเอียด"
            >
              <i className="fa-regular fa-eye"></i>
            </button>

            {canApproveThis && (
              <>
                <button
                  onClick={() => handleApprove(row)}
                  className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors flex items-center gap-1"
                  title="อนุมัติ"
                >
                  <i className="fa-solid fa-check"></i>
                  อนุมัติ
                </button>
                <button
                  onClick={() => handleReject(row)}
                  className="px-2 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors flex items-center gap-1"
                  title="ไม่อนุมัติ"
                >
                  <i className="fa-solid fa-xmark"></i>
                  ปฏิเสธ
                </button>
              </>
            )}

            {canCancelThis && !canApproveThis && (
              <button
                onClick={() => handleCancel(row)}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-200 text-slate-700 hover:bg-rose-100 hover:text-rose-700 transition-colors"
                title="ขอยกเลิกคำขอ"
              >
                ยกเลิก
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // Custom Card Renderer for Requests
  const renderRequestCard = (req: UnifiedRequest) => {
    const badge = getStatusBadge(req.status);
    const canApproveThis = (role === 'SUPER_ADMIN' || canApproveFor(req.employeeId)) && req.status === 'PENDING';
    const isOwn = currentEmployee?.id === req.employeeId;
    const canCancelThis = isOwn && (req.status === 'PENDING' || req.status === 'APPROVED');

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-[#064a8b] transition-all flex flex-col justify-between group">
        <div>
          {/* Card Top: Code & Status */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <button
              onClick={() => setSelectedRequestDetail(req)}
              className="font-black text-sm text-[#064a8b] hover:underline flex items-center gap-1.5"
            >
              <i className="fa-solid fa-file-invoice text-slate-400"></i>
              <span>{req.requestCode}</span>
            </button>

            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badge.bgClass} ${badge.textClass}`}>
              <i className={`fa-solid ${badge.icon} text-[9px]`}></i>
              {badge.label}
            </span>
          </div>

          {/* Requester Info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
              {req.employeeName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-800 text-xs truncate">
                {req.employeeName}
              </h4>
              <p className="text-[11px] text-slate-500 truncate">
                {req.departmentName} ({req.employeeCode})
              </p>
            </div>
          </div>

          {/* Type & Period Highlight Box */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 mb-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                req.requestType === 'LEAVE'
                  ? 'bg-blue-100 text-[#064a8b]'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {req.requestType === 'LEAVE'
                  ? `วันลา: ${getLeaveTypeName(req.leaveType)}`
                  : 'ทำงานล่วงเวลา (OT)'}
              </span>
              <span className="font-black text-slate-800 text-xs">
                {req.requestType === 'LEAVE'
                  ? `${req.daysCount} วัน`
                  : `${req.otHours} ชม. (x${req.otMultiplier || 1.5})`}
              </span>
            </div>

            <div className="text-slate-600 font-medium text-[11px]">
              <i className="fa-regular fa-calendar text-slate-400 mr-1.5"></i>
              {req.requestType === 'LEAVE' ? (
                <span>
                  {formatThaiDate(req.startDate)} {req.startDate !== req.endDate ? `ถึง ${formatThaiDate(req.endDate)}` : ''}
                  {req.isHalfDay && ` (ครึ่งวัน ${req.halfDayPeriod === 'MORNING' ? 'เช้า' : 'บ่าย'})`}
                </span>
              ) : (
                <span>{req.startDate} - {req.endDate.split(' ')[1] || req.endDate}</span>
              )}
            </div>
          </div>

          {/* Reason Quote */}
          <div className="mb-3">
            <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
              "{req.reason}"
            </p>
          </div>

          {/* Approver Meta */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>
              <i className="fa-solid fa-user-check mr-1 text-slate-400"></i>
              ผู้อนุมัติ: <strong className="text-slate-600">{req.approverName}</strong>
            </span>
            <span>{req.submittedAt?.split(' ')[0]}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 mt-3 flex items-center gap-2">
          <button
            onClick={() => setSelectedRequestDetail(req)}
            className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-[#064a8b] hover:text-white text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1"
          >
            <i className="fa-regular fa-eye"></i>
            <span>ดูข้อมูล</span>
          </button>

          {canApproveThis && (
            <>
              <button
                onClick={() => handleApprove(req)}
                className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
                title="อนุมัติคำขอ"
              >
                <i className="fa-solid fa-check"></i>
                <span>อนุมัติ</span>
              </button>
              <button
                onClick={() => handleReject(req)}
                className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
                title="ปฏิเสธคำขอ"
              >
                <i className="fa-solid fa-xmark"></i>
                <span>ปฏิเสธ</span>
              </button>
            </>
          )}

          {canCancelThis && !canApproveThis && (
            <button
              onClick={() => handleCancel(req)}
              className="py-1.5 px-2.5 rounded-xl bg-slate-200 text-slate-700 hover:bg-rose-100 hover:text-rose-700 text-xs font-bold transition-colors"
            >
              ยกเลิก
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-[#022247] flex items-center gap-2">
            <i className="fa-solid fa-envelope-open-text text-[#064a8b]"></i>
            ระบบคำขอและการอนุมัติ (Leave & OT Center)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            รวมคำขอลาหยุดและคำขอทำงานล่วงเวลา (OT) ในหน้าเดียว ตรวจสอบและอนุมัติตามสายงาน
          </p>
        </div>

        {role !== 'SUPER_ADMIN' ? (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowLeaveModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white shadow-sm transition-all flex items-center gap-1.5"
            >
              <i className="fa-solid fa-calendar-plus text-[#c3a138]"></i>
              ยื่นคำขอลาหยุด
            </button>
            <button
              onClick={() => setShowOTModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all flex items-center gap-1.5"
            >
              <i className="fa-solid fa-business-time"></i>
              ยื่นคำขอ OT
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1.5">
              <i className="fa-solid fa-crown text-purple-600"></i>
              ศูนย์พิจารณาอนุมัติคำขอ (Super Admin)
            </span>
          </div>
        )}
      </div>

      {/* 3 Tabs: รออนุมัติ | คำขอทั้งหมด | ประวัติการอนุมัติ */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'PENDING'
              ? 'bg-[#064a8b] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <i className="fa-solid fa-hourglass-half"></i>
          <span>รออนุมัติ</span>
          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
            activeTab === 'PENDING' ? 'bg-[#c3a138] text-slate-900' : 'bg-slate-200 text-slate-700'
          }`}>
            {requests.filter(r => r.status === 'PENDING').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ALL'
              ? 'bg-[#064a8b] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <i className="fa-solid fa-list-check"></i>
          <span>คำขอทั้งหมด</span>
          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
            activeTab === 'ALL' ? 'bg-[#c3a138] text-slate-900' : 'bg-slate-200 text-slate-700'
          }`}>
            {requests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'HISTORY'
              ? 'bg-[#064a8b] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <i className="fa-solid fa-clock-rotate-left"></i>
          <span>ประวัติการอนุมัติ</span>
          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
            activeTab === 'HISTORY' ? 'bg-[#c3a138] text-slate-900' : 'bg-slate-200 text-slate-700'
          }`}>
            {requests.filter(r => r.status !== 'PENDING').length}
          </span>
        </button>
      </div>

      {/* Main DataTable with Card view support */}
      <DataTable
        columns={columns}
        data={filteredRequests}
        searchPlaceholder="ค้นหาเลขที่คำขอ, ชื่อพนักงาน, แผนก..."
        emptyText={
          activeTab === 'PENDING'
            ? 'ไม่มีคำขอที่ค้างรอการอนุมัติ'
            : activeTab === 'HISTORY'
            ? 'ยังไม่มีประวัติการอนุมัติ'
            : 'ไม่พบรายการคำขอ'
        }
        renderCard={renderRequestCard}
        defaultViewMode="card"
      />

      {/* Modal 1: Request Leave */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="ส่งคำขอลาหยุดงาน (Leave Request)"
        subtitle="ระบบจะตรวจสอบโควต้าวันลาคงเหลือและกันยอดไว้ทันที"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setShowLeaveModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleLeaveSubmit}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#064a8b] text-white hover:bg-[#022247] shadow-sm flex items-center gap-1.5"
            >
              <i className="fa-solid fa-paper-plane"></i>
              ส่งคำขอลา
            </button>
          </>
        }
      >
        <form onSubmit={handleLeaveSubmit} className="space-y-4">
          {/* Employee selector (if admin/hr) */}
          {(role === 'SUPER_ADMIN' || role === 'HR_MANAGER') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                พนักงานที่ขอลา:
              </label>
              <select
                value={leaveEmployeeId}
                onChange={e => setLeaveEmployeeId(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode} - {emp.positionName})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ประเภทการลา:
              </label>
              <select
                value={leaveType}
                onChange={e => setLeaveType(e.target.value as LeaveType)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-medium"
              >
                <option value="SICK">ลาป่วย (Sick Leave)</option>
                <option value="PERSONAL">ลากิจส่วนตัว (Personal Leave)</option>
                <option value="ANNUAL">ลาพักผ่อนประจำปี (Annual Leave)</option>
                <option value="MATERNITY">ลาคลอด (Maternity Leave)</option>
                <option value="TRAINING">ลาฝึกอบรม (Training Leave)</option>
              </select>
            </div>

            {/* Quota preview card */}
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#064a8b] font-bold">โควต้า {getLeaveTypeName(leaveType)}</p>
                <p className="text-[10px] text-slate-500">คงเหลือใช้งานได้:</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-[#064a8b]">
                  {(currentQuota?.remainingDays || 0) - (currentQuota?.pendingDays || 0)}
                </span>
                <span className="text-xs text-slate-500 ml-1">วัน</span>
                <p className="text-[9px] text-slate-400">
                  (รออนุมัติ: {currentQuota?.pendingDays || 0} วัน)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isHalfDay}
                onChange={e => setIsHalfDay(e.target.checked)}
                className="w-4 h-4 text-[#064a8b] rounded"
              />
              <span>ลาครึ่งวัน (0.5 วัน)</span>
            </label>

            {isHalfDay && (
              <div className="flex items-center gap-3 ml-4">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="halfDayPeriod"
                    value="MORNING"
                    checked={halfDayPeriod === 'MORNING'}
                    onChange={() => setHalfDayPeriod('MORNING')}
                  />
                  <span>ช่วงเช้า</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="halfDayPeriod"
                    value="AFTERNOON"
                    checked={halfDayPeriod === 'AFTERNOON'}
                    onChange={() => setHalfDayPeriod('AFTERNOON')}
                  />
                  <span>ช่วงบ่าย</span>
                </label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ตั้งแต่วันที่:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ถึงวันที่:
              </label>
              <input
                type="date"
                value={isHalfDay ? startDate : endDate}
                disabled={isHalfDay}
                onChange={e => setEndDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl disabled:bg-slate-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              เหตุผลการลา: <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={leaveReason}
              onChange={e => setLeaveReason(e.target.value)}
              placeholder="ระบุเหตุผลความจำเป็น เช่น ไปทำธุระต่ออายุใบขับขี่, มีไข้หวัดพบแพทย์..."
              rows={3}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#064a8b]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              แนบเอกสารประกอบ (JPG, PNG, PDF ขนาดไม่เกิน 5 MB):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={leaveAttachment}
                onChange={e => setLeaveAttachment(e.target.value)}
                placeholder="ชื่อไฟล์แนบ เช่น medical_cert.pdf หรือคลิกจำลองอัปโหลด"
                className="flex-1 text-xs p-2.5 border border-slate-300 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setLeaveAttachment('cert_document_' + Date.now().toString().slice(-4) + '.pdf')}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300"
              >
                <i className="fa-solid fa-paperclip mr-1"></i> จำลองแนบไฟล์
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Request OT */}
      <Modal
        isOpen={showOTModal}
        onClose={() => setShowOTModal(false)}
        title="ส่งคำขอทำงานล่วงเวลา (OT Request)"
        subtitle="คำขอ OT ที่ผ่านการอนุมัติจะถูกนำไปคำนวณในรอบเงินเดือนโดยอัตโนมัติ"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setShowOTModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleOTSubmit}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-sm flex items-center gap-1.5"
            >
              <i className="fa-solid fa-paper-plane"></i>
              ส่งคำขอ OT
            </button>
          </>
        }
      >
        <form onSubmit={handleOTSubmit} className="space-y-4">
          {(role === 'SUPER_ADMIN' || role === 'HR_MANAGER') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                พนักงานที่ขอ OT:
              </label>
              <select
                value={otEmployeeId}
                onChange={e => setOtEmployeeId(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode} - {emp.positionName})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เวลาเริ่ม OT:
              </label>
              <input
                type="text"
                value={otStartDate}
                onChange={e => setOtStartDate(e.target.value)}
                placeholder="2026-10-16 17:00"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เวลาสิ้นสุด OT:
              </label>
              <input
                type="text"
                value={otEndDate}
                onChange={e => setOtEndDate(e.target.value)}
                placeholder="2026-10-16 20:00"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จำนวนชั่วโมง OT:
              </label>
              <input
                type="number"
                min={0.5}
                max={12}
                step={0.5}
                value={otHours}
                onChange={e => setOtHours(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-bold text-[#064a8b]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                อัตราการคูณ (Multiplier):
              </label>
              <select
                value={otMultiplier}
                onChange={e => setOtMultiplier(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-semibold"
              >
                <option value={1.5}>1.5 เท่า (วันทำงานปกติหลังเวลาทำการ)</option>
                <option value={2.0}>2.0 เท่า (วันหยุดประจำสัปดาห์ในเวลาทำการ)</option>
                <option value={3.0}>3.0 เท่า (วันหยุดประจำสัปดาห์นอกเวลาทำการ)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              เหตุผลการทำ OT: <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={otReason}
              onChange={e => setOtReason(e.target.value)}
              placeholder="ระบุรายละเอียดงาน เช่น ครูสอนขับรถรอบพิเศษเตรียมสอบใบขับขี่, งานซ่อมบำรุงยานพาหนะเร่งด่วน..."
              rows={3}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#064a8b]"
              required
            />
          </div>
        </form>
      </Modal>

      {/* Modal 3: Request Detail & Audit Action Log */}
      {selectedRequestDetail && (
        <Modal
          isOpen={Boolean(selectedRequestDetail)}
          onClose={() => setSelectedRequestDetail(null)}
          title={`รายละเอียดคำขอ ${selectedRequestDetail.requestCode}`}
          subtitle={`ผู้ยื่น: ${selectedRequestDetail.employeeName} (${selectedRequestDetail.departmentName})`}
          size="lg"
          footer={
            <div className="w-full flex items-center justify-between">
              <div>
                {selectedRequestDetail.status === 'PENDING' && (
                  <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                    <i className="fa-solid fa-hourglass-half"></i> อยู่ระหว่างรอการพิจารณา
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedRequestDetail(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  ปิดหน้าต่าง
                </button>
                {selectedRequestDetail.status === 'PENDING' && (role === 'SUPER_ADMIN' || canApproveFor(selectedRequestDetail.employeeId)) && (
                  <>
                    <button
                      onClick={() => handleReject(selectedRequestDetail)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
                    >
                      ปฏิเสธคำขอ
                    </button>
                    <button
                      onClick={() => handleApprove(selectedRequestDetail)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                    >
                      อนุมัติคำขอ
                    </button>
                  </>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Info Grid */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 block">ประเภทคำขอ:</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedRequestDetail.requestType === 'LEAVE'
                      ? `วันลา - ${getLeaveTypeName(selectedRequestDetail.leaveType)}`
                      : 'ทำงานล่วงเวลา (OT)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">สถานะปัจจุบัน:</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold mt-0.5 ${getStatusBadge(selectedRequestDetail.status).bgClass} ${getStatusBadge(selectedRequestDetail.status).textClass}`}>
                    {getStatusBadge(selectedRequestDetail.status).label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-2">
                <div>
                  <span className="text-slate-500 block">ช่วงวันที่ / เวลา:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedRequestDetail.requestType === 'LEAVE'
                      ? `${formatThaiDate(selectedRequestDetail.startDate)} ถึง ${formatThaiDate(selectedRequestDetail.endDate)}`
                      : `${selectedRequestDetail.startDate} ถึง ${selectedRequestDetail.endDate}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">จำนวน:</span>
                  <span className="font-bold text-[#064a8b]">
                    {selectedRequestDetail.requestType === 'LEAVE'
                      ? `${selectedRequestDetail.daysCount} วัน`
                      : `${selectedRequestDetail.otHours} ชั่วโมง (อัตราคูณ x${selectedRequestDetail.otMultiplier})`}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2">
                <span className="text-slate-500 block">เหตุผลประกอบ:</span>
                <p className="font-medium text-slate-800 mt-1 bg-white p-2.5 rounded-xl border border-slate-200">
                  {selectedRequestDetail.reason}
                </p>
              </div>

              {selectedRequestDetail.attachmentName && (
                <div className="border-t border-slate-200 pt-2">
                  <span className="text-slate-500 block">เอกสารแนบ:</span>
                  <div className="inline-flex items-center gap-2 mt-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[#064a8b] font-medium">
                    <i className="fa-solid fa-file-pdf"></i>
                    <span>{selectedRequestDetail.attachmentName}</span>
                    <span className="text-[10px] text-slate-400">(ตรวจสอบความถูกต้องแล้ว)</span>
                  </div>
                </div>
              )}

              {selectedRequestDetail.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <span className="font-bold block">เหตุผลที่ไม่อนุมัติ:</span>
                  <p className="mt-0.5">{selectedRequestDetail.rejectionReason}</p>
                </div>
              )}

              {selectedRequestDetail.cancellationReason && (
                <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-slate-700">
                  <span className="font-bold block">เหตุผลที่ยกเลิก:</span>
                  <p className="mt-0.5">{selectedRequestDetail.cancellationReason}</p>
                </div>
              )}
            </div>

            {/* Action History / Audit Trail */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <i className="fa-solid fa-timeline text-[#064a8b]"></i>
                ประวัติการดำเนินการ (Audit History)
              </h4>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {selectedRequestDetail.actionLogs?.map((log, idx) => (
                  <div key={idx} className="p-3 text-xs flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                      <i className={`fa-solid ${
                        log.action === 'SUBMITTED' ? 'fa-paper-plane text-blue-600' :
                        log.action === 'APPROVED' ? 'fa-check text-emerald-600' :
                        log.action === 'REJECTED' ? 'fa-xmark text-rose-600' :
                        'fa-ban text-slate-600'
                      } text-[11px]`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          {log.actionByName} ({log.actionRole})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {log.actionDate}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">
                        {log.comment || (log.action === 'SUBMITTED' ? 'ยื่นคำขอในระบบ' : log.action)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
