import React, { useState, useEffect } from 'react';
import { ArrowUp, CornerDownRight } from 'lucide-react';

export default function BiddingPanel({ gameState, mySeat, onBid }) {
  const { biddingState, activeSeat, players, bidStarterSeat } = gameState;
  const { currentHighestBid, currentHighestBidderSeat, history, passedPlayers } = biddingState;

  const isActive = activeSeat === mySeat;
  const isBidStarter = mySeat === bidStarterSeat;
  const hasNoBids = currentHighestBid === 0;
  
  // Calculate minimum legal bid
  const minLegalBid = hasNoBids ? 75 : currentHighestBid + 5;
  const [selectedBid, setSelectedBid] = useState(minLegalBid);

  // Sync selectedBid when minLegalBid changes
  useEffect(() => {
    setSelectedBid(minLegalBid);
  }, [minLegalBid]);

  const handleSubmitBid = (e) => {
    e.preventDefault();
    if (selectedBid > 150) return;
    onBid(selectedBid);
  };

  const handlePass = () => {
    onBid('pass');
  };

  const activePlayerName = players[activeSeat]?.name || 'Player';
  const highestBidderName = currentHighestBidderSeat !== null ? players[currentHighestBidderSeat]?.name : 'None';

  return (
    <div className="w-full max-w-md mx-auto glass-panel rounded-2xl border border-slate-700/60 p-5 flex flex-col gap-4 animate-pop-in">
      
      {/* Current Bid Display */}
      <div className="flex justify-between items-center bg-slate-950/60 rounded-xl p-3 border border-slate-800">
        <div>
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Current Highest Bid</span>
          <span className="text-2xl font-black text-yellow-400">
            {hasNoBids ? 'No Bid' : `${currentHighestBid} pts`}
          </span>
        </div>
        {currentHighestBidderSeat !== null && (
          <div className="text-right">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Bidder</span>
            <span className="text-slate-100 font-bold text-sm bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">
              {highestBidderName}
            </span>
          </div>
        )}
      </div>

      {/* Bidding History Log */}
      <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/60 h-32 overflow-y-auto flex flex-col gap-1.5">
        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 block">Bidding History</span>
        {history.length === 0 ? (
          <div className="text-slate-500 text-xs text-center py-6">No bids placed yet. Bidding starts with {players[bidStarterSeat]?.name}.</div>
        ) : (
          history.map((h, i) => {
            const bidder = players[h.seat];
            const isPass = h.bid === 'pass';
            return (
              <div key={i} className="flex justify-between items-center text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <CornerDownRight size={10} className="text-slate-500" />
                  <span className="font-medium">{bidder?.name}</span>
                </span>
                <span className={`font-bold ${isPass ? 'text-slate-500 italic' : 'text-emerald-400'}`}>
                  {isPass ? 'Pass' : `Bid ${h.bid}`}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Action Controls */}
      <div className="mt-2">
        {isActive ? (
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider animate-pulse">Your Turn to Bid</span>
            </div>

            <form onSubmit={handleSubmitBid} className="space-y-4">
              {/* Bid Selector (Slider) */}
              {selectedBid <= 150 ? (
                <div className="space-y-2 bg-slate-950/20 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-xs font-semibold">Your Bid:</span>
                    <span className="text-lg font-black text-emerald-400">{selectedBid}</span>
                  </div>
                  <input
                    type="range"
                    min={minLegalBid}
                    max={150}
                    step={5}
                    value={selectedBid}
                    onChange={(e) => setSelectedBid(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>MIN: {minLegalBid}</span>
                    <span>MAX: 150</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-xs text-center p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                  Bid limit of 150 reached. You must pass.
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePass}
                  disabled={isBidStarter && hasNoBids}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition ${
                    isBidStarter && hasNoBids
                      ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-[0.98]'
                  }`}
                >
                  Pass
                </button>
                {selectedBid <= 150 && (
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-1 shadow-lg active:scale-[0.98] transition"
                  >
                    <ArrowUp size={16} />
                    Bid {selectedBid}
                  </button>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-4 bg-slate-950/30 border border-slate-800/40 rounded-xl text-slate-400 text-xs font-semibold">
            Waiting for <span className="text-indigo-400">{activePlayerName}</span> to act...
          </div>
        )}
      </div>

    </div>
  );
}
