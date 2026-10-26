import { useState } from 'react'
import { api } from '../lib/api'

export default function RSVPButton({ eventId, initialStatus }) {
  const [status, setStatus] = useState(initialStatus)
  const [error, setError] = useState('')

  const choose = async (value) => {
    const previous = status
    setStatus(value)
    setError('')
    try {
      await api(`/events/${eventId}/rsvp`, { method: 'POST', body: { status: value } })
    } catch (err) {
      setStatus(previous)
      setError(err.message)
    }
  }

  const base = 'flex-1 rounded-lg py-2 text-sm font-semibold transition'
  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={() => choose('yes')}
          className={`${base} ${status === 'yes' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'}`}
        >
          ✓ Attending
        </button>
        <button
          onClick={() => choose('no')}
          className={`${base} ${status === 'no' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}
        >
          ✕ Can't make it
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}