import React from 'react';
import { Crown, RotateCcw, Home } from 'lucide-react';
import { GAME_STATES } from '../engine/constants.js';

export default function Scoreboard({ gameState, mySeat, onAction, onBackToLobby }) {
  const { 
    players, 
    handPoints, 
    biddingState, 
    declarationState, 
    partnership,
    gameState: currentGameState,
    handCount 
  } = gameState;

  const { currentHighestBid, currentHighestBidderSeat } = biddingState;
  const { partnerCard, trumpSuit } = declarationState;
  const { bidWinnerSeat, partnerSeat, isSolo } = partnership;

  const isHandOver = currentGameState === GAME_STATES.HAND_OVER;
  const isMatchOver = currentGameState === GAME_STATES.MATCH_OVER;

  // Find leader
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const leaderScore = sortedPlayers[0]?.score || 0;
  const matchWinner = sortedPlayers[0];

  // Calculate bidding side total points vs defending side
  const biddingPoints = handPoints[bidWinnerSeat] + (isSolo ? 0 : (partnerSeat !== null ? handPoints[partnerSeat] : 0));
  const defendingPoints = 150 - biddingPoints;
  const isBiddingSuccess = biddingPoints >= currentHighestBid;

  const suitEmoji = { S: '♠', H: '♥', D: '♦', C: '♣' };
  const suitColors = { S: '#818cf8', H: '#f43f5e', D: '#f59e0b', C: '#10b981' };

  return (
    <div className="flex-col animate-slide-up" style={{ gap: '1rem', width: '100%' }}>
      
      {/* Match Scores Leaderboard */}
      <div className="glass-panel" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex-row justify-between items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leaderboard</span>
          <span style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.6rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '9999px', color: '#94a3b8' }}>
            Hand #{handCount + 1}
          </span>
        </div>
        
        {/* Match Scores List */}
        <div className="flex-col" style={{ gap: '0.625rem' }}>
          {players.map((p, idx) => {
            const isLeading = p.score === leaderScore && p.score > 0;
            const isMe = idx === mySeat;
            return (
              <div key={idx} className="score-row-item">
                <div className="score-line-details">
                  <span className="flex-row items-center" style={{ gap: '0.25rem', color: isMe ? '#10b981' : '#cbd5e1', fontWeight: isMe ? 700 : 500 }}>
                    {isMe && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>}
                    <span>{p.name} {p.isBot ? '🤖' : ''}</span>
                    {isLeading && <Crown size={11} style={{ color: '#fbbf24', marginLeft: '0.125rem' }} />}
                  </span>
                  <span style={{ fontWeight: 800, color: '#f8fafc' }}>{p.score} / 1000</span>
                </div>
                {/* Score bar */}
                <div className="score-progress-track">
                  <div 
                    className={`score-progress-bar ${isLeading ? 'leader' : ''}`}
                    style={{ width: `${Math.min(100, (p.score / 1000) * 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hand Status details */}
      {currentHighestBid > 0 && currentGameState !== GAME_STATES.BIDDING && (
        <div className="glass-panel flex-col" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', gap: '0.75rem' }}>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Round Info
          </div>

          <div className="grid-2">
            <div className="info-box-item flex-col flex-center">
              <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Trump Suit</span>
              <span className="info-box-value flex-row items-center" style={{ gap: '0.25rem', color: suitColors[trumpSuit], fontSize: '1rem' }}>
                <span>{suitEmoji[trumpSuit]}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1' }}>{trumpSuit === 'S' ? 'Spades' : trumpSuit === 'H' ? 'Hearts' : trumpSuit === 'D' ? 'Diamonds' : 'Clubs'}</span>
              </span>
            </div>

            <div className="info-box-item flex-col flex-center">
              <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Partner Card</span>
              <span className="info-box-value" style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
                {partnerCard ? `${partnerCard.rank}${suitEmoji[partnerCard.suit]}` : 'TBD'}
              </span>
            </div>
          </div>

          <div className="flex-col" style={{ background: 'rgba(2, 6, 23, 0.3)', padding: '0.625rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.03)', gap: '0.375rem', fontSize: '0.75rem' }}>
            <div className="justify-between">
              <span style={{ color: '#94a3b8' }}>Bid Target:</span>
              <span style={{ fontWeight: 800, color: '#fbbf24' }}>{currentHighestBid} pts</span>
            </div>
            
            <div className="justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.375rem', marginTop: '0.125rem' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Bidders Points:</span>
              <span style={{ fontWeight: 850, color: '#f8fafc' }}>{biddingPoints} pts</span>
            </div>

            <div className="justify-between">
              <span style={{ color: '#94a3b8' }}>Defenders Points:</span>
              <span style={{ fontWeight: 800, color: '#94a3b8' }}>{defendingPoints} pts</span>
            </div>
            
            <div className="justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.375rem', marginTop: '0.125rem', fontSize: '0.7rem' }}>
              <span style={{ color: '#64748b' }}>Partner Status:</span>
              <span style={{ fontWeight: 700, color: '#cbd5e1' }}>
                {isSolo 
                  ? 'Solo Bid (1v3)' 
                  : partnerSeat !== null 
                    ? `Revealed: ${players[partnerSeat]?.name.split(' ')[0]}` 
                    : 'Hidden'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hand Over Dialog Modal */}
      {isHandOver && (
        <div className="modal-overlay-blur">
          <div className="modal-window-card animate-pop-in" style={{ padding: '2rem' }}>
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '50%',
              background: isBiddingSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: isBiddingSuccess ? '#10b981' : '#f43f5e',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              {isBiddingSuccess ? '🎉' : '❌'}
            </div>
            
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.25rem', color: '#f8fafc' }}>
              {isBiddingSuccess ? 'Bid Secured!' : 'Bid Failed!'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '1.25rem' }}>
              Bidding Side captured {biddingPoints} / {currentHighestBid} points.
            </p>

            <div className="flex-col" style={{ background: 'rgba(2, 6, 23, 0.5)', borderRadius: '1rem', padding: '0.875rem', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '1rem', fontSize: '0.75rem', textAlign: 'left', gap: '0.375rem' }}>
              <div className="justify-between" style={{ fontWeight: 800, color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.375rem', marginBottom: '0.125rem' }}>
                <span>Player Roles</span>
                <span>Points Won</span>
              </div>
              <div className="justify-between">
                <span>Bid Winner: {players[bidWinnerSeat]?.name}</span>
                <span style={{ fontWeight: 700 }}>{handPoints[bidWinnerSeat]} pts</span>
              </div>
              {!isSolo && (
                <div className="justify-between">
                  <span>Partner: {players[partnerSeat]?.name || 'Unknown'}</span>
                  <span style={{ fontWeight: 700 }}>{handPoints[partnerSeat] || 0} pts</span>
                </div>
              )}
              <div className="justify-between" style={{ color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.375rem', marginTop: '0.125rem' }}>
                <span>Opponents:</span>
                <span style={{ fontWeight: 700 }}>{defendingPoints} pts</span>
              </div>
            </div>

            {/* Play-by-play Trick History List */}
            <div 
              className="flex-col" 
              style={{ 
                background: 'rgba(2, 6, 23, 0.4)', 
                borderRadius: '1rem', 
                padding: '0.875rem', 
                border: '1px solid rgba(255,255,255,0.04)', 
                marginBottom: '1.5rem', 
                fontSize: '0.75rem', 
                textAlign: 'left',
                maxHeight: '160px',
                overflowY: 'auto',
                gap: '0.5rem'
              }}
            >
              <div style={{ fontWeight: 800, color: '#3b82f6', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.375rem', marginBottom: '0.125rem' }}>
                📜 Play-by-Play Trick History
              </div>
              {gameState.trickPlayState.history && gameState.trickPlayState.history.length > 0 ? (
                gameState.trickPlayState.history.map((trickItem, tIdx) => {
                  const winnerName = players[trickItem.winnerSeat]?.name.split(' ')[0];
                  return (
                    <div 
                      key={tIdx} 
                      className="flex-col" 
                      style={{ 
                        paddingBottom: '0.5rem', 
                        borderBottom: tIdx < gameState.trickPlayState.history.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                        gap: '0.25rem'
                      }}
                    >
                      <div className="justify-between" style={{ fontSize: '0.65rem', color: '#64748b' }}>
                        <span>Trick #{tIdx + 1}</span>
                        <span style={{ color: '#fbbf24', fontWeight: 700 }}>🏆 Winner: {winnerName} (+{trickItem.points} pts)</span>
                      </div>
                      
                      <div className="flex-row" style={{ gap: '0.375rem', overflowX: 'auto', padding: '0.125rem 0' }}>
                        {trickItem.cardsPlayed.map(({ seat, card }, cIdx) => {
                          const isWinner = seat === trickItem.winnerSeat;
                          const cardStr = `${card.rank}${suitEmoji[card.suit]}`;
                          return (
                            <span 
                              key={cIdx} 
                              style={{ 
                                background: isWinner ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.05)', 
                                border: `1px solid ${isWinner ? '#fbbf24' : 'rgba(255,255,255,0.08)'}`,
                                borderRadius: '4px',
                                padding: '2px 6px',
                                color: isWinner ? '#fbbf24' : '#cbd5e1',
                                fontSize: '0.65rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <span style={{ fontWeight: 800 }}>{players[seat]?.name.split(' ')[0].substring(0, 4)}:</span>
                              <span style={{ color: suitColors[card.suit], fontWeight: 900 }}>{cardStr}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: '#475569', fontStyle: 'italic' }}>No tricks played in this hand.</div>
              )}
            </div>

            <button
              onClick={() => onAction('next_hand')}
              className="btn btn-success"
              style={{ width: '100%', padding: '0.875rem' }}
            >
              <RotateCcw size={14} style={{ marginRight: '0.375rem' }} />
              Start Next Hand
            </button>
          </div>
        </div>
      )}

      {/* Match Over Modal */}
      {isMatchOver && (
        <div className="modal-overlay-blur">
          <div className="modal-window-card animate-pop-in" style={{ padding: '2.5rem 2rem', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
            <div style={{
              width: '4.5rem',
              height: '4.5rem',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '2px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
              margin: '0 auto 1.25rem',
              boxShadow: '0 0 20px rgba(251, 191, 36, 0.15)'
            }}>
              <Crown size={36} />
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fbbf24', marginBottom: '0.25rem' }}>
              Match Finished!
            </h1>
            <p style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              👑 {matchWinner?.name} Wins the Match! 👑
            </p>

            <div className="flex-col" style={{ background: 'rgba(2, 6, 23, 0.5)', borderRadius: '1rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '2rem', gap: '0.5rem', textAlign: 'left', fontSize: '0.8rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'block' }}>Final Scores</span>
              {players.map((p, idx) => (
                <div key={idx} className="justify-between items-center" style={{ fontWeight: p.id === matchWinner.id ? 800 : 500 }}>
                  <span className="flex-row items-center" style={{ gap: '0.25rem', color: p.id === matchWinner.id ? '#fbbf24' : '#cbd5e1' }}>
                    {p.name} {p.isBot ? '🤖' : ''}
                    {p.id === matchWinner.id && <Crown size={10} />}
                  </span>
                  <span style={{ color: p.id === matchWinner.id ? '#fbbf24' : '#f8fafc', fontWeight: 800 }}>
                    {p.score} pts
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={onBackToLobby}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.875rem' }}
            >
              <Home size={14} style={{ marginRight: '0.375rem' }} />
              Back to Lobby
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
