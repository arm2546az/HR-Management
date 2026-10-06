import React, { useState, useMemo } from 'react';
import { useHR } from '../../context/HRContext';

interface LeaveStatItem {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  barGradient: string;
  barVerticalGradient: string;
  textColor: string;
  count: number;
  days: number;
  percentage: number;
}

export const LeaveStatisticsCard: React.FC = () => {
  const { requests, selectedCompanyId } = useHR();

  // Period filter state
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-10');

  // Orientation toggle: default to 'VERTICAL' as requested by user
  const [orientation, setOrientation] = useState<'VERTICAL' | 'HORIZONTAL'>('VERTICAL');

  // Baseline demo stats (matching user's specification when no real data in selected period)
  const baselineStatsByPeriod: Record<string, { totalItems: number; totalDays: number; stats: Record<string, { count: number; days: number }> }> = {
    '2026-10': {
      totalItems: 24,
      totalDays: 45,
      stats: {
        SICK: { count: 12, days: 14 },
        ANNUAL: { count: 6, days: 18 },
        PERSONAL: { count: 4, days: 4 },
        TRAINING: { count: 2, days: 9 },
        MATERNITY: { count: 0, days: 0 },
      },
    },
    '2026-09': {
      totalItems: 18,
      totalDays: 32,
      stats: {
        SICK: { count: 8, days: 10 },
        ANNUAL: { count: 5, days: 15 },
        PERSONAL: { count: 3, days: 3 },
        TRAINING: { count: 2, days: 4 },
        MATERNITY: { count: 0, days: 0 },
      },
    },
    '2026-ALL': {
      totalItems: 86,
      totalDays: 164,
      stats: {
        SICK: { count: 38, days: 46 },
        ANNUAL: { count: 26, days: 78 },
        PERSONAL: { count: 14, days: 17 },
        TRAINING: { count: 6, days: 19 },
        MATERNITY: { count: 2, days: 4 },
      },
    },
  };

  const { items, totalCount, totalDays } = useMemo(() => {
    // Check if real approved requests exist
    const realApproved = requests.filter(r => {
      const matchComp = selectedCompanyId === 'ALL' || r.companyId === selectedCompanyId;
      const isApproved = r.requestType === 'LEAVE' && r.status === 'APPROVED';
      if (!matchComp || !isApproved) return false;
      if (selectedPeriod === '2026-ALL') return true;
      return r.startDate ? r.startDate.startsWith(selectedPeriod) : false;
    });

    let catCounts: Record<string, { count: number; days: number }> = {
      SICK: { count: 0, days: 0 },
      ANNUAL: { count: 0, days: 0 },
      PERSONAL: { count: 0, days: 0 },
      TRAINING: { count: 0, days: 0 },
      MATERNITY: { count: 0, days: 0 },
    };

    let computedTotalCount = 0;
    let computedTotalDays = 0;

    if (realApproved.length > 0) {
      realApproved.forEach(r => {
        const type = r.leaveType || 'PERSONAL';
        if (!catCounts[type]) {
          catCounts[type] = { count: 0, days: 0 };
        }
        catCounts[type].count += 1;
        catCounts[type].days += r.daysCount || 1;
        computedTotalCount += 1;
        computedTotalDays += r.daysCount || 1;
      });
    } else {
      // Use baseline reference stats for current period
      const baseline = baselineStatsByPeriod[selectedPeriod] || baselineStatsByPeriod['2026-10'];
      catCounts = baseline.stats;
      computedTotalCount = baseline.totalItems;
      computedTotalDays = baseline.totalDays;
    }

    const categoriesConfig = [
      {
        id: 'SICK',
        name: 'ลาป่วย',
        icon: 'fa-heart-pulse',
        iconBg: 'bg-rose-50 text-rose-600',
        barGradient: 'bg-gradient-to-r from-rose-500 to-rose-600',
        barVerticalGradient: 'bg-gradient-to-t from-rose-600 via-rose-500 to-rose-400',
        textColor: 'text-rose-600',
      },
      {
        id: 'ANNUAL',
        name: 'พักร้อน',
        icon: 'fa-umbrella-beach',
        iconBg: 'bg-indigo-50 text-indigo-600',
        barGradient: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
        barVerticalGradient: 'bg-gradient-to-t from-indigo-700 via-indigo-500 to-indigo-400',
        textColor: 'text-indigo-600',
      },
      {
        id: 'PERSONAL',
        name: 'ลากิจ',
        icon: 'fa-calendar-check',
        iconBg: 'bg-amber-50 text-amber-600',
        barGradient: 'bg-gradient-to-r from-amber-500 to-amber-600',
        barVerticalGradient: 'bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400',
        textColor: 'text-amber-600',
      },
      {
        id: 'TRAINING',
        name: 'ฝึกอบรม',
        icon: 'fa-graduation-cap',
        iconBg: 'bg-purple-50 text-purple-600',
        barGradient: 'bg-gradient-to-r from-purple-500 to-purple-600',
        barVerticalGradient: 'bg-gradient-to-t from-purple-600 via-purple-500 to-purple-400',
        textColor: 'text-purple-600',
      },
      {
        id: 'MATERNITY',
        name: 'ลาคลอด',
        icon: 'fa-baby',
        iconBg: 'bg-pink-50 text-pink-600',
        barGradient: 'bg-gradient-to-r from-pink-400 to-pink-500',
        barVerticalGradient: 'bg-gradient-to-t from-pink-500 via-pink-400 to-pink-300',
        textColor: 'text-pink-600',
      },
    ];

    const list: LeaveStatItem[] = categoriesConfig.map(cfg => {
      const data = catCounts[cfg.id] || { count: 0, days: 0 };
      const pct = computedTotalCount > 0 ? Math.round((data.count / computedTotalCount) * 100) : 0;
      return {
        ...cfg,
        count: data.count,
        days: data.days,
        percentage: pct,
      };
    });

    return {
      items: list,
      totalCount: computedTotalCount,
      totalDays: computedTotalDays,
    };
  }, [requests, selectedCompanyId, selectedPeriod]);

  // Max percentage for scaling vertical chart height nicely (minimum 50%)
  const maxPercentage = useMemo(() => {
    const maxVal = Math.max(...items.map(i => i.percentage), 50);
    return maxVal > 80 ? 100 : Math.ceil(maxVal / 10) * 10;
  }, [items]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <i className="fa-solid fa-chart-column text-[#064a8b]"></i>
            <span>สถิติการลาแยกประเภท (ที่อนุมัติแล้ว)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span className="font-semibold text-slate-700">
              รวมทั้งหมด {totalCount} รายการ ({totalDays} วันทำงาน)
            </span>
          </p>
        </div>

        {/* Controls: Orientation Toggle & Dropdown Period Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Orientation Toggle Buttons */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              onClick={() => setOrientation('VERTICAL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                orientation === 'VERTICAL'
                  ? 'bg-white text-[#064a8b] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="สลับเป็นกราฟแนวตั้ง"
            >
              <i className="fa-solid fa-chart-simple"></i>
              <span>กราฟแนวตั้ง</span>
            </button>
            <button
              onClick={() => setOrientation('HORIZONTAL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                orientation === 'HORIZONTAL'
                  ? 'bg-white text-[#064a8b] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="สลับเป็นแถบแนวนอน"
            >
              <i className="fa-solid fa-bars-progress"></i>
              <span>แถบแนวนอน</span>
            </button>
          </div>

          {/* Dropdown Period Selector */}
          <div className="relative">
            <label htmlFor="leave-stat-period" className="sr-only">เลือกรอบเดือน</label>
            <select
              id="leave-stat-period"
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#064a8b] transition-all cursor-pointer shadow-2xs"
            >
              <option value="2026-10">รอบเดือนนี้: ต.ค. 2026</option>
              <option value="2026-09">รอบเดือนที่แล้ว: ก.ย. 2026</option>
              <option value="2026-ALL">ภาพรวมสะสมทั้งปี 2026</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
              <i className="fa-solid fa-chevron-down text-[10px]"></i>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: VERTICAL COLUMN CHART (DEFAULT AS REQUESTED BY USER)
         ========================================================================= */}
      {orientation === 'VERTICAL' && (
        <div className="pt-1">
          {/* Chart Board Container */}
          <div className="relative bg-gradient-to-b from-slate-50/50 to-white rounded-2xl p-4 sm:p-6 border border-slate-200/70">
            {/* Background Reference Guidelines */}
            <div className="absolute inset-x-6 top-16 bottom-[104px] sm:bottom-[112px] flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-dashed border-slate-300 w-full flex justify-end">
                <span className="text-[10px] text-slate-400 font-mono -mt-2.5 bg-white px-1 rounded">{maxPercentage}%</span>
              </div>
              <div className="border-b border-dashed border-slate-300 w-full flex justify-end">
                <span className="text-[10px] text-slate-400 font-mono -mt-2.5 bg-white px-1 rounded">{Math.round(maxPercentage * 0.5)}%</span>
              </div>
              <div className="border-b border-slate-400 w-full flex justify-end">
                <span className="text-[10px] text-slate-500 font-mono -mt-2.5 bg-white px-1 rounded font-bold">0% (ฐาน)</span>
              </div>
            </div>

            {/* 5-Column Grid with Shared Baseline */}
            <div className="relative z-10 grid grid-cols-5 gap-2 sm:gap-6">
              {items.map(item => {
                // Calculate height percentage relative to maxPercentage (0% to 100%)
                const heightPercent = maxPercentage > 0 ? (item.percentage / maxPercentage) * 100 : 0;

                return (
                  <div key={item.id} className="flex flex-col items-center group">
                    {/* Top Stats Label: Fixed height container so all bars start at same level */}
                    <div className="h-14 flex flex-col items-center justify-end pb-2 text-center w-full">
                      <div className="font-mono text-base sm:text-lg font-black text-slate-900 group-hover:scale-110 transition-transform leading-none">
                        {item.percentage}%
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600 mt-1 truncate max-w-full">
                        {item.count} ครั้ง
                        <span className="text-[10px] text-slate-400 ml-1 font-normal">({item.days}ว)</span>
                      </div>
                    </div>

                    {/* Vertical Bar Track & Baseline (Directly seated on the ground baseline) */}
                    <div className="w-full flex justify-center border-b-2 border-slate-300">
                      <div className="w-11 sm:w-16 h-48 sm:h-56 bg-slate-100/90 rounded-t-2xl p-1 sm:p-1.5 flex flex-col justify-end border-t border-x border-slate-200/80 shadow-inner relative group-hover:border-slate-300 transition-all">
                        {/* Filled Bar growing upward from the bottom baseline */}
                        <div
                          className={`w-full rounded-t-xl rounded-b-xs transition-all duration-700 shadow-sm flex items-start justify-center pt-1.5 ${item.barVerticalGradient}`}
                          style={{ height: `${Math.max(heightPercent, item.count > 0 ? 6 : 2)}%` }}
                        >
                          {/* Shimmer line indicator on top of bar */}
                          {item.count > 0 && (
                            <div className="w-4 h-1 bg-white/70 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Category Label & Icon (Seated uniformly under the baseline) */}
                    <div className="pt-3 text-center space-y-1.5 flex flex-col items-center w-full">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shadow-2xs group-hover:shadow-md group-hover:scale-105 transition-all ${item.iconBg}`}>
                        <i className={`fa-solid ${item.icon}`}></i>
                      </div>

                      <div className="font-bold text-xs sm:text-sm text-slate-800 leading-tight">
                        {item.name}
                      </div>

                      <div className="text-[10px] text-slate-400 font-medium hidden sm:block">
                        {item.days} วันทำงาน
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: HORIZONTAL PROGRESS BARS (ALTERNATIVE TOGGLE VIEW)
         ========================================================================= */}
      {orientation === 'HORIZONTAL' && (
        <div className="space-y-3 pt-1">
          {items.map(item => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              {/* Left: Category Label */}
              <div className="w-28 sm:w-32 flex items-center gap-2.5 shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 shadow-2xs ${item.iconBg}`}>
                  <i className={`fa-solid ${item.icon}`}></i>
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  {item.name}
                </span>
              </div>

              {/* Middle: Horizontal Progress Bar */}
              <div className="flex-1 flex items-center gap-3">
                <div className="flex-1 bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.barGradient}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>

              {/* Right Side: Count & Days + Percentage */}
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 shrink-0 text-xs sm:text-sm">
                <div className="text-left sm:text-right font-medium text-slate-600">
                  <span className="font-bold text-slate-900">{item.count} ครั้ง</span>
                  <span className="text-slate-400 text-xs ml-1">({item.days} วัน)</span>
                </div>

                <div className="w-12 text-right">
                  <span className="font-mono font-black text-slate-800 text-sm">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
