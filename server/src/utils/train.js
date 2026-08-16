import fs from 'fs';
import path from 'path';
import { NeuralNetwork, encodeStateAction } from '../engine/neural.js';

const LOG_DIR = './logs';
const WEIGHTS_PATH = './logs/bot_weights.json';
const SHIP_SERVER_WEIGHTS = './src/engine/bot_weights.json';
const SHIP_CLIENT_WEIGHTS = '../client/src/engine/bot_weights.json';

const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

function getTrickWinner(trick, trumpSuit) {
  if (trick.length === 0) return null;
  const leadCard = trick[0].card;
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
  return winnerSeat;
}

export function runTraining() {
  console.log('--- Starting Bot Machine Learning Training Cycle ---');
  
  if (!fs.existsSync(LOG_DIR)) {
    console.log('No telemetry logs folder found. Play some matches first to generate training data.');
    return;
  }

  const nn = new NeuralNetwork();
  // Try loading existing weights to continue learning, fallback to SHIP weights if exists
  if (fs.existsSync(WEIGHTS_PATH)) {
    nn.loadWeights(JSON.parse(fs.readFileSync(WEIGHTS_PATH, 'utf8')));
    console.log(`Loaded existing training weights from: ${WEIGHTS_PATH}`);
  } else if (fs.existsSync(SHIP_SERVER_WEIGHTS)) {
    nn.loadWeights(JSON.parse(fs.readFileSync(SHIP_SERVER_WEIGHTS, 'utf8')));
    console.log(`Loaded base weights from: ${SHIP_SERVER_WEIGHTS}`);
  } else {
    console.log('Initializing fresh neural network weights...');
  }

  // Find all json log files
  const files = fs.readdirSync(LOG_DIR).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('No structured telemetry log files found in ./logs. Play matches first.');
    return;
  }

  console.log(`Found ${files.length} match telemetry logs. Processing game events...`);

  const trainingPairs = []; // Array of { inputs, target }

  files.forEach(file => {
    const filePath = path.join(LOG_DIR, file);
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.trim().split('\n');
      
      const playEvents = [];
      lines.forEach(line => {
        if (!line) return;
        const record = JSON.parse(line);
        if (record.event === 'play_card') {
          playEvents.push(record.payload);
        }
      });

      // Group playEvents into tricks (each trick has 4 plays)
      for (let i = 0; i < playEvents.length; i += 4) {
        const trickPlays = playEvents.slice(i, i + 4);
        if (trickPlays.length < 4) continue; // Skip incomplete trick

        // Extract play details
        const trumpSuit = trickPlays[0].trumpSuit;
        const partnerCard = trickPlays[0].partnerCard;
        const partnerSeat = trickPlays[0].partnerSeat;
        const bidWinnerSeat = trickPlays[0].bidWinnerSeat;

        // Reconstruct trick array as [{ seat, card }]
        const trick = trickPlays.map(p => ({ seat: p.seat, card: p.cardPlayed }));
        const winnerSeat = getTrickWinner(trick, trumpSuit);
        const trickPoints = trick.reduce((sum, p) => sum + (p.card.points || 0), 0);

        // Determine teams
        // Bidding team is bidWinnerSeat + partnerSeat. Defending is others.
        const isSeatBiddingTeam = (seat) => {
          return seat === bidWinnerSeat || seat === partnerSeat;
        };

        const isBiddingTeamWinner = isSeatBiddingTeam(winnerSeat);

        // For each of the 4 plays, construct the state-action pair inputs and reward targets
        trickPlays.forEach((play, playIdx) => {
          const seat = play.seat;
          const currentTrickBeforePlay = trickPlays.slice(0, playIdx).map(p => ({ seat: p.seat, card: p.cardPlayed }));
          
          // Encode state action
          const inputs = encodeStateAction(
            seat,
            currentTrickBeforePlay,
            trumpSuit,
            partnerCard,
            partnerSeat,
            bidWinnerSeat,
            play.cardPlayed
          );

          // Calculate reward/utility target
          // Base reward: +points if team won, -points if team lost.
          // Add a small constant +/- 2 for winning/losing lead even if points are 0.
          const isPlayBiddingTeam = isSeatBiddingTeam(seat);
          const didMyTeamWin = (isPlayBiddingTeam === isBiddingTeamWinner);
          
          let reward = didMyTeamWin ? (trickPoints + 2) : -(trickPoints + 2);
          
          // Normalize reward to fit Tanh range [-1, 1]
          // Max points in trick is around 50 points (Aces, 10s, and Kaali: 14*4 + 30 = 86 max, typically <= 45).
          // Divide by 45 to bound it cleanly.
          const target = Math.max(-1.0, Math.min(1.0, reward / 45.0));

          trainingPairs.push({ inputs, target });
        });
      }
    } catch (err) {
      console.error(`Error parsing telemetry file ${file}:`, err.message);
    }
  });

  if (trainingPairs.length === 0) {
    console.log('No complete tricks extracted from telemetry logs.');
    return;
  }

  console.log(`Extracted ${trainingPairs.length} training samples. Running backpropagation epochs...`);

  // Run training epochs
  const epochs = 20;
  let totalLoss = 0;

  for (let epoch = 1; epoch <= epochs; epoch++) {
    totalLoss = 0;
    
    // Shuffle training pairs to improve SGD convergence
    const shuffled = [...trainingPairs].sort(() => Math.random() - 0.5);

    shuffled.forEach(({ inputs, target }) => {
      const forwardRes = nn.forward(inputs);
      totalLoss += Math.pow(forwardRes.outOutput[0] - target, 2); // Squared Error
      nn.backward(inputs, forwardRes, target);
    });

    const averageLoss = totalLoss / trainingPairs.length;
    if (epoch % 5 === 0 || epoch === 1) {
      console.log(`Epoch ${epoch}/${epochs} - Mean Squared Error Loss: ${averageLoss.toFixed(6)}`);
    }
  }

  // Save weights
  const weightsObj = {
    w1: nn.w1,
    b1: nn.b1,
    w2: nn.w2,
    b2: nn.b2
  };
  const weightsData = JSON.stringify(weightsObj, null, 2);
  
  // Write to local logs cache
  if (!fs.existsSync(path.dirname(WEIGHTS_PATH))) {
    fs.mkdirSync(path.dirname(WEIGHTS_PATH), { recursive: true });
  }
  fs.writeFileSync(WEIGHTS_PATH, weightsData);

  // Write to Server Shipping Engine
  if (fs.existsSync(path.dirname(SHIP_SERVER_WEIGHTS))) {
    fs.writeFileSync(SHIP_SERVER_WEIGHTS, weightsData);
  }
  
  // Write to Client Shipping Engine
  if (fs.existsSync(path.dirname(SHIP_CLIENT_WEIGHTS))) {
    fs.writeFileSync(SHIP_CLIENT_WEIGHTS, weightsData);
  }

  console.log(`Training complete! Saved updated neural network weights to:`);
  console.log(`  - Local logs cache: ${WEIGHTS_PATH}`);
  console.log(`  - Server shipping engine: ${SHIP_SERVER_WEIGHTS}`);
  console.log(`  - Client shipping engine: ${SHIP_CLIENT_WEIGHTS}`);
  console.log('----------------------------------------------------');
}

// Automatically execute if run directly
if (process.argv[1] && process.argv[1].endsWith('train.js')) {
  runTraining();
}
