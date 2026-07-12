import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import confetti from 'canvas-confetti';

import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import BiddingPanel from './components/BiddingPanel';
import DeclarationOverlay from './components/DeclarationOverlay';
import Scoreboard from './components/Scoreboard';

import { Game } from './engine/game.js';
import { GAME_STATES } from './engine/constants.js';
import { makeBotBid, makeBotDeclaration, makeBotPlay } from './engine/bot.js';

// Resolve Server URL with local dev fallback
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function App() {
  // Game Setup States
  const [inGame, setInGame] = useState(false);
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);
  const [playerName, setPlayerName] = useState('Player');
  
  // Game State Sync
  const [roomCode, setRoomCode] = useState('');
  const [mySeat, setMySeat] = useState(0);
  const [gameState, setGameState] = useState(null);
  const [timerState, setTimerState] = useState(null);
  
  // HUD Feed Log
  const [actionLog, setActionLog] = useState([]);
  
  // Networking Sockets
  const socketRef = useRef(null);
  const localGameRef = useRef(null);

  // Bot timer ref to prevent leaks
  const botTimerRef = useRef(null);

  // Confetti celebrations
  const triggerConfettiSuccess = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const triggerConfettiMatchWin = () => {
    const duration = 4 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  // Check state transitions to play confetti
  useEffect(() => {
    if (!gameState) return;
    
    if (gameState.gameState === GAME_STATES.HAND_OVER) {
      // Check if bidding team succeeded
      const bidVal = gameState.biddingState.currentHighestBid;
      const bidWinner = gameState.partnership.bidWinnerSeat;
      const partner = gameState.partnership.partnerSeat;
      const isSolo = gameState.partnership.isSolo;
      
      const biddingPoints = gameState.handPoints[bidWinner] + (isSolo ? 0 : (partner !== null ? gameState.handPoints[partner] : 0));
      if (biddingPoints >= bidVal) {
        triggerConfettiSuccess();
      }
    } else if (gameState.gameState === GAME_STATES.MATCH_OVER) {
      triggerConfettiMatchWin();
    }
  }, [gameState?.gameState]);

  // SINGLE PLAYER BOT AUTO-PLAY ENGINE
  const runLocalBotTurn = () => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    const game = localGameRef.current;
    if (!game || game.gameState === GAME_STATES.MATCH_OVER || game.gameState === GAME_STATES.LOBBY) return;

    const activeSeat = game.activeSeat;
    const activePlayer = game.players[activeSeat];

    if (activePlayer && activePlayer.isBot) {
      botTimerRef.current = setTimeout(() => {
        const state = game.gameState;
        const hand = game.hands[activeSeat];
        let logMessage = '';

        try {
          if (state === GAME_STATES.BIDDING) {
            const bid = makeBotBid(hand, game.biddingState.currentHighestBid, activeSeat === game.bidStarterSeat);
            game.placeBid(activeSeat, bid);
            logMessage = `${activePlayer.name} ${bid === 'pass' ? 'passed' : 'bid ' + bid}`;
          } else if (state === GAME_STATES.DECLARATION) {
            const dec = makeBotDeclaration(hand);
            game.declare(activeSeat, dec.partnerCard, dec.trumpSuit);
            logMessage = `${activePlayer.name} declared Trump: ${dec.trumpSuit}, Partner Card: ${dec.partnerCard.rank}-${dec.partnerCard.suit}`;
          } else if (state === GAME_STATES.TRICK_PLAY) {
            const currentTrick = game.trickPlayState.currentTrick;
            const trumpSuit = game.declarationState.trumpSuit;
            const partnerCard = game.declarationState.partnerCard;
            const partnerSeat = game.partnership.partnerSeat;
            const bidWinnerSeat = game.partnership.bidWinnerSeat;

            const cardToPlay = makeBotPlay(hand, currentTrick, trumpSuit, partnerCard, partnerSeat, bidWinnerSeat, activeSeat);
            
            const partnerCardStr = `${partnerCard.rank}-${partnerCard.suit}`;
            const playedCardStr = `${cardToPlay.rank}-${cardToPlay.suit}`;
            const isPartnerCard = partnerCardStr === playedCardStr;

            game.playCard(activeSeat, cardToPlay);
            logMessage = `${activePlayer.name} played ${playedCardStr}`;

            if (isPartnerCard) {
              setActionLog(prev => [...prev, `Partner Revealed! ${activePlayer.name} holds the Partner Card.`]);
            }
          }

          setActionLog(prev => [...prev, logMessage]);
          setGameState(game.getStateForPlayer(0)); // sync player 0 view
        } catch (err) {
          console.error('Local bot action error:', err);
        }
      }, 1000);
    }
  };

  // Bot Turn trigger hook (Single Player only)
  useEffect(() => {
    if (isSinglePlayer && gameState) {
      const activeSeat = gameState.activeSeat;
      const activePlayer = gameState.players[activeSeat];
      if (activePlayer && activePlayer.isBot && gameState.gameState !== GAME_STATES.HAND_OVER) {
        runLocalBotTurn();
      }
    }
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [gameState?.activeSeat, gameState?.gameState, isSinglePlayer]);

  // SINGLE PLAYER ACTIONS
  const startSinglePlayer = (name) => {
    setPlayerName(name);
    setIsSinglePlayer(true);
    setInGame(true);
    setMySeat(0);
    setActionLog(['Match started against bots! Good luck.']);

    const localPlayers = [
      { id: 'human-0', name: name, isBot: false },
      { id: 'bot-1', name: 'Rani Bot', isBot: true },
      { id: 'bot-2', name: 'Kaali Bot', isBot: true },
      { id: 'bot-3', name: 'Spade Bot', isBot: true }
    ];

    const game = new Game();
    localGameRef.current = game;
    game.startMatch(localPlayers);

    setGameState(game.getStateForPlayer(0));
  };

  const handleLocalAction = (type, data) => {
    const game = localGameRef.current;
    if (!game) return;

    try {
      if (type === 'bid') {
        game.placeBid(0, data.bid);
        setActionLog(prev => [...prev, `You ${data.bid === 'pass' ? 'passed' : 'bid ' + data.bid}`]);
      } else if (type === 'declare') {
        game.declare(0, data.partnerCard, data.trumpSuit);
        setActionLog(prev => [...prev, `You declared Trump: ${data.trumpSuit}, Partner Card: ${data.partnerCard.rank}-${data.partnerCard.suit}`]);
      } else if (type === 'play_card') {
        const card = data.card;
        const partnerCard = game.declarationState.partnerCard;
        const isPartnerCard = partnerCard && (card.rank === partnerCard.rank && card.suit === partnerCard.suit);

        game.playCard(0, card);
        setActionLog(prev => [...prev, `You played ${card.rank}-${card.suit}`]);

        if (isPartnerCard) {
          setActionLog(prev => [...prev, `Partner Revealed! You hold the Partner Card.`]);
        }
      } else if (type === 'next_hand') {
        game.startHand();
        setActionLog(prev => [...prev, 'Next hand started!']);
      }

      setGameState(game.getStateForPlayer(0));
    } catch (err) {
      alert(err.message);
    }
  };

  // MULTIPLAYER (ONLINE) SYSTEM
  const createOnlineRoom = (name, settings) => {
    setPlayerName(name);
    setIsSinglePlayer(false);
    
    // Connect Socket
    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.emit('create_room', { playerName: name, settings }, (res) => {
      if (res.status === 'success') {
        setRoomCode(res.roomCode);
        setMySeat(res.seat);
        setInGame(true);
        setActionLog([`Room created! Code: ${res.roomCode}. Share it to let players join.`]);
      } else {
        alert(res.message);
        socket.disconnect();
      }
    });

    setupSocketListeners(socket);
  };

  const joinOnlineRoom = (name, code) => {
    setPlayerName(name);
    setIsSinglePlayer(false);

    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.emit('join_room', { roomCode: code, playerName: name }, (res) => {
      if (res.status === 'success') {
        setRoomCode(res.roomCode);
        setMySeat(res.seat);
        setInGame(true);
        setActionLog([`Joined Room ${res.roomCode}! Waiting for players...`]);
      } else {
        alert(res.message);
        socket.disconnect();
      }
    });

    setupSocketListeners(socket);
  };

  const setupSocketListeners = (socket) => {
    socket.on('state_update', (data) => {
      setGameState(data.gameState);
      setRoomCode(data.roomCode);
    });

    socket.on('timer_update', (data) => {
      setTimerState(data);
    });

    socket.on('game_action', (data) => {
      setActionLog(prev => [...prev, data.message]);
    });

    socket.on('partner_revealed', (data) => {
      setActionLog(prev => [...prev, data.message]);
    });

    socket.on('disconnect', () => {
      setActionLog(prev => [...prev, 'Disconnected from server. Try refreshing.']);
    });
  };

  const handleOnlineAction = (type, data) => {
    if (socketRef.current) {
      socketRef.current.emit('game_action', { type, data });
    }
  };

  const startOnlineGame = () => {
    if (socketRef.current) {
      socketRef.current.emit('start_game');
    }
  };

  const leaveGame = () => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    localGameRef.current = null;
    setInGame(false);
    setIsSinglePlayer(false);
    setGameState(null);
    setTimerState(null);
    setActionLog([]);
  };

  const handleAction = (type, data) => {
    if (isSinglePlayer) {
      handleLocalAction(type, data);
    } else {
      handleOnlineAction(type, data);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      
      {!inGame ? (
        <Lobby
          onCreateRoom={createOnlineRoom}
          onJoinRoom={joinOnlineRoom}
          onStartSinglePlayer={startSinglePlayer}
        />
      ) : (
        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4 gap-4">
          {/* Header Bar */}
          <header className="flex justify-between items-center glass-panel rounded-2xl px-6 py-3 border border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="text-xl">👑</span>
              <span className="font-extrabold tracking-wider bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent text-sm sm:text-base">
                KAALI KI RANI
              </span>
            </div>
            
            {roomCode ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-bold uppercase">Room:</span>
                <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-xl text-sm font-black tracking-widest">
                  {roomCode}
                </span>
              </div>
            ) : (
              <span className="text-xs text-yellow-400/90 font-extrabold uppercase bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-xl">
                Offline Play
              </span>
            )}
          </header>

          {/* Lobby Waiting Panel (Only online before start) */}
          {gameState && gameState.gameState === GAME_STATES.LOBBY && (
            <div className="flex-1 glass-panel rounded-3xl border border-slate-800 p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto my-12 animate-pop-in">
              <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-2xl mb-4 shadow">👥</div>
              <h2 className="text-xl font-bold mb-2">Room Lobby</h2>
              <p className="text-slate-400 text-xs mb-6">
                Waiting for players to join. You can fill remaining empty slots with bots and start playing!
              </p>

              <div className="w-full bg-slate-950/60 rounded-xl p-4 border border-slate-900 mb-6 text-left space-y-2 text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider block border-b border-slate-900 pb-1">Players Connected</span>
                {gameState.players.map((p, idx) => (
                  <div key={idx} className="flex justify-between font-medium">
                    <span>{p.name}</span>
                    <span className="text-emerald-400">Ready</span>
                  </div>
                ))}
                {Array.from({ length: 4 - gameState.players.length }).map((_, i) => (
                  <div key={i} className="text-slate-600 italic">Empty Slot (will be filled with Bot)</div>
                ))}
              </div>

              {gameState.players[0]?.id === socketRef.current?.id || mySeat === 0 ? (
                <button
                  onClick={startOnlineGame}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition"
                >
                  Start Match (Fill Bots)
                </button>
              ) : (
                <p className="text-slate-500 text-xs italic">Only the host can start the match.</p>
              )}
            </div>
          )}

          {/* Core Game UI Grid */}
          {gameState && gameState.gameState !== GAME_STATES.LOBBY && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Central Game Board */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                <GameBoard
                  gameState={gameState}
                  mySeat={mySeat}
                  onPlayCard={(card) => handleAction('play_card', { card })}
                  onLeave={leaveGame}
                  timerState={timerState}
                  actionLog={actionLog}
                />
              </div>

              {/* Sidebar Panel containing Scoreboard, Bidding or Declarations */}
              <div className="flex flex-col gap-4">
                {/* 1. Scoreboard (Always visible in-game) */}
                <Scoreboard
                  gameState={gameState}
                  mySeat={mySeat}
                  onAction={handleAction}
                  onBackToLobby={leaveGame}
                />

                {/* 2. Bidding Controls Overlay (Visible in sidebar when bidding) */}
                {gameState.gameState === GAME_STATES.BIDDING && (
                  <BiddingPanel
                    gameState={gameState}
                    mySeat={mySeat}
                    onBid={(bid) => handleAction('bid', { bid })}
                  />
                )}

                {/* 3. Declaration overlay (For bid winner selection) */}
                {gameState.gameState === GAME_STATES.DECLARATION && (
                  <DeclarationOverlay
                    gameState={gameState}
                    mySeat={mySeat}
                    onDeclare={(dec) => handleAction('declare', dec)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Footer copyright */}
      <footer className="py-4 text-center text-[10px] text-slate-600">
        Kaali Ki Rani PWA © 2026. Made with ❤️ for card game lovers.
      </footer>
    </div>
  );
}
