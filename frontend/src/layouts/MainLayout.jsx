import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

export default function MainLayout() {
  return (
    <div className="main-layout">
      <aside className="main-layout__sidebar">
        <Sidebar />
      </aside>

      <div className="main-layout__content">
        <header className="main-layout__navbar">
          <Navbar />
        </header>

        <main className="main-layout__page" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}