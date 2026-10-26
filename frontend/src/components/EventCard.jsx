import RSVPButton from './RSVPButton'

const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  })

export default function EventCard({ event }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
        {event.type}
      </span>
      <h3 className="mt-1 text-lg font-bold text-slate-900">{event.title}</h3>
      <p className="text-sm text-slate-600">{formatDate(event.startsAt)}</p>
      {event.venue && <p className="text-sm text-slate-600">📍 {event.venue}</p>}
      {event.notes && (
        <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">{event.notes}</p>
      )}
      <div className="mt-3">
        <RSVPButton eventId={event.id} initialStatus={event.myStatus} />
      </div>
    </div>
  )
}