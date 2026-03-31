const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, 'friday_plans.db'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS friday_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    friday_date TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS plan_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL REFERENCES friday_plans(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    emoji TEXT NOT NULL,
    title TEXT NOT NULL,
    time TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_plan_activities_plan_id ON plan_activities(plan_id);
  CREATE INDEX IF NOT EXISTS idx_friday_plans_date ON friday_plans(friday_date);
`)

const stmtGetPlan = db.prepare('SELECT * FROM friday_plans WHERE id = ?')
const stmtGetActivities = db.prepare(
  'SELECT * FROM plan_activities WHERE plan_id = ? ORDER BY position ASC'
)

function getPlan(id) {
  const plan = stmtGetPlan.get(id)
  if (!plan) return null
  return { ...plan, activities: stmtGetActivities.all(id) }
}

function getPlans(order = 'ASC') {
  const dir = order === 'DESC' ? 'DESC' : 'ASC'
  const plans = db.prepare(`SELECT * FROM friday_plans ORDER BY friday_date ${dir}`).all()
  return plans.map(plan => ({ ...plan, activities: stmtGetActivities.all(plan.id) }))
}

function savePlan(fridayDate, activities) {
  return db.transaction(() => {
    const existing = db.prepare('SELECT id FROM friday_plans WHERE friday_date = ?').get(fridayDate)
    let planId

    if (existing) {
      planId = existing.id
      db.prepare('DELETE FROM plan_activities WHERE plan_id = ?').run(planId)
    } else {
      const result = db.prepare('INSERT INTO friday_plans (friday_date) VALUES (?)').run(fridayDate)
      planId = result.lastInsertRowid
    }

    const insertActivity = db.prepare(
      'INSERT INTO plan_activities (plan_id, position, emoji, title, time, description) VALUES (?, ?, ?, ?, ?, ?)'
    )
    activities.forEach((act, i) => {
      insertActivity.run(planId, i, act.emoji, act.title, act.time, act.description || '')
    })

    return getPlan(planId)
  })()
}

module.exports = { getPlans, savePlan }
