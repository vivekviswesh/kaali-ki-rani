import React from 'react';
import { Crown, RotateCcw, Home, Award, HelpCircle } from 'lucide-react';
import { GAME_STATES } from '../engine/constants.js';
import { formatCard } from '../engine/deck.js';

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

  // Find winner if match over
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const matchWinner = sortedPlayers[0];

  // Calculate bidding side total points vs defending side
  const biddingPoints = handPoints[bidWinnerSeat] + (isSolo ? 0 : (partnerSeat !== null ? handPoints[partnerSeat] : 0));
  const defendingPoints = 150 - biddingPoints;

  const isBiddingSuccess = biddingPoints >= currentHighestBid;

  const suitEmoji = {
    S: '♠',
    H: '♥',
    D: '♦',
    C: '♣'
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-slide-up">
      
      {/* Mini HUD Info (Sticky Top/Side during gameplay) */}
      <div className="glass-panel rounded-2xl border border-slate-700/50 p-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scores & Game Info</span>
          <span className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded-full">
            Hand #{handCount + 1}
          </span>
        </div>
        
        {/* Match Scores */}
        <div className="space-y-2">
          {players.map((p, idx) => {
            const isLeading = p.score === sortedPlayers[0].score && p.score > 0;
            return (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1">
                    {idx === mySeat && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                    <span className={idx === mySeat ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                      {p.name} {p.isBot ? '(Bot)' : ''}
                    </span>
                    {isLeading && <Crown size={12} className="text-yellow-400" />}
                  </span>
                  <span className="font-extrabold text-slate-100">{p.score} / 1000</span>
                </div>
                {/* Score bar */}
                <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isLeading ? 'bg-yellow-400' : 'bg-indigo-500'}`}
                    style={{ width: `${Math.min(100, (p.score / 1000) * 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hand Status Overlay / Panel */}
      {currentHighestBid > 0 && currentGameState !== GAME_STATES.BIDDING && (
        <div className="glass-panel rounded-2xl border border-slate-700/50 p-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 mb-2">
            Declaration & Partnership
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-950">
              <span className="text-slate-500 text-[10px] font-semibold block uppercase">Trump Suit</span>
              <span className={`text-base font-extrabold flex items-center gap-1 ${
                trumpSuit === 'H' || trumpSuit === 'D' ? 'text-rose-500' : 'text-slate-300'
              }`}>
                {suitEmoji[trumpSuit]} {trumpSuit === 'S' ? 'Spades' : trumpSuit === 'H' ? 'Hearts' : trumpSuit === 'D' ? 'Diamonds' : 'Clubs'}
              </span>
            </div>

            <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-950">
              <span className="text-slate-500 text-[10px] font-semibold block uppercase">Partner Card</span>
              <span className="text-sm font-extrabold text-yellow-400 flex items-center gap-1">
                {partnerCard ? `${partnerCard.rank}${suitEmoji[partnerCard.suit]}` : 'TBD'}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/30 p-2 rounded-xl border border-slate-950 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Bid Target:</span>
              <span className="font-extrabold text-yellow-400">{currentHighestBid} pts</span>
            </div>
            
            <div className="flex justify-between items-center border-t border-slate-800/60 pt-1.5">
              <span className="text-slate-400 font-semibold">Bidding Side Points:</span>
              <span className="font-black text-slate-100">
                {biddingPoints} pts
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">Defending Side Points:</span>
              <span className="font-black text-slate-400">
                {defendingPoints} pts
              </span>
            </div>
            
            <div className="border-t border-slate-800/60 pt-1.5 flex justify-between">
              <span className="text-slate-500">Partner Status:</span>
              <span className="font-bold text-slate-300">
                {isSolo 
                  ? 'Solo Bid (1v3)' 
                  : partnerSeat !== null 
                    ? `Revealed: ${players[partnerSeat]?.name}` 
                    : 'Hidden'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hand Over Dialog Modal */}
      {isHandOver && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 border border-emerald-500/20 shadow-2xl text-center animate-pop-in">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl ${
              isBiddingSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {isBiddingSuccess ? '🎉' : '❌'}
            </div>
            
            <h2 className="text-2xl font-black mb-1">
              {isBiddingSuccess ? 'Bid Secured!' : 'Bid Failed!'}
            </h2>
            <p className="text-slate-400 text-xs mb-4">
              Bidding Side got {biddingPoints} / {currentHighestBid} points.
            </p>

            <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-900 mb-6 text-left space-y-2 text-xs">
              <div className="flex justify-between font-bold border-b border-slate-800 pb-1.5 text-slate-400">
                <span>Player Roles</span>
                <span>Hand Points Won</span>
              </div>
              <div className="flex justify-between">
                <span>Bid Winner: {players[bidWinnerSeat]?.name}</span>
                <span className="font-bold">{handPoints[bidWinnerSeat]} pts</span>
              </div>
              {!isSolo && (
                <div className="flex justify-between">
                  <span>Partner: {players[partnerSeat]?.name}</span>
                  <span className="font-bold">{handPoints[partnerSeat]} pts</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400 border-t border-slate-800/60 pt-1.5">
                <span>Opponents:</span>
                <span className="font-bold">{defendingPoints} pts</span>
              </div>
            </div>

            <button
              onClick={() => onAction('next_hand')}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
            >
              <RotateCcw size={16} />
              Start Next Hand
            </button>
          </div>
        </div>
      )}

      {/* Match Over / Winner Dialog Modal */}
      {isMatchOver && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-yellow-500/30 shadow-2xl text-center animate-pop-in">
            <div className="w-20 h-20 bg-yellow-500/10 border-2 border-yellow-500/40 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
              <Crown size={40} className="text-yellow-400 animate-bounce" />
            </div>

            <h1 className="text-3xl font-black tracking-tight text-yellow-400 mb-1">
              Match Completed!
            </h1>
            <p className="text-slate-300 text-sm font-semibold mb-6">
              👑 {matchWinner?.name} Wins the Match! 👑
            </p>

            <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-900 mb-8 space-y-3">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block text-left">Final Scores</span>
              {players.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm font-medium">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    {p.name} {p.isBot ? '(Bot)' : ''}
                    {p.id === matchWinner.id && <Crown size={12} className="text-yellow-400" />}
                  </span>
                  <span className={`font-black ${p.id === matchWinner.id ? 'text-yellow-400' : 'text-slate-100'}`}>
                    {p.score} pts
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={onBackToLobby}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
              >
                <Home size={16} />
                Lobby
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
