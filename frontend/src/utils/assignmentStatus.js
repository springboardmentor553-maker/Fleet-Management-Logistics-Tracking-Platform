export const ASSIGNMENT_STATUS_BADGE = {
  assigned: { label: 'Assigned', className: 'status-assigned' },
  completed: { label: 'Completed', className: 'status-delivered' },
  cancelled: { label: 'Cancelled', className: 'status-cancelled' },
}

export const ATTENDANCE_STATUS_BADGE = {
  present: { label: 'Present', className: 'status-delivered' },
  absent: { label: 'Absent', className: 'status-cancelled' },
  leave: { label: 'Leave', className: 'status-delayed' },
}

export const ATTENDANCE_STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'leave', label: 'Leave' },
]

export const ASSIGNMENT_STATUS_OPTIONS = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]