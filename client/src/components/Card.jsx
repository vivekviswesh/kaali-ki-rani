import React from 'react';

const SUIT_SYMBOLS = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣'
};

const SUIT_COLORS = {
  S: 'text-indigo-400',
  H: 'text-rose-500',
  D: 'text-amber-500',
  C: 'text-emerald-500'
};

const SUIT_BG_GLOW = {
  S: 'rgba(99, 102, 241, 0.15)',
  H: 'rgba(244, 63, 94, 0.15)',
  D: 'rgba(245, 158, 11, 0.15)',
  C: 'rgba(16, 185, 129, 0.15)'
};

export default function Card({ card, isPlayable = true, isSelected = false, onClick, hidden = false }) {
  if (hidden) {
    return (
      <div 
        className="w-16 h-24 sm:w-20 sm:h-30 md:w-24 md:h-36 rounded-xl border border-slate-700 bg-slate-900 flex items-center justify-center shadow-lg relative overflow-hidden"
        style={{
          background: 'repeating-linear-gradient(45deg, #0f172a, #0f172a 10px, #1e293b 10px, #1e293b 20px)',
          boxShadow: 'inset 0 0 15px rgba(0,0,0,0.6)'
        }}
      >
        {/* Card Back Logo */}
        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 border-emerald-500/30 flex items-center justify-center bg-slate-950/80 shadow-md">
          <span className="text-emerald-400 font-extrabold text-sm sm:text-base">KKR</span>
        </div>
      </div>
    );
  }

  const { rank, suit, points } = card;
  const isKaaliKiRani = suit === 'S' && rank === 'Q';
  
  // Custom styling for Queen of Spades
  const cardBorderClass = isKaaliKiRani 
    ? 'border-yellow-500/60 shadow-[0_0_15px_rgba(234,179,8,0.25)]' 
    : isSelected 
      ? 'border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]' 
      : 'border-slate-700/80';
      
  const cardBgClass = isKaaliKiRani
    ? 'bg-gradient-to-br from-slate-900 to-indigo-950/90'
    : 'bg-slate-900/90';

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`playing-card w-16 h-24 sm:w-20 sm:h-30 md:w-24 md:h-36 rounded-xl border-2 ${cardBorderClass} ${cardBgClass} flex flex-col justify-between p-2 sm:p-3 relative shadow-md select-none ${
        !isPlayable ? 'opacity-40 cursor-not-allowed' : ''
      } ${isSelected ? '-translate-y-6 sm:-translate-y-8 border-emerald-400 z-10' : ''}`}
      style={{
        backdropFilter: 'blur(4px)',
        '--suit-glow': SUIT_BG_GLOW[suit]
      }}
    >
      {/* Top Value & Suit */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col items-center">
          <span className={`text-base sm:text-lg md:text-xl font-bold leading-none ${isKaaliKiRani ? 'text-yellow-400' : 'text-slate-100'}`}>
            {rank}
          </span>
          <span className={`text-xs sm:text-sm md:text-base leading-none ${SUIT_COLORS[suit]}`}>
            {SUIT_SYMBOLS[suit]}
          </span>
        </div>
        
        {/* Crown for Queen of Spades, Point badges for others */}
        {isKaaliKiRani && (
          <div className="text-yellow-500 animate-pulse text-xs sm:text-sm">👑</div>
        )}
        
        {!isKaaliKiRani && points > 0 && (
          <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] sm:text-[10px] px-1 rounded-md font-bold">
            +{points}
          </div>
        )}
        
        {isKaaliKiRani && (
          <div className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[9px] sm:text-[10px] px-1 rounded-md font-bold">
            +30
          </div>
        )}
      </div>

      {/* Center Giant Suit Icon */}
      <div 
        className={`absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08] text-4xl sm:text-5xl md:text-6xl ${SUIT_COLORS[suit]}`}
        style={{ textShadow: `0 0 20px ${SUIT_BG_GLOW[suit]}` }}
      >
        {SUIT_SYMBOLS[suit]}
      </div>

      {/* Bottom Value & Suit (Inverted) */}
      <div className="flex justify-between items-end rotate-180">
        <div className="flex flex-col items-center">
          <span className={`text-base sm:text-lg md:text-xl font-bold leading-none ${isKaaliKiRani ? 'text-yellow-400' : 'text-slate-100'}`}>
            {rank}
          </span>
          <span className={`text-xs sm:text-sm md:text-base leading-none ${SUIT_COLORS[suit]}`}>
            {SUIT_SYMBOLS[suit]}
          </span>
        </div>
      </div>
    </div>
  );
}
