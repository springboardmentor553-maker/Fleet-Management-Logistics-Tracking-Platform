import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'

export default function RowMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <MoreVertical
        size={16}
        style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
        onClick={() => setOpen(!open)}
      />
      {open && (
        <div className="ff-row-menu">
          <div className="ff-row-menu-item" onClick={() => { onEdit(); setOpen(false) }}>
            <Pencil size={13} /> Edit
          </div>
          <div className="ff-row-menu-item danger" onClick={() => { onDelete(); setOpen(false) }}>
            <Trash2 size={13} /> Delete
          </div>
        </div>
      )}
    </div>
  )
}