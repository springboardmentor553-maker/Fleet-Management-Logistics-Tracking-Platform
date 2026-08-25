import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'

const toISO = (date) => {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const fromISO = (str) => {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export default function AppDatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  disabled = false,
}) {
  return (
    <div className="ff-datepicker-wrap">
      <Calendar size={14} className="ff-datepicker-icon" />
      <DatePicker
        selected={fromISO(value)}
        onChange={(date) => onChange(toISO(date))}
        dateFormat="dd MMM yyyy"
        placeholderText={placeholder}
        minDate={minDate ? fromISO(minDate) : undefined}
        maxDate={maxDate ? fromISO(maxDate) : undefined}
        disabled={disabled}
        className="ff-datepicker-input"
        calendarClassName="ff-datepicker-calendar"
        popperPlacement="bottom-start"
        showPopperArrow={false}
        todayButton="Today"
      />
    </div>
  )
}
