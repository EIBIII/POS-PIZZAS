import { useState } from 'react'
import { useApp } from '../context'
import Icon from '../components/Icon'

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin', admin: 'Admin', gerente: 'Gerente',
  cajero: 'Cajero', mesero: 'Mesero', cocinero: 'Cocinero', repartidor: 'Repartidor',
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: '#DC2626', admin: '#DC2626', gerente: '#D97706',
  cajero: '#16A34A', mesero: '#2563EB', cocinero: '#7C3AED', repartidor: '#DB2777',
}

export default function Login() {
  const { users, login } = useApp()
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [showPIN, setShowPIN] = useState(false)

  const activeUsers = users.filter(u => u.active)
  const selected = users.find(u => u.id === selectedUser)

  function selectProfile(userId: string) {
    setSelectedUser(userId)
    setPin('')
    setError('')
    setShowPIN(true)
  }

  function handleDigit(d: string) {
    if (pin.length >= 4) return
    const newPin = pin + d
    setPin(newPin)
    if (newPin.length === 4) {
      setTimeout(() => {
        const ok = login(selectedUser!, newPin)
        if (!ok) {
          setError('PIN incorrecto')
          setTimeout(() => { setPin(''); setError('') }, 1200)
        }
      }, 150)
    }
  }

  function handleBackspace() {
    setPin(p => p.slice(0, -1))
    setError('')
  }

  function handleClose() {
    setShowPIN(false)
    setSelectedUser(null)
    setPin('')
    setError('')
  }

  const initials = (name: string) => name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left — branding */}
      <div style={{
        width: '42%', minHeight: '100vh',
        background: '#DC2626',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 40, position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', width: 400, height: 400, border: '2px solid rgba(255,255,255,0.1)', borderRadius: '50%', top: -80, right: -120 }} />
        <div style={{ position: 'absolute', width: 280, height: 280, border: '2px solid rgba(255,255,255,0.08)', borderRadius: '50%', bottom: -40, left: -60 }} />
        <div style={{ position: 'absolute', width: 160, height: 160, background: 'rgba(255,255,255,0.06)', borderRadius: '50%', bottom: 100, right: 40 }} />

        <div style={{ position: 'relative', textAlign: 'center' }}>
          {/* Big pizza icon */}
          <div style={{ width: 96, height: 96, background: 'rgba(255,255,255,0.15)', borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Icon name="pizza" size={52} color="#FFFFFF" strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 52, color: '#FFFFFF', lineHeight: 1, letterSpacing: '-0.02em' }}>
            PIZZAIAS
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Sistema Punto de Venta
          </div>
          <div style={{ width: 40, height: 3, background: '#FBBF24', borderRadius: 2, margin: '20px auto 0' }} />
        </div>

        <div style={{ position: 'relative', marginTop: 48, width: '100%', maxWidth: 300 }}>
          {[
            { icon: 'receipt', text: 'Gestión de pedidos y caja' },
            { icon: 'chefHat', text: 'Cola de cocina en tiempo real' },
            { icon: 'trendingUp', text: 'Reportes y estadísticas' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={icon} size={16} color="#fff" />
              </div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — profile selection */}
      <div style={{ flex: 1, background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 28, color: '#18181B', letterSpacing: '-0.02em', lineHeight: 1 }}>
              Selecciona tu perfil
            </div>
            <div style={{ fontSize: 14, color: '#71717A', marginTop: 8 }}>
              Haz clic en tu nombre e ingresa tu PIN para acceder
            </div>
          </div>

          {/* Profile grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            {activeUsers.map(user => {
              const color = ROLE_COLORS[user.role] || '#DC2626'
              return (
                <button
                  key={user.id}
                  onClick={() => selectProfile(user.id)}
                  style={{
                    padding: '16px', background: '#FFFFFF', border: '1px solid #E4E4E7',
                    borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.14s', display: 'flex', alignItems: 'center', gap: 12,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = color
                    ;(e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${color}20`
                    ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#E4E4E7'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                    ;(e.currentTarget as HTMLElement).style.transform = 'none'
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${color}15`, color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 800, flexShrink: 0, fontFamily: 'Cooper Black, serif',
                  }}>{initials(user.name)}</div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name.split(' ')[0]} {user.name.split(' ')[1] || ''}
                    </div>
                    <div style={{ fontSize: 11.5, marginTop: 2 }}>
                      <span style={{ padding: '1px 6px', borderRadius: 99, background: `${color}15`, color, fontWeight: 600 }}>
                        {ROLE_LABEL[user.role]}
                      </span>
                    </div>
                  </div>
                  <Icon name="chevronRight" size={14} color="#D4D4D8" />
                </button>
              )
            })}
          </div>

          <div style={{ textAlign: 'center', fontSize: 12, color: '#A1A1AA' }}>
            PIN de acceso: cada perfil tiene su propio PIN de 4 dígitos
          </div>
        </div>
      </div>

      {/* PIN Modal */}
      {showPIN && selected && (
        <div className="overlay anim-fade">
          <div className="anim-scale" style={{ background: '#FFFFFF', borderRadius: 20, padding: 32, width: 340, boxShadow: '0 24px 64px rgba(0,0,0,0.15)', textAlign: 'center' }}>
            {/* Avatar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: `${ROLE_COLORS[selected.role] || '#DC2626'}15`,
                color: ROLE_COLORS[selected.role] || '#DC2626',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 800, margin: '0 auto 10px', fontFamily: 'Cooper Black, serif',
              }}>{initials(selected.name)}</div>
              <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 18, color: '#18181B' }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: '#71717A', marginTop: 2 }}>{ROLE_LABEL[selected.role]}</div>
            </div>

            <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 15, color: '#18181B', marginBottom: 16 }}>
              Ingresa tu PIN
            </div>

            {/* PIN dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: i < pin.length ? (error ? '#DC2626' : '#DC2626') : '#E4E4E7',
                  border: `2px solid ${i < pin.length ? (error ? '#DC2626' : '#DC2626') : '#D4D4D8'}`,
                  transition: 'all 0.15s',
                  transform: error ? 'scale(1.2)' : 'scale(1)',
                }} />
              ))}
            </div>

            {error && (
              <div style={{ fontSize: 12.5, color: '#DC2626', marginBottom: 12, fontWeight: 600 }}>
                {error}
              </div>
            )}

            {/* Keypad */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              {['1','2','3','4','5','6','7','8','9'].map(d => (
                <button key={d} onClick={() => handleDigit(d)}
                  style={{
                    padding: '14px', fontSize: 20, fontFamily: 'Cooper Black, serif',
                    background: '#F7F7F8', color: '#18181B',
                    border: '1px solid #E4E4E7', borderRadius: 12, cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F4F4F5')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#F7F7F8')}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                >{d}</button>
              ))}
              <button
                onClick={handleClose}
                style={{ padding: '14px', fontSize: 12, fontWeight: 600, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="x" size={16} color="#DC2626" />
              </button>
              <button onClick={() => handleDigit('0')}
                style={{
                  padding: '14px', fontSize: 20, fontFamily: 'Cooper Black, serif',
                  background: '#F7F7F8', color: '#18181B',
                  border: '1px solid #E4E4E7', borderRadius: 12, cursor: 'pointer',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F4F4F5')}
                onMouseLeave={e => (e.currentTarget.style.background = '#F7F7F8')}
              >0</button>
              <button onClick={handleBackspace}
                style={{ padding: '14px', background: '#F7F7F8', border: '1px solid #E4E4E7', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="chevronLeft" size={18} color="#71717A" />
              </button>
            </div>

            <div style={{ fontSize: 11, color: '#A1A1AA' }}>Demo: PIN = {Array.from(selected.pin).join(' · ')}</div>
          </div>
        </div>
      )}
    </div>
  )
}
