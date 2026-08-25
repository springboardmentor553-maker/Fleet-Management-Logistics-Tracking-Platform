export const CATEGORY_LABELS = {
  oil_change: 'Oil Change',
  tyre_replacement: 'Tyre Replacement',
  brake_service: 'Brake Service',
  engine_service: 'Engine Service',
  general_inspection: 'General Inspection',
}

const DUE_SOON_WINDOW_DAYS = 7

// Derives a display category from the record's actual status + next_service_date,
// since "Due Soon" / "Overdue" / "Upcoming" are date-driven, not stored status values.
export function getDisplayCategory(record) {
  if (record.status === 'completed') return 'completed'
  if (record.status === 'cancelled') return 'cancelled'

  if (!record.next_service_date) return 'upcoming'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nextDate = new Date(record.next_service_date)
  nextDate.setHours(0, 0, 0, 0)

  const diffDays = Math.round((nextDate - today) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'overdue'
  if (diffDays <= DUE_SOON_WINDOW_DAYS) return 'due_soon'
  return 'upcoming'
}

export const CATEGORY_BADGE = {
  overdue: { label: 'Overdue', className: 'status-cancelled' },
  due_soon: { label: 'Due Soon', className: 'status-delayed' },
  upcoming: { label: 'Upcoming', className: 'status-assigned' },
  completed: { label: 'Completed', className: 'status-delivered' },
  cancelled: { label: 'Cancelled', className: 'status-cancelled' },
}