const brain = require('brain.js')

const EMOJIS = ['🎬', '🍕', '🌙', '🎮', '🍿', '🎉', '🍦', '🎲', '📺', '🎤']

/** Encode a plan's activities as a fixed-length binary feature vector (one bit per emoji). */
function encodePlan(activities) {
  const vector = new Array(EMOJIS.length).fill(0)
  for (const activity of activities) {
    const idx = EMOJIS.indexOf(activity.emoji)
    if (idx >= 0) vector[idx] = 1
  }
  return vector
}

/** Return the most-recently-used activity details for a given emoji across historical plans. */
function lookupActivity(emoji, historicalPlans) {
  for (let i = historicalPlans.length - 1; i >= 0; i--) {
    const match = historicalPlans[i].activities.find(a => a.emoji === emoji)
    if (match) return { emoji, title: match.title, time: match.time, description: match.description }
  }
  return { emoji, title: emoji, time: '7:00 PM', description: '' }
}

/** Parse a time string like "7:00 PM" into total minutes from midnight. */
function parseMinutes(timeStr) {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return 0
  let [, h, m, meridiem] = match
  h = parseInt(h, 10)
  m = parseInt(m, 10)
  if (meridiem.toUpperCase() === 'PM' && h !== 12) h += 12
  if (meridiem.toUpperCase() === 'AM' && h === 12) h = 0
  return h * 60 + m
}

/**
 * Train an LSTM time-step network on historical Friday night plans and predict the next one.
 * Requires at least 2 saved plans to produce a prediction.
 */
function predictNextFriday(historicalPlans) {
  if (historicalPlans.length < 2) {
    return {
      prediction: null,
      message: 'Save at least 2 Friday night plans to enable predictions.',
    }
  }

  const encoded = historicalPlans.map(p => encodePlan(p.activities))

  const net = new brain.recurrent.LSTMTimeStep({
    inputSize: EMOJIS.length,
    hiddenLayers: [EMOJIS.length],
    outputSize: EMOJIS.length,
  })

  // Train on the full sequence of past Friday plans (fewer iterations to keep response snappy)
  net.train([encoded], {
    iterations: 300,
    errorThresh: 0.01,
    log: false,
  })

  // Predict the next step from the complete history
  const outputVector = net.run(encoded)

  // Threshold at 0.4; fall back to top 3 scored emojis if nothing clears the bar
  const THRESHOLD = 0.4
  let predictedEmojis = EMOJIS.filter((_, i) => outputVector[i] >= THRESHOLD)
  if (predictedEmojis.length === 0) {
    predictedEmojis = EMOJIS
      .map((e, i) => ({ emoji: e, score: outputVector[i] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(x => x.emoji)
  }

  // Build activity objects using historical data for titles/times
  const activities = predictedEmojis
    .map(emoji => lookupActivity(emoji, historicalPlans))
    .sort((a, b) => parseMinutes(a.time) - parseMinutes(b.time))

  return {
    prediction: activities,
    message: `Predicted from ${historicalPlans.length} past Friday night${historicalPlans.length !== 1 ? 's' : ''}`,
  }
}

module.exports = { predictNextFriday }
