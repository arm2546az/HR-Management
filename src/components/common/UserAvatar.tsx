import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

interface UserAvatarProps {
  userId?: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  allowUpload?: boolean;
  onAvatarUpdated?: (newUrl: string | null) => void;
  showBadge?: boolean;
  alt?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  avatarUrl,
  size = 'md',
  className = '',
  allowUpload = false,
  onAvatarUpdated,
  showBadge = false,
  alt = 'รูปโปรไฟล์ผู้ใช้งาน',
}) => {
  const { currentUser, currentEmployee, updateUserAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Determine current active avatar:
  // 1. Explicit prop avatarUrl
  // 2. User/Employee avatar from AuthContext or localStorage
  const activeUserId = userId || currentUser?.id || 'guest';
  const storedAvatar = typeof window !== 'undefined'
    ? localStorage.getItem(`vn_user_avatar_${activeUserId}`)
    : null;

  const currentAvatarUrl = avatarUrl || currentUser?.avatarUrl || currentEmployee?.avatarUrl || storedAvatar;

  // Size styling maps
  const sizeMap = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-3xl',
    '2xl': 'w-28 h-28 text-5xl',
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, GIF, WebP)');
      return;
    }

    // Limit to 3MB
    if (file.size > 3 * 1024 * 1024) {
      alert('ขนาดไฟล์รูปภาพต้องไม่เกิน 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = () => {
    if (!previewUrl) return;

    // Save to localStorage for persistence
    localStorage.setItem(`vn_user_avatar_${activeUserId}`, previewUrl);

    // Call auth context method if available
    if (updateUserAvatar) {
      updateUserAvatar(previewUrl);
    }
    if (onAvatarUpdated) {
      onAvatarUpdated(previewUrl);
    }

    setShowUploadModal(false);
    setPreviewUrl(null);
  };

  const handleRemoveAvatar = () => {
    localStorage.removeItem(`vn_user_avatar_${activeUserId}`);
    if (updateUserAvatar) {
      updateUserAvatar(null);
    }
    if (onAvatarUpdated) {
      onAvatarUpdated(null);
    }
    setShowUploadModal(false);
    setPreviewUrl(null);
  };

  // Default Icon from Image 5 (Exact Person Silhouette SVG)
  const renderDefaultIcon = () => (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full fill-current text-[#9ca3af]"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Light circular background */}
      <circle cx="50" cy="50" r="50" fill="#e2e8f0" />
      {/* Head */}
      <circle cx="50" cy="40" r="18" fill="#9ca3af" />
      {/* Shoulders & Torso */}
      <path
        d="M 22 84 C 24 66 36 60 50 60 C 64 60 76 66 78 84 C 69 93 57 97 50 97 C 43 97 31 93 22 84 Z"
        fill="#9ca3af"
      />
    </svg>
  );

  return (
    <>
      <div className={`relative inline-block ${className}`}>
        <div
          className={`${sizeMap[size]} rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-xs shrink-0 flex items-center justify-center select-none ${
            allowUpload ? 'cursor-pointer hover:opacity-90 group transition-all ring-2 ring-transparent hover:ring-[#064a8b]' : ''
          }`}
          onClick={() => allowUpload && setShowUploadModal(true)}
          title={allowUpload ? 'คลิกเพื่อเปลี่ยนรูปโปรไฟล์' : alt}
        >
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt={alt}
              className="w-full h-full object-cover"
              onError={e => {
                // If image fails to load, fallback to default icon
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            renderDefaultIcon()
          )}

          {/* Hover Camera Overlay if allowUpload */}
          {allowUpload && (
            <div className="absolute inset-0 bg-slate-950/45 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <i className="fa-solid fa-camera text-xs"></i>
            </div>
          )}
        </div>

        {/* Small Edit Badge */}
        {showBadge && allowUpload && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setShowUploadModal(true);
            }}
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#064a8b] hover:bg-[#022247] text-white flex items-center justify-center shadow-md border-2 border-white text-[10px] cursor-pointer"
            title="เปลี่ยนรูปโปรไฟล์"
          >
            <i className="fa-solid fa-camera"></i>
          </button>
        )}
      </div>

      {/* Upload Profile Picture Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#064a8b] flex items-center justify-center">
                  <i className="fa-solid fa-image-portrait"></i>
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  เปลี่ยนรูปโปรไฟล์
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setPreviewUrl(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* Avatar Preview */}
            <div className="flex flex-col items-center justify-center gap-3 py-2">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#064a8b]/20 shadow-lg bg-slate-100 flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : currentAvatarUrl ? (
                  <img
                    src={currentAvatarUrl}
                    alt="Current"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  renderDefaultIcon()
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {previewUrl
                  ? 'ตัวอย่างรูปภาพที่เลือก'
                  : currentAvatarUrl
                  ? 'รูปโปรไฟล์ปัจจุบันของคุณ'
                  : 'ยังไม่มีรูปโปรไฟล์ (ใช้รูปไอคอนเริ่มต้น)'}
              </p>
            </div>

            {/* File Upload Controls */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#064a8b] hover:bg-[#022247] text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-cloud-arrow-up"></i>
                <span>เลือกรูปจากอุปกรณ์ของคุณ</span>
              </button>

              {currentAvatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="w-full py-2 px-4 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-trash-can"></i>
                  <span>ลบรูปโปรไฟล์ (ใช้ไอคอนเริ่มต้น)</span>
                </button>
              )}
            </div>

            {/* Actions Footer */}
            {previewUrl && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPreviewUrl(null)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  ยกเลิกรูปนี้
                </button>
                <button
                  type="button"
                  onClick={handleSaveAvatar}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                >
                  บันทึกรูปภาพ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
