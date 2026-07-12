import { Game } from './engine/game.js';
import { GAME_STATES } from './engine/constants.js';
import { formatCard } from './engine/deck.js';
import { makeBotBid, makeBotDeclaration, makeBotPlay } from './bot.js';

export class Room {
  constructor(roomCode, io, settings = {}) {
    this.roomCode = roomCode;
    this.io = io;
    this.timeoutDuration = settings.timeoutDuration !== undefined ? settings.timeoutDuration : 20; // in seconds, 0 = disabled
    this.botDifficulty = settings.botDifficulty || 'medium';
    
    this.game = new Game();
    this.seats = [null, null, null, null]; // { id, name, socketId, isBot, isDisconnected }
    this.gameStarted = false;
    
    this.turnTimer = null;
    this.botTimer = null;
    this.turnDeadline = null;
  }

  addPlayer(id, name, socketId) {
    // Check if player is reconnecting
    const existingIndex = this.seats.findIndex(s => s && s.id === id);
    if (existingIndex !== -1) {
      this.seats[existingIndex].socketId = socketId;
      this.seats[existingIndex].isDisconnected = false;
      return existingIndex;
    }

    // Find first empty seat
    const emptyIndex = this.seats.findIndex(s => s === null);
    if (emptyIndex === -1) {
      throw new Error('Room is full.');
    }

    this.seats[emptyIndex] = { id, name, socketId, isBot: false, isDisconnected: false };
    return emptyIndex;
  }

  removePlayer(socketId) {
    const index = this.seats.findIndex(s => s && s.socketId === socketId);
    if (index === -1) return null;

    const player = this.seats[index];
    if (this.gameStarted) {
      // Mark as disconnected, the server will auto-act for them
      player.isDisconnected = true;
      player.socketId = null;
      
      // If all human players disconnected, we should probably clean up, but otherwise continue
      this.broadcastState();
      
      // If it was their turn, trigger auto-act timer immediately
      if (this.game.activeSeat === index) {
        this.resetTurnTimer(true); // accelerate timeout for disconnected
      }
    } else {
      // Remove completely before game starts
      this.seats[index] = null;
    }
    
    return player;
  }

  fillWithBots() {
    const names = ['Rani Bot', 'Kaali Bot', 'Spade Bot', 'Ace Bot'];
    for (let i = 0; i < 4; i++) {
      if (this.seats[i] === null) {
        this.seats[i] = {
          id: `bot-${i}-${Math.random().toString(36).substr(2, 4)}`,
          name: names[i],
          socketId: null,
          isBot: true,
          isDisconnected: false
        };
      }
    }
  }

  start() {
    if (this.gameStarted) return;
    
    // Fill remaining empty seats with bots
    this.fillWithBots();
    this.gameStarted = true;
    
    // Convert seats to engine player format
    const enginePlayers = this.seats.map(s => ({
      id: s.id,
      name: s.name,
      isBot: s.isBot
    }));

    this.game.startMatch(enginePlayers);
    this.broadcastState();
    this.runTurnCycle();
  }

  runTurnCycle() {
    this.clearTimers();
    
    if (this.game.gameState === GAME_STATES.MATCH_OVER) {
      this.broadcastState();
      return;
    }

    const activeSeat = this.game.activeSeat;
    const activePlayer = this.seats[activeSeat];

    if (!activePlayer) return;

    if (activePlayer.isBot || activePlayer.isDisconnected) {
      // Bots or disconnected players: schedule auto action after brief realistic delay
      const delay = activePlayer.isDisconnected ? 1000 : 1500;
      this.botTimer = setTimeout(() => {
        this.executeAutoMove(activeSeat);
      }, delay);
    } else {
      // Human player: Start turn timeout countdown
      this.resetTurnTimer(false);
    }
  }

  resetTurnTimer(isAccelerated = false) {
    if (this.turnTimer) clearTimeout(this.turnTimer);
    
    if (this.timeoutDuration <= 0) {
      this.turnDeadline = null;
      return;
    }

    const duration = isAccelerated ? 2 : this.timeoutDuration; // 2 seconds if disconnected
    this.turnDeadline = Date.now() + duration * 1000;
    
    this.io.to(this.roomCode).emit('timer_update', {
      activeSeat: this.game.activeSeat,
      duration,
      deadline: this.turnDeadline
    });

    this.turnTimer = setTimeout(() => {
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
          bid = 75; // force opening bid
        } else {
          // If bot, let it make a real heuristic bid. If disconnected player, auto pass.
          const isBot = this.seats[seat].isBot;
          if (isBot) {
            bid = makeBotBid(hand, this.game.biddingState.currentHighestBid, seat === this.game.bidStarterSeat);
          }
        }
        
        this.game.placeBid(seat, bid);
        this.io.to(this.roomCode).emit('game_action', {
          action: 'bid',
          seat,
          bid,
          message: `${this.seats[seat].name} ${bid === 'pass' ? 'passed' : 'bid ' + bid}`
        });

      } else if (gameState === GAME_STATES.DECLARATION) {
        // Run bot declaration logic to select partner card & trump
        const dec = makeBotDeclaration(hand);
        this.game.declare(seat, dec.partnerCard, dec.trumpSuit);
        
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
        
        // Find a legal card to play
        let cardToPlay;
        const isBot = this.seats[seat].isBot;

        if (isBot) {
          cardToPlay = makeBotPlay(hand, currentTrick, trumpSuit, partnerCard, partnerSeat, bidWinnerSeat, seat);
        } else {
          // Disconnected or timed out human: play lowest legal card
          const leadCard = currentTrick.length > 0 ? currentTrick[0].card : null;
          const legalCards = hand.filter(c => !leadCard || c.suit === leadCard.suit);
          const choices = legalCards.length > 0 ? legalCards : hand;
          // Sort by rank value and play lowest
          const sorted = [...choices].sort((a, b) => a.points - b.points); // prioritize throwing points
          cardToPlay = sorted[sorted.length - 1]; // or whatever legal card
          // Wait, let's just make sure it's legal
          cardToPlay = choices[choices.length - 1];
        }

        // Keep track of the partner card format to see if it gets played
        const isPartnerCard = partnerCard && (cardToPlay.rank === partnerCard.rank && cardToPlay.suit === partnerCard.suit);

        this.game.playCard(seat, cardToPlay);
        
        this.io.to(this.roomCode).emit('game_action', {
          action: 'play_card',
          seat,
          card: cardToPlay,
          message: `${this.seats[seat].name} played ${formatCard(cardToPlay)}`
        });

        if (isPartnerCard) {
          this.io.to(this.roomCode).emit('partner_revealed', {
            partnerSeat: seat,
            message: `Partner Revealed! ${this.seats[seat].name} holds the Partner Card.`
          });
        }
      }

      // If resolving hand/match, check state transition
      const oldState = gameState;
      const newState = this.game.gameState;
      
      if (oldState === GAME_STATES.TRICK_PLAY && newState === GAME_STATES.HAND_OVER) {
        this.io.to(this.roomCode).emit('hand_over', {
          players: this.game.players,
          handPoints: this.game.handPoints,
          message: `Hand over. scores updated.`
        });
      }

      this.broadcastState();
      this.runTurnCycle();

    } catch (err) {
      console.error('Error in auto move:', err);
      // Fail-safe: if something fails, force pass or play random card
      this.clearTimers();
    }
  }

  handlePlayerAction(socketId, type, data) {
    const seat = this.seats.findIndex(s => s && s.socketId === socketId);
    if (seat === -1) throw new Error('Player not in room.');
    if (this.game.activeSeat !== seat) throw new Error('Not your turn.');

    if (type === 'bid') {
      this.game.placeBid(seat, data.bid);
      this.io.to(this.roomCode).emit('game_action', {
        action: 'bid',
        seat,
        bid: data.bid,
        message: `${this.seats[seat].name} ${data.bid === 'pass' ? 'passed' : 'bid ' + data.bid}`
      });
    } else if (type === 'declare') {
      this.game.declare(seat, data.partnerCard, data.trumpSuit);
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
      this.io.to(this.roomCode).emit('game_action', {
        action: 'play_card',
        seat,
        card,
        message: `${this.seats[seat].name} played ${formatCard(card)}`
      });

      if (isPartnerCard) {
        this.io.to(this.roomCode).emit('partner_revealed', {
          partnerSeat: seat,
          message: `Partner Revealed! ${this.seats[seat].name} holds the Partner Card.`
        });
      }
    } else if (type === 'next_hand') {
      // Any player can request to start next hand if Hand Over
      if (this.game.gameState === GAME_STATES.HAND_OVER) {
        this.game.startHand();
        this.io.to(this.roomCode).emit('game_action', {
          action: 'next_hand',
          message: `Next hand started!`
        });
      }
    }

    const oldState = this.game.gameState;
    // Broadcast updated state
    this.broadcastState();
    this.runTurnCycle();
  }

  broadcastState() {
    this.seats.forEach((player, seatIndex) => {
      if (player && player.socketId) {
        const playerState = this.game.getStateForPlayer(seatIndex);
        this.io.to(player.socketId).emit('state_update', {
          roomCode: this.roomCode,
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
    this.clearTimers();
  }
}
