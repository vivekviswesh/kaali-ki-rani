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

    </div>
  );
}
