import { SUITS, RANKS, RANK_VALUES, getCardPoints } from './constants.js';

/**
 * Heuristically evaluates a hand's bidding strength.
 * Returns a number representing the recommended max bid (between 0 and 150).
 */
export function evaluateBidStrength(hand) {
  let score = 0;
  
  // Count high cards and trumps
  const suitCounts = {};
  for (const suit of Object.values(SUITS)) {
    suitCounts[suit] = 0;
  }
  
  for (const card of hand) {
    suitCounts[card.suit]++;
    
    // Add strength points
    if (card.rank === RANKS.ACE) score += 8;
    if (card.rank === RANKS.KING) score += 5;
    if (card.rank === RANKS.QUEEN) score += 3;
    if (card.rank === RANKS.JACK) score += 2;
    if (card.rank === RANKS.TEN) score += 3;
    
    // Kaali Ki Rani itself is valuable
    if (card.suit === SUITS.SPADES && card.rank === RANKS.QUEEN) {
      score += 10;
    }
  }

  // Find longest suit length
  const maxSuitLength = Math.max(...Object.values(suitCounts));
  score += maxSuitLength * 3; // Long suits are good for trumps

  // Base bid calculation
  // 75 is the minimum bid
  if (score < 35) {
    return 0; // Bot prefers to pass if weak
  }
  
  // Scale bid value realistically (5 points for every 3 points of score above 35)
  const calculatedBid = 75 + Math.floor((score - 35) / 3) * 5;
  return Math.min(130, Math.max(75, calculatedBid));
}

/**
 * Decides a bid action for the bot.
 */
export function makeBotBid(hand, currentHighestBid, isStarter) {
  const maxBid = evaluateBidStrength(hand);
  
  if (currentHighestBid === 0) {
    // If starter, must bid at least 75
    return 75;
  }
  
  if (maxBid > currentHighestBid) {
    // Round to next multiple of 5 above current highest
    const nextBid = Math.min(150, Math.ceil((currentHighestBid + 1) / 5) * 5);
    if (nextBid <= maxBid) {
      return nextBid;
    }
  }
  
  return 'pass';
}

/**
 * Chooses the partner card and trump suit to declare.
 */
export function makeBotDeclaration(hand) {
  // 1. Choose trump suit: the suit they have the most cards in
  const suitCounts = {};
  for (const suit of Object.values(SUITS)) {
    suitCounts[suit] = 0;
  }
  for (const card of hand) {
    suitCounts[card.suit]++;
  }
  
  let bestTrump = SUITS.SPADES;
  let maxCount = -1;
  for (const [suit, count] of Object.entries(suitCounts)) {
    if (count > maxCount) {
      maxCount = count;
      bestTrump = suit;
    }
  }

  // 2. Choose partner card: name an Ace they do NOT hold.
  // Best partner is someone holding an Ace of a suit they have, but don't hold the Ace of.
  const myAces = hand.filter(c => c.rank === RANKS.ACE).map(c => c.suit);
  
  let partnerSuit = null;
  // Try to find a suit where the bot has cards but does not have the Ace
  for (const suit of Object.values(SUITS)) {
    const hasCardsInSuit = hand.some(c => c.suit === suit);
    const hasAceInSuit = myAces.includes(suit);
    if (hasCardsInSuit && !hasAceInSuit) {
      partnerSuit = suit;
      break;
    }
  }

  // If they have all Aces or none fit, name an Ace they don't hold in any suit
  if (!partnerSuit) {
    for (const suit of Object.values(SUITS)) {
      if (!myAces.includes(suit)) {
        partnerSuit = suit;
        break;
      }
    }
  }

  // Fallback: if they hold all Aces, name the King of their longest suit
  let partnerCard = { rank: RANKS.ACE, suit: partnerSuit || bestTrump };
  if (myAces.length === 4) {
    partnerCard = { rank: RANKS.KING, suit: bestTrump };
  }

  return { partnerCard, trumpSuit: bestTrump };
}

/**
 * Selects a card to play.
 */
export function makeBotPlay(hand, currentTrick, trumpSuit, partnerCard, partnerSeat, bidWinnerSeat, botSeat) {
  const legalCards = getLegalCards(hand, currentTrick);
  if (legalCards.length === 0) return null;
  
  // 1. Single card remaining
  if (legalCards.length === 1) {
    return legalCards[0];
  }

  const partnerCardStr = partnerCard ? `${partnerCard.rank}-${partnerCard.suit}` : '';
  const leadCard = currentTrick.length > 0 ? currentTrick[0].card : null;

  // Let's identify roles
  const amIBidWinner = (botSeat === bidWinnerSeat);
  const amIPartner = (botSeat === partnerSeat);
  const isBiddingTeam = amIBidWinner || amIPartner;

  // 2. Bot is leading the trick
  if (!leadCard) {
    // If bidding team, lead high or draw trump
    // If defending team, lead low or try to force out trumps/Queen
    // For simplicity, let's sort cards by value and play a moderate card, or a high Ace if we have it
    const aces = legalCards.filter(c => c.rank === RANKS.ACE);
    if (aces.length > 0) {
      // Play a non-spade Ace first if possible (safer)
      const nonSpadeAce = aces.find(c => c.suit !== SUITS.SPADES);
      return nonSpadeAce || aces[0];
    }
    
    // Otherwise play the highest non-point card to establish tricks, or lowest card
    const nonPointCards = legalCards.filter(c => c.points === 0);
    if (nonPointCards.length > 0) {
      return nonPointCards[0]; // Sort order is high to low, so this is highest non-point card
    }
    return legalCards[legalCards.length - 1]; // Lowest card
  }

  // 3. Bot is following suit
  const isFollowingSuit = legalCards[0].suit === leadCard.suit;

  // Determine who is currently winning the trick
  let winningSeat = currentTrick[0].seat;
  let winningCard = currentTrick[0].card;
  
  for (let i = 1; i < currentTrick.length; i++) {
    const { seat, card } = currentTrick[i];
    const isTrump = card.suit === trumpSuit;
    const bestIsTrump = winningCard.suit === trumpSuit;

    if (isTrump && !bestIsTrump) {
      winningSeat = seat;
      winningCard = card;
    } else if ((isTrump && bestIsTrump) || (card.suit === leadCard.suit && winningCard.suit === leadCard.suit)) {
      if (RANK_VALUES[card.rank] > RANK_VALUES[winningCard.rank]) {
        winningSeat = seat;
        winningCard = card;
      }
    }
  }

  const isPartnerWinning = (winningSeat === bidWinnerSeat || winningSeat === partnerSeat) && (winningSeat !== botSeat);

  if (isFollowingSuit) {
    // Can we win?
    const winningLegalCards = legalCards.filter(card => {
      // Since it follows suit, it only wins if winningCard is not trump (or winningCard is lead suit and this is higher)
      if (winningCard.suit === trumpSuit && leadCard.suit !== trumpSuit) return false;
      return RANK_VALUES[card.rank] > RANK_VALUES[winningCard.rank];
    });

    if (winningLegalCards.length > 0 && !isPartnerWinning) {
      // We want to win, play the highest winning card
      return winningLegalCards[0];
    }

    // If partner is winning, we can discard points to feed them!
    if (isPartnerWinning && isBiddingTeam) {
      // Find cards with points
      const pointCards = legalCards.filter(c => c.points > 0).sort((a, b) => b.points - a.points);
      if (pointCards.length > 0) {
        return pointCards[0]; // Play highest point card to feed partner
      }
    }

    // Otherwise play the lowest card (keep high cards)
    return legalCards[legalCards.length - 1];
  } else {
    // We are VOID in lead suit!
    // We can trump or discard.
    const trumps = legalCards.filter(c => c.suit === trumpSuit);
    
    if (trumps.length > 0 && !isPartnerWinning) {
      // We can win by trumping! Let's play the lowest trump that can win
      let winningTrumps = [];
      if (winningCard.suit === trumpSuit) {
        winningTrumps = trumps.filter(c => RANK_VALUES[c.rank] > RANK_VALUES[winningCard.rank]);
      } else {
        winningTrumps = trumps;
      }
      
      if (winningTrumps.length > 0) {
        return winningTrumps[winningTrumps.length - 1]; // Play lowest winning trump
      }
    }

    // If partner is winning, feed them point cards
    if (isPartnerWinning && isBiddingTeam) {
      const pointCards = legalCards.filter(c => c.points > 0).sort((a, b) => b.points - a.points);
      if (pointCards.length > 0) {
        // Don't throw away Queen of Spades if we can avoid it, unless partner is definitely winning
        // Wait, Queen of Spades is worth 30, so if partner is winning, feeding it is perfect!
        return pointCards[0];
      }
    }

    // Otherwise discard lowest card
    // Avoid discarding points to opponents if opponents are winning
    const safeDiscards = legalCards.filter(c => c.points === 0);
    if (safeDiscards.length > 0) {
      return safeDiscards[safeDiscards.length - 1]; // Lowest non-point card
    }
    return legalCards[legalCards.length - 1]; // Lowest card
  }
}

/**
 * Filter legal cards to play.
 */
function getLegalCards(hand, currentTrick) {
  if (currentTrick.length === 0) {
    return [...hand];
  }
  const leadCard = currentTrick[0].card;
  const followCards = hand.filter(c => c.suit === leadCard.suit);
  if (followCards.length > 0) {
    return followCards;
  }
  return [...hand];
}
