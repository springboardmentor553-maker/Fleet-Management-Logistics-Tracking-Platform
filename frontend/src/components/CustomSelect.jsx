import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export default function CustomSelect({ value, onChange, options = [], statusPill = false, placeholder = 'Select' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = options.find(o => o.value === value)

  const handleSelect = (optionValue) => {
    onChange(optionValue)
    setOpen(false)
  }

  return (
    <div
      className={`ff-custom-select ${statusPill ? `status-pill status-${value}` : ''} ${open ? 'open' : ''}`}
      ref={ref}
    >
      <button
        type="button"
        className="ff-custom-select-trigger"
        onClick={() => setOpen(o => !o)}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} className={`ff-custom-select-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <ul className="ff-custom-select-list">
          {options.map(opt => (
            <li
              key={opt.value}
              className={`ff-custom-select-option ${opt.value === value ? 'selected' : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check size={14} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
