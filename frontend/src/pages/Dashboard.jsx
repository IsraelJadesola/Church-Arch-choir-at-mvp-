import { useEffect, useState } from 'react'
import EventCard from '../components/EventCard'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { songs, announcements } from '../lib/mockData'

export default function Dashboard() {
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const news = announcements[0]

  useEffect(() => {
    api('/events')
      .then((d) => setEvent(d.events[0] || null))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Hello, {user.name} 👋
        <span className="block text-sm font-normal text-slate-500">
          Voice part: {user.voicePart}
        </span>
      </h1>

      <section>
        <h2 className="mb-2 font-semibold text-slate-700">Next event</h2>
        {loading && <p className="text-slate-500">Loading...</p>}
        {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        {!loading && !error && !event && <p className="text-slate-500">No upcoming events yet.</p>}
        {event && <EventCard event={event} />}
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-slate-700">This week's practice</h2>
        <div className="space-y-2">
          {songs.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
              <div>
                <p className="font-medium text-slate-900">{s.title}</p>
                <p className="text-xs text-slate-500">Key of {s.key} · {s.status}</p>
              </div>
              <a
                href={s.materials[user.voicePart]}
                className="rounded-lg bg-indigo-600 px-3 py-1 text-sm text-white"
              >
                ▶ {user.voicePart}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-indigo-50 p-4">
        <h2 className="font-semibold text-indigo-900">📢 {news.title}</h2>
        <p className="text-sm text-indigo-800">{news.body}</p>
      </section>
    </div>
  )
}