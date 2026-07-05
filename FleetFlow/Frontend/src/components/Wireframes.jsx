import { useState } from 'react'

/* ── Reusable SVG primitives ── */
const R = ({ x, y, w, h, fill = '#1e293b', stroke = '#475569', r = 4 }) => (
  <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth="1" rx={r} />
)
const T = ({ x, y, size = 11, color = '#94a3b8', bold = false, children, anchor = 'start' }) => (
  <text x={x} y={y} fontSize={size} fill={color} fontWeight={bold ? '700' : '400'}
    fontFamily="system-ui,sans-serif" textAnchor={anchor}>{children}</text>
)
const Btn = ({ x, y, w = 80, h = 22, label, color = '#6366f1' }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill={color} rx={5} />
    <text x={x + w / 2} y={y + 14} fontSize={10} fill="#fff" textAnchor="middle"
      fontFamily="system-ui,sans-serif" fontWeight="600">{label}</text>
  </g>
)
const Input = ({ x, y, w = 200, label }) => (
  <g>
    <text x={x} y={y - 4} fontSize={10} fill="#94a3b8" fontFamily="system-ui,sans-serif">{label}</text>
    <rect x={x} y={y} width={w} height={24} fill="#0f172a" stroke="#334155" strokeWidth="1" rx={4} />
  </g>
)
const Badge = ({ x, y, label, color }) => (
  <g>
    <rect x={x} y={y} width={label.length * 7 + 12} height={18} fill={color + '22'} rx={9} />
    <text x={x + 6} y={y + 12} fontSize={9} fill={color} fontFamily="system-ui,sans-serif" fontWeight="600">{label}</text>
  </g>
)
const Divider = ({ x, y, w }) => <line x1={x} y1={y} x2={x + w} y2={y} stroke="#334155" strokeWidth="1" />

/* ── Sidebar shared component ── */
function Sidebar({ active }) {
  const items = [
    { id: 'dashboard', icon: '▦', label: 'Dashboard' },
    { id: 'vehicles',  icon: '⬡', label: 'Vehicles'  },
    { id: 'drivers',   icon: '◉', label: 'Drivers'   },
  ]
  return (
    <g>
      <R x={0} y={0} w={130} h={420} fill="#1e293b" stroke="#334155" r={0} />
      {/* Brand */}
      <T x={14} y={28} size={13} color="#f1f5f9" bold>🚚 FleetFlow</T>
      <Divider x={0} y={40} w={130} />
      {/* Nav items */}
      {items.map((item, i) => {
        const isActive = item.id === active
        return (
          <g key={item.id}>
            {isActive && <R x={8} y={52 + i * 36} w={114} h={28} fill="#6366f1" stroke="none" r={6} />}
            <T x={22} y={70 + i * 36} size={11} color={isActive ? '#fff' : '#94a3b8'}>
              {item.icon}  {item.label}
            </T>
          </g>
        )
      })}
      {/* Logout */}
      <R x={8} y={380} w={114} h={26} fill="none" stroke="#334155" r={6} />
      <T x={22} y={397} size={10} color="#64748b">🚪  Logout</T>
    </g>
  )
}

/* ── Topbar ── */
function Topbar({ title, subtitle, x = 130 }) {
  return (
    <g>
      <R x={x} y={0} w={670} h={52} fill="#0f172a" stroke="#334155" r={0} />
      <T x={x + 20} y={22} size={14} color="#f1f5f9" bold>{title}</T>
      <T x={x + 20} y={38} size={10} color="#64748b">{subtitle}</T>
    </g>
  )
}

/* ══════════════════════════════════════════
   WIREFRAME 1 — Login
══════════════════════════════════════════ */
function WF_Login() {
  return (
    <svg viewBox="0 0 800 420" className="wf-svg">
      {/* bg */}
      <rect width="800" height="420" fill="#0f172a" />
      {/* card */}
      <R x={280} y={60} w={240} h={300} fill="#1e293b" stroke="#334155" r={12} />
      {/* brand */}
      <T x={400} y={100} size={20} color="#f1f5f9" bold anchor="middle">🚚 FleetFlow</T>
      <T x={400} y={118} size={10} color="#94a3b8" anchor="middle">Sign in to your account</T>
      <Divider x={296} y={128} w={208} />
      {/* fields */}
      <Input x={296} y={148} w={208} label="Email" />
      <Input x={296} y={196} w={208} label="Password" />
      {/* button */}
      <Btn x={296} y={238} w={208} h={28} label="Sign In" />
      {/* annotations */}
      <T x={30}  y={160} size={10} color="#6366f1">① Email field</T>
      <line x1={110} y1={158} x2={290} y2={162} stroke="#6366f1" strokeWidth="1" strokeDasharray="4,3" />
      <T x={30}  y={210} size={10} color="#6366f1">② Password field</T>
      <line x1={120} y1={208} x2={290} y2={210} stroke="#6366f1" strokeWidth="1" strokeDasharray="4,3" />
      <T x={560} y={255} size={10} color="#6366f1">③ Submit button</T>
      <line x1={558} y1={253} x2={510} y2={253} stroke="#6366f1" strokeWidth="1" strokeDasharray="4,3" />
      {/* label */}
      <T x={400} y={400} size={11} color="#475569" anchor="middle">WIREFRAME 1 — Login Page</T>
    </svg>
  )
}

/* ══════════════════════════════════════════
   WIREFRAME 2 — Dashboard
══════════════════════════════════════════ */
function WF_Dashboard() {
  const cards = [
    { label: 'Total Vehicles',  val: '24', color: '#6366f1' },
    { label: 'Available',       val: '18', color: '#22c55e' },
    { label: 'Active Drivers',  val: '6',  color: '#f59e0b' },
    { label: 'Shipments',       val: '42', color: '#3b82f6' },
    { label: 'Pending',         val: '8',  color: '#8b5cf6' },
    { label: 'In Transit',      val: '6',  color: '#06b6d4' },
    { label: 'Delivered',       val: '28', color: '#10b981' },
  ]
  return (
    <svg viewBox="0 0 800 420" className="wf-svg">
      <rect width="800" height="420" fill="#0f172a" />
      <Sidebar active="dashboard" />
      <Topbar title="Fleet Dashboard" subtitle="Live overview of your fleet operations" />
      {/* stat cards — row 1 (4) */}
      {cards.slice(0, 4).map((c, i) => (
        <g key={i}>
          <R x={148 + i * 130} y={68} w={118} h={64} fill="#1e293b" stroke="#334155" r={8} />
          <rect x={154} y={74} width={28} height={28} fill={c.color + '22'} rx={6} />
          <T x={168} y={93} size={14} color={c.color} anchor="middle">◈</T>
          <T x={190} y={88} size={16} color={c.color} bold>{c.val}</T>
          <T x={190} y={102} size={9} color="#94a3b8">{c.label}</T>
        </g>
      ))}
      {/* stat cards — row 2 (3) */}
      {cards.slice(4).map((c, i) => (
        <g key={i}>
          <R x={148 + i * 130} y={144} w={118} h={64} fill="#1e293b" stroke="#334155" r={8} />
          <rect x={154} y={150} width={28} height={28} fill={c.color + '22'} rx={6} />
          <T x={168} y={169} size={14} color={c.color} anchor="middle">◈</T>
          <T x={190} y={164} size={16} color={c.color} bold>{c.val}</T>
          <T x={190} y={178} size={9} color="#94a3b8">{c.label}</T>
        </g>
      ))}
      {/* annotations */}
      <T x={148} y={240} size={10} color="#6366f1">① Stat cards — live counts from API</T>
      <T x={148} y={256} size={10} color="#6366f1">② Each card color-coded by category</T>
      <T x={148} y={272} size={10} color="#6366f1">③ Sidebar nav — active state highlighted</T>
      <T x={400} y={410} size={11} color="#475569" anchor="middle">WIREFRAME 2 — Dashboard</T>
    </svg>
  )
}

/* ══════════════════════════════════════════
   WIREFRAME 3 — Vehicle Registration
══════════════════════════════════════════ */
function WF_Vehicles() {
  const rows = [
    { plate: 'TN-01-AB-1234', model: 'Tata Ace',    cap: '1000 kg', avail: true  },
    { plate: 'MH-02-CD-5678', model: 'Ashok Leyland', cap: '5000 kg', avail: false },
    { plate: 'KA-03-EF-9012', model: 'Eicher Pro',  cap: '3000 kg', avail: true  },
  ]
  return (
    <svg viewBox="0 0 800 420" className="wf-svg">
      <rect width="800" height="420" fill="#0f172a" />
      <Sidebar active="vehicles" />
      <Topbar title="Vehicles" subtitle="Manage your fleet vehicles" />
      {/* Add button */}
      <Btn x={680} y={14} w={100} h={26} label="+ Add Vehicle" />
      {/* Table */}
      <R x={140} y={62} w={648} h={24} fill="#0f172a" stroke="#334155" r={0} />
      {['#','Plate Number','Model','Capacity','Status','Actions'].map((h, i) => {
        const xs = [148, 172, 290, 390, 470, 560]
        return <T key={i} x={xs[i]} y={78} size={9} color="#64748b" bold>{h}</T>
      })}
      {rows.map((r, i) => (
        <g key={i}>
          <R x={140} y={86 + i * 40} w={648} h={40} fill={i % 2 === 0 ? '#1e293b' : '#172032'} stroke="#334155" r={0} />
          <T x={148} y={110 + i * 40} size={10} color="#94a3b8">{i + 1}</T>
          <R x={168} y={96 + i * 40} w={90} h={18} fill="#0f172a" stroke="#334155" r={4} />
          <T x={172} y={109 + i * 40} size={9} color="#e2e8f0">{r.plate}</T>
          <T x={290} y={110 + i * 40} size={10} color="#cbd5e1">{r.model}</T>
          <T x={390} y={110 + i * 40} size={10} color="#cbd5e1">{r.cap}</T>
          <Badge x={468} y={98 + i * 40} label={r.avail ? 'Available' : 'In Use'} color={r.avail ? '#22c55e' : '#ef4444'} />
          <Btn x={558} y={97 + i * 40} w={36} h={18} label="Edit"   color="#1d4ed8" />
          <Btn x={600} y={97 + i * 40} w={42} h={18} label="Delete" color="#dc2626" />
        </g>
      ))}
      {/* Modal ghost */}
      <R x={490} y={210} w={240} h={180} fill="#1e293b" stroke="#6366f1" r={10} />
      <T x={500} y={230} size={11} color="#f1f5f9" bold>Add Vehicle</T>
      <Divider x={490} y={236} w={240} />
      <Input x={500} y={250} w={220} label="Plate Number" />
      <Input x={500} y={290} w={220} label="Model" />
      <Input x={500} y={330} w={220} label="Capacity (kg)" />
      <Btn x={620} y={368} w={100} h={22} label="Add Vehicle" />
      {/* annotations */}
      <T x={148} y={310} size={10} color="#6366f1">① Table with Edit / Delete per row</T>
      <T x={148} y={326} size={10} color="#6366f1">② Modal form slides in on "+ Add"</T>
      <T x={148} y={342} size={10} color="#6366f1">③ Status badge — green / red</T>
      <T x={400} y={410} size={11} color="#475569" anchor="middle">WIREFRAME 3 — Vehicle Registration</T>
    </svg>
  )
}

/* ══════════════════════════════════════════
   WIREFRAME 4 — Driver Management
══════════════════════════════════════════ */
function WF_Drivers() {
  const rows = [
    { name: 'Ravi Kumar',   email: 'ravi@fleet.com',  phone: '+91 98765 43210', lic: 'TN-01-2024-001', avail: true  },
    { name: 'Suresh Babu',  email: 'suresh@fleet.com', phone: '+91 87654 32109', lic: 'MH-02-2023-045', avail: false },
    { name: 'Arjun Singh',  email: 'arjun@fleet.com',  phone: '+91 76543 21098', lic: 'KA-03-2022-078', avail: true  },
  ]
  return (
    <svg viewBox="0 0 800 420" className="wf-svg">
      <rect width="800" height="420" fill="#0f172a" />
      <Sidebar active="drivers" />
      <Topbar title="Drivers" subtitle="Manage your fleet drivers" />
      {/* Add button */}
      <Btn x={682} y={14} w={96} h={26} label="+ Add Driver" />
      {/* Table header */}
      <R x={140} y={62} w={648} h={24} fill="#0f172a" stroke="#334155" r={0} />
      {['#','Name','Email','Phone','License','Status','Actions'].map((h, i) => {
        const xs = [148, 172, 278, 378, 456, 546, 618]
        return <T key={i} x={xs[i]} y={78} size={9} color="#64748b" bold>{h}</T>
      })}
      {rows.map((r, i) => (
        <g key={i}>
          <R x={140} y={86 + i * 42} w={648} h={42} fill={i % 2 === 0 ? '#1e293b' : '#172032'} stroke="#334155" r={0} />
          <T x={148} y={112 + i * 42} size={10} color="#94a3b8">{i + 1}</T>
          {/* avatar */}
          <circle cx={182} cy={108 + i * 42} r={10} fill="#6366f122" />
          <T x={182} y={112 + i * 42} size={10} color="#6366f1" anchor="middle">{r.name[0]}</T>
          <T x={196} y={112 + i * 42} size={10} color="#cbd5e1">{r.name}</T>
          <T x={278} y={112 + i * 42} size={9}  color="#94a3b8">{r.email}</T>
          <T x={378} y={112 + i * 42} size={9}  color="#94a3b8">{r.phone}</T>
          <R x={452} y={98 + i * 42} w={80} h={18} fill="#0f172a" stroke="#334155" r={4} />
          <T x={456} y={111 + i * 42} size={8} color="#e2e8f0">{r.lic}</T>
          <Badge x={544} y={99 + i * 42} label={r.avail ? 'Available' : 'On Trip'} color={r.avail ? '#22c55e' : '#f59e0b'} />
          <Btn x={616} y={98 + i * 42} w={34} h={18} label="Edit"   color="#1d4ed8" />
          <Btn x={656} y={98 + i * 42} w={40} h={18} label="Delete" color="#dc2626" />
        </g>
      ))}
      {/* annotations */}
      <T x={148} y={226} size={10} color="#6366f1">① Avatar initial + name column</T>
      <T x={148} y={242} size={10} color="#6366f1">② License badge — monospace style</T>
      <T x={148} y={258} size={10} color="#6366f1">③ Status: Available (green) / On Trip (amber)</T>
      <T x={148} y={274} size={10} color="#6366f1">④ Edit opens pre-filled modal form</T>
      <T x={400} y={410} size={11} color="#475569" anchor="middle">WIREFRAME 4 — Driver Management</T>
    </svg>
  )
}

/* ══════════════════════════════════════════
   Main Wireframe Viewer
══════════════════════════════════════════ */
const SCREENS = [
  { id: 'login',     label: '① Login',               component: WF_Login     },
  { id: 'dashboard', label: '② Dashboard',            component: WF_Dashboard },
  { id: 'vehicles',  label: '③ Vehicle Registration', component: WF_Vehicles  },
  { id: 'drivers',   label: '④ Driver Management',    component: WF_Drivers   },
]

export default function Wireframes() {
  const [active, setActive] = useState('login')
  const Screen = SCREENS.find((s) => s.id === active).component

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>UI Wireframes</h2>
          <p>Annotated wireframes for all 4 screens</p>
        </div>
      </div>

      <div className="wf-tabs">
        {SCREENS.map((s) => (
          <button
            key={s.id}
            className={`wf-tab ${active === s.id ? 'active' : ''}`}
            onClick={() => setActive(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="wf-canvas">
        <Screen />
      </div>

      <div className="wf-legend">
        <span className="wf-legend-dot" />
        <span>Dashed lines = annotations &nbsp;|&nbsp; Purple highlight = active/selected state &nbsp;|&nbsp; All values are representative placeholders</span>
      </div>
    </div>
  )
}
