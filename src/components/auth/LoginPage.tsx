import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { VNGroupLogo } from '../common/VNGroupLogo';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [branchId, setBranchId] = useState<'c2' | 'c1'>('c2'); // c2 = ท่ามะเขือ, c1 = เมืองกำแพงเพชร
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    const success = login(username, password, branchId);
    setIsLoading(false);

    if (!success) {
      setErrorMsg('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
    }
  };

  const isBranchRole =
    username.includes('หัวหน้าแผนก') ||
    username.includes('พนักงาน') ||
    username.toLowerCase().includes('depthead') ||
    username.toLowerCase().includes('employee') ||
    username.toLowerCase().includes('staff') ||
    username === '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-5">
        {/* Top Header & Official VN Group Logo */}
        <div className="text-center flex flex-col items-center justify-center space-y-2">
          <VNGroupLogo size="lg" className="mb-1" />
          <p className="text-xs sm:text-sm font-medium text-slate-600">
            โรงเรียนสอนขับรถวีเอ็น (กำแพงเพชร & ท่ามะเขือ)
          </p>
        </div>

        {/* Clean Center Login Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              เข้าสู่ระบบ (Sign In)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              กรุณาระบุชื่อผู้ใช้งานและรหัสผ่านเพื่อเข้าใช้งานระบบ
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <i className="fa-solid fa-circle-exclamation text-rose-500 text-sm shrink-0"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                ชื่อผู้ใช้งาน (Username) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <i className="fa-solid fa-user text-sm"></i>
                </span>
                <input
                  type="text"
                  autoFocus
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="เช่น superadmin, HR manager, หัวหน้าแผนก, พนักงาน"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#064a8b]/20 focus:border-[#064a8b] transition-all"
                  required
                />
              </div>
            </div>

            {/* Branch Selector for Department Head & Employee */}
            {isBranchRole && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 text-[11px]">
                    สาขาประจำ (Branch) <span className="text-slate-400 font-normal">(สำหรับหัวหน้าแผนก / พนักงาน)</span>
                  </label>
                  <span className="text-[10px] text-[#064a8b] font-bold">
                    {branchId === 'c2' ? 'สาขาท่ามะเขือ' : 'สาขาเมืองกำแพงเพชร'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBranchId('c2')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      branchId === 'c2'
                        ? 'bg-[#064a8b] text-white border-[#064a8b] shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <i className="fa-solid fa-location-dot text-xs"></i>
                    <span>สาขาท่ามะเขือ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBranchId('c1')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      branchId === 'c1'
                        ? 'bg-[#064a8b] text-white border-[#064a8b] shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <i className="fa-solid fa-location-dot text-xs"></i>
                    <span>สาขาเมืองกำแพงเพชร</span>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                รหัสผ่าน (Password) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <i className="fa-solid fa-lock text-sm"></i>
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#064a8b]/20 focus:border-[#064a8b] transition-all"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#064a8b] hover:bg-[#022247] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <i className="fa-solid fa-right-to-bracket"></i>
                <span>{isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}</span>
              </button>
            </div>
          </form>

          {/* Security & System Info Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-shield-halved text-emerald-500"></i>
              ระบบยืนยันตัวตนปลอดภัย
            </span>
            <span>VN Group HRMS</span>
          </div>
        </div>

        {/* Support Note */}
        <p className="text-center text-[11px] text-slate-400">
          © 2026 โรงเรียนสอนขับรถวีเอ็น (กำแพงเพชร & ท่ามะเขือ)
        </p>
      </div>
    </div>
  );
};
