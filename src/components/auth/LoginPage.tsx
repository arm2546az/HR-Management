import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_USERS, INITIAL_EMPLOYEES } from '../../data/mockData';
import { Role } from '../../types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const success = login(username, password);
    if (!success) {
      setErrorMsg('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleQuickLogin = (uname: string) => {
    setUsername(uname);
    setPassword('password123');
    login(uname, 'password123');
  };

  const roleMeta: Record<Role, { title: string; desc: string; badge: string; color: string; icon: string }> = {
    SUPER_ADMIN: {
      title: '1. Super Admin',
      desc: 'ผู้บริหารสูงสุด (Super Admin) - เข้าถึงทุกระบบ',
      badge: 'สิทธิ์สูงสุดทุกสาขา',
      color: 'border-purple-300 bg-purple-50/50 hover:border-purple-600',
      icon: 'fa-crown text-purple-600',
    },
    HR_MANAGER: {
      title: '2. HR manager',
      desc: 'ฝ่ายทรัพยากรบุคคล (HR Manager) - 2 หน้าหลัก',
      badge: 'ฝ่ายบุคคล (2 หน้าหลัก)',
      color: 'border-blue-300 bg-blue-50/50 hover:border-[#064a8b]',
      icon: 'fa-user-tie text-[#064a8b]',
    },
    DEPARTMENT_HEAD: {
      title: '3. หัวหน้าแผนก',
      desc: 'หัวหน้าแผนก / ผู้ดูแลสายงานและอนุมัติทีม',
      badge: 'สายอนุมัติทีม',
      color: 'border-amber-300 bg-amber-50/50 hover:border-amber-600',
      icon: 'fa-user-check text-amber-600',
    },
    EMPLOYEE: {
      title: '4. พนักงาน',
      desc: 'พนักงานทั่วไป / ผู้ใช้งานระบบ',
      badge: 'พนักงานทั่วไป',
      color: 'border-emerald-300 bg-emerald-50/50 hover:border-emerald-600',
      icon: 'fa-user text-emerald-600',
    },
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Top Header Card */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#022247] border border-[#c3a138] text-[#c3a138] text-2xl shadow-lg mb-2 font-black">
            <i className="fa-solid fa-car-side"></i>
          </div>
          <h1 className="text-3xl font-black text-[#022247] tracking-tight">
            VN GROUP HRMS
          </h1>
          <p className="text-sm font-semibold text-slate-600">
            ระบบบริหารทรัพยากรบุคคล โรงเรียนสอนขับรถวีเอ็น (กำแพงเพชร & ท่ามะเขือ)
          </p>
        </div>

        {/* 2-Columns: Form vs Quick Preset Accounts */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Left Form (5 cols) */}
          <div className="p-8 md:col-span-5 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">
                เข้าสู่ระบบ (Sign In)
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                กรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าใช้งานระบบ
              </p>

              {errorMsg && (
                <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  <i className="fa-solid fa-circle-exclamation mr-1.5"></i>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ชื่อผู้ใช้งาน (Username):
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <i className="fa-solid fa-user"></i>
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="เช่น superadmin, adminhr"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#064a8b]/20 focus:border-[#064a8b]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    รหัสผ่าน (Password):
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <i className="fa-solid fa-lock"></i>
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="รหัสผ่าน"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#064a8b]/20 focus:border-[#064a8b]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#064a8b] hover:bg-[#022247] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-right-to-bracket"></i>
                  เข้าสู่ระบบ
                </button>
              </form>
            </div>

            <div className="pt-6 border-t border-slate-100 text-[11px] text-slate-400 text-center">
              VN Group HR Management System Prototype Demo
            </div>
          </div>

          {/* Right Preset Accounts Cards (7 cols) */}
          <div className="p-8 md:col-span-7 bg-slate-50/70 border-t md:border-t-0 md:border-l border-slate-200">
            <div className="mb-4">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#c3a138] text-slate-900">
                <i className="fa-solid fa-key mr-1"></i> รหัสผ่านของแต่ละสิทธิ์ (คลิกเพื่อเข้าสู่ระบบทันที)
              </span>
              <p className="text-xs text-slate-500 mt-1">
                คลิกที่การ์ดบัญชีด้านล่างเพื่อสลับเข้าทดสอบระบบตามแต่ละบทบาทหน้าที่จริง
              </p>
            </div>

            <div className="space-y-3">
              {INITIAL_USERS.map(u => {
                const meta = roleMeta[u.role];
                const emp = INITIAL_EMPLOYEES.find(e => e.id === u.employeeId);
                return (
                  <div
                    key={u.id}
                    onClick={() => handleQuickLogin(u.username)}
                    className={`p-3.5 rounded-2xl border ${meta.color} cursor-pointer transition-all shadow-xs hover:shadow-md flex items-center justify-between group bg-white`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                        <i className={`fa-solid ${meta.icon}`}></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-800">{meta.title}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600">
                            {meta.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {emp ? `${emp.firstName} ${emp.lastName}` : meta.desc}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Username: <strong>{u.username}</strong> | Password: <strong>password123</strong>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 group-hover:bg-[#064a8b] group-hover:text-white text-slate-700 text-xs font-bold transition-colors shrink-0"
                    >
                      เลือก <i className="fa-solid fa-arrow-right text-[10px] ml-1"></i>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
