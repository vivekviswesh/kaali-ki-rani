import { Game } from './engine/game.js';
import { GAME_STATES } from './engine/constants.js';
import { formatCard } from './engine/deck.js';
import { makeBotBid, makeBotDeclaration, makeBotPlay } from './bot.js';
import { generateBotName, logGameEvent } from './utils/logger.js';

export class Room {
  constructor(roomCode, io, settings = {}) {
    this.roomCode = roomCode;
    this.io = io;
    this.timeoutDuration = settings.timeoutDuration !== undefined ? settings.timeoutDuration : 20; // in seconds, 0 = disabled
    this.botDifficulty = settings.botDifficulty || 'medium';
    
    // Generate Unique Game ID for log tracking
    const p1 = Math.random().toString(36).substr(2, 4).toUpperCase();
    const p2 = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.gameId = `KKR-${p1}-${p2}`;
    
    this.game = new Game();
    this.seats = [null, null, null, null]; // { id, name, socketId, isBot, isDisconnected }
    this.gameStarted = false;
    
    this.turnTimer = null;
    this.botTimer = null;
    this.turnDeadline = null;

    logGameEvent(this.gameId, `Room created with code ${roomCode} (Settings: Timeout ${this.timeoutDuration}s)`);
  }

  addPlayer(id, name, socketId) {
    // Check if player is reconnecting
    const existingIndex = this.seats.findIndex(s => s && s.id === id);
    if (existingIndex !== -1) {
      this.seats[existingIndex].socketId = socketId;
      this.seats[existingIndex].isDisconnected = false;
      logGameEvent(this.gameId, `Player ${name} reconnected in seat ${existingIndex}`);
      return existingIndex;
    }

    // Find first empty seat
    const emptyIndex = this.seats.findIndex(s => s === null);
    if (emptyIndex === -1) {
      throw new Error('Room is full.');
    }

    this.seats[emptyIndex] = { id, name, socketId, isBot: false, isDisconnected: false };
    logGameEvent(this.gameId, `Player ${name} joined in seat ${emptyIndex}`);
    return emptyIndex;
  }

  removePlayer(socketId) {
    const index = this.seats.findIndex(s => s && s.socketId === socketId);
    if (index === -1) return null;

    const player = this.seats[index];
    if (this.gameStarted) {
      player.isDisconnected = true;
      player.socketId = null;
      logGameEvent(this.gameId, `Player ${player.name} in seat ${index} disconnected. Bot taking over.`);
      this.broadcastState();
      
      if (this.game.activeSeat === index) {
        this.resetTurnTimer(true); // accelerate timeout
      }
    } else {
      logGameEvent(this.gameId, `Player ${player.name} in seat ${index} left before start.`);
      this.seats[index] = null;
    }
    
    return player;
  }

  fillWithBots() {
    for (let i = 0; i < 4; i++) {
      if (this.seats[i] === null) {
        const uniqueBotName = generateBotName();
        this.seats[i] = {
          id: `bot-${i}-${Math.random().toString(36).substr(2, 4)}`,
          name: uniqueBotName,
          socketId: null,
          isBot: true,
          isDisconnected: false
        };
        logGameEvent(this.gameId, `Filled seat ${i} with Bot: ${uniqueBotName}`);
      }
    }
  }

  start() {
    if (this.gameStarted) return;
    
    this.fillWithBots();
    this.gameStarted = true;
    
    const enginePlayers = this.seats.map(s => ({
      id: s.id,
      name: s.name,
      isBot: s.isBot
    }));

    logGameEvent(this.gameId, `Starting Match. Seating arrangement: ${this.seats.map((s, idx) => `Seat ${idx}:${s.name}`).join(', ')}`);
    this.game.startMatch(enginePlayers);
    this.broadcastState();
    this.runTurnCycle();
  }

  runTurnCycle() {
    this.clearTimers();
    
    if (this.game.gameState === GAME_STATES.MATCH_OVER) {
      logGameEvent(this.gameId, 'Match Completed! Final Leaderboard:');
      this.game.players.forEach(p => {
        logGameEvent(this.gameId, `  Player ${p.name}: ${p.score} points`);
      });
      this.broadcastState();
      return;
    }

    const activeSeat = this.game.activeSeat;
    const activePlayer = this.seats[activeSeat];

    if (!activePlayer) return;

    if (activePlayer.isBot || activePlayer.isDisconnected) {
      const delay = activePlayer.isDisconnected ? 1000 : 1500;
      this.botTimer = setTimeout(() => {
        this.executeAutoMove(activeSeat);
      }, delay);
    } else {
      this.resetTurnTimer(false);
    }
  }

  resetTurnTimer(isAccelerated = false) {
    if (this.turnTimer) clearTimeout(this.turnTimer);
    
    if (this.timeoutDuration <= 0) {
      this.turnDeadline = null;
      return;
    }

    const duration = isAccelerated ? 2 : this.timeoutDuration;
    this.turnDeadline = Date.now() + duration * 1000;
    
    this.io.to(this.roomCode).emit('timer_update', {
      activeSeat: this.game.activeSeat,
      duration,
      deadline: this.turnDeadline
    });

    this.turnTimer = setTimeout(() => {
      logGameEvent(this.gameId, `Timeout triggered for active player ${this.seats[this.game.activeSeat]?.name} in seat ${this.game.activeSeat}`);
      this.executeAutoMove(this.game.activeSeat);
    }, duration * 1000);
  }

  executeAutoMove(seat) {
    if (this.game.activeSeat !== seat) return;
    
    const gameState = this.game.gameState;
    const hand = this.game.hands[seat];
    
    try {
      if (gameState === GAME_STATES.BIDDING) {
        let bid = 'pass';
        if (seat === this.game.bidStarterSeat && this.game.biddingState.currentHighestBid === 0) {
          bid = 75;
        } else {
          const isBot = this.seats[seat].isBot;
          if (isBot) {
            bid = makeBotBid(hand, this.game.biddingState.currentHighestBid, seat === this.game.bidStarterSeat);
          }
        }
        
        this.game.placeBid(seat, bid);
        logGameEvent(this.gameId, `Bid action: Seat ${seat} (${this.seats[seat].name}) ${bid === 'pass' ? 'passed' : 'bid ' + bid}`);

        this.io.to(this.roomCode).emit('game_action', {
          action: 'bid',
          seat,
          bid,
          message: `${this.seats[seat].name} ${bid === 'pass' ? 'passed' : 'bid ' + bid}`
        });

      } else if (gameState === GAME_STATES.DECLARATION) {
        const dec = makeBotDeclaration(hand);
        this.game.declare(seat, dec.partnerCard, dec.trumpSuit);
        logGameEvent(this.gameId, `Declaration action: Seat ${seat} (${this.seats[seat].name}) declared Trump: ${dec.trumpSuit}, Partner Card: ${formatCard(dec.partnerCard)}`);

        this.io.to(this.roomCode).emit('game_action', {
          action: 'declare',
          seat,
          partnerCard: dec.partnerCard,
          trumpSuit: dec.trumpSuit,
          message: `${this.seats[seat].name} declared Trump: ${dec.trumpSuit}, Partner Card: ${formatCard(dec.partnerCard)}`
        });

      } else if (gameState === GAME_STATES.TRICK_PLAY) {
        const currentTrick = this.game.trickPlayState.currentTrick;
        const trumpSuit = this.game.declarationState.trumpSuit;
        const partnerCard = this.game.declarationState.partnerCard;
        const partnerSeat = this.game.partnership.partnerSeat;
        const bidWinnerSeat = this.game.partnership.bidWinnerSeat;
        
        let cardToPlay = null;
        const isBot = this.seats[seat].isBot;

        // Wrap bot play logic in a strict try-catch block for fail-safe play
        try {
          if (isBot) {
            cardToPlay = makeBotPlay(hand, currentTrick, trumpSuit, partnerCard, partnerSeat, bidWinnerSeat, seat);
          } else {
            // Timed out or disconnected human
            const leadCard = currentTrick.length > 0 ? currentTrick[0].card : null;
            const legalCards = hand.filter(c => !leadCard || c.suit === leadCard.suit);
            const choices = legalCards.length > 0 ? legalCards : hand;
            cardToPlay = choices[choices.length - 1];
          }

          if (!cardToPlay) {
            throw new Error('makeBotPlay returned null or empty card.');
          }
        } catch (botErr) {
          // Fail-safe: Play the first legal card to keep the game moving and avoid hangs!
          const leadCard = currentTrick.length > 0 ? currentTrick[0].card : null;
          const legalCards = hand.filter(c => !leadCard || c.suit === leadCard.suit);
          const choices = legalCards.length > 0 ? legalCards : hand;
          cardToPlay = choices[0];
          
          logGameEvent(this.gameId, `[FAIL-SAFE] Bot ${this.seats[seat].name} play threw error: "${botErr.message}". Auto-playing card: ${formatCard(cardToPlay)}`);
        }

        const isPartnerCard = partnerCard && (cardToPlay.rank === partnerCard.rank && cardToPlay.suit === partnerCard.suit);

        this.game.playCard(seat, cardToPlay);
        logGameEvent(this.gameId, `Play action: Seat ${seat} (${this.seats[seat].name}) played ${formatCard(cardToPlay)}`);

        this.io.to(this.roomCode).emit('game_action', {
          action: 'play_card',
          seat,
          card: cardToPlay,
          message: `${this.seats[seat].name} played ${formatCard(cardToPlay)}`
        });

        if (isPartnerCard) {
          logGameEvent(this.gameId, `Partner Card Revealed: Seat ${seat} (${this.seats[seat].name}) played the Partner Card.`);
          this.io.to(this.roomCode).emit('partner_revealed', {
            partnerSeat: seat,
            message: `Partner Revealed! ${this.seats[seat].name} holds the Partner Card.`
          });
        }
      }

      const oldState = gameState;
      const newState = this.game.gameState;
      
      if (oldState === GAME_STATES.TRICK_PLAY && newState === GAME_STATES.HAND_OVER) {
        logGameEvent(this.gameId, `Hand Completed. Hand Points: ${this.game.handPoints.map((pts, idx) => `Seat ${idx}:${pts}`).join(', ')}`);
        this.game.players.forEach(p => {
          logGameEvent(this.gameId, `  Player ${p.name} updated score: ${p.score}`);
        });

        this.io.to(this.roomCode).emit('hand_over', {
          players: this.game.players,
          handPoints: this.game.handPoints,
          message: `Hand over. scores updated.`
        });
      }

      this.broadcastState();
      this.runTurnCycle();

    } catch (err) {
      logGameEvent(this.gameId, `CRITICAL ERROR in executeAutoMove: ${err.message}`);
      this.clearTimers();
    }
  }

  handlePlayerAction(socketId, type, data) {
    const seat = this.seats.findIndex(s => s && s.socketId === socketId);
    if (seat === -1) throw new Error('Player not in room.');
    if (this.game.activeSeat !== seat) throw new Error('Not your turn.');

    if (type === 'bid') {
      this.game.placeBid(seat, data.bid);
      logGameEvent(this.gameId, `Player action: Seat ${seat} (${this.seats[seat].name}) ${data.bid === 'pass' ? 'passed' : 'bid ' + data.bid}`);

      this.io.to(this.roomCode).emit('game_action', {
        action: 'bid',
        seat,
        bid: data.bid,
        message: `${this.seats[seat].name} ${data.bid === 'pass' ? 'passed' : 'bid ' + data.bid}`
      });
    } else if (type === 'declare') {
      this.game.declare(seat, data.partnerCard, data.trumpSuit);
      logGameEvent(this.gameId, `Player action: Seat ${seat} (${this.seats[seat].name}) declared Trump: ${data.trumpSuit}, Partner Card: ${formatCard(data.partnerCard)}`);

      this.io.to(this.roomCode).emit('game_action', {
        action: 'declare',
        seat,
        partnerCard: data.partnerCard,
        trumpSuit: data.trumpSuit,
        message: `${this.seats[seat].name} declared Trump: ${data.trumpSuit}, Partner Card: ${formatCard(data.partnerCard)}`
      });
    } else if (type === 'play_card') {
      const card = data.card;
      const partnerCard = this.game.declarationState.partnerCard;
      const isPartnerCard = partnerCard && (card.rank === partnerCard.rank && card.suit === partnerCard.suit);

      this.game.playCard(seat, card);
      logGameEvent(this.gameId, `Player action: Seat ${seat} (${this.seats[seat].name}) played ${formatCard(card)}`);

      this.io.to(this.roomCode).emit('game_action', {
        action: 'play_card',
        seat,
        card,
        message: `${this.seats[seat].name} played ${formatCard(card)}`
      });

      if (isPartnerCard) {
        logGameEvent(this.gameId, `Partner Card Revealed: Seat ${seat} (${this.seats[seat].name}) played the Partner Card.`);
        this.io.to(this.roomCode).emit('partner_revealed', {
          partnerSeat: seat,
          message: `Partner Revealed! ${this.seats[seat].name} holds the Partner Card.`
        });
      }
    } else if (type === 'next_hand') {
      if (this.game.gameState === GAME_STATES.HAND_OVER) {
        logGameEvent(this.gameId, `Starting Hand #${this.game.handCount + 1}`);
        this.game.startHand();
        this.io.to(this.roomCode).emit('game_action', {
          action: 'next_hand',
          message: `Next hand started!`
        });
      }
    }

    this.broadcastState();
    this.runTurnCycle();
  }

  broadcastState() {
    this.seats.forEach((player, seatIndex) => {
      if (player && player.socketId) {
        const playerState = this.game.getStateForPlayer(seatIndex);
        this.io.to(player.socketId).emit('state_update', {
          roomCode: this.roomCode,
          gameId: this.gameId, // transmit gameId to client
          mySeat: seatIndex,
          gameState: playerState,
          seats: this.seats.map(s => s ? { name: s.name, isBot: s.isBot, isDisconnected: s.isDisconnected } : null),
          timeoutDuration: this.timeoutDuration,
          turnDeadline: this.turnDeadline
        });
      }
    });
  }

  clearTimers() {
    if (this.turnTimer) clearTimeout(this.turnTimer);
    if (this.botTimer) clearTimeout(this.botTimer);
    this.turnTimer = null;
    this.botTimer = null;
  }

  destroy() {
    logGameEvent(this.gameId, `Room destroyed/cleaned up.`);
    this.clearTimers();
  }
}
