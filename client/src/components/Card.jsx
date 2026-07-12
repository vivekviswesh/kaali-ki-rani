import React from 'react';

const SUIT_SYMBOLS = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣'
};

const SUIT_COLOR_CLASSES = {
  S: 'color-indigo',
  H: 'color-rose',
  D: 'color-amber',
  C: 'color-emerald'
};

export default function Card({ card, isPlayable = true, isSelected = false, onClick, hidden = false }) {
  // Inline styles for custom colors
  const suitColors = {
    S: '#818cf8', // indigo
    H: '#f43f5e', // rose
    D: '#f59e0b', // amber
    C: '#10b981'  // emerald
  };

  if (hidden) {
    return (
      <div 
        className="playing-card disabled"
        style={{
          background: 'repeating-linear-gradient(45deg, #0f172a, #0f172a 10px, #1e293b 10px, #1e293b 20px)',
          boxShadow: 'inset 0 0 15px rgba(0,0,0,0.6)',
          cursor: 'default'
        }}
      >
        <div 
          className="flex-center" 
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '50%',
            border: '2px solid rgba(16, 185, 129, 0.25)',
            background: 'rgba(2, 6, 23, 0.9)',
            margin: 'auto'
          }}
        >
          <span style={{ color: '#10b981', fontWeight: 900, fontSize: '0.8rem' }}>KKR</span>
        </div>
      </div>
    );
  }

  const { rank, suit, points } = card;
  const isKaaliKiRani = suit === 'S' && rank === 'Q';

  // Build card class list
  let cardClass = 'playing-card';
  if (isKaaliKiRani) cardClass += ' queen-of-spades';
  if (!isPlayable) cardClass += ' disabled';
  
  // Custom inline style for card lift if selected
  const selectedCardStyle = isSelected ? {
    transform: 'translateY(-24px) scale(1.05)',
    borderColor: '#10b981',
    boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
    zIndex: 30
  } : {};

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={cardClass}
      style={selectedCardStyle}
    >
      {/* Top Value & Suit */}
      <div className="justify-between" style={{ width: '100%' }}>
        <div className="flex-col" style={{ alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isKaaliKiRani ? '#fbbf24' : '#f8fafc', lineHeight: 1 }}>
            {rank}
          </span>
          <span style={{ fontSize: '0.8rem', color: suitColors[suit], lineHeight: 1 }}>
            {SUIT_SYMBOLS[suit]}
          </span>
        </div>
        
        {/* Crown/Points Badge */}
        {isKaaliKiRani ? (
          <span style={{ fontSize: '0.75rem' }} className="point-badge rani">👑 +30</span>
        ) : points > 0 ? (
          <span className="point-badge regular">+{points}</span>
        ) : null}
      </div>

      {/* Center Giant Suit Icon */}
      <div className="playing-card-center-icon" style={{ color: suitColors[suit] }}>
        {SUIT_SYMBOLS[suit]}
      </div>

      {/* Bottom Value & Suit (Inverted) */}
      <div className="justify-between" style={{ width: '100%', transform: 'rotate(180deg)' }}>
        <div className="flex-col" style={{ alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isKaaliKiRani ? '#fbbf24' : '#f8fafc', lineHeight: 1 }}>
            {rank}
          </span>
          <span style={{ fontSize: '0.8rem', color: suitColors[suit], lineHeight: 1 }}>
            {SUIT_SYMBOLS[suit]}
          </span>
        </div>
      </div>
    </div>
  );
}
