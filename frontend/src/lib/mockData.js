export const currentUser = { name: 'Grace', voicePart: 'Alto', role: 'member' }

export const events = [
  { id: 1, type: 'Rehearsal', title: 'Thursday Rehearsal', date: 'Thu, 22 Oct · 6:00 PM',
    venue: 'Main Auditorium', notes: 'Focus on the bridge of Song 2.' },
  { id: 2, type: 'Service', title: 'Sunday Service', date: 'Sun, 25 Oct · 8:00 AM',
    venue: 'Main Auditorium', notes: 'Arrive 7:15 AM for warm-up.' },
]

export const songs = [
  { id: 1, title: 'Great Is Thy Faithfulness', key: 'G', status: 'Learning',
    materials: { Soprano: '#', Alto: '#', Tenor: '#', Bass: '#' } },
  { id: 2, title: 'How Great Thou Art', key: 'C', status: 'Ready',
    materials: { Soprano: '#', Alto: '#', Tenor: '#', Bass: '#' } },
]

export const announcements = [
  { id: 1, title: 'Robes for Sunday', body: 'Please wear the blue robes this Sunday.', date: '16 Oct' },
]

export const rsvpSummary = {
  Soprano: { yes: 8, no: 2, pending: 3 },
  Alto:    { yes: 6, no: 1, pending: 4 },
  Tenor:   { yes: 3, no: 2, pending: 2 },
  Bass:    { yes: 4, no: 1, pending: 1 },
}