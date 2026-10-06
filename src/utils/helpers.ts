import Swal from 'sweetalert2';

export const formatThaiDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  try {
    const parts = dateStr.split(' ')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10) + 543;
      const month = thaiMonths[parseInt(parts[1], 10) - 1];
      const day = parseInt(parts[2], 10);
      return `${day} ${month} ${year}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear() + 543;
    const month = thaiMonths[d.getMonth()];
    const day = d.getDate();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const getLeaveTypeName = (type?: string): string => {
  switch (type) {
    case 'SICK': return 'ลาป่วย';
    case 'PERSONAL': return 'ลากิจ';
    case 'ANNUAL': return 'ลาพักร้อน';
    case 'MATERNITY': return 'ลาคลอด';
    case 'MILITARY': return 'ลารับราชการทหาร';
    case 'TRAINING': return 'ลาฝึกอบรม';
    default: return type || '-';
  }
};

export const getStatusBadge = (status: string): { label: string; bgClass: string; textClass: string; icon: string } => {
  switch (status) {
    case 'ACTIVE':
      return { label: 'ทำงานอยู่', bgClass: 'bg-emerald-100 border border-emerald-300', textClass: 'text-emerald-800', icon: 'fa-check-circle' };
    case 'PROBATION':
      return { label: 'ทดลองงาน', bgClass: 'bg-amber-100 border border-amber-300', textClass: 'text-amber-800', icon: 'fa-user-clock' };
    case 'PENDING_START':
      return { label: 'รอเริ่มงาน', bgClass: 'bg-sky-100 border border-sky-300', textClass: 'text-sky-800', icon: 'fa-calendar-plus' };
    case 'RESIGNED':
      return { label: 'ลาออก', bgClass: 'bg-slate-200 border border-slate-300', textClass: 'text-slate-700', icon: 'fa-user-minus' };
    case 'TERMINATED':
      return { label: 'เลิกจ้าง', bgClass: 'bg-rose-100 border border-rose-300', textClass: 'text-rose-800', icon: 'fa-user-xmark' };

    // Request Statuses
    case 'DRAFT':
      return { label: 'ร่าง', bgClass: 'bg-slate-100 border border-slate-300', textClass: 'text-slate-700', icon: 'fa-file-lines' };
    case 'PENDING':
      return { label: 'รออนุมัติ', bgClass: 'bg-amber-100 border border-amber-300', textClass: 'text-amber-800', icon: 'fa-hourglass-half' };
    case 'APPROVED':
      return { label: 'อนุมัติแล้ว', bgClass: 'bg-emerald-100 border border-emerald-300', textClass: 'text-emerald-800', icon: 'fa-check' };
    case 'REJECTED':
      return { label: 'ไม่อนุมัติ', bgClass: 'bg-rose-100 border border-rose-300', textClass: 'text-rose-800', icon: 'fa-xmark' };
    case 'CANCELLED':
      return { label: 'ยกเลิก', bgClass: 'bg-gray-200 border border-gray-400', textClass: 'text-gray-700', icon: 'fa-ban' };

    // Attendance Statuses
    case 'ON_TIME':
      return { label: 'ตรงเวลา', bgClass: 'bg-emerald-100 border border-emerald-300', textClass: 'text-emerald-800', icon: 'fa-circle-check' };
    case 'LATE':
      return { label: 'สาย', bgClass: 'bg-amber-100 border border-amber-300', textClass: 'text-amber-800', icon: 'fa-triangle-exclamation' };
    case 'EARLY_LEAVE':
      return { label: 'ออกก่อนเวลา', bgClass: 'bg-purple-100 border border-purple-300', textClass: 'text-purple-800', icon: 'fa-person-walking-dashed-line-arrow-right' };
    case 'NEEDS_CHECK':
      return { label: 'รอตรวจสอบ', bgClass: 'bg-orange-100 border border-orange-300', textClass: 'text-orange-800', icon: 'fa-circle-question' };
    case 'INCOMPLETE':
      return { label: 'ข้อมูลไม่ครบ', bgClass: 'bg-rose-100 border border-rose-300', textClass: 'text-rose-800', icon: 'fa-circle-exclamation' };

    // Payroll Statuses
    case 'CALCULATED':
      return { label: 'คำนวณแล้ว', bgClass: 'bg-blue-100 border border-blue-300', textClass: 'text-blue-800', icon: 'fa-calculator' };
    case 'PENDING_REVIEW':
      return { label: 'รอตรวจสอบ', bgClass: 'bg-amber-100 border border-amber-300', textClass: 'text-amber-800', icon: 'fa-magnifying-glass' };
    case 'PAID':
      return { label: 'จ่ายแล้ว', bgClass: 'bg-emerald-100 border border-emerald-300', textClass: 'text-emerald-800', icon: 'fa-money-bill-wave' };

    default:
      return { label: status, bgClass: 'bg-slate-100 border border-slate-300', textClass: 'text-slate-700', icon: 'fa-info-circle' };
  }
};

// SweetAlert2 helper functions styled according to VN Group brand colors (#022247, #064a8b)
export const Alert = {
  success: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonColor: '#064a8b',
      confirmButtonText: 'ตกลง',
      customClass: {
        popup: 'rounded-xl shadow-2xl font-sans',
      },
    });
  },
  error: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonColor: '#064a8b',
      confirmButtonText: 'เข้าใจแล้ว',
      customClass: {
        popup: 'rounded-xl shadow-2xl font-sans',
      },
    });
  },
  warning: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonColor: '#064a8b',
      confirmButtonText: 'ตกลง',
      customClass: {
        popup: 'rounded-xl shadow-2xl font-sans',
      },
    });
  },
  confirm: (title: string, text: string, confirmButtonText = 'ยืนยันดำเนินการ'): Promise<boolean> => {
    return Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#064a8b',
      cancelButtonColor: '#64748b',
      confirmButtonText,
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl shadow-2xl font-sans',
      },
    }).then(res => res.isConfirmed);
  },
  promptReason: (title: string, placeholder = 'ระบุเหตุผล...'): Promise<{ confirmed: boolean; reason: string }> => {
    return Swal.fire({
      title,
      input: 'textarea',
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'กรุณาระบุเหตุผลอย่างชัดเจน';
        }
        return null;
      },
      customClass: {
        popup: 'rounded-xl shadow-2xl font-sans',
      },
    }).then(res => ({
      confirmed: res.isConfirmed,
      reason: res.value || '',
    }));
  },
};
