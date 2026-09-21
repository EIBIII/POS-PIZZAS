import { useEffect } from 'react'
import Icon from './Icon'
import { useApp, type View } from '../context'
import { VIEW_PERMISSION_KEY } from '../types'

interface NavItem { id: View; label: string; icon: string; section: string }

const NAV: NavItem[] = [
  { id: 'main', label: 'Principal', icon: 'home', section: 'Caja' },
  { id: 'pedido', label: 'Pedido', icon: 'clipboard', section: 'Caja' },
  { id: 'extras', label: 'Extras', icon: 'shoppingBag', section: 'Caja' },
  { id: 'historial', label: 'Historial', icon: 'history', section: 'Caja' },
  { id: 'cola', label: 'Cola de Pedidos', icon: 'chefHat', section: 'Caja' },
  { id: 'dashboard', label: 'Dashboard', icon: 'barChart', section: 'Gestión' },
  { id: 'usuarios', label: 'Usuarios', icon: 'users', section: 'Gestión' },
  { id: 'productos', label: 'Productos', icon: 'pizza', section: 'Gestión' },
  { id: 'inventario', label: 'Inventario', icon: 'package', section: 'Gestión' },
  { id: 'reportes', label: 'Reportes', icon: 'trendingUp', section: 'Gestión' },
  { id: 'configuracion', label: 'Configuración', icon: 'settings', section: 'Sistema' },
  { id: 'auditoria', label: 'Auditoría', icon: 'search', section: 'Sistema' },
  { id: 'corte', label: 'Corte de Caja', icon: 'cashRegister', section: 'Sistema' },
]

export default function Sidebar() {
  const { currentUser, roles, hasPermission, view, setView, logout, sidebarOpen, setSidebarOpen, settings } = useApp()

  // En tablets (y pantallas angostas) arrancamos con el menú colapsado a solo íconos.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) setSidebarOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!currentUser) return null

  const role = currentUser.role
  const roleLabel = roles.find(r => r.id === role)?.label ?? role
  // Cada pestaña se filtra por el permiso real del rol (tabla editable en Usuarios > Roles y Permisos),
  // no por una lista de roles fija por ítem — así ningún rol ve pestañas que no puede usar.
  const visible = NAV.filter(item => hasPermission(VIEW_PERMISSION_KEY[item.id]))
  const sections = [...new Set(visible.map(i => i.section))]

  const initials = currentUser.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  if (!sidebarOpen) {
    return (
      <aside style={{
        width: 64, minWidth: 64, background: '#FFFFFF', borderRight: '1px solid #E4E4E7',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        height: '100vh', position: 'sticky', top: 0, zIndex: 30, padding: '14px 0',
      }}>
        <button
          onClick={() => setSidebarOpen(true)}
          title="Expandir menú"
          style={{
            width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: settings.logoUrl ? '#FFFFFF' : '#DC2626',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 18, flexShrink: 0, overflow: 'hidden',
            boxShadow: settings.logoUrl ? '0 0 0 1.5px #E4E4E7' : '0 4px 12px rgba(220,38,38,0.3)',
          }}
        >
          {settings.logoUrl
            ? <img src={settings.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Icon name="menu" size={18} color="#fff" />}
        </button>

        <nav style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%' }}>
          {visible.map(item => {
            const active = view === item.id
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                title={item.label}
                style={{
                  width: 42, height: 42, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: active ? '#FEF2F2' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F7F7F8' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <Icon name={item.icon} size={17} color={active ? '#DC2626' : '#71717A'} />
              </button>
            )
          })}
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 10, marginTop: 8, borderTop: '1px solid #E4E4E7', width: '100%' }}>
          <div title={`${currentUser.name} · ${roleLabel}`} style={{
            width: 32, height: 32, borderRadius: '50%', background: '#FBBF24', color: '#18181B',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0,
          }}>{initials}</div>
          <button onClick={logout} title="Cerrar sesión"
            style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="logout" size={14} color="#DC2626" />
          </button>
        </div>
      </aside>
    )
  }

  return (
    <>
      {/* Overlay on mobile */}
      <div
        onClick={() => setSidebarOpen(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 29, display: 'none' }}
      />
      <aside
        className="anim-slide-left"
        style={{
          width: 228, minWidth: 228,
          background: '#FFFFFF',
          borderRight: '1px solid #E4E4E7',
          display: 'flex', flexDirection: 'column',
          height: '100vh', position: 'sticky', top: 0, zIndex: 30,
        }}
      >
        {/* Logo + close */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #E4E4E7', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38,
            background: settings.logoUrl ? '#FFFFFF' : '#DC2626',
            border: settings.logoUrl ? '1px solid #E4E4E7' : 'none',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden',
          }}>
            {settings.logoUrl
              ? <img src={settings.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Icon name="pizza" size={20} color="#fff" strokeWidth={2} />}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 17, color: '#18181B', letterSpacing: '-0.01em', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{settings.name}</div>
            <div style={{ fontSize: 10, color: '#A1A1AA', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>Sistema POS</div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#A1A1AA', borderRadius: 6, display: 'flex' }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
          {sections.map((section, si) => (
            <div key={section} style={{ marginBottom: 4 }}>
              {si > 0 && <div style={{ height: 1, background: '#F4F4F5', margin: '8px 6px 10px' }} />}
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 6px', marginBottom: 4 }}>
                {section}
              </div>
              {visible.filter(i => i.section === section).map(item => {
                const active = view === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                      padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      background: active ? '#FEF2F2' : 'transparent',
                      color: active ? '#DC2626' : '#3F3F46',
                      border: 'none', fontSize: 13, fontWeight: active ? 600 : 400,
                      transition: 'all 0.12s', textAlign: 'left', marginBottom: 1,
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F7F7F8' }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <span style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}>
                      <Icon name={item.icon} size={15} color={active ? '#DC2626' : '#71717A'} />
                    </span>
                    <span>{item.label}</span>
                    {active && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#DC2626' }} />}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid #E4E4E7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#FBBF24', color: '#18181B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, flexShrink: 0,
            }}>{initials}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name.split(' ')[0]}
              </div>
              <div style={{ fontSize: 10.5, color: '#A1A1AA' }}>{roleLabel}</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%', padding: '7px', fontSize: 12, fontWeight: 600,
              background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
              borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
            onMouseLeave={e => (e.currentTarget.style.background = '#FEF2F2')}
          >
            <Icon name="logout" size={13} color="#DC2626" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
