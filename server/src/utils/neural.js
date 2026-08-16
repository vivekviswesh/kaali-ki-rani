import fs from 'fs';
import path from 'path';

export const SUITS = { SPADES: 'S', HEARTS: 'H', DIAMONDS: 'D', CLUBS: 'C' };
export const RANKS = { TWO: '2', THREE: '3', FOUR: '4', FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9', TEN: '10', JACK: 'J', QUEEN: 'Q', KING: 'K', ACE: 'A' };
export const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

export class NeuralNetwork {
  constructor() {
    this.inputSize = 29;
    this.hiddenSize = 16;
    this.outputSize = 1;
    this.learningRate = 0.05;

    // Initialize weights and biases with Xavier/Glorot initialization
    const initLimit1 = Math.sqrt(6 / (this.inputSize + this.hiddenSize));
    this.w1 = Array.from({ length: this.hiddenSize }, () =>
      Array.from({ length: this.inputSize }, () => (Math.random() * 2 - 1) * initLimit1)
    );
    this.b1 = Array.from({ length: this.hiddenSize }, () => 0);

    const initLimit2 = Math.sqrt(6 / (this.hiddenSize + this.outputSize));
    this.w2 = Array.from({ length: this.outputSize }, () =>
      Array.from({ length: this.hiddenSize }, () => (Math.random() * 2 - 1) * initLimit2)
    );
    this.b2 = Array.from({ length: this.outputSize }, () => 0);
  }

  tanh(x) {
    return Math.tanh(x);
  }

  tanhDerivative(x) {
    return 1 - Math.tanh(x) ** 2;
  }

  relu(x) {
    return Math.max(0, x);
  }

  reluDerivative(x) {
    return x > 0 ? 1 : 0;
  }

  forward(input) {
    // Hidden layer with ReLU
    const hInput = [];
    const hOutput = [];
    for (let i = 0; i < this.hiddenSize; i++) {
      let sum = this.b1[i];
      for (let j = 0; j < this.inputSize; j++) {
        sum += this.w1[i][j] * input[j];
      }
      hInput.push(sum);
      hOutput.push(this.relu(sum));
    }

    // Output layer with Tanh (values between -1 and 1)
    const outInput = [];
    const outOutput = [];
    for (let i = 0; i < this.outputSize; i++) {
      let sum = this.b2[i];
      for (let j = 0; j < this.hiddenSize; j++) {
        sum += this.w2[i][j] * hOutput[j];
      }
      outInput.push(sum);
      outOutput.push(this.tanh(sum));
    }

    return { hInput, hOutput, outInput, outOutput };
  }

  backward(input, forwardResult, target) {
    const { hInput, hOutput, outInput, outOutput } = forwardResult;
    const loss = outOutput[0] - target; // Output error

    // Gradients for w2 and b2 (output layer)
    const dOutInput = loss * this.tanhDerivative(outInput[0]);
    const dW2 = Array.from({ length: this.outputSize }, () =>
      Array.from({ length: this.hiddenSize }, (_, j) => dOutInput * hOutput[j])
    );
    const dB2 = [dOutInput];

    // Gradients for w1 and b1 (hidden layer)
    const dHOutput = [];
    for (let j = 0; j < this.hiddenSize; j++) {
      let sum = 0;
      for (let i = 0; i < this.outputSize; i++) {
        sum += dOutInput * this.w2[i][j];
      }
      dHOutput.push(sum);
    }

    const dHInput = [];
    for (let j = 0; j < this.hiddenSize; j++) {
      dHInput.push(dHOutput[j] * this.reluDerivative(hInput[j]));
    }

    const dW1 = Array.from({ length: this.hiddenSize }, (_, i) =>
      Array.from({ length: this.inputSize }, (_, j) => dHInput[i] * input[j])
    );
    const dB1 = [...dHInput];

    // SGD weight updates
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.inputSize; j++) {
        this.w1[i][j] -= this.learningRate * dW1[i][j];
      }
      this.b1[i] -= this.learningRate * dB1[i];
    }

    for (let i = 0; i < this.outputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        this.w2[i][j] -= this.learningRate * dW2[i][j];
      }
      this.b2[i] -= this.learningRate * dB2[i];
    }
  }

  save(filepath) {
    try {
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = JSON.stringify({
        w1: this.w1,
        b1: this.b1,
        w2: this.w2,
        b2: this.b2
      }, null, 2);
      fs.writeFileSync(filepath, data);
    } catch (err) {
      console.error('Failed saving neural weights:', err.message);
    }
  }

  load(filepath) {
    try {
      if (fs.existsSync(filepath)) {
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        this.w1 = data.w1;
        this.b1 = data.b1;
        this.w2 = data.w2;
        this.b2 = data.b2;
        return true;
      }
    } catch (err) {
      console.error('Failed loading neural weights:', err.message);
    }
    return false;
  }
}

// Encode state-action pair to feature vector (29 inputs)
export function encodeStateAction(seat, currentTrick, trumpSuit, partnerCard, partnerSeat, bidWinnerSeat, playedCard) {
  const inputs = new Array(29).fill(0);
  const suitIndex = { S: 0, H: 1, C: 2, D: 3 };

  // 1. Lead suit (4 inputs)
  if (currentTrick.length > 0) {
    const leadSuit = currentTrick[0].card.suit;
    if (suitIndex[leadSuit] !== undefined) {
      inputs[suitIndex[leadSuit]] = 1;
    }
  }

  // 2. Trump suit (4 inputs)
  if (trumpSuit && suitIndex[trumpSuit] !== undefined) {
    inputs[4 + suitIndex[trumpSuit]] = 1;
  }

  // 3. Played cards in trick (12 inputs: 3 seats * 4 suits)
  currentTrick.forEach((play, idx) => {
    if (idx < 3 && suitIndex[play.card.suit] !== undefined) {
      inputs[8 + idx * 4 + suitIndex[play.card.suit]] = 1;
    }
  });

  // 4. Card to play suit (4 inputs)
  if (suitIndex[playedCard.suit] !== undefined) {
    inputs[20 + suitIndex[playedCard.suit]] = 1;
  }

  // 5. Card to play rank scaled (1 input, 2-14 scaled to 0-1)
  const rankVal = RANK_VALUES[playedCard.rank] || 2;
  inputs[24] = (rankVal - 2) / 12;

  // 6. Card to play points scaled (1 input, 0-30 scaled to 0-1)
  inputs[25] = (playedCard.points || 0) / 30;

  // 7. Role (2 inputs: bidding team, defending team)
  const amIBidWinner = (seat === bidWinnerSeat);
  const amIPartner = (seat === partnerSeat);
  const isBiddingTeam = amIBidWinner || amIPartner;
  if (isBiddingTeam) {
    inputs[26] = 1;
  } else {
    inputs[27] = 1;
  }

  // 8. Current points in trick scaled (1 input, 0-50 scaled to 0-1)
  const trickPoints = currentTrick.reduce((sum, p) => sum + (p.card.points || 0), 0);
  inputs[28] = trickPoints / 50;

  return inputs;
}
