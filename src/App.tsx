import { AppProvider, useApp } from './context'
import Sidebar from './components/Sidebar'
import Login from './views/Login'
import MainPOS from './views/MainPOS'
import PedidoView from './views/Pedido'
import ExtrasView from './views/Extras'
import HistorialView from './views/Historial'
import ColaPView from './views/ColaP'
import Dashboard from './views/Dashboard'
import Usuarios from './views/Usuarios'
import Productos from './views/Productos'
import Inventario from './views/Inventario'
import Reportes from './views/Reportes'
import Configuracion from './views/Configuracion'
import Auditoria from './views/Auditoria'
import CorteCaja from './views/CorteCaja'

function AppContent() {
  const { currentUser, view } = useApp()

  if (!currentUser) return <Login />

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0c0c10' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'hidden' }} className="animate-fade-in" key={view}>
        {view === 'main' && <MainPOS />}
        {view === 'pedido' && <PedidoView />}
        {view === 'extras' && <ExtrasView />}
        {view === 'historial' && <HistorialView />}
        {view === 'cola' && <ColaPView />}
        {view === 'dashboard' && <Dashboard />}
        {view === 'usuarios' && <Usuarios />}
        {view === 'productos' && <Productos />}
        {view === 'inventario' && <Inventario />}
        {view === 'reportes' && <Reportes />}
        {view === 'configuracion' && <Configuracion />}
        {view === 'auditoria' && <Auditoria />}
        {view === 'corte' && <CorteCaja />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
