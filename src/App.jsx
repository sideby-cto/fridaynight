import { useRef, useState } from 'react'
import './App.css'

const EMOJIS = ['🎬', '🍕', '🌙', '🎮', '🍿', '🎉', '🍦', '🎲', '📺', '🎤']

const DEFAULT_ACTIVITIES = [
  { id: 1, emoji: '🍕', title: 'Dinner', time: '6:00 PM', description: 'Enjoy a delicious dinner together' },
  { id: 2, emoji: '🎬', title: 'Movie at the Theater', time: '7:00 PM', description: 'Watch a fun movie on the big screen' },
  { id: 3, emoji: '🌙', title: 'Bedtime', time: '8:30 PM', description: 'Wind down and get ready for sleep' },
]

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

function App() {
  const [activities, setActivities] = useState(DEFAULT_ACTIVITIES)
  const [showForm, setShowForm] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const nextIdRef = useRef(DEFAULT_ACTIVITIES.length + 1)

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

      <main className="planner-main">
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
          <button className="btn-add" onClick={() => setShowForm(true)}>
            ➕ Add Activity
          </button>
        )}
      </main>

      <footer className="planner-footer">
        <p>🌟 Have an amazing Friday night! 🌟</p>
      </footer>
    </div>
  )
}

export default App
