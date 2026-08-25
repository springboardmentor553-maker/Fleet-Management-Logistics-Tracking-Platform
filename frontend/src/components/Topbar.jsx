import { Search, Sun, Moon } from 'lucide-react'
import NotificationDropdown from './NotificationDropdown'
import ProfileDropdown from './ProfileDropdown'

// The app-wide top bar: global search, dark mode toggle, notifications, profile.
// Sits inside <main>, to the right of the sidebar, and stays sticky on scroll (see App.css).
export default function Topbar({
  search, setSearch, darkMode, setDarkMode,
  shipments, trips, maintenanceAlerts, onMaintenanceAlertRead,
}) {
  return (
    <div className="ff-topbar">
      <div className="ff-search">
        <span className="ff-search-icon"><Search size={15} /></span>
        <input
          placeholder="Search vehicles, drivers, shipments..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="ff-topbar-actions">
        <button
          type="button"
          className="ff-icon-btn"
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle dark mode"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <NotificationDropdown
          shipments={shipments}
          trips={trips}
          maintenanceAlerts={maintenanceAlerts}
          onMaintenanceAlertRead={onMaintenanceAlertRead}
        />
        <ProfileDropdown />
      </div>
    </div>
  )
}
