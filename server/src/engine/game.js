import {
  GAME_STATES,
  MIN_BID,
  MAX_BID,
  TOTAL_POINTS,
  WINNING_SCORE,
  SUITS,
  getCardPoints
} from './constants.js';
import { createDeck, shuffleDeck, dealCards, sortHand, formatCard } from './deck.js';

export class Game {
  constructor() {
    this.players = []; // Array of 4 players: { id, name, seat, score }
    this.gameState = GAME_STATES.LOBBY;
    this.bidStarterSeat = 0;
    this.hands = [[], [], [], []];
    
    // Hand State
    this.activeSeat = null;
    
    // Bidding
    this.biddingState = {
      currentHighestBid: 0,
      currentHighestBidderSeat: null,
      passedPlayers: [false, false, false, false],
      history: [] // [{ seat, bid }]
    };
    
    // Declaration
    this.declarationState = {
      partnerCard: null, // { rank, suit }
      trumpSuit: null
    };
    
    // Trick Play
    this.trickPlayState = {
      currentTrick: [], // [{ seat, card }]
      leadSeat: null,
      trickCount: 0,
      history: [] // [{ leadSeat, cardsPlayed, winnerSeat, points }]
    };
    
    this.handPoints = [0, 0, 0, 0];
    
    // Partnership
    this.partnership = {
      bidWinnerSeat: null,
      partnerSeat: null, // resolved when partner card is played
      actualPartnerSeat: null, // resolved secretly when card is declared
      isSolo: false
    };

    // Keep track of which hands have been completed
    this.handCount = 0;
  }

  startMatch(players) {
    if (players.length !== 4) {
      throw new Error('Game requires exactly 4 players.');
    }
    
    this.players = players.map((player, index) => ({
      id: player.id,
      name: player.name,
      seat: index,
      score: 0,
      isBot: player.isBot || false
    }));
    
    this.gameState = GAME_STATES.LOBBY;
    // Choose first bid starter randomly
    this.bidStarterSeat = Math.floor(Math.random() * 4);
    this.handCount = 0;
    
    this.startHand();
  }

  startHand() {
    this.gameState = GAME_STATES.BIDDING;
    
    // Deal cards
    const deck = shuffleDeck(createDeck());
    const dealtHands = dealCards(deck);
    this.hands = dealtHands.map(hand => sortHand(hand));
    
    // Reset Hand States
    this.activeSeat = this.bidStarterSeat;
    this.biddingState = {
      currentHighestBid: 0,
      currentHighestBidderSeat: null,
      passedPlayers: [false, false, false, false],
      history: []
    };
    
    this.declarationState = {
      partnerCard: null,
      trumpSuit: null
    };
    
    this.trickPlayState = {
      currentTrick: [],
      leadSeat: null,
      trickCount: 0,
      history: []
    };
    
    this.handPoints = [0, 0, 0, 0];
    
    this.partnership = {
      bidWinnerSeat: null,
      partnerSeat: null,
      actualPartnerSeat: null,
      isSolo: false
    };
  }

  placeBid(seat, bid) {
    if (this.gameState !== GAME_STATES.BIDDING) {
      throw new Error('Not in bidding phase.');
    }
    if (this.biddingState.passedPlayers[seat]) {
      throw new Error('Player has already passed and is locked out.');
    }
    if (this.activeSeat !== seat) {
      throw new Error('Not this player\'s turn to bid.');
    }

    if (bid === 'pass') {
      // Bid starter cannot pass on the first turn of bidding
      if (seat === this.bidStarterSeat && this.biddingState.currentHighestBid === 0) {
        throw new Error('The bid starter must open the bidding.');
      }
      
      this.biddingState.passedPlayers[seat] = true;
      this.biddingState.history.push({ seat, bid: 'pass' });
    } else {
      const bidVal = parseInt(bid, 10);
      if (isNaN(bidVal) || bidVal < MIN_BID || bidVal > MAX_BID || bidVal % 5 !== 0) {
        throw new Error(`Bid must be a multiple of 5 between ${MIN_BID} and ${MAX_BID}.`);
      }
      
      if (bidVal <= this.biddingState.currentHighestBid) {
        throw new Error('Bid must be higher than the current highest bid.');
      }
      
      this.biddingState.currentHighestBid = bidVal;
      this.biddingState.currentHighestBidderSeat = seat;
      this.biddingState.history.push({ seat, bid: bidVal });
    }

    // Check if bidding is finished
    const activeBidders = this.biddingState.passedPlayers.filter(p => !p).length;
    
    // Bidding ends when:
    // 1. Only 1 player remains active
    // 2. Or the highest bid has reached 150 and all other players have passed
    if (activeBidders === 1 && this.biddingState.currentHighestBidderSeat !== null) {
      this.finishBidding();
    } else if (this.biddingState.currentHighestBid === MAX_BID) {
      // Force pass for others, but let's just advance and lock others out if they try to bid.
      // Actually, when bid is 150, the next players must pass. Bidding will naturally end as they pass.
      this.advanceBiddingTurn();
    } else {
      this.advanceBiddingTurn();
    }
  }

  advanceBiddingTurn() {
    let nextSeat = (this.activeSeat + 1) % 4;
    while (this.biddingState.passedPlayers[nextSeat]) {
      nextSeat = (nextSeat + 1) % 4;
    }
    this.activeSeat = nextSeat;
  }

  finishBidding() {
    this.gameState = GAME_STATES.DECLARATION;
    this.partnership.bidWinnerSeat = this.biddingState.currentHighestBidderSeat;
    this.activeSeat = this.partnership.bidWinnerSeat;
  }

  declare(seat, partnerCard, trumpSuit) {
    if (this.gameState !== GAME_STATES.DECLARATION) {
      throw new Error('Not in declaration phase.');
    }
    if (this.partnership.bidWinnerSeat !== seat) {
      throw new Error('Only the bid winner can declare.');
    }
    if (!partnerCard || !partnerCard.rank || !partnerCard.suit) {
      throw new Error('Invalid partner card declared.');
    }
    if (!Object.values(SUITS).includes(trumpSuit)) {
      throw new Error('Invalid trump suit declared.');
    }

    this.declarationState.partnerCard = partnerCard;
    this.declarationState.trumpSuit = trumpSuit;

    // Find who holds the partner card
    const targetCardStr = formatCard(partnerCard);
    let foundSeat = null;
    for (let i = 0; i < 4; i++) {
      const hasCard = this.hands[i].some(card => formatCard(card) === targetCardStr);
      if (hasCard) {
        foundSeat = i;
        break;
      }
    }

    if (foundSeat === null) {
      throw new Error(`Partner card ${targetCardStr} not found in any player hand.`);
    }

    this.partnership.actualPartnerSeat = foundSeat;
    this.partnership.isSolo = (foundSeat === this.partnership.bidWinnerSeat);

    // If solo, we can set partnerSeat to bidWinnerSeat immediately (though it doesn't reveal to others)
    if (this.partnership.isSolo) {
      this.partnership.partnerSeat = this.partnership.bidWinnerSeat;
    }

    // Transition to Trick Play
    this.gameState = GAME_STATES.TRICK_PLAY;
    this.trickPlayState.leadSeat = this.partnership.bidWinnerSeat;
    this.activeSeat = this.partnership.bidWinnerSeat;
    this.trickPlayState.currentTrick = [];
    this.trickPlayState.trickCount = 0;
    this.trickPlayState.history = [];
  }

  playCard(seat, card) {
    if (this.gameState !== GAME_STATES.TRICK_PLAY) {
      throw new Error('Not in trick play phase.');
    }
    if (this.activeSeat !== seat) {
      throw new Error('Not this player\'s turn.');
    }

    // Check if player has card
    const playerHand = this.hands[seat];
    const cardIndex = playerHand.findIndex(c => c.rank === card.rank && c.suit === card.suit);
    if (cardIndex === -1) {
      throw new Error(`Card ${formatCard(card)} not in player hand.`);
    }

    // Follow Suit validation
    if (this.trickPlayState.currentTrick.length > 0) {
      const leadCard = this.trickPlayState.currentTrick[0].card;
      if (card.suit !== leadCard.suit) {
        const hasLeadSuit = playerHand.some(c => c.suit === leadCard.suit);
        if (hasLeadSuit) {
          throw new Error(`Must follow suit: ${leadCard.suit}.`);
        }
      }
    }

    // Play card
    const playedCard = playerHand.splice(cardIndex, 1)[0];
    this.trickPlayState.currentTrick.push({ seat, card: playedCard });

    // Check partner card reveal
    const partnerCardStr = formatCard(this.declarationState.partnerCard);
    if (formatCard(playedCard) === partnerCardStr) {
      this.partnership.partnerSeat = seat;
    }

    // Resolve trick if all 4 players played
    if (this.trickPlayState.currentTrick.length === 4) {
      this.resolveTrick();
    } else {
      this.activeSeat = (this.activeSeat + 1) % 4;
    }
  }

  resolveTrick() {
    const trick = this.trickPlayState.currentTrick;
    const leadCard = trick[0].card;
    const trumpSuit = this.declarationState.trumpSuit;

    let winnerSeat = trick[0].seat;
    let bestCard = leadCard;

    for (let i = 1; i < trick.length; i++) {
      const { seat, card } = trick[i];
      const isTrump = card.suit === trumpSuit;
      const bestIsTrump = bestCard.suit === trumpSuit;

      if (isTrump && !bestIsTrump) {
        winnerSeat = seat;
        bestCard = card;
      } else if ((isTrump && bestIsTrump) || (card.suit === leadCard.suit && bestCard.suit === leadCard.suit)) {
        if (RANK_VALUES[card.rank] > RANK_VALUES[bestCard.rank]) {
          winnerSeat = seat;
          bestCard = card;
        }
      }
    }

    // Calculate points in this trick
    const trickPoints = trick.reduce((sum, t) => sum + t.card.points, 0);
    this.handPoints[winnerSeat] += trickPoints;

    // Record history
    this.trickPlayState.history.push({
      leadSeat: this.trickPlayState.leadSeat,
      cardsPlayed: [...trick],
      winnerSeat,
      points: trickPoints
    });

    this.trickPlayState.trickCount++;
    this.trickPlayState.leadSeat = winnerSeat;
    this.activeSeat = winnerSeat;
    this.trickPlayState.currentTrick = [];

    // Check early resolution
    if (this.checkHandEnded()) {
      this.resolveHand();
    }
  }

  checkHandEnded() {
    // Hand ends if 13 tricks played
    if (this.trickPlayState.trickCount === 13) {
      return true;
    }

    // Early resolution checks
    const bidValue = this.biddingState.currentHighestBid;
    
    // Points captured by bidding team
    const bidWinner = this.partnership.bidWinnerSeat;
    const partner = this.partnership.actualPartnerSeat;
    
    const biddingTeamPoints = this.handPoints[bidWinner] + (this.partnership.isSolo ? 0 : this.handPoints[partner]);
    const defendingTeamPoints = TOTAL_POINTS - biddingTeamPoints;

    // 1. Bid secured
    if (biddingTeamPoints >= bidValue) {
      return true;
    }

    // 2. Bid mathematically dead (opponents points > 150 - bid + 5 => >= 150 - bid + 5)
    if (defendingTeamPoints >= (TOTAL_POINTS - bidValue + 5)) {
      return true;
    }

    return false;
  }

  resolveHand() {
    this.gameState = GAME_STATES.HAND_OVER;
    this.handCount++;

    const bidValue = this.biddingState.currentHighestBid;
    const bidWinner = this.partnership.bidWinnerSeat;
    const partner = this.partnership.actualPartnerSeat;
    const isSolo = this.partnership.isSolo;

    const biddingTeamPoints = this.handPoints[bidWinner] + (isSolo ? 0 : this.handPoints[partner]);
    const bidSuccess = biddingTeamPoints >= bidValue;

    // Scoring Distribution
    if (isSolo) {
      if (bidSuccess) {
        this.players[bidWinner].score += 3 * bidValue;
      } else {
        for (let i = 0; i < 4; i++) {
          if (i !== bidWinner) {
            this.players[i].score += bidValue;
          }
        }
      }
    } else {
      if (bidSuccess) {
        this.players[bidWinner].score += 2 * bidValue;
        this.players[partner].score += 1 * bidValue;
      } else {
        for (let i = 0; i < 4; i++) {
          if (i !== bidWinner && i !== partner) {
            this.players[i].score += bidValue;
          }
        }
      }
    }

    // Force floor scores at 0 (already positive, but rule floor is enforced)
    for (let i = 0; i < 4; i++) {
      if (this.players[i].score < 0) this.players[i].score = 0;
    }

    // Check Match Over
    const highestScore = Math.max(...this.players.map(p => p.score));
    if (highestScore >= WINNING_SCORE) {
      this.gameState = GAME_STATES.MATCH_OVER;
    } else {
      // Set up next bid starter
      this.bidStarterSeat = (this.bidStarterSeat + 1) % 4;
    }
  }

  // Helper to extract sanitized view of state for a specific player (by seat)
  getStateForPlayer(playerSeat) {
    const isOverOrDec = this.gameState === GAME_STATES.HAND_OVER || this.gameState === GAME_STATES.MATCH_OVER;
    
    // Hide partner seat if not yet revealed
    const partnerRevealed = this.partnership.partnerSeat !== null || isOverOrDec;
    const clientPartnerSeat = partnerRevealed ? this.partnership.partnerSeat : null;
    
    // Hide other player cards
    const clientHands = this.hands.map((hand, index) => {
      if (index === playerSeat || isOverOrDec) {
        return hand;
      }
      return hand.map(() => ({ hidden: true }));
    });

    return {
      gameState: this.gameState,
      players: this.players,
      activeSeat: this.activeSeat,
      bidStarterSeat: this.bidStarterSeat,
      handCount: this.handCount,
      handPoints: this.handPoints,
      hand: this.hands[playerSeat], // raw hand for this player
      handsCount: this.hands.map(h => h.length), // counts only for others
      allHands: clientHands, // redacted hands
      biddingState: {
        currentHighestBid: this.biddingState.currentHighestBid,
        currentHighestBidderSeat: this.biddingState.currentHighestBidderSeat,
        passedPlayers: this.biddingState.passedPlayers,
        history: this.biddingState.history
      },
      declarationState: this.declarationState,
      trickPlayState: {
        currentTrick: this.trickPlayState.currentTrick,
        leadSeat: this.trickPlayState.leadSeat,
        trickCount: this.trickPlayState.trickCount,
        history: this.trickPlayState.history
      },
      partnership: {
        bidWinnerSeat: this.partnership.bidWinnerSeat,
        partnerSeat: clientPartnerSeat,
        isSolo: isOverOrDec ? this.partnership.isSolo : (this.partnership.isSolo || (this.partnership.partnerSeat === this.partnership.bidWinnerSeat))
      }
    };
  }
}
