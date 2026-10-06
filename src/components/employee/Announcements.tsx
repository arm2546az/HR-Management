import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHR } from '../../context/HRContext';
import { CompanyAnnouncement } from '../../types';
import { formatThaiDate } from '../../utils/helpers';

interface AnnouncementsProps {
  className?: string;
  limit?: number;
}

export const Announcements: React.FC<AnnouncementsProps> = ({
  className = '',
  limit,
}) => {
  const { role } = useAuth();
  const { announcements, companies, selectedCompanyId } = useHR();

  const [filterPriority, setFilterPriority] = useState<'ALL' | 'URGENT' | 'HIGH' | 'NORMAL'>('ALL');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<CompanyAnnouncement | null>(null);

  // Security & visibility check: ONLY visible to employees as requested
  if (role !== 'EMPLOYEE') {
    return null;
  }

  // Filter announcements for current company/branch
  const filteredAnnouncements = announcements
    .filter(ann => {
      // Company branch filter
      if (ann.companyId !== 'ALL' && selectedCompanyId !== 'ALL' && ann.companyId !== selectedCompanyId) {
        return false;
      }
      // Priority filter
      if (filterPriority !== 'ALL' && ann.priority !== filterPriority) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by priority first (URGENT > HIGH > NORMAL), then date descending
      const weight = { URGENT: 3, HIGH: 2, NORMAL: 1 };
      const diffWeight = (weight[b.priority] || 0) - (weight[a.priority] || 0);
      if (diffWeight !== 0) return diffWeight;
      return b.date.localeCompare(a.date);
    });

  const displayedList = limit ? filteredAnnouncements.slice(0, limit) : filteredAnnouncements;

  const getPriorityBadge = (priority: CompanyAnnouncement['priority']) => {
    switch (priority) {
      case 'URGENT':
        return {
          label: 'ข่าวด่วนที่สุด',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
          dotClass: 'bg-rose-500 animate-pulse',
          icon: 'fa-triangle-exclamation',
        };
      case 'HIGH':
        return {
          label: 'ประกาศสำคัญ',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          dotClass: 'bg-amber-500',
          icon: 'fa-circle-exclamation',
        };
      default:
        return {
          label: 'ข่าวทั่วไป',
          badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
          dotClass: 'bg-blue-500',
          icon: 'fa-bullhorn',
        };
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-lg shadow-2xs shrink-0">
            <i className="fa-solid fa-bullhorn"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 leading-tight">
                ประกาศและข่าวสารองค์กร
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700">
                HR Notices
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ข่าวสาร ระเบียบปฏิบัติ และประกาศแจ้งจากฝ่ายบริหาร VN Group (เฉพาะพนักงาน)
            </p>
          </div>
        </div>

        {/* Priority Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'URGENT', 'HIGH', 'NORMAL'] as const).map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterPriority === p
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {p === 'ALL' ? 'ทั้งหมด' : p === 'URGENT' ? 'ด่วน' : p === 'HIGH' ? 'สำคัญ' : 'ทั่วไป'}
            </button>
          ))}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5">
        {displayedList.length === 0 ? (
          <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-xl">
              <i className="fa-regular fa-newspaper"></i>
            </div>
            <p className="text-sm font-bold text-slate-600">ไม่มีประกาศใหม่ในขณะนี้</p>
            <p className="text-xs text-slate-400">เมื่อมีข่าวสารใหม่จากฝ่ายบุคคลจะปรากฏในส่วนนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedList.map(item => {
              const badge = getPriorityBadge(item.priority);
              const branchName = item.companyId === 'ALL'
                ? 'ทุกสาขา'
                : companies.find(c => c.id === item.companyId)?.shortName || 'ทุกสาขา';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedAnnouncement(item)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-white transition-all shadow-2xs hover:shadow-sm cursor-pointer flex flex-col justify-between group space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`}></span>
                        <i className={`fa-solid ${badge.icon} text-[10px]`}></i>
                        <span>{badge.label}</span>
                      </span>

                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <i className="fa-regular fa-calendar text-[10px]"></i>
                        <span>{formatThaiDate(item.date)}</span>
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 truncate">
                      <i className="fa-regular fa-user text-slate-400"></i>
                      <span className="truncate">{item.author || 'ฝ่ายบุคคล'}</span>
                    </span>
                    <span className="flex items-center gap-1 text-indigo-600 font-bold shrink-0">
                      <span>อ่านรายละเอียด</span>
                      <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getPriorityBadge(selectedAnnouncement.priority).badgeClass}`}>
                  <i className={`fa-solid ${getPriorityBadge(selectedAnnouncement.priority).icon} text-xs`}></i>
                  <span>{getPriorityBadge(selectedAnnouncement.priority).label}</span>
                </span>
                <span className="text-xs text-slate-400">
                  {formatThaiDate(selectedAnnouncement.date)}
                </span>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-900 leading-snug">
                {selectedAnnouncement.title}
              </h3>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedAnnouncement.content}
              </div>

              <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
                <span>ประกาศโดย: <strong>{selectedAnnouncement.author}</strong></span>
                <span>ผู้รับ: พนักงานทุกคนในเครือ VN Group</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs"
              >
                รับทราบประกาศ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
