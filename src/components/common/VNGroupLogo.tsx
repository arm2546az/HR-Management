import React from 'react';

interface VNGroupLogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const VNGroupLogo: React.FC<VNGroupLogoProps> = ({
  className = '',
  variant = 'full',
  size = 'md',
}) => {
  // Height presets
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24',
  };

  const isWhite = variant === 'white';
  const textColor = isWhite ? '#FFFFFF' : '#003870';
  const subTextColor = isWhite ? '#CAD7F5' : '#003870';

  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClasses[size]} ${className}`}
      >
        {/* V.N. Group Stylized Wing / Crest Emblem */}
        <g id="vn-crest">
          {/* Bottom Wing Swoop */}
          <path
            d="M 68 126 C 60 110 58 92 68 76 C 74 96 90 120 118 136 L 96 160 C 80 148 72 138 68 126 Z"
            fill="#013b7b"
          />
          {/* Middle Wing Band */}
          <path
            d="M 72 74 C 70 54 82 32 94 20 C 88 44 98 84 136 122 L 96 160 C 78 128 72 96 72 74 Z"
            fill="#002759"
          />
          {/* Upper Wing Band */}
          <path
            d="M 94 20 C 104 10 118 4 126 2 C 112 28 126 76 160 106 L 96 160 C 90 134 90 70 94 20 Z"
            fill="#003870"
          />
          {/* Accent Turquoise Stripe */}
          <path
            d="M 126 44 C 138 48 152 54 162 62 C 146 76 134 94 128 108 C 122 88 122 64 126 44 Z"
            fill="#00a8b5"
          />
          {/* Top Yellow/Lime Accent Curve */}
          <path
            d="M 126 44 C 144 50 166 54 184 40 C 172 58 156 68 140 74 C 132 64 128 54 126 44 Z"
            fill="#b8db1a"
          />
        </g>
      </svg>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      {/* Dynamic Crest SVG */}
      <svg
        viewBox="0 0 220 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClasses[size]} w-auto object-contain`}
      >
        <g id="vn-group-crest" transform="translate(10, 5)">
          {/* Bottom Wing Band */}
          <path
            d="M 46 98 C 42 86 42 74 48 62 C 54 78 66 98 88 110 L 72 128 C 58 118 50 108 46 98 Z"
            fill="#013b7b"
          />
          {/* Middle Wing Band */}
          <path
            d="M 48 60 C 48 44 56 26 66 16 C 62 36 72 68 102 98 L 72 128 C 56 102 50 78 48 60 Z"
            fill="#002759"
          />
          {/* Upper Wing Band */}
          <path
            d="M 66 16 C 74 8 84 4 90 2 C 80 22 92 60 120 84 L 72 128 C 68 106 66 54 66 16 Z"
            fill="#003870"
          />
          {/* Turquoise Accent */}
          <path
            d="M 90 36 C 100 40 112 45 120 52 C 108 64 98 78 94 90 C 88 74 88 52 90 36 Z"
            fill="#00a8b5"
          />
          {/* Lime Green Accent Tip */}
          <path
            d="M 90 36 C 104 42 122 46 136 34 C 126 50 114 58 102 62 C 96 54 92 44 90 36 Z"
            fill="#b8db1a"
          />
        </g>
      </svg>

      {/* Brand Title: V.N.GROUP */}
      <div
        className="font-black tracking-[0.22em] text-center leading-none mt-1"
        style={{
          color: textColor,
          fontFamily: "'Inter', 'Prompt', -apple-system, sans-serif",
          fontSize: size === 'sm' ? '13px' : size === 'md' ? '17px' : size === 'lg' ? '22px' : '28px',
        }}
      >
        V.N.GROUP
      </div>

      {/* Tagline: BEHIND YOUR SUCCESS */}
      <div
        className="tracking-[0.28em] uppercase text-center font-semibold mt-0.5 leading-none"
        style={{
          color: subTextColor,
          fontFamily: "'Inter', 'Prompt', sans-serif",
          fontSize: size === 'sm' ? '6.5px' : size === 'md' ? '8.5px' : size === 'lg' ? '11px' : '14px',
          opacity: 0.9,
        }}
      >
        BEHIND YOUR SUCCESS
      </div>
    </div>
  );
};
