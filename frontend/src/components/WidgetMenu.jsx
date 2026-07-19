import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreVertical, ExternalLink } from 'lucide-react'

export default function WidgetMenu({ viewAllPath }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <span className="ff-widget-more" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        <MoreVertical size={15} />
      </span>
      {open && (
        <div className="ff-row-menu" style={{ minWidth: 150 }}>
          <div className="ff-row-menu-item" onClick={() => { navigate(viewAllPath); setOpen(false) }}>
            <ExternalLink size={13} /> View All
          </div>
        </div>
      )}
    </div>
  )
}
