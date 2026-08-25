import { Inbox } from 'lucide-react'

export default function EmptyState({
  title = 'Nothing here yet',
  description = 'Data will appear here as your fleet starts moving.',
  action,
  icon: Icon = Inbox,
}) {
  return (
    <div className="ff-empty-state">
      <div className="ff-empty-state-icon"><Icon size={19} /></div>
      <div className="ff-empty-state-title">{title}</div>
      <div className="ff-empty-state-copy">{description}</div>
      {action}
    </div>
  )
}
