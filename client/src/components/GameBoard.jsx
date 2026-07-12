import React, { useState, useEffect } from 'react';
import Card from './Card';
import { LogOut, Volume2, VolumeX, History, Send } from 'lucide-react';
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
    allHands,
    trickPlayState, 
    declarationState,
    handPoints,
    partnership
  } = gameState;

  const { currentTrick, leadSeat } = trickPlayState;
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

  // Positions on the board for relative seats
  const positionClasses = {
    south: 'player-south absolute flex flex-col items-center gap-1.5',
    north: 'player-north absolute flex flex-col items-center gap-1.5',
    west: 'player-west absolute flex flex-row items-center gap-2',
    east: 'player-east absolute flex flex-row-reverse items-center gap-2'
  };

  // Central trick positions for played cards
  const trickCardPositions = {
    south: 'bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 rotate-0 scale-95',
    north: 'top-8 sm:top-12 left-1/2 -translate-x-1/2 rotate-180 scale-95',
    west: 'left-8 sm:left-12 top-1/2 -translate-y-1/2 -rotate-90 scale-95',
    east: 'right-8 sm:right-12 top-1/2 -translate-y-1/2 rotate-95 scale-95'
  };

  // Convert suits to symbols
  const suitEmoji = { S: '♠', H: '♥', D: '♦', C: '♣' };

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] felt-table rounded-3xl border border-emerald-500/20 shadow-2xl overflow-hidden animate-pop-in">
      
      {/* HUD Info Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20 pointer-events-none">
        {/* Leaving button */}
        <button
          onClick={onLeave}
          className="pointer-events-auto bg-slate-900/80 border border-slate-700/80 hover:bg-rose-950/40 hover:border-rose-800/80 p-2 rounded-xl text-slate-300 hover:text-rose-400 transition"
          title="Leave Room"
        >
          <LogOut size={16} />
        </button>

        {/* Declared Partner/Trump Tags */}
        <div className="flex gap-2">
          {trumpSuit && (
            <div className="bg-slate-900/90 border border-slate-700/80 px-3 py-1 rounded-xl text-xs font-bold text-slate-100 flex items-center gap-1 shadow-md">
              <span className="text-slate-400 font-medium">Trump:</span>
              <span className={trumpSuit === 'H' || trumpSuit === 'D' ? 'text-rose-500' : 'text-indigo-400'}>
                {suitEmoji[trumpSuit]}
              </span>
            </div>
          )}
          {partnerCard && (
            <div className="bg-slate-900/90 border border-slate-700/80 px-3 py-1 rounded-xl text-xs font-bold text-yellow-400 flex items-center gap-1 shadow-md">
              <span className="text-slate-400 font-medium">Partner:</span>
              <span>
                {partnerCard.rank}{suitEmoji[partnerCard.suit]}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Central Table Felt Card Area */}
      <div className="absolute inset-20 sm:inset-28 rounded-full border border-emerald-950/60 bg-emerald-950/20 shadow-inner flex items-center justify-center">
        {/* Render Played Cards in current trick */}
        {currentTrick.map(({ seat, card }) => {
          const relPos = getRelativePosition(seat);
          return (
            <div 
              key={seat} 
              className={`absolute transition-all duration-300 ${trickCardPositions[relPos]}`}
            >
              <Card card={card} isPlayable={false} />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 text-[9px] px-1 rounded font-bold text-slate-300 shadow">
                {players[seat]?.name.split(' ')[0]}
              </div>
            </div>
          );
        })}

        {/* Empty state instruction inside table */}
        {currentTrick.length === 0 && activeSeat !== null && (
          <div className="text-center select-none opacity-40">
            <span className="text-[10px] font-extrabold uppercase tracking-wider block text-emerald-400">
              Trick {trickPlayState.trickCount + 1}
            </span>
            <span className="text-xs font-bold text-slate-300 mt-1 block">
              {activeSeat === mySeat ? 'Your Lead' : `${players[activeSeat]?.name}'s Turn`}
            </span>
          </div>
        )}
      </div>

      {/* Players Circular layout */}
      {players.map((player, seatIdx) => {
        const relPos = getRelativePosition(seatIdx);
        const isCurrentTurn = activeSeat === seatIdx;
        const score = player.score;
        const wonPoints = handPoints[seatIdx];

        // Is partner?
        const isSelf = seatIdx === mySeat;
        const isRevealedPartner = partnership.partnerSeat === seatIdx;
        const isSelfBidWinner = partnership.bidWinnerSeat === seatIdx;

        let roleTag = '';
        if (isSelfBidWinner) roleTag = '👑 Bidder';
        else if (isRevealedPartner) roleTag = '🤝 Partner';

        // Styling classes
        const glowClass = isCurrentTurn ? 'glow-green border-emerald-400 scale-105' : 'border-slate-800';

        return (
          <div key={seatIdx} className={positionClasses[relPos]}>
            {/* Player Avatar Panel */}
            <div className={`glass-panel border-2 ${glowClass} rounded-2xl p-2 px-3 flex flex-col items-center relative transition shadow-md`}>
              
              {/* Timeout ring / timer number */}
              {isCurrentTurn && countdown > 0 && (
                <div className="absolute -top-3 -right-3 bg-emerald-500 text-slate-950 font-black text-[10px] w-6 h-6 rounded-full flex items-center justify-center border border-emerald-300 shadow animate-pulse">
                  {countdown}
                </div>
              )}

              {/* Player Name */}
              <span className={`text-[11px] sm:text-xs font-bold flex items-center gap-1 ${isSelf ? 'text-emerald-400' : 'text-slate-100'}`}>
                {player.name} {player.isBot ? '🤖' : ''}
              </span>

              {/* Role Tags */}
              {roleTag && (
                <span className="text-[9px] font-extrabold bg-slate-950 border border-slate-800 text-yellow-400 px-1 rounded mt-0.5 uppercase tracking-wide">
                  {roleTag}
                </span>
              )}

              {/* Hand points tracker for current round */}
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                Points: <b className="text-slate-200">{wonPoints}</b>
              </span>
            </div>

            {/* Redacted other player card counts (Mini representations) */}
            {!isSelf && relPos !== 'south' && (
              <div className="flex gap-0.5 mt-1 justify-center max-w-[80px]">
                {Array.from({ length: gameState.handsCount[seatIdx] || 0 }).map((_, cIdx) => (
                  <div key={cIdx} className="w-1.5 h-3 bg-slate-800 border border-slate-700/60 rounded-sm"></div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Action Logs Box (overlay at bottom left) */}
      <div className="absolute bottom-4 left-4 glass-panel max-w-[200px] sm:max-w-[280px] h-20 sm:h-24 rounded-2xl border border-slate-800 p-2 overflow-y-auto z-20 pointer-events-auto">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Game Feed</span>
        <div className="space-y-1">
          {actionLog.slice(-5).map((log, i) => (
            <p key={i} className="text-[9px] sm:text-[10px] text-slate-300 leading-tight">
              {log}
            </p>
          ))}
        </div>
      </div>

      {/* Play area HUD for South player hand */}
      <div className="absolute bottom-4 right-4 left-[220px] sm:left-[300px] flex justify-end items-end z-20 gap-3 pointer-events-none">
        {/* Your hand dock */}
        <div className="pointer-events-auto flex items-end justify-center gap-1 sm:gap-2 max-w-full overflow-x-auto p-2 scrollbar-none">
          {hand.map((card, idx) => {
            const isPlayable = activeSeat === mySeat && legalIndices.includes(idx);
            return (
              <div key={idx} className="transition-transform duration-200">
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

    </div>
  );
}
