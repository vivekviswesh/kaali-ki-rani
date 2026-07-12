import React, { useState, useEffect } from 'react';
import Card from './Card';
import { LogOut } from 'lucide-react';
import { GAME_STATES } from '../engine/constants.js';

export default function GameBoard({ 
  gameState, 
  mySeat, 
  onPlayCard, 
  onLeave, 
  timerState,
  actionLog = []
}) {
  const { 
    players, 
    activeSeat, 
    hand, 
    trickPlayState, 
    declarationState,
    handPoints,
    partnership
  } = gameState;

  const { currentTrick } = trickPlayState;
  const { trumpSuit, partnerCard } = declarationState;

  const [selectedCard, setSelectedCard] = useState(null);
  const [countdown, setCountdown] = useState(0);

  // Map seats relative to mySeat
  // 0 -> South (me)
  // 1 -> West
  // 2 -> North
  // 3 -> East
  const getRelativePosition = (seat) => {
    const diff = (seat - mySeat + 4) % 4;
    if (diff === 0) return 'south';
    if (diff === 1) return 'west';
    if (diff === 2) return 'north';
    return 'east';
  };

  // Sync turn timers
  useEffect(() => {
    if (timerState && timerState.activeSeat === activeSeat && timerState.deadline) {
      const calculateTimeLeft = () => {
        const left = Math.max(0, Math.round((timerState.deadline - Date.now()) / 1000));
        setCountdown(left);
      };
      
      calculateTimeLeft();
      const interval = setInterval(calculateTimeLeft, 500);
      return () => clearInterval(interval);
    } else {
      setCountdown(0);
    }
  }, [timerState, activeSeat]);

  // Evaluate which cards in hand are legal
  const getLegalCardIndices = () => {
    if (currentTrick.length === 0) {
      // Any card is legal to lead
      return hand.map((_, i) => i);
    }
    const leadCard = currentTrick[0].card;
    const followIndices = hand
      .map((c, i) => (c.suit === leadCard.suit ? i : -1))
      .filter((i) => i !== -1);
      
    if (followIndices.length > 0) {
      return followIndices;
    }
    // Void in lead suit, all cards are legal
    return hand.map((_, i) => i);
  };

  const legalIndices = getLegalCardIndices();

  const handleCardClick = (card, index) => {
    if (activeSeat !== mySeat) return;
    if (!legalIndices.includes(index)) return;

    // Direct play
    onPlayCard(card);
    setSelectedCard(null);
  };

  // Convert suits to symbols
  const suitEmoji = { S: '♠', H: '♥', D: '♦', C: '♣' };
  const suitColors = { S: '#818cf8', H: '#f43f5e', D: '#f59e0b', C: '#10b981' };

  return (
    <div className="trick-table-arena felt-table animate-pop-in">
      
      {/* HUD Info Header */}
      <div className="flex-row justify-between" style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        right: '1rem',
        zIndex: 25,
        pointerEvents: 'none'
      }}>
        {/* Leaving button */}
        <button
          onClick={onLeave}
          className="btn btn-secondary flex-center"
          style={{
            pointerEvents: 'auto',
            padding: '0.5rem',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '0.75rem',
            width: '2.25rem',
            height: '2.25rem'
          }}
          title="Leave Room"
        >
          <LogOut size={14} />
        </button>

        {/* Declared Partner/Trump Tags */}
        <div className="flex-row" style={{ gap: '0.5rem' }}>
          {trumpSuit && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.75rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
            }}>
              <span style={{ color: '#94a3b8', fontWeight: 500 }}>Trump:</span>
              <span style={{ color: suitColors[trumpSuit], fontSize: '0.9rem' }}>
                {suitEmoji[trumpSuit]}
              </span>
            </div>
          )}
          {partnerCard && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.75rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
            }}>
              <span style={{ color: '#94a3b8', fontWeight: 500 }}>Partner:</span>
              <span>
                {partnerCard.rank}{suitEmoji[partnerCard.suit]}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Central Table Felt Card Area */}
      <div className="center-felt-circle">
        {/* Render Played Cards in current trick */}
        {currentTrick.map(({ seat, card }) => {
          const relPos = getRelativePosition(seat);
          return (
            <div 
              key={seat} 
              className={`played-trick-card ${relPos}`}
            >
              <Card card={card} isPlayable={false} />
              <div className="played-card-label">
                {players[seat]?.name.split(' ')[0]}
              </div>
            </div>
          );
        })}

        {/* Empty state instruction inside table */}
        {currentTrick.length === 0 && activeSeat !== null && (
          <div className="center-text-overlay">
            <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981', display: 'block' }}>
              Trick {trickPlayState.trickCount + 1}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginTop: '0.125rem', display: 'block' }}>
              {activeSeat === mySeat ? 'Your Lead' : `${players[activeSeat]?.name.split(' ')[0]}'s Lead`}
            </span>
          </div>
        )}
      </div>

      {/* Players Circular layout */}
      {players.map((player, seatIdx) => {
        const relPos = getRelativePosition(seatIdx);
        const isCurrentTurn = activeSeat === seatIdx;
        const wonPoints = handPoints[seatIdx];

        // Role details
        const isSelf = seatIdx === mySeat;
        const isRevealedPartner = partnership.partnerSeat === seatIdx;
        const isSelfBidWinner = partnership.bidWinnerSeat === seatIdx;

        let roleTag = '';
        if (isSelfBidWinner) roleTag = '👑 Bidder';
        else if (isRevealedPartner) roleTag = '🤝 Partner';

        return (
          <div key={seatIdx} className={`player-spot ${relPos}`}>
            {/* Player Avatar Panel */}
            <div className={`player-avatar-hud ${isCurrentTurn ? 'active-turn' : ''}`}>
              
              {/* Timeout countdown badge */}
              {isCurrentTurn && countdown > 0 && (
                <div className="timer-badge">
                  {countdown}
                </div>
              )}

              {/* Player Name */}
              <div className="player-name">
                {player.name.split(' ')[0]} {player.isBot ? '🤖' : ''}
              </div>

              {/* Role Tags */}
              {roleTag && (
                <div className="player-role-badge">
                  {roleTag}
                </div>
              )}

              {/* Hand points tracker for current round */}
              <div className="player-points">
                Points: <b style={{ color: '#e2e8f0' }}>{wonPoints}</b>
              </div>
            </div>

            {/* Redacted other player card counts (Mini cards representations) */}
            {!isSelf && relPos !== 'south' && (
              <div className="flex-row justify-center" style={{ gap: '2px', maxWidth: '80px', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                {Array.from({ length: gameState.handsCount[seatIdx] || 0 }).map((_, cIdx) => (
                  <div 
                    key={cIdx} 
                    style={{
                      width: '6px',
                      height: '12px',
                      background: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '1px'
                    }}
                  ></div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Action Logs Box (overlay at bottom left) */}
      <div className="feed-log-overlay">
        <div className="feed-title">Game Feed</div>
        <div className="flex-col">
          {actionLog.slice(-4).map((log, i) => (
            <p key={i} className="feed-row">
              {log}
            </p>
          ))}
        </div>
      </div>

      {/* Play area HUD for South player hand */}
      <div className="player-hand-dock">
        {hand.map((card, idx) => {
          const isPlayable = activeSeat === mySeat && legalIndices.includes(idx);
          return (
            <div key={idx} style={{ flexShrink: 0 }}>
              <Card
                card={card}
                isPlayable={isPlayable}
                isSelected={selectedCard === idx}
                onClick={() => handleCardClick(card, idx)}
              />
            </div>
          );
        })}
      </div>

    </div>
  );
}
