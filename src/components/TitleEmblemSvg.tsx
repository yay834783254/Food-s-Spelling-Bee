import React from 'react';

export const TitleEmblemSvg: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Outer Honeycomb Shield Silhouette */}
    <polygon
      points="60,6 108,33 108,87 60,114 12,87 12,33"
      fill="#1C1613"
      stroke="#F59E0B"
      strokeWidth="3.5"
    />
    <polygon
      points="60,13 101,37 101,83 60,107 19,83 19,37"
      fill="#271F1A"
      stroke="#78350F"
      strokeWidth="1.5"
    />
    {/* Subtle Inner Honeycomb Lattice */}
    <path
      d="M60 22 L76 31 L76 49 L60 58 L44 49 L44 31 Z"
      stroke="#452715"
      strokeWidth="1.5"
      fill="#1F1814"
    />
    {/* Left & Right Acoustic Wings */}
    <path
      d="M52 54 C32 36, 18 44, 24 60 C28 70, 44 66, 54 60 Z"
      fill="#FDE68A"
      fillOpacity="0.9"
      stroke="#D97706"
      strokeWidth="2"
    />
    <path
      d="M68 54 C88 36, 102 44, 96 60 C92 70, 76 66, 66 60 Z"
      fill="#FDE68A"
      fillOpacity="0.9"
      stroke="#D97706"
      strokeWidth="2"
    />
    {/* Bee Toque / Chef Crown */}
    <path
      d="M49 36 C46 28, 53 24, 60 26 C67 24, 74 28, 71 36 Z"
      fill="#FBF8F3"
      stroke="#D97706"
      strokeWidth="2"
    />
    {/* Bee Thorax & Golden Striped Abdomen */}
    <ellipse cx="60" cy="46" rx="9" ry="8" fill="#F59E0B" stroke="#1C1613" strokeWidth="2" />
    <ellipse cx="60" cy="70" rx="14" ry="18" fill="#F59E0B" stroke="#1C1613" strokeWidth="2.5" />
    <path d="M47 64 H73" stroke="#1C1613" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M46 72 H74" stroke="#1C1613" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M49 80 H71" stroke="#1C1613" strokeWidth="4" strokeLinecap="round" />
    {/* Fountain Nib Stinger */}
    <polygon points="56,87 64,87 60,99" fill="#FDE68A" stroke="#1C1613" strokeWidth="1.5" />
  </svg>
);

export const HoneyPipSvg: React.FC<{ state: 'full' | 'cracked' | 'empty' }> = ({ state }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <polygon
      points="12,2 21,7 21,17 12,22 3,17 3,7"
      fill={state === 'full' ? '#F59E0B' : state === 'cracked' ? '#B45309' : '#1C1613'}
      stroke={state === 'empty' ? '#57463B' : '#FDE68A'}
      strokeWidth="2"
    />
    {state === 'full' && (
      <polygon points="12,5 17,8 17,12 12,9 7,12 7,8" fill="#FEF3C7" fillOpacity="0.65" />
    )}
    {state === 'cracked' && (
      <path d="M9 6 L13 12 L10 15 L14 20" stroke="#1C1613" strokeWidth="2" fill="none" />
    )}
  </svg>
);

export const SoundWaveIconSvg: React.FC<{ active: boolean; className?: string }> = ({
  active,
  className = 'w-5 h-5'
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M11 5L6 9H2V15H6L11 19V5Z"
      fill={active ? '#F59E0B' : 'currentColor'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53"
      stroke={active ? '#FDE68A' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07"
      stroke={active ? '#F59E0B' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
