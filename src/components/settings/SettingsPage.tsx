import React, { useState } from 'react';
import { useHR } from '../../context/HRContext';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_POSITIONS, INITIAL_USERS } from '../../data/mockData';
import { Modal } from '../common/Modal';
import { Alert } from '../../utils/helpers';

export const SettingsPage: React.FC = () => {
  const { role } = useAuth();
  const {
    companies,
    departments,
    employees,
    addCompany,
    updateCompany,
    deleteCompany,
    addDepartment,
    deleteDepartment,
    resetAllData,
  } = useHR();

  // Settings Tabs
  const [activeTab, setActiveTab] = useState<
    'ORG_STRUCTURE' | 'ROLES' | 'LEAVE_POLICY' | 'EARNINGS_DEDUCTIONS' | 'RESET'
  >('ORG_STRUCTURE');

  // Modals State
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [newComp, setNewComp] = useState({
    name: '',
    shortName: '',
    code: '',
    phone: '',
    address: '',
    taxId: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    lat: 16.48,
    lng: 99.52,
    radiusMeters: 500,
  });

  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDept, setNewDept] = useState({
    name: '',
    code: '',
    companyId: companies[0]?.id || 'c1',
  });

  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [positionsList, setPositionsList] = useState(INITIAL_POSITIONS);
  const [newPos, setNewPos] = useState({
    name: '',
    level: 'ระดับปฏิบัติการ',
    minSalary: 15000,
    maxSalary: 25000,
  });

  // Earnings & Deductions Master List
  const [incomeItems, setIncomeItems] = useState([
    { id: 'inc-1', name: 'เงินเดือนพื้นฐาน (Base Salary)', isTaxable: true, isSSO: true },
    { id: 'inc-2', name: 'ค่าประจำตำแหน่ง (Position Allowance)', isTaxable: true, isSSO: true },
    { id: 'inc-3', name: 'เบี้ยขยันประจำเดือน (Attendance Bonus)', isTaxable: true, isSSO: false },
    { id: 'inc-4', name: 'ค่าล่วงเวลา (Overtime Pay - OT 1.5x / 3x)', isTaxable: true, isSSO: false },
    { id: 'inc-5', name: 'ค่าสอนขับรถรอบพิเศษ', isTaxable: true, isSSO: false },
  ]);

  const [deductionItems, setDeductionItems] = useState([
    { id: 'ded-1', name: 'เงินสมทบกองทุนประกันสังคม (5% สูงสุด 750 บ.)', desc: 'หักตามกฎหมายประกันสังคม' },
    { id: 'ded-2', name: 'กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.)', desc: 'หักชำระหนี้ตามคำสั่ง กยศ.' },
    { id: 'ded-3', name: 'ภาษีเงินได้หัก ณ ที่จ่าย (Withholding Tax)', desc: 'หักตามอัตราก้าวหน้าภาษีเงินได้' },
    { id: 'ded-4', name: 'หักขาดงาน / มาสายเกินเกณฑ์', desc: 'คำนวณตามชั่วโมงที่ขาดงาน' },
  ]);

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemType, setNewItemType] = useState<'INCOME' | 'DEDUCTION'>('INCOME');
  const [newItemName, setNewItemName] = useState('');

  // Handle Add Company (Manual)
  const handleAddCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComp.name.trim() || !newComp.code.trim()) {
      Alert.warning('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อบริษัทและรหัสสาขา');
      return;
    }
    addCompany({
      name: newComp.name,
      shortName: newComp.shortName || newComp.name,
      code: newComp.code,
      phone: newComp.phone || '055-000-000',
      address: newComp.address || 'จ.กำแพงเพชร',
      taxId: newComp.taxId || '0555562000000',
      status: newComp.status,
      location: {
        lat: Number(newComp.lat) || 16.48,
        lng: Number(newComp.lng) || 99.52,
        radiusMeters: Number(newComp.radiusMeters) || 500,
      },
    });
    Alert.success('เพิ่มบริษัทสำเร็จ', `เพิ่มสาขา ${newComp.name} เรียบร้อยแล้ว`);
    setShowAddCompanyModal(false);
    setNewComp({
      name: '',
      shortName: '',
      code: '',
      phone: '',
      address: '',
      taxId: '',
      status: 'ACTIVE',
      lat: 16.48,
      lng: 99.52,
      radiusMeters: 500,
    });
  };

  // Handle Add Department (Manual)
  const handleAddDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.name.trim()) {
      Alert.warning('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อแผนก');
      return;
    }
    addDepartment({
      name: newDept.name,
      code: newDept.code || `DEP-0${departments.length + 1}`,
      companyId: newDept.companyId,
    });
    Alert.success('เพิ่มแผนกสำเร็จ', `บันทึกแผนก "${newDept.name}" เรียบร้อยแล้ว`);
    setShowAddDeptModal(false);
    setNewDept({
      name: '',
      code: '',
      companyId: companies[0]?.id || 'c1',
    });
  };

  // Handle Add Position
  const handleAddPositionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPos.name.trim()) {
      Alert.warning('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อตำแหน่ง');
      return;
    }
    const created = {
      id: `p-${Date.now()}`,
      departmentId: departments[0]?.id || 'd1',
      name: newPos.name,
      level: newPos.level,
      baseSalaryMin: Number(newPos.minSalary) || 15000,
      baseSalaryMax: Number(newPos.maxSalary) || 25000,
    };
    setPositionsList(prev => [...prev, created]);
    Alert.success('เพิ่มตำแหน่งสำเร็จ', `บันทึกตำแหน่ง ${newPos.name} เรียบร้อยแล้ว`);
    setShowAddPositionModal(false);
    setNewPos({ name: '', level: 'ระดับปฏิบัติการ', minSalary: 15000, maxSalary: 25000 });
  };

  // Handle Add Earning / Deduction Item
  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    if (newItemType === 'INCOME') {
      setIncomeItems(prev => [
        ...prev,
        { id: `inc-${Date.now()}`, name: newItemName, isTaxable: true, isSSO: false },
      ]);
    } else {
      setDeductionItems(prev => [
        ...prev,
        { id: `ded-${Date.now()}`, name: newItemName, desc: 'รายการหักที่กำหนดเอง' },
      ]);
    }
    Alert.success('เพิ่มรายการสำเร็จ', `บันทึก "${newItemName}" เรียบร้อยแล้ว`);
    setShowAddItemModal(false);
    setNewItemName('');
  };

  // Toggle company status
  const handleToggleCompanyStatus = (comp: any) => {
    const nextStatus = comp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateCompany(comp.id, { status: nextStatus });
    Alert.success('ปรับสถานะบริษัทสำเร็จ', `ปรับเป็น ${nextStatus === 'ACTIVE' ? 'เปิดทำการปกติ' : 'ปิดทำการชั่วคราว'}`);
  };

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#022247] flex items-center gap-2">
            <i className="fa-solid fa-sliders text-[#064a8b]"></i>
            การตั้งค่าระบบองค์กร (System Configuration)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดโครงสร้างบริษัท แผนก โครงสร้างตำแหน่ง นโยบายการลา และสิทธิ์ผู้ใช้งาน
          </p>
        </div>

        <button
          onClick={() => {
            Alert.confirm('คืนค่าระบบเริ่มต้น', 'คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้นหรือไม่?').then(yes => {
              if (yes) resetAllData();
            });
          }}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-rose-50 text-rose-600 border border-slate-200 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <i className="fa-solid fa-rotate-left"></i>
          คืนค่าเริ่มต้น (Reset)
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        {[
          { key: 'ORG_STRUCTURE', label: '1) โครงสร้างบริษัท & แผนก', icon: 'fa-building-columns' },
          { key: 'ROLES', label: '2) สิทธิ์ผู้ใช้ 4 บทบาท (RBAC)', icon: 'fa-user-shield' },
          { key: 'LEAVE_POLICY', label: '3) นโยบายการลา', icon: 'fa-calendar-days' },
          { key: 'EARNINGS_DEDUCTIONS', label: '4) รายการรายได้และรายการหัก', icon: 'fa-money-bill-transfer' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.key
                ? 'bg-[#064a8b] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <i className={`fa-solid ${tab.icon} text-xs`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* =========================================================================
          TAB 1: SIDE-BY-SIDE UI BOX - บริษัทข้างๆ กับลิสแผนก & โครงสร้างตำแหน่ง
         ========================================================================= */}
      {activeTab === 'ORG_STRUCTURE' && (
        <div className="space-y-6">
          {/* Side-by-side Company Box (Left) and Department Box (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* LEFT BOX: UI BOX แสดงบริษัทที่มีและสถานะ */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                    <i className="fa-solid fa-building text-[#064a8b]"></i>
                    บริษัทและสาขาในเครือ ({companies.length} แห่ง)
                  </h3>
                  <p className="text-[11px] text-slate-500">แสดงสถานะเปิดทำการ พิกัด และข้อมูลติดต่อ</p>
                </div>

                <button
                  onClick={() => setShowAddCompanyModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white shadow-xs flex items-center gap-1 shrink-0"
                >
                  <i className="fa-solid fa-plus text-[#c3a138]"></i>
                  เพิ่มบริษัท
                </button>
              </div>

              <div className="space-y-3">
                {companies.map(c => {
                  const isActive = c.status !== 'INACTIVE';
                  const compDepts = departments.filter(d => d.companyId === c.id);
                  const compEmps = employees.filter(e => e.companyId === c.id);

                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-[#064a8b] transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-[#064a8b]">
                          {c.code}
                        </span>

                        {/* Status Toggle Button */}
                        <button
                          onClick={() => handleToggleCompanyStatus(c)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                          title="คลิกเพื่อสลับสถานะเปิด/ปิด"
                        >
                          <i className={`fa-solid fa-circle text-[8px] ${isActive ? 'text-emerald-500' : 'text-rose-500'}`}></i>
                          <span>{isActive ? 'เปิดทำการปกติ (Active)' : 'ปิดปรับปรุง (Inactive)'}</span>
                        </button>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-800 text-sm">{c.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{c.address}</p>
                      </div>

                      <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60 space-y-1">
                        <p>โทรศัพท์: <strong>{c.phone}</strong></p>
                        <p>เลขผู้เสียภาษี: <strong>{c.taxId}</strong></p>
                        <p>พิกัดลงเวลา: <strong>Lat {c.location.lat}, Lng {c.location.lng}</strong> (รัศมี {c.location.radiusMeters} ม.)</p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>แผนก: <strong>{compDepts.length}</strong> แผนก • พนักงาน: <strong>{compEmps.length}</strong> คน</span>
                        <button
                          onClick={() => {
                            Alert.confirm('ลบบริษัท', `ต้องการลบ "${c.name}" หรือไม่?`).then(yes => {
                              if (yes) deleteCompany(c.id);
                            });
                          }}
                          className="text-slate-400 hover:text-rose-600"
                          title="ลบสาขานี้"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT BOX: UI BOX รายชื่อแผนกงานที่อยู่ข้างๆ */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                    <i className="fa-solid fa-sitemap text-[#064a8b]"></i>
                    รายชื่อแผนกงาน (Departments List - {departments.length} แผนก)
                  </h3>
                  <p className="text-[11px] text-slate-500">แผนกงานในแต่ละสาขาและจำนวนบุคลากร</p>
                </div>

                <button
                  onClick={() => setShowAddDeptModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white shadow-xs flex items-center gap-1 shrink-0"
                >
                  <i className="fa-solid fa-plus text-[#c3a138]"></i>
                  เพิ่มแผนก
                </button>
              </div>

              <div className="space-y-2.5">
                {departments.map(d => {
                  const comp = companies.find(c => c.id === d.companyId);
                  const deptEmps = employees.filter(e => e.departmentId === d.id);

                  return (
                    <div
                      key={d.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-[#064a8b] transition-all flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 text-sm">{d.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">({d.code})</span>
                        </div>
                        <span className="text-slate-500 block text-[11px]">
                          สังกัดสาขา: <strong>{comp?.shortName || '-'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#064a8b] font-black text-xs">
                          {deptEmps.length} คน
                        </span>
                        <button
                          onClick={() => {
                            Alert.confirm('ลบแผนก', `ต้องการลบแผนก "${d.name}" หรือไม่?`).then(yes => {
                              if (yes) deleteDepartment(d.id);
                            });
                          }}
                          className="text-slate-300 hover:text-rose-600 p-1"
                          title="ลบแผนก"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* โครงสร้างตำแหน่งระดับงาน (Job Position Structure) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                  <i className="fa-solid fa-id-badge text-[#064a8b]"></i>
                  โครงสร้างตำแหน่งและระดับงาน (Job Positions & Salary Brackets)
                </h3>
                <p className="text-xs text-slate-500">ระดับงานและช่วงฐานเงินเดือนประจำตำแหน่ง</p>
              </div>

              <button
                onClick={() => setShowAddPositionModal(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white shadow-xs flex items-center gap-1"
              >
                <i className="fa-solid fa-plus text-[#c3a138]"></i>
                เพิ่มตำแหน่ง
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {positionsList.map(pos => (
                <div key={pos.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">{pos.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                      {pos.level}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] flex justify-between">
                    <span>ช่วงเงินเดือนฐาน:</span>
                    <span className="font-semibold text-slate-700">
                      {pos.baseSalaryMin.toLocaleString()} - {pos.baseSalaryMax.toLocaleString()} บ.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: สิทธิ์ผู้ใช้ 4 บทบาท (RBAC)
         ========================================================================= */}
      {activeTab === 'ROLES' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-black text-slate-800 text-sm">
              โครงสร้างสิทธิ์การใช้งาน 4 ระดับบทบาท (Role-Based Access Control)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Role 1: Super Admin */}
              <div className="p-4 rounded-2xl border-2 border-purple-200 bg-purple-50/40 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white">
                    ระดับ 1
                  </span>
                  <i className="fa-solid fa-crown text-purple-600"></i>
                </div>
                <h4 className="font-black text-slate-800 text-sm">1. Super Admin</h4>
                <p className="text-[11px] text-slate-600">ผู้บริหารสูงสุด / ประธานกรรมการ</p>
                <div className="pt-2 border-t border-purple-200 space-y-1 text-[11px] text-slate-700">
                  <p>✔ เข้าถึงได้ทุกหน้าและทุกสาขา</p>
                  <p>✔ แดชบอร์ดภาพรวมเน้นมือถือ</p>
                  <p>✔ อนุมัติคำขอทุกรายการ</p>
                  <p>✔ กำหนดนโยบายบริษัท</p>
                </div>
              </div>

              {/* Role 2: HR manager */}
              <div className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/40 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#064a8b] text-white">
                    ระดับ 2
                  </span>
                  <i className="fa-solid fa-user-tie text-[#064a8b]"></i>
                </div>
                <h4 className="font-black text-slate-800 text-sm">2. HR manager</h4>
                <p className="text-[11px] text-slate-600">ฝ่ายทรัพยากรบุคคล</p>
                <div className="pt-2 border-t border-blue-200 space-y-1 text-[11px] text-slate-700">
                  <p>✔ หน้าบริหารงานบุคคล</p>
                  <p>✔ จัดการเงินเดือน & แก้แมนนวล</p>
                  <p>✔ คำนวณประกันสังคม, กยศ., ภาษี</p>
                  <p>✔ โซนรายงานและวันหยุด</p>
                </div>
              </div>

              {/* Role 3: หัวหน้าแผนก */}
              <div className="p-4 rounded-2xl border-2 border-amber-200 bg-amber-50/40 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-600 text-white">
                    ระดับ 3
                  </span>
                  <i className="fa-solid fa-user-check text-amber-600"></i>
                </div>
                <h4 className="font-black text-slate-800 text-sm">3. หัวหน้าแผนก</h4>
                <p className="text-[11px] text-slate-600">หัวหน้าฝ่าย / ผู้ควบคุมสายงาน</p>
                <div className="pt-2 border-t border-amber-200 space-y-1 text-[11px] text-slate-700">
                  <p>✔ ดูสมาชิกและลูกทีมของตน</p>
                  <p>✔ อนุมัติคำขอลาและ OT ทีม</p>
                  <p>✔ ดูเวลางานของทีม</p>
                  <p>✖ ไม่เห็นข้อมูลเงินเดือน</p>
                </div>
              </div>

              {/* Role 4: พนักงาน */}
              <div className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                    ระดับ 4
                  </span>
                  <i className="fa-solid fa-user text-emerald-600"></i>
                </div>
                <h4 className="font-black text-slate-800 text-sm">4. พนักงาน</h4>
                <p className="text-[11px] text-slate-600">พนักงานและครูฝึกสอนทั่วไป</p>
                <div className="pt-2 border-t border-emerald-200 space-y-1 text-[11px] text-slate-700">
                  <p>✔ ลงเวลาเข้า-ออกงาน</p>
                  <p>✔ ส่งคำขอลาและ OT ของตน</p>
                  <p>✔ ดูโปรไฟล์และวันลาคงเหลือ</p>
                  <p>✔ ดูสลิปเงินเดือนตนเอง</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: นโยบายการลา (LEAVE POLICY)
         ========================================================================= */}
      {activeTab === 'LEAVE_POLICY' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-black text-slate-800 text-sm">
              นโยบายวันลาประจำปี VN Group (Leave Policies)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-800 text-sm">ลาป่วย (Sick Leave)</span>
                  <span className="px-2 py-0.5 rounded font-bold bg-blue-100 text-[#064a8b]">30 วัน/ปี</span>
                </div>
                <p className="text-slate-600">จ่ายค่าจ้างเต็มจำนวนตามกฎหมายคุ้มครองแรงงาน</p>
                <p className="text-[11px] text-slate-400">ลาติดต่อกัน 3 วันทำงานขึ้นไป ต้องมีใบรับรองแพทย์แผนปัจจุบัน</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-800 text-sm">ลากิจส่วนตัว (Personal)</span>
                  <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">6 วัน/ปี</span>
                </div>
                <p className="text-slate-600">สำหรับทำธุระจำเป็น ต้องยื่นคำขอล่วงหน้าอย่างน้อย 1 วัน</p>
                <p className="text-[11px] text-slate-400">ต้องได้รับการอนุมัติจากหัวหน้าแผนกก่อนหยุดงาน</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-800 text-sm">พักผ่อนประจำปี (Annual)</span>
                  <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">6-10 วัน/ปี</span>
                </div>
                <p className="text-slate-600">สำหรับพนักงานที่ทำงานครบ 1 ปีขึ้นไป</p>
                <p className="text-[11px] text-slate-400">สามารถสะสมทบยอดได้สูงสุด 3 วันในรอบปีถัดไป</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: รายการรายได้และรายการการหัก
         ========================================================================= */}
      {activeTab === 'EARNINGS_DEDUCTIONS' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-800 text-sm">
                  รายการรายได้และรายการการหัก (Earnings & Deductions Master)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  รายการค่าตอบแทนและรายการหักเงินที่ใช้ในการคำนวณเงินเดือนรอบขององค์กร
                </p>
              </div>

              <button
                onClick={() => setShowAddItemModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white shadow-xs flex items-center gap-1 shrink-0"
              >
                <i className="fa-solid fa-plus text-[#c3a138]"></i>
                เพิ่มรายการใหม่
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Earnings */}
              <div className="space-y-3">
                <h4 className="font-black text-slate-800 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                  <i className="fa-solid fa-arrow-trend-up text-emerald-600"></i>
                  รายการรายได้ (Earnings)
                </h4>
                <div className="space-y-2">
                  {incomeItems.map(item => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-800">{item.name}</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                        {item.isSSO ? 'ฐาน ปกส.' : 'รายได้พิเศษ'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-3">
                <h4 className="font-black text-rose-800 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                  <i className="fa-solid fa-arrow-trend-down text-rose-600"></i>
                  รายการการหัก (Deductions)
                </h4>
                <div className="space-y-2">
                  {deductionItems.map(item => (
                    <div key={item.id} className="p-3 bg-rose-50/40 rounded-xl border border-rose-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block">{item.name}</span>
                        <span className="text-[10px] text-slate-500">{item.desc}</span>
                      </div>
                      <span className="text-[10px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded">
                        รายการหัก
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD COMPANY */}
      <Modal
        isOpen={showAddCompanyModal}
        onClose={() => setShowAddCompanyModal(false)}
        title="เพิ่มบริษัท / สาขาใหม่แบบแมนนวล"
        subtitle="บันทึกข้อมูลสาขาโรงเรียนสอนขับรถเข้าสู่ระบบ"
        size="md"
        footer={
          <>
            <button onClick={() => setShowAddCompanyModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200">ยกเลิก</button>
            <button onClick={handleAddCompanySubmit} className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white">บันทึกสาขา</button>
          </>
        }
      >
        <form onSubmit={handleAddCompanySubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ชื่อเต็มบริษัท/สาขา *</label>
            <input
              type="text"
              required
              value={newComp.name}
              onChange={e => setNewComp({ ...newComp, name: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="เช่น โรงเรียนสอนขับรถวีเอ็น (สาขาสลกบาตร)"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ชื่อย่อสาขา</label>
              <input
                type="text"
                value={newComp.shortName}
                onChange={e => setNewComp({ ...newComp, shortName: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                placeholder="เช่น สาขาสลกบาตร"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">รหัสสาขา *</label>
              <input
                type="text"
                required
                value={newComp.code}
                onChange={e => setNewComp({ ...newComp, code: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                placeholder="VN-SLB"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">ที่อยู่สาขา</label>
            <input
              type="text"
              value={newComp.address}
              onChange={e => setNewComp({ ...newComp, address: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
              <input
                type="text"
                value={newComp.phone}
                onChange={e => setNewComp({ ...newComp, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                placeholder="055-XXX-XXX"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">สถานะ</label>
              <select
                value={newComp.status}
                onChange={e => setNewComp({ ...newComp, status: e.target.value as any })}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                <option value="ACTIVE">เปิดทำการปกติ (Active)</option>
                <option value="INACTIVE">ปิดทำการชั่วคราว (Inactive)</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD DEPARTMENT */}
      <Modal
        isOpen={showAddDeptModal}
        onClose={() => setShowAddDeptModal(false)}
        title="เพิ่มแผนกงานใหม่แบบแมนนวล"
        subtitle="บันทึกแผนกเข้าสู่โครงสร้างองค์กร"
        size="md"
        footer={
          <>
            <button onClick={() => setShowAddDeptModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200">ยกเลิก</button>
            <button onClick={handleAddDeptSubmit} className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white">บันทึกแผนก</button>
          </>
        }
      >
        <form onSubmit={handleAddDeptSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ชื่อแผนกงาน *</label>
            <input
              type="text"
              required
              value={newDept.name}
              onChange={e => setNewDept({ ...newDept, name: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="เช่น ฝ่ายลูกค้าสัมพันธ์และต้อนรับ"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">รหัสแผนก</label>
            <input
              type="text"
              value={newDept.code}
              onChange={e => setNewDept({ ...newDept, code: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="DEP-0X"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">สาขาที่สังกัด</label>
            <select
              value={newDept.companyId}
              onChange={e => setNewDept({ ...newDept, companyId: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD POSITION */}
      <Modal
        isOpen={showAddPositionModal}
        onClose={() => setShowAddPositionModal(false)}
        title="เพิ่มตำแหน่งงานใหม่"
        subtitle="กำหนดระดับงานและกรอบอัตราเงินเดือน"
        size="md"
        footer={
          <>
            <button onClick={() => setShowAddPositionModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200">ยกเลิก</button>
            <button onClick={handleAddPositionSubmit} className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white">บันทึกตำแหน่ง</button>
          </>
        }
      >
        <form onSubmit={handleAddPositionSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ชื่อตำแหน่งงาน *</label>
            <input
              type="text"
              required
              value={newPos.name}
              onChange={e => setNewPos({ ...newPos, name: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="เช่น เจ้าหน้าที่ความปลอดภัย"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">ระดับงาน</label>
            <select
              value={newPos.level}
              onChange={e => setNewPos({ ...newPos, level: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="ระดับปฏิบัติการ">ระดับปฏิบัติการ (Staff)</option>
              <option value="ระดับชำนาญการ">ระดับชำนาญการ (Senior Staff)</option>
              <option value="ระดับหัวหน้างาน">ระดับหัวหน้างาน (Supervisor)</option>
              <option value="ระดับบริหาร">ระดับบริหาร (Manager)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">เงินเดือนขั้นต่ำ</label>
              <input
                type="number"
                value={newPos.minSalary}
                onChange={e => setNewPos({ ...newPos, minSalary: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">เงินเดือนขั้นสูง</label>
              <input
                type="number"
                value={newPos.maxSalary}
                onChange={e => setNewPos({ ...newPos, maxSalary: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD EARNING / DEDUCTION ITEM */}
      <Modal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        title="เพิ่มรายการรายได้ / รายการหัก"
        subtitle="บันทึกประเภทรายการทางการเงิน"
        size="md"
        footer={
          <>
            <button onClick={() => setShowAddItemModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200">ยกเลิก</button>
            <button onClick={handleAddItemSubmit} className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white">บันทึกรายการ</button>
          </>
        }
      >
        <form onSubmit={handleAddItemSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ประเภทรายการ</label>
            <select
              value={newItemType}
              onChange={e => setNewItemType(e.target.value as any)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="INCOME">รายการรายได้ (Earning)</option>
              <option value="DEDUCTION">รายการการหัก (Deduction)</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">ชื่อรายการ *</label>
            <input
              type="text"
              required
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="เช่น ค่าเบี้ยเลี้ยงพิเศษ, ค่าประกันอุบัติเหตุ"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
