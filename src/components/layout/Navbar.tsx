import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHR } from '../../context/HRContext';
import { Role } from '../../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onNavigate,
}) => {
  const { currentUser, currentEmployee, role, logout } = useAuth();
  const {
    companies,
    selectedCompanyId,
    setSelectedCompanyId,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    requests,
  } = useHR();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Filter unread notifications relevant to current user/role
  const userNotifications = notifications.filter(n => {
    if (n.userId === currentUser?.id || n.userId === currentEmployee?.id || n.userId === 'ALL') return true;
    if (n.targetRole && n.targetRole === role) return true;
    return false;
  });

  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  // Pending requests count for badge
  const pendingRequestsCount = requests.filter(r => r.status === 'PENDING').length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleLabels: Record<Role, { title: string; badge: string; color: string; icon: string }> = {
    SUPER_ADMIN: { title: '1. Super Admin', badge: 'Super Admin', color: 'bg-purple-600 text-white', icon: 'fa-crown' },
    HR_MANAGER: { title: '2. HR manager', badge: 'HR Manager', color: 'bg-[#064a8b] text-white', icon: 'fa-user-tie' },
    DEPARTMENT_HEAD: { title: '3. หัวหน้าแผนก', badge: 'หัวหน้าแผนก', color: 'bg-amber-600 text-white', icon: 'fa-user-check' },
    EMPLOYEE: { title: '4. พนักงาน', badge: 'พนักงาน', color: 'bg-emerald-600 text-white', icon: 'fa-user' },
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      {/* Main Navbar */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
            title="เปิด/ปิด เมนูด้านข้าง"
          >
            <i className="fa-solid fa-bars text-lg"></i>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#022247] to-[#064a8b] text-[#c3a138] flex items-center justify-center shadow-sm font-bold text-lg">
              <i className="fa-solid fa-car-side"></i>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[#022247] text-base sm:text-lg tracking-tight">VN Group</span>
                <span className="hidden md:inline-block text-[11px] font-semibold bg-[#064a8b]/10 text-[#064a8b] px-2 py-0.5 rounded">
                  HRMS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block leading-none">
                โรงเรียนสอนขับรถวีเอ็น (กำแพงเพชร & ท่ามะเขือ)
              </p>
            </div>
          </div>
        </div>

        {/* Center: Branch Filter (for Admin/SuperAdmin) */}
        {role !== 'EMPLOYEE' && (
          <div className="hidden lg:flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-600 pl-2">
              <i className="fa-solid fa-building mr-1 text-[#064a8b]"></i> สาขา:
            </span>
            <select
              value={selectedCompanyId}
              onChange={e => setSelectedCompanyId(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#064a8b]"
            >
              <option value="ALL">🏢 ทุกสาขา (ภาพรวมทั้งเครือ VN Group)</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  📍 {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Right: Actions, Notifications & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Branch filter for small screens */}
          {role !== 'EMPLOYEE' && (
            <div className="lg:hidden">
              <select
                value={selectedCompanyId}
                onChange={e => setSelectedCompanyId(e.target.value)}
                className="text-xs bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-slate-800 max-w-[140px] truncate"
              >
                <option value="ALL">ทุกสาขา</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.shortName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Pending Approval Shortcut for Approvers/Admins */}
          {(role === 'DEPARTMENT_HEAD' || role === 'SUPER_ADMIN' || role === 'HR_MANAGER') && pendingRequestsCount > 0 && (
            <button
              onClick={() => onNavigate('requests')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
              title="มีคำขอรอการอนุมัติ"
            >
              <i className="fa-solid fa-clock-rotate-left text-amber-600"></i>
              <span>รออนุมัติ</span>
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] flex items-center justify-center font-bold">
                {pendingRequestsCount}
              </span>
            </button>
          )}

          {/* Notification Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
              title="การแจ้งเตือน"
            >
              <i className="fa-regular fa-bell text-lg"></i>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 bg-[#022247] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-bell text-[#c3a138]"></i>
                    <span className="font-bold text-sm">การแจ้งเตือนในระบบ</span>
                    {unreadCount > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                        {unreadCount} ใหม่
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] text-[#a4b3d3] hover:text-white underline"
                    >
                      อ่านทั้งหมด
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {userNotifications.length > 0 ? (
                    userNotifications.slice(0, 8).map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          if (n.linkTarget) onNavigate(n.linkTarget);
                          setShowNotifDropdown(false);
                        }}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                          !n.isRead ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            n.type === 'REQUEST' ? 'bg-amber-100 text-amber-700' :
                            n.type === 'APPROVAL' ? 'bg-emerald-100 text-emerald-700' :
                            n.type === 'PROBATION' ? 'bg-purple-100 text-purple-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            <i className={`fa-solid ${
                              n.type === 'REQUEST' ? 'fa-file-invoice' :
                              n.type === 'APPROVAL' ? 'fa-circle-check' :
                              n.type === 'PROBATION' ? 'fa-user-clock' :
                              'fa-coins'
                            } text-xs`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs truncate ${!n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                {n.title}
                              </p>
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {n.createdAt}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400">
                      <i className="fa-regular fa-bell-slash text-3xl mb-2 text-slate-300"></i>
                      <p className="text-xs">ไม่มีการแจ้งเตือนใหม่</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-[#064a8b] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {currentEmployee?.firstName?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : currentUser?.username}
                </p>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${roleLabels[role].color}`}>
                    {roleLabels[role].badge}
                  </span>
                </div>
              </div>
              <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 hidden md:block"></i>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <p className="text-xs text-slate-500">เข้าสู่ระบบในชื่อ</p>
                  <p className="text-sm font-bold text-slate-800">
                    {currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : currentUser?.username}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {currentEmployee?.positionName || 'ผู้ใช้งาน'}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    <i className={`fa-solid ${roleLabels[role].icon} text-xs`}></i>
                    {roleLabels[role].title}
                  </div>
                </div>

                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      onNavigate(role === 'EMPLOYEE' ? 'emp-profile' : 'employees');
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <i className="fa-solid fa-id-badge text-slate-400"></i>
                    โปรไฟล์พนักงาน
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
