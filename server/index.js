const { getPlans, savePlan } = require('./db')
const { predictNextFriday } = require('./predict')

/** Return true if the given YYYY-MM-DD string falls on a Friday. */
function isFriday(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).getDay() === 5
}

const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }))
app.use(express.json())

/** GET /api/plans — return all historical Friday night plans, newest first. */
app.get('/api/plans', async (req, res) => {
  try {
    res.json(await getPlans('DESC'))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /api/plans — save (or overwrite) the plan for a given Friday date. */
app.post('/api/plans', async (req, res) => {
  const { fridayDate, activities } = req.body
  if (!fridayDate || !Array.isArray(activities) || activities.length === 0) {
    return res.status(400).json({ error: 'fridayDate and a non-empty activities array are required.' })
  }
  if (!isFriday(fridayDate)) {
    return res.status(400).json({ error: `${fridayDate} is not a Friday.` })
  }
  try {
    const plan = await savePlan(fridayDate, activities)
    res.status(201).json(plan)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/predict — run LSTM on historical data and return a predicted next-Friday plan. */
app.get('/api/predict', async (req, res) => {
  try {
    // Prediction needs chronological (oldest-first) order for correct sequence training
    const plans = await getPlans('ASC')
    const result = predictNextFriday(plans)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🌙 Friday Night server running on http://localhost:${PORT}`)
})
