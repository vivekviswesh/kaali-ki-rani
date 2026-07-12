import React, { useState } from 'react';
import { SUITS, RANKS } from '../engine/constants.js';
import { Sparkles } from 'lucide-react';

const SUIT_SYMBOLS = {
  S: '♠ Spades',
  H: '♥ Hearts',
  D: '♦ Diamonds',
  C: '♣ Clubs'
};

export default function DeclarationOverlay({ gameState, mySeat, onDeclare }) {
  const { activeSeat, players } = gameState;
  const isActive = activeSeat === mySeat;
  
  const [partnerRank, setPartnerRank] = useState('A');
  const [partnerSuit, setPartnerSuit] = useState('S');
  const [trumpSuit, setTrumpSuit] = useState('S');

  const handleSubmit = (e) => {
    e.preventDefault();
    onDeclare({
      partnerCard: { rank: partnerRank, suit: partnerSuit },
      trumpSuit
    });
  };

  const activePlayerName = players[activeSeat]?.name || 'Player';

  // Custom styling for suit buttons
  const suitColors = {
    S: { border: 'rgba(99, 102, 241, 0.4)', bgActive: 'rgba(99, 102, 241, 0.2)', text: '#818cf8', activeGlow: '0 0 12px rgba(99, 102, 241, 0.4)', activeBorder: '#6366f1' },
    H: { border: 'rgba(244, 63, 94, 0.4)', bgActive: 'rgba(244, 63, 94, 0.2)', text: '#f43f5e', activeGlow: '0 0 12px rgba(244, 63, 94, 0.4)', activeBorder: '#e11d48' },
    D: { border: 'rgba(245, 158, 11, 0.4)', bgActive: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b', activeGlow: '0 0 12px rgba(245, 158, 11, 0.4)', activeBorder: '#fbbf24' },
    C: { border: 'rgba(16, 185, 129, 0.4)', bgActive: 'rgba(16, 185, 129, 0.2)', text: '#10b981', activeGlow: '0 0 12px rgba(16, 185, 129, 0.4)', activeBorder: '#34d399' }
  };

  if (!isActive) {
    return (
      <div className="modal-overlay-blur">
        <div className="modal-window-card" style={{ maxWidth: '400px' }}>
          <div style={{
            width: '3.5rem',
            height: '3.5rem',
            background: 'rgba(2, 6, 23, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            margin: '0 auto 1.25rem'
          }}>📣</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', marginBottom: '0.5rem' }}>Partner & Trump Declaration</h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.4 }}>
            Waiting for bid winner <span style={{ color: '#10b981', fontWeight: 800 }}>{activePlayerName}</span> to declare the Partner Card and Trump Suit...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay-blur">
      <div className="modal-window-card animate-pop-in" style={{ maxWidth: '440px', padding: '1.75rem', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'left' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '2.75rem',
            height: '2.75rem',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24',
            margin: '0 auto 0.5rem'
          }}>
            <Sparkles size={18} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f8fafc' }}>Make Your Declaration</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.125rem' }}>You won the bid! Choose your partnership and trumps.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '1.5rem' }}>
          
          {/* Partner Card Section */}
          <div className="flex-col" style={{ gap: '0.75rem' }}>
            <label className="form-label" style={{ margin: 0 }}>1. Partner Card</label>
            <div className="grid-2">
              {/* Rank select */}
              <div className="flex-col" style={{ gap: '0.25rem' }}>
                <span style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Rank</span>
                <select
                  value={partnerRank}
                  onChange={(e) => setPartnerRank(e.target.value)}
                  className="form-select"
                >
                  {Object.values(RANKS).map((rank) => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
              </div>

              {/* Suit select */}
              <div className="flex-col" style={{ gap: '0.25rem' }}>
                <span style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Suit</span>
                <select
                  value={partnerSuit}
                  onChange={(e) => setPartnerSuit(e.target.value)}
                  className="form-select"
                >
                  {Object.entries(SUIT_SYMBOLS).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <p style={{ fontSize: '0.7rem', color: '#64748b', background: 'rgba(2, 6, 23, 0.3)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(2, 6, 23, 0.5)', lineHeight: 1.4 }}>
              💡 <b>Note:</b> The player holding this card becomes your secret partner. If this card is in your own hand, you will play <b>Solo (1 vs 3)</b>.
            </p>
          </div>

          {/* Trump Suit Section */}
          <div className="flex-col" style={{ gap: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0 }}>2. Trump Suit</label>
            <div className="grid-4">
              {Object.keys(SUITS).map((key) => {
                const code = SUITS[key];
                const active = trumpSuit === code;
                const config = suitColors[code];
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setTrumpSuit(code)}
                    className="btn"
                    style={{
                      padding: '0.75rem 0',
                      background: active ? config.bgActive : 'rgba(2, 6, 23, 0.4)',
                      border: `1px solid ${active ? config.activeBorder : config.border}`,
                      color: active ? '#ffffff' : config.text,
                      boxShadow: active ? config.activeGlow : 'none',
                      borderRadius: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.125rem'
                    }}
                  >
                    <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{SUIT_SYMBOLS[code].split(' ')[0]}</span>
                    <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.8 }}>{key.slice(0, 5)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem' }}
          >
            📢 Broadcast Declaration
          </button>
        </form>
      </div>
    </div>
  );
}
