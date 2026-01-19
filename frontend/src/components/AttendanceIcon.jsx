import React from 'react';
import './AttendanceIcon.css';

const AttendanceIcon = ({ size = 200 }) => {
  return (
    <div className="attendance-icon" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        {/* Background Circle */}
        <circle cx="100" cy="100" r="95" fill="#f5f0eb" stroke="#2c2c2c" strokeWidth="2"/>
        
        {/* Top curved header */}
        <path d="M 30 70 Q 100 50 170 70" fill="#4a7c8c" />
        <rect x="30" y="70" width="140" height="15" fill="#4a7c8c" />
        
        {/* Piano keys on header */}
        <g className="piano-keys">
          <rect x="75" y="65" width="3" height="8" fill="white" opacity="0.7"/>
          <rect x="80" y="65" width="3" height="8" fill="white" opacity="0.7"/>
          <rect x="85" y="65" width="3" height="8" fill="white" opacity="0.7"/>
          <rect x="115" y="65" width="3" height="8" fill="white" opacity="0.7"/>
          <rect x="120" y="65" width="3" height="8" fill="white" opacity="0.7"/>
          <rect x="125" y="65" width="3" height="8" fill="white" opacity="0.7"/>
        </g>
        
        {/* Clock icon */}
        <circle cx="130" cy="55" r="12" fill="#3bb3c3" stroke="white" strokeWidth="2"/>
        <line x1="130" y1="55" x2="130" y2="48" stroke="white" strokeWidth="1.5"/>
        <line x1="130" y1="55" x2="135" y2="55" stroke="white" strokeWidth="1.5"/>
        
        {/* Yellow note/card */}
        <rect x="40" y="88" width="45" height="18" rx="3" fill="#ffd966"/>
        <line x1="45" y1="93" x2="80" y2="93" stroke="#f4c542" strokeWidth="2"/>
        <line x1="45" y1="98" x2="75" y2="98" stroke="#f4c542" strokeWidth="2"/>
        
        {/* Teal note */}
        <rect x="40" y="110" width="30" height="15" rx="2" fill="#5dbdc9"/>
        <line x1="44" y1="115" x2="66" y2="115" stroke="#4a9aa5" strokeWidth="1.5"/>
        <line x1="44" y1="119" x2="62" y2="119" stroke="#4a9aa5" strokeWidth="1.5"/>
        
        {/* Person */}
        <g className="person">
          {/* Head */}
          <circle cx="90" cy="95" r="10" fill="#8b5e5e"/>
          {/* Hair */}
          <path d="M 82 92 Q 90 85 98 92" fill="#6b3e3e"/>
          {/* Body */}
          <path d="M 75 105 L 75 135 L 82 135 L 82 145 L 85 145 L 85 135 L 95 135 L 95 145 L 98 145 L 98 135 L 105 135 L 105 105 Z" fill="#d4614f"/>
          {/* Arms */}
          <path d="M 75 110 L 65 120 L 68 123 L 78 113" fill="#d4614f"/>
          <path d="M 105 110 L 108 120 L 112 125 L 105 113" fill="#d4614f"/>
          {/* Phone in hand */}
          <rect x="106" y="118" width="8" height="12" rx="1" fill="#2c3e50"/>
        </g>
        
        {/* Checkmark box */}
        <rect x="118" y="95" width="28" height="25" rx="3" fill="white" stroke="#e0e0e0" strokeWidth="1.5"/>
        <circle cx="132" cy="107" r="10" fill="#e8f5f7" stroke="#3bb3c3" strokeWidth="2"/>
        <path d="M 127 107 L 130 110 L 137 102" fill="none" stroke="#3bb3c3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        
        {/* Small UI elements */}
        <rect x="152" y="100" width="20" height="8" rx="2" fill="#e07856"/>
        
        {/* Grid squares */}
        <rect x="45" y="130" width="12" height="12" rx="1" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
        <rect x="60" y="130" width="12" height="12" rx="1" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
        <rect x="75" y="130" width="12" height="12" rx="1" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
        <rect x="115" y="130" width="12" height="12" rx="1" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
        <rect x="130" y="130" width="12" height="12" rx="1" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
        <rect x="145" y="130" width="12" height="12" rx="1" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
        
        {/* Colored squares */}
        <rect x="47" y="132" width="8" height="8" fill="#ffd966"/>
        <rect x="62" y="132" width="8" height="8" fill="#e07856"/>
        <rect x="77" y="132" width="8" height="8" fill="#5dbdc9"/>
        <rect x="117" y="132" width="8" height="8" fill="#e07856"/>
        <rect x="132" y="132" width="8" height="8" fill="#ffd966"/>
        <rect x="147" y="132" width="8" height="8" fill="#5dbdc9"/>
        
        {/* Bell notification */}
        <g className="bell">
          <path d="M 125 148 Q 125 142 130 142 Q 135 142 135 148 L 134 152 L 126 152 Z" fill="#ffd966"/>
          <rect x="128" y="152" width="4" height="2" fill="#ffd966"/>
          <line x1="128" y1="146" x2="132" y2="146" stroke="#f4c542" strokeWidth="0.5"/>
          <circle cx="133" cy="144" r="1.5" fill="#e07856"/>
        </g>
        
        {/* Decorative plus signs */}
        <text x="90" y="68" fill="#a8c5a8" fontSize="8" opacity="0.5">+</text>
        <text x="105" y="80" fill="#a8c5a8" fontSize="6" opacity="0.5">+</text>
        <text x="148" y="90" fill="#a8c5a8" fontSize="8" opacity="0.5">+</text>
        <text x="70" y="85" fill="#a8c5a8" fontSize="6" opacity="0.5">+</text>
        
        {/* Decorative circles */}
        <circle cx="102" cy="73" r="2" fill="none" stroke="#a8c5a8" strokeWidth="0.5" opacity="0.5"/>
        <circle cx="135" cy="70" r="1.5" fill="none" stroke="#a8c5a8" strokeWidth="0.5" opacity="0.5"/>
        <circle cx="82" y="90" r="1.5" fill="none" stroke="#a8c5a8" strokeWidth="0.5" opacity="0.5"/>
      </svg>
    </div>
  );
};

export default AttendanceIcon;