import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHR } from '../../context/HRContext';
import { Role } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  desc?: string;
  badge?: number;
  badgeColor?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
}) => {
  const { role, currentUser, currentEmployee, switchRole, logout } = useAuth();
  const { requests, selectedCompanyId, setSelectedCompanyId, companies } = useHR();

  // Branch selector dropdown toggle in sidebar
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  // Role switcher dropdown toggle in sidebar
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  // Pending counts
  const pendingRequestsCount = requests.filter(r => r.status === 'PENDING').length;
  const pendingLeaveCount = requests.filter(r => r.requestType === 'LEAVE' && r.status === 'PENDING').length;

  const handleNavClick = (tabKey: string) => {
    onSelectTab(tabKey);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  // Branch name calculation
  const currentBranchName = selectedCompanyId === 'ALL'
    ? 'ทุกสาขาในเครือ (VN Group)'
    : companies.find(c => c.id === selectedCompanyId)?.shortName || 'สาขาที่เลือก';

  // Role metadata
  const roleCardMeta: Record<Role, {
    name: string;
    title: string;
    badgeColor: string;
    ringColor: string;
    icon: string;
    iconColor: string;
    avatarBg: string;
  }> = {
    SUPER_ADMIN: {
      name: 'Super Admin',
      title: 'ผู้บริหารสูงสุด (Executive)',
      badgeColor: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
      ringColor: 'ring-purple-400/40',
      icon: 'fa-crown',
      iconColor: 'text-purple-300',
      avatarBg: 'bg-purple-900/60 border-purple-400/30',
    },
    HR_MANAGER: {
      name: 'HR Manager',
      title: 'ผู้จัดการฝ่ายบุคคล (HR Admin)',
      badgeColor: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white',
      ringColor: 'ring-blue-400/40',
      icon: 'fa-user-tie',
      iconColor: 'text-cyan-300',
      avatarBg: 'bg-blue-900/60 border-blue-400/30',
    },
    DEPARTMENT_HEAD: {
      name: 'หัวหน้าแผนก',
      title: 'หัวหน้าฝ่าย / สายอนุมัติ (Dept Head)',
      badgeColor: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
      ringColor: 'ring-amber-400/40',
      icon: 'fa-user-check',
      iconColor: 'text-amber-300',
      avatarBg: 'bg-amber-900/60 border-amber-400/30',
    },
    EMPLOYEE: {
      name: 'พนักงาน',
      title: 'ผู้ใช้งานทั่วไป (Staff)',
      badgeColor: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white',
      ringColor: 'ring-emerald-400/40',
      icon: 'fa-user',
      iconColor: 'text-emerald-300',
      avatarBg: 'bg-emerald-900/60 border-emerald-400/30',
    },
  };

  const currentRoleMeta = roleCardMeta[role] || roleCardMeta.SUPER_ADMIN;

  // 1. Super Admin Menu Sections
  const superAdminSections: MenuSection[] = [
    {
      title: 'ภาพรวมและการอนุมัติ',
      items: [
        {
          key: 'dashboard',
          label: 'ภาพรวมผู้บริหาร',
          icon: 'fa-chart-pie',
          desc: 'แดชบอร์ดสรุป สถิติรวม ผู้ลาวันนี้ ครบโปร',
        },
        {
          key: 'requests',
          label: 'ศูนย์อนุมัติคำขอ',
          icon: 'fa-envelope-open-text',
          desc: 'พิจารณาคำขอลาหยุด และทำงานล่วงเวลา (OT)',
          badge: pendingRequestsCount,
          badgeColor: 'bg-[#c3a138] text-slate-950',
        },
      ],
    },
    {
      title: 'งานบริหารจัดการ',
      items: [
        {
          key: 'hr-management',
          label: 'บริหารงานบุคคล',
          icon: 'fa-users',
          desc: 'จัดการพนักงาน ติดตามสถานะ ประเมินโปร วันหยุด',
        },
        {
          key: 'attendance-leave',
          label: 'เวลางานและวันลา',
          icon: 'fa-calendar-days',
          desc: 'ประวัติลงเวลา ตรวจสอบการเข้าสาย ปฏิทินงาน',
        },
        {
          key: 'hr-payroll-reports',
          label: 'เงินเดือนและรายงาน',
          icon: 'fa-money-check-dollar',
          desc: 'คำนวณเงินเดือน ปกส. กยศ. ภาษี 4 รายงานสรุป',
        },
      ],
    },
    {
      title: 'ระบบและความปลอดภัย',
      items: [
        {
          key: 'settings',
          label: 'ตั้งค่าระบบองค์กร',
          icon: 'fa-sliders',
          desc: 'โครงสร้างบริษัท สาขา แผนก ตำแหน่ง สิทธิ์ใช้งาน',
        },
      ],
    },
  ];

  // 2. HR Manager Menu Sections (2 consolidate workspaces with clarity)
  const hrManagerSections: MenuSection[] = [
    {
      title: '1) บริหารงานบุคคล',
      items: [
        {
          key: 'hr-management',
          label: 'บริหารงานบุคคล',
          icon: 'fa-users',
          desc: 'จัดการพนักงาน ติดตามสถานะ อนุมัติวันลา วันหยุดบริษัท',
          badge: pendingLeaveCount,
          badgeColor: 'bg-[#c3a138] text-slate-950',
        },
      ],
    },
    {
      title: '2) เงินเดือนและรายงาน',
      items: [
        {
          key: 'hr-payroll-reports',
          label: 'เงินเดือนและรายงาน',
          icon: 'fa-money-check-dollar',
          desc: 'รอบเงินเดือน คำนวณภาษี ปกส. กยศ. สลิป 4 รายงานสรุป',
        },
      ],
    },
  ];

  // 3. Department Head Menu Sections
  const deptHeadSections: MenuSection[] = [
    {
      title: 'ภาพรวมงานทีม',
      items: [
        {
          key: 'dashboard',
          label: 'ภาพรวมทีม',
          icon: 'fa-chart-pie',
          desc: 'สถิติทีม และพนักงานในความรับผิดชอบ',
        },
      ],
    },
    {
      title: 'การกำกับดูแลสมาชิก',
      items: [
        {
          key: 'requests',
          label: 'คำขอของทีม',
          icon: 'fa-user-check',
          desc: 'อนุมัติหรือปฏิเสธคำขอลา และ OT ของสมาชิกในทีม',
          badge: pendingRequestsCount,
          badgeColor: 'bg-[#c3a138] text-slate-950',
        },
        {
          key: 'attendance-leave',
          label: 'เวลางานของทีม',
          icon: 'fa-calendar-days',
          desc: 'ตรวจสอบประวัติการลงเวลาเข้า-ออกงานของสมาชิก',
        },
      ],
    },
  ];

  // 4. Employee Menu Sections
  const employeeSections: MenuSection[] = [
    {
      title: 'กิจกรรมประจำวัน',
      items: [
        {
          key: 'emp-home',
          label: 'หน้าหลัก & ลงเวลา',
          icon: 'fa-house-chimney',
          desc: 'ลงเวลาเข้า-ออกงาน ประกาศบริษัท วันลาคงเหลือ',
        },
        {
          key: 'emp-requests',
          label: 'คำขอของฉัน & สลิปเงินเดือน',
          icon: 'fa-file-signature',
          desc: 'ระบบยื่นคำขอลาหยุด, ขอ OT และสลิปเงินเดือน e-Slip',
        },
        {
          key: 'emp-attendance',
          label: 'เวลางานและวันลา',
          icon: 'fa-clock-rotate-left',
          desc: 'ประวัติการลงเวลาทำงาน และปฏิทินวันหยุดบริษัท',
        },
      ],
    },
    {
      title: 'ข้อมูลและเอกสาร',
      items: [
        {
          key: 'emp-profile',
          label: 'โปรไฟล์ของฉัน',
          icon: 'fa-id-card',
          desc: 'ข้อมูลส่วนตัว สัญญาจ้าง และรายละเอียดสิทธิประโยชน์',
        },
      ],
    },
  ];

  const currentSections = role === 'HR_MANAGER'
    ? hrManagerSections
    : role === 'SUPER_ADMIN'
    ? superAdminSections
    : role === 'DEPARTMENT_HEAD'
    ? deptHeadSections
    : employeeSections;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-gradient-to-b from-[#01142b] via-[#021d3f] to-[#010e20] text-white flex flex-col transition-all duration-300 ease-in-out border-r border-[#083a6f]/60 shadow-2xl lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* =========================================
            1. BRAND HEADER & BRANCH SELECTOR
           ========================================= */}
        <div className="p-4 border-b border-[#083a6f]/60 relative bg-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Luxury VN Emblem */}
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0a58ca] via-[#064a8b] to-[#022247] border-2 border-[#c3a138] text-[#c3a138] flex items-center justify-center font-black text-xl shadow-lg ring-2 ring-[#c3a138]/20 shrink-0">
                <i className="fa-solid fa-car-side"></i>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-black text-base text-white tracking-wider leading-none">
                    VN GROUP
                  </h1>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#c3a138] text-slate-950 uppercase tracking-tighter">
                    HRMS
                  </span>
                </div>
                <p className="text-[11px] text-[#a4b3d3] leading-tight font-medium truncate mt-1">
                  โรงเรียนสอนขับรถวีเอ็น
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors lg:hidden"
              title="ปิดเมนู"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          {/* Branch Switcher Trigger Button */}
          <div className="mt-3 relative">
            <button
              onClick={() => setShowBranchDropdown(!showBranchDropdown)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-[11px] text-[#cad7f5] transition-all"
              title="คลิกเพื่อสลับสาขาที่ต้องการดูข้อมูล"
            >
              <div className="flex items-center gap-2 truncate">
                <i className="fa-solid fa-location-dot text-[#c3a138] text-xs shrink-0"></i>
                <span className="font-semibold truncate">{currentBranchName}</span>
              </div>
              <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`}></i>
            </button>

            {/* Branch Dropdown Popover */}
            {showBranchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#021d3f] border border-[#083a6f] rounded-xl shadow-2xl p-1 z-50 text-xs space-y-0.5">
                <button
                  onClick={() => {
                    setSelectedCompanyId('ALL');
                    setShowBranchDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-between ${
                    selectedCompanyId === 'ALL'
                      ? 'bg-[#064a8b] text-white font-bold'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <span className="truncate">🏢 ทุกสาขาในเครือ</span>
                  {selectedCompanyId === 'ALL' && <i className="fa-solid fa-check text-[10px] text-[#c3a138]"></i>}
                </button>

                {companies.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCompanyId(c.id);
                      setShowBranchDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-between ${
                      selectedCompanyId === c.id
                        ? 'bg-[#064a8b] text-white font-bold'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <span className="truncate">📍 {c.shortName}</span>
                    {selectedCompanyId === c.id && <i className="fa-solid fa-check text-[10px] text-[#c3a138]"></i>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* =========================================
            2. USER PROFILE & ROLE SWITCHER
           ========================================= */}
        <div className="px-3 pt-3">
          <div className="p-3 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-xs relative group">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${currentRoleMeta.avatarBg} border flex items-center justify-center shadow-inner shrink-0 ${currentRoleMeta.ringColor}`}>
                <i className={`fa-solid ${currentRoleMeta.icon} text-base ${currentRoleMeta.iconColor}`}></i>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-white truncate">
                    {currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : (currentUser?.username || 'ผู้ดูแลระบบ')}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="สถานะ: ออนไลน์"></span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${currentRoleMeta.badgeColor} shadow-xs truncate`}>
                    {currentRoleMeta.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Role Switcher Button */}
            <div className="mt-2.5 pt-2 border-t border-white/10">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="w-full text-left flex items-center justify-between text-[11px] text-slate-300 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <i className="fa-solid fa-shuffle text-[#c3a138] text-[10px]"></i>
                  <span>สลับสิทธิ์ใช้งาน</span>
                </span>
                <i className={`fa-solid fa-chevron-down text-[9px] transition-transform ${showRoleSwitcher ? 'rotate-180' : ''}`}></i>
              </button>

              {/* Role Switcher Menu Buttons */}
              {showRoleSwitcher && (
                <div className="grid grid-cols-2 gap-1.5 mt-2 pt-1 border-t border-white/5">
                  {(['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'] as Role[]).map(r => {
                    const isCurrent = role === r;
                    const rLabel = r === 'SUPER_ADMIN' ? 'Super Admin' :
                                   r === 'HR_MANAGER' ? 'HR Manager' :
                                   r === 'DEPARTMENT_HEAD' ? 'หัวหน้าแผนก' : 'พนักงาน';
                    return (
                      <button
                        key={r}
                        onClick={() => {
                          switchRole(r);
                          setShowRoleSwitcher(false);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center truncate ${
                          isCurrent
                            ? 'bg-[#c3a138] text-slate-950 shadow-xs'
                            : 'bg-white/10 text-slate-200 hover:bg-white/20'
                        }`}
                      >
                        {rLabel}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================
            3. CATEGORIZED MENU NAVIGATION
           ========================================= */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {currentSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              {/* Category Header */}
              <div className="px-2 pt-1 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#a4b3d3] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c3a138]"></span>
                  <span>{section.title}</span>
                </span>
                <span className="text-[9px] text-slate-500 font-medium">
                  {section.items.length}
                </span>
              </div>

              {/* Menu Items */}
              <div className="space-y-1.5">
                {section.items.map(menu => {
                  const isActive = activeTab === menu.key;
                  const hasBadge = Boolean(menu.badge) && (menu.badge as number) > 0;

                  return (
                    <button
                      key={menu.key}
                      onClick={() => handleNavClick(menu.key)}
                      className={`w-full text-left p-2.5 rounded-2xl transition-all duration-200 relative group flex flex-col gap-1 border ${
                        isActive
                          ? 'bg-gradient-to-r from-[#0d4b8f] to-[#042d5e] text-white border-[#c3a138]/60 shadow-lg ring-1 ring-[#c3a138]/30'
                          : 'bg-white/[0.04] border-white/5 text-slate-200 hover:bg-white/[0.09] hover:text-white hover:border-white/10'
                      }`}
                    >
                      {/* Luminous Left Border Highlight */}
                      {isActive && (
                        <span className="absolute left-0 top-2.5 bottom-2.5 w-1.5 bg-[#c3a138] rounded-r-full shadow-md"></span>
                      )}

                      <div className="flex items-center justify-between w-full pl-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Icon Tile */}
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-transform duration-200 shrink-0 ${
                              isActive
                                ? 'bg-[#c3a138] text-slate-950 font-black shadow-md scale-105'
                                : 'bg-white/10 text-[#c3a138] group-hover:bg-white/15 group-hover:scale-105'
                            }`}
                          >
                            <i className={`fa-solid ${menu.icon}`}></i>
                          </div>

                          {/* Menu Label */}
                          <div className="min-w-0">
                            <span className={`block font-bold text-xs tracking-tight leading-tight truncate ${
                              isActive ? 'text-white' : 'text-slate-100 group-hover:text-white'
                            }`}>
                              {menu.label}
                            </span>
                          </div>
                        </div>

                        {/* Right Badge / Chevron */}
                        <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                          {hasBadge && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${menu.badgeColor || 'bg-[#c3a138] text-slate-950'} shadow-md animate-pulse`}>
                              {menu.badge}
                            </span>
                          )}
                          <i className={`fa-solid fa-chevron-right text-[9px] transition-transform duration-200 ${
                            isActive
                              ? 'text-[#c3a138] translate-x-0.5'
                              : 'text-slate-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5'
                          }`}></i>
                        </div>
                      </div>

                      {/* Subtitle Description */}
                      {menu.desc && (
                        <p className={`text-[10px] pl-11 line-clamp-1 leading-normal ${
                          isActive ? 'text-blue-100 font-medium' : 'text-[#a4b3d3] group-hover:text-slate-200'
                        }`}>
                          {menu.desc}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* =========================================
            4. FOOTER: SYSTEM STATUS & LOGOUT
           ========================================= */}
        <div className="p-3 border-t border-[#083a6f]/60 bg-black/25 text-xs">
          <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-slate-200">
                  VN HRMS พร้อมใช้งาน
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">v1.0 Pro</span>
            </div>

            <button
              onClick={logout}
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 border border-white/10 hover:border-rose-400/30 transition-all flex items-center justify-center gap-2 text-xs font-bold"
              title="ออกจากระบบ"
            >
              <i className="fa-solid fa-arrow-right-from-bracket text-xs text-rose-400"></i>
              <span>ออกจากระบบ (Logout)</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
