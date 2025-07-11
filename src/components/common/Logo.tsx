import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = '', size = 32 }: LogoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 64 64" 
      width={size} 
      height={size}
      className={className}
    >
      {/* Shield outline */}
      <path
        d="M32,4
           L12,12
           V32
           C12,47 32,60 32,60
           C32,60 52,47 52,32
           V12
           L32,4 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Centered, smaller stylized card */}
      <rect
        x="22" y="26"
        width="20" height="12"
        rx="3" ry="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Card stripe detail */}
      <line
        x1="24" y1="32"
        x2="40" y2="32"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
