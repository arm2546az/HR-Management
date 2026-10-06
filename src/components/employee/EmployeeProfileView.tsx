import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHR } from '../../context/HRContext';
import { formatThaiDate, formatCurrency, getStatusBadge } from '../../utils/helpers';

export const EmployeeProfileView: React.FC = () => {
  const { currentEmployee } = useAuth();
  const { companies, departments, employees } = useHR();

  if (!currentEmployee) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-xl">
          <i className="fa-regular fa-user"></i>
        </div>
        <h3 className="font-bold text-slate-800 text-base">ยังไม่มีข้อมูลโปรไฟล์พนักงาน</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          ยังไม่มีข้อมูลพนักงานที่ผูกกับบัญชีนี้ คุณสามารถไปที่เมนูบริหารงานบุคคลเพื่อกดเพิ่มพนักงานใหม่ได้
        </p>
      </div>
    );
  }

  const myCompany = companies.find(c => c.id === currentEmployee.companyId);
  const myDept = departments.find(d => d.id === currentEmployee.departmentId);
  const myApprover = employees.find(e => e.id === currentEmployee.approverId);
  const badge = getStatusBadge(currentEmployee.employmentStatus);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#064a8b] text-white flex items-center justify-center font-black text-2xl shadow-md">
            {currentEmployee.firstName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#064a8b]">
                {currentEmployee.employeeCode}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badge.bgClass} ${badge.textClass}`}>
                {badge.label}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-800 mt-1">
              {currentEmployee.firstName} {currentEmployee.lastName} {currentEmployee.nickname ? `(${currentEmployee.nickname})` : ''}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentEmployee.positionName} • {myCompany?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <i className="fa-solid fa-user text-[#064a8b]"></i>
            ข้อมูลส่วนบุคคล
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">เบอร์โทรศัพท์:</span>
              <span className="font-bold text-slate-800">{currentEmployee.phone}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">อีเมลบริษัท:</span>
              <span className="font-bold text-slate-800">{currentEmployee.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">วันเกิด:</span>
              <span className="font-bold text-slate-800">{formatThaiDate(currentEmployee.birthDate)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">เลขบัตรประชาชน:</span>
              <span className="font-bold text-slate-800">{currentEmployee.idCardNumber}</span>
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <i className="fa-solid fa-briefcase text-[#064a8b]"></i>
            ข้อมูลการจ้างงานและสายงาน
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">แผนกงาน:</span>
              <span className="font-bold text-slate-800">{myDept?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">วันเริ่มงาน:</span>
              <span className="font-bold text-slate-800">{formatThaiDate(currentEmployee.hireDate)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">กะเวลาการทำงาน:</span>
              <span className="font-bold text-slate-800">{currentEmployee.workShift}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">หัวหน้างานผู้อนุมัติ:</span>
              <span className="font-bold text-[#064a8b]">
                {myApprover ? `${myApprover.firstName} ${myApprover.lastName}` : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Quota Details */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <i className="fa-solid fa-calendar-check text-[#c3a138]"></i>
          สรุปสิทธิ์วันลาคงเหลือของฉัน
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {Object.values(currentEmployee.leaveQuotas).slice(0, 3).map((q: any) => {
            const labelMap: Record<string, string> = {
              ANNUAL: 'วันลาพักร้อนคงเหลือ',
              SICK: 'วันลาป่วยคงเหลือ',
              PERSONAL: 'วันลากิจคงเหลือ',
            };
            return (
              <div key={q.leaveType} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block">{labelMap[q.leaveType] || q.leaveType}</span>
                <div className="text-2xl font-bold text-[#064a8b] mt-2">
                  {q.remainingDays} <span className="text-xs text-slate-400 font-normal">/ {q.entitledDays} วัน</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
