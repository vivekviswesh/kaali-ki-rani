import fs from 'fs';
import path from 'path';

// Compilation target
const DATASET_FILE = './logs/training_dataset.json';

function runAnalyzer() {
  const logDir = './logs';
  if (!fs.existsSync(logDir)) {
    console.log('No logs directory found. Run some games first!');
    return;
  }

  // Find all telemetry JSON logs
  const files = fs.readdirSync(logDir).filter(f => f.endsWith('.json') && f !== 'training_dataset.json');

  if (files.length === 0) {
    console.log('No telemetry log files found in ./logs.');
    return;
  }

  console.log(`Analyzing ${files.length} telemetry logs...`);

  const biddingExamples = [];
  const declarationExamples = [];
  const playExamples = [];
  
  let totalMatches = 0;
  let totalHands = 0;

  for (const file of files) {
    const filePath = path.join(logDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');

    let matchGameId = '';
    let biddingSucceeded = false;
    let bidWinner = null;
    let partner = null;
    let isSolo = false;

    // First pass: extract final hand outcomes for this game
    const tempBids = [];
    const tempPlays = [];
    const tempDeclares = [];

    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        matchGameId = record.gameId;

        if (record.event === 'match_start') {
          totalMatches++;
        } else if (record.event === 'hand_start') {
          totalHands++;
        } else if (record.event === 'bid') {
          tempBids.push(record.payload);
        } else if (record.event === 'declare') {
          tempDeclares.push(record.payload);
        } else if (record.event === 'play_card') {
          tempPlays.push(record.payload);
        } else if (record.event === 'hand_over') {
          // Hand finished, extract labels
          const { currentHighestBid, bidWinnerSeat, partnerSeat, isSolo: soloStatus, handPoints } = record.payload;
          
          bidWinner = bidWinnerSeat;
          partner = partnerSeat;
          isSolo = soloStatus;

          const biddingPoints = handPoints[bidWinner] + (isSolo ? 0 : (partner !== null ? handPoints[partner] : 0));
          biddingSucceeded = biddingPoints >= currentHighestBid;

          // Process the bids for this round
          for (const bidRecord of tempBids) {
            biddingExamples.push({
              hand: bidRecord.hand,
              currentHighestBid: bidRecord.currentHighestBid,
              seat: bidRecord.seat,
              bidPlaced: bidRecord.bid,
              isBiddingTeam: bidRecord.seat === bidWinner || (partner !== null && bidRecord.seat === partner),
              outcomeSuccess: biddingSucceeded
            });
          }

          // Process declarations
          for (const decRecord of tempDeclares) {
            declarationExamples.push({
              hand: decRecord.hand,
              seat: decRecord.seat,
              declaredPartnerCard: decRecord.partnerCard,
              declaredTrumpSuit: decRecord.trumpSuit,
              outcomeSuccess: biddingSucceeded
            });
          }

          // Process trick plays
          for (const playRecord of tempPlays) {
            const isPlayerBiddingSide = playRecord.seat === bidWinner || (partner !== null && playRecord.seat === partner);
            playExamples.push({
              hand: playRecord.handBefore,
              currentTrick: playRecord.currentTrick,
              trumpSuit: playRecord.trumpSuit,
              partnerCard: playRecord.partnerCard,
              isPartnerRevealed: playRecord.partnerSeat !== null,
              isBiddingSide: isPlayerBiddingSide,
              cardPlayed: playRecord.cardPlayed,
              outcomeSuccess: isPlayerBiddingSide ? biddingSucceeded : !biddingSucceeded
            });
          }

          // Reset temp store for next round
          tempBids.length = 0;
          tempPlays.length = 0;
          tempDeclares.length = 0;
        }
      } catch (err) {
        console.error(`Error parsing telemetry line in ${file}:`, err.message);
      }
    }
  }

  const dataset = {
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceFilesAnalyzed: files.length,
      totalMatches,
      totalHands,
      counts: {
        bidding: biddingExamples.length,
        declaration: declarationExamples.length,
        play: playExamples.length
      }
    },
    bidding: biddingExamples,
    declaration: declarationExamples,
    play: playExamples
  };

  fs.writeFileSync(DATASET_FILE, JSON.stringify(dataset, null, 2));

  console.log('\n=======================================');
  console.log('       ML LOG ANALYSIS COMPLETE        ');
  console.log('=======================================');
  console.log(`Source Log Files:     ${files.length}`);
  console.log(`Total Matches:        ${totalMatches}`);
  console.log(`Total Hands Played:   ${totalHands}`);
  console.log(`Bidding Actions:      ${biddingExamples.length}`);
  console.log(`Declarations:         ${declarationExamples.length}`);
  console.log(`Trick Card Decisions: ${playExamples.length}`);
  console.log(`Dataset Saved to:     ${DATASET_FILE}`);
  console.log('=======================================\n');
}

runAnalyzer();
