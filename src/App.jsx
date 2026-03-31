import { useEffect, useRef, useState } from 'react'
import './App.css'

const EMOJIS = ['🎬', '🍕', '🌙', '🎮', '🍿', '🎉', '🍦', '🎲', '📺', '🎤']

const DEFAULT_ACTIVITIES = [
  { id: 1, emoji: '🍕', title: 'Dinner', time: '6:00 PM', description: 'Enjoy a delicious dinner together' },
  { id: 2, emoji: '🎬', title: 'Movie at the Theater', time: '7:00 PM', description: 'Watch a fun movie on the big screen' },
  { id: 3, emoji: '🌙', title: 'Bedtime', time: '8:30 PM', description: 'Wind down and get ready for sleep' },
]

/** Return the ISO date string (YYYY-MM-DD) for this week's upcoming or current Friday. */
function getThisFridayDate() {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun … 5=Fri … 6=Sat
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7
  const friday = new Date(today)
  friday.setDate(today.getDate() + daysUntilFriday)
  return friday.toISOString().split('T')[0]
}

/** Format a YYYY-MM-DD date string for display. */
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function ActivityCard({ activity, onDelete, onEdit }) {
  return (
    <div className="activity-card">
      <div className="activity-time">{activity.time}</div>
      <div className="activity-body">
        <div className="activity-emoji">{activity.emoji}</div>
        <div className="activity-info">
          <h2 className="activity-title">{activity.title}</h2>
          <p className="activity-description">{activity.description}</p>
        </div>
      </div>
      <div className="activity-actions">
        <button className="btn-icon btn-edit" onClick={() => onEdit(activity)} aria-label="Edit activity">✏️</button>
        <button className="btn-icon btn-delete" onClick={() => onDelete(activity.id)} aria-label="Remove activity">🗑️</button>
      </div>
    </div>
  )
}

function ActivityForm({ initial, onSave, onCancel }) {
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🎬')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [time, setTime] = useState(initial?.time ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !time.trim()) return
    onSave({ emoji, title: title.trim(), time: time.trim(), description: description.trim() })
  }

  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      <h3 className="form-title">{initial ? 'Edit Activity' : 'Add Activity'}</h3>
      <div className="form-row">
        <label className="form-label">Emoji</label>
        <div className="emoji-picker">
          {EMOJIS.map(e => (
            <button
              key={e}
              type="button"
              className={`emoji-option${emoji === e ? ' selected' : ''}`}
              onClick={() => setEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="form-row">
        <label className="form-label" htmlFor="act-title">Activity</label>
        <input
          id="act-title"
          className="form-input"
          type="text"
          placeholder="e.g. Movie at the Theater"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <label className="form-label" htmlFor="act-time">Time</label>
        <input
          id="act-time"
          className="form-input"
          type="text"
          placeholder="e.g. 7:00 PM"
          value={time}
          onChange={e => setTime(e.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <label className="form-label" htmlFor="act-desc">Notes</label>
        <input
          id="act-desc"
          className="form-input"
          type="text"
          placeholder="Optional notes"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary">💾 Save</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

/** Read-only view of a single saved plan used in the History tab. */
function PlanCard({ plan }) {
  return (
    <div className="plan-card">
      <div className="plan-card-date">{formatDate(plan.friday_date)}</div>
      <div className="plan-card-activities">
        {plan.activities.map((act, i) => (
          <div key={i} className="plan-card-activity">
            <span className="plan-card-time">{act.time}</span>
            <span className="plan-card-emoji">{act.emoji}</span>
            <span className="plan-card-title">{act.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function App() {
  const [activities, setActivities] = useState(DEFAULT_ACTIVITIES)
  const [showForm, setShowForm] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const nextIdRef = useRef(DEFAULT_ACTIVITIES.length + 1)

  const [activeTab, setActiveTab] = useState('tonight')
  const [history, setHistory] = useState([])
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saving' | 'saved' | 'error'
  const [prediction, setPrediction] = useState(null) // { prediction, message } | null
  const [predStatus, setPredStatus] = useState('idle') // 'idle' | 'loading' | 'ready' | 'error'

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    try {
      const res = await fetch('/api/plans')
      if (!res.ok) return
      setHistory(await res.json())
    } catch {
      // server not available; silently ignore
    }
  }

  async function savePlan() {
    if (activities.length === 0) return
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fridayDate: getThisFridayDate(), activities }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaveStatus('saved')
      await fetchHistory()
      setTimeout(() => setSaveStatus(null), 3000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  async function fetchPrediction() {
    setPredStatus('loading')
    setPrediction(null)
    try {
      const res = await fetch('/api/predict')
      if (!res.ok) throw new Error('Prediction failed')
      const data = await res.json()
      setPrediction(data)
      setPredStatus('ready')
    } catch {
      setPredStatus('error')
    }
  }

  function handleAdd(data) {
    setActivities(prev => [...prev, { id: nextIdRef.current++, ...data }])
    setShowForm(false)
  }

  function handleEdit(data) {
    setActivities(prev => prev.map(a => a.id === editingActivity.id ? { ...a, ...data } : a))
    setEditingActivity(null)
  }

  function handleDelete(id) {
    setActivities(prev => prev.filter(a => a.id !== id))
  }

  function startEdit(activity) {
    setEditingActivity(activity)
    setShowForm(false)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingActivity(null)
  }

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="planner">
      <header className="planner-header">
        <div className="header-stars">⭐ ⭐ ⭐</div>
        <h1 className="planner-title">🌙 Friday Night Plan</h1>
        <p className="planner-date">{currentDate}</p>
      </header>

      <nav className="planner-tabs" role="tablist">
        {[
          { id: 'tonight', label: '🌙 Tonight' },
          { id: 'history', label: '📚 History' },
          { id: 'prediction', label: '🔮 Predict' },
        ].map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id)
              if (tab.id === 'history') fetchHistory()
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="planner-main">

        {/* ── Tonight Tab ──────────────────────────────── */}
        {activeTab === 'tonight' && (
          <>
            {activities.length === 0 && (
              <div className="empty-state">
                <div className="empty-emoji">📋</div>
                <p>No activities yet! Add one below.</p>
              </div>
            )}

            <div className="timeline">
              {activities.map((activity, index) => (
                <div key={activity.id} className="timeline-item">
                  {index < activities.length - 1 && <div className="timeline-connector" />}
                  {editingActivity?.id === activity.id ? (
                    <ActivityForm initial={editingActivity} onSave={handleEdit} onCancel={cancelForm} />
                  ) : (
                    <ActivityCard activity={activity} onDelete={handleDelete} onEdit={startEdit} />
                  )}
                </div>
              ))}
            </div>

            {showForm && !editingActivity && (
              <div className="form-wrapper">
                <ActivityForm onSave={handleAdd} onCancel={cancelForm} />
              </div>
            )}

            {!showForm && !editingActivity && (
              <div className="tonight-actions">
                <button className="btn-add" onClick={() => setShowForm(true)}>
                  ➕ Add Activity
                </button>
                <button
                  className={`btn-save${saveStatus === 'saving' ? ' loading' : ''}`}
                  onClick={savePlan}
                  disabled={saveStatus === 'saving' || activities.length === 0}
                >
                  {saveStatus === 'saving' && '⏳ Saving…'}
                  {saveStatus === 'saved' && '✅ Saved!'}
                  {saveStatus === 'error' && '❌ Error – retry?'}
                  {!saveStatus && '💾 Save This Friday'}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── History Tab ──────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="history-view">
            {history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-emoji">📭</div>
                <p>No saved plans yet. Save this Friday&apos;s plan to start building your history!</p>
              </div>
            ) : (
              <>
                <p className="history-subtitle">{history.length} Friday night{history.length !== 1 ? 's' : ''} recorded</p>
                <div className="plan-list">
                  {history.map(plan => (
                    <PlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Prediction Tab ───────────────────────────── */}
        {activeTab === 'prediction' && (
          <div className="prediction-view">
            <div className="prediction-header">
              <p className="prediction-subtitle">
                An LSTM recurrent neural network learns from your saved Friday nights and predicts what next Friday might look like.
              </p>
              <button
                className="btn-predict"
                onClick={fetchPrediction}
                disabled={predStatus === 'loading'}
              >
                {predStatus === 'loading' ? '⏳ Training model…' : '🔮 Predict Next Friday'}
              </button>
            </div>

            {predStatus === 'error' && (
              <div className="pred-error">
                ❌ Could not generate a prediction. Make sure the server is running.
              </div>
            )}

            {prediction && (
              <div className="pred-result">
                <p className="pred-message">{prediction.message}</p>
                {prediction.prediction ? (
                  <div className="timeline pred-timeline">
                    {prediction.prediction.map((act, i) => (
                      <div key={i} className="timeline-item">
                        {i < prediction.prediction.length - 1 && <div className="timeline-connector" />}
                        <div className="activity-card pred-card">
                          <div className="activity-time">{act.time}</div>
                          <div className="activity-body">
                            <div className="activity-emoji">{act.emoji}</div>
                            <div className="activity-info">
                              <h2 className="activity-title">{act.title}</h2>
                              <p className="activity-description">{act.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-emoji">📊</div>
                    <p>{prediction.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      <footer className="planner-footer">
        <p>🌟 Have an amazing Friday night! 🌟</p>
      </footer>
    </div>
  )
}

export default App

