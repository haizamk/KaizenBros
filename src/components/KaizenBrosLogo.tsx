import React from 'react';

interface KaizenBrosLogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
  variant?: 'dark' | 'light' | 'emerald';
}

export const KaizenBrosLogo: React.FC<KaizenBrosLogoProps> = ({
  size = 40,
  className = '',
  showText = false,
  variant = 'emerald'
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div className={`inline-flex items-center space-x-3 select-none ${className}`}>
      {/* Precision Vector Emblem matching screenshot */}
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4))' }}
      >
        {/* Background Card */}
        <rect
          x="4"
          y="4"
          width="112"
          height="112"
          rx="18"
          fill="#111827"
          stroke="#1F2937"
          strokeWidth="2"
        />

        {/* Inner Dark Blue Canvas reflecting the signage plate */}
        <rect
          x="10"
          y="10"
          width="100"
          height="100"
          rx="12"
          fill="#0F172A"
        />

        {/* White Outer Frame from Screenshot */}
        <rect
          x="20"
          y="18"
          width="80"
          height="84"
          rx="6"
          stroke="#FFFFFF"
          strokeWidth="6"
          fill="none"
        />

        {/* Letter 'k' - Vertical Stalk */}
        <rect
          x="38"
          y="26"
          width="7"
          height="68"
          rx="2"
          fill="#FFFFFF"
        />

        {/* Letter 'k' - Left Arrow Chevron / Arm */}
        <path
          d="M38 60 L26 48 L26 57 L33 63 L26 69 L26 78 Z"
          fill="#FFFFFF"
        />

        {/* Letter 'b' - Tall Vertical Stalk */}
        <rect
          x="57"
          y="26"
          width="7"
          height="68"
          rx="2"
          fill="#FFFFFF"
        />

        {/* Letter 'b' - Rounded Lower Bowl */}
        <path
          d="M64 53 C76 53 84 60 84 72 C84 84 76 91 64 91 L64 83 C71 83 76 78 76 72 C76 66 71 61 64 61 Z"
          fill="#FFFFFF"
        />

        {/* Subtle Brand Accent Dot (Emerald signature) */}
        <circle cx="89" cy="27" r="3.5" fill="#10B981" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold tracking-tight text-white font-serif text-lg leading-none">
              KAIZENBROS
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 leading-none">
              DIALISIS
            </span>
          </div>
          <span className="text-[10px] text-slate-400 tracking-wider uppercase font-sans mt-0.5">
            Pusat Rawatan Hemodialisis KKM
          </span>
        </div>
      )}
    </div>
  );
};
