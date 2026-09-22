import { useState } from 'react'
import { useApp } from '../context'
import Icon from '../components/Icon'

const MANAGER_ROLES = ['super_admin', 'admin', 'gerente']

export default function CorteCaja() {
  const { orders, currentUser, settings, users, addAudit } = useApp()
  const [actualAmount, setActualAmount] = useState<number | ''>('')
  const [cut, setCut] = useState(false)
  const [cutData, setCutData] = useState<{ expected: number; actual: number; diff: number; initialFloat: number } | null>(null)
  const [initialFloat, setInitialFloat] = useState<number>(settings.initialFloat)
  const [floatUnlocked, setFloatUnlocked] = useState(false)
  const [showPIN, setShowPIN] = useState(false)
  const [pin, setPinVal] = useState('')
  const [pinError, setPinError] = useState('')

  const isManager = MANAGER_ROLES.includes(currentUser?.role || '')
  const canEditFloat = isManager || floatUnlocked

  function handlePINDigit(d: string) {
    const newPin = pin + d
    setPinVal(newPin)
    if (newPin.length === 4) {
      const manager = users.find(u => MANAGER_ROLES.includes(u.role) && u.pin === newPin && u.active)
      if (manager) {
        setShowPIN(false)
        setFloatUnlocked(true)
        setPinVal('')
        addAudit({ action: 'PIN gerente validado', module: 'Corte de Caja', detail: `${manager.name} autorizó modificar el fondo inicial`, user: currentUser?.name || '' })
      } else {
        setPinError('PIN incorrecto')
        setTimeout(() => { setPinVal(''); setPinError('') }, 1200)
      }
    }
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayOrders = orders.filter(o => o.createdAt >= today && o.status === 'entregado')
  const cashOrders = todayOrders.filter(o => o.paymentMethod === 'efectivo')
  const cardOrders = todayOrders.filter(o => o.paymentMethod === 'tarjeta')
  const cashTotal = cashOrders.reduce((s, o) => s + o.total, 0)
  const cardTotal = cardOrders.reduce((s, o) => s + o.total, 0)
  const totalRevenue = cashTotal + cardTotal
  const cancelledCount = orders.filter(o => o.createdAt >= today && o.status === 'cancelado').length

  function doCut() {
    const actual = Number(actualAmount) || 0
    const expected = cashTotal + initialFloat
    setCutData({ expected, actual, diff: actual - expected, initialFloat })
    setCut(true)
  }

  function fmtMoney(n: number) {
    return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
  }

  if (cut && cutData) {
    const diffColor = cutData.diff === 0 ? '#16A34A' : cutData.diff > 0 ? '#2563EB' : '#DC2626'
    const diffLabel = cutData.diff === 0 ? 'Cuadrado' : cutData.diff > 0 ? 'Sobrante' : 'Faltante'
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F7F8' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 20, padding: 40, width: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${diffColor}15`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Icon name={cutData.diff === 0 ? 'check' : 'info'} size={26} color={diffColor} />
            </div>
            <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 22, color: '#18181B' }}>Corte completado</div>
            <div style={{ fontSize: 13, color: '#A1A1AA', marginTop: 4 }}>{new Date().toLocaleString('es-MX')}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {[
              ['Fondo inicial', fmtMoney(cutData.initialFloat), '#71717A'],
              ['Ventas efectivo', fmtMoney(cashTotal), '#18181B'],
              ['Ventas tarjeta', fmtMoney(cardTotal), '#18181B'],
              ['Total esperado', fmtMoney(cutData.expected), '#18181B'],
              ['Total contado', fmtMoney(cutData.actual), '#18181B'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F7F7F8', borderRadius: 9 }}>
                <span style={{ fontSize: 13.5, color: '#71717A' }}>{label}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: `${diffColor}10`, border: `2px solid ${diffColor}25`, borderRadius: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: diffColor }}>{diffLabel}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: diffColor }}>{fmtMoney(Math.abs(cutData.diff))}</span>
            </div>
          </div>

          <button onClick={() => { setCut(false); setCutData(null); setActualAmount('') }}
            style={{ width: '100%', padding: 12, background: '#DC2626', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'Cooper Black, serif', fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 16px rgba(220,38,38,0.25)' }}>
            Nuevo corte
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: '#F7F7F8', padding: 28 }}>
      <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 22, color: '#18181B', marginBottom: 4 }}>Corte de Caja</div>
      <div style={{ fontSize: 12.5, color: '#A1A1AA', marginBottom: 28 }}>
        {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {currentUser?.name}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Pedidos entregados', value: String(todayOrders.length), color: '#16A34A', icon: 'check' },
          { label: 'Ventas efectivo', value: `$${cashTotal.toLocaleString()}`, color: '#DC2626', icon: 'cashRegister' },
          { label: 'Ventas tarjeta', value: `$${cardTotal.toLocaleString()}`, color: '#2563EB', icon: 'tag' },
          { label: 'Cancelados', value: String(cancelledCount), color: cancelledCount > 3 ? '#DC2626' : '#A1A1AA', icon: 'x' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kpi.label}</div>
                <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 24, color: kpi.color, whiteSpace: 'nowrap' }}>{kpi.value}</div>
              </div>
              <div style={{ width: 36, height: 36, background: `${kpi.color}12`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={kpi.icon} size={17} color={kpi.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Order log */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #E4E4E7', fontFamily: 'Cooper Black, serif', fontSize: 14, color: '#18181B' }}>
            Pedidos del día ({todayOrders.length})
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {todayOrders.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#A1A1AA', fontSize: 13.5 }}>Sin pedidos entregados hoy</div>
            ) : todayOrders.map(o => (
              <div key={o.id} style={{ padding: '10px 18px', borderBottom: '1px solid #F4F4F5', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#18181B', minWidth: 80 }}>{o.orderNumber}</div>
                <div style={{ flex: 1, fontSize: 13, color: '#71717A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customer || 'Venta mostrador'}</div>
                <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: o.paymentMethod === 'efectivo' ? '#DCFCE7' : '#DBEAFE', color: o.paymentMethod === 'efectivo' ? '#16A34A' : '#2563EB', fontWeight: 600 }}>
                  {o.paymentMethod === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
                </span>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13.5, fontWeight: 700, color: '#DC2626' }}>${o.total}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 18px', background: '#F7F7F8', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E4E4E7' }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#18181B' }}>Total</span>
            <span style={{ fontFamily: 'Cooper Black, serif', fontSize: 18, color: '#DC2626' }}>${totalRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Cut form */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 14, padding: 24, alignSelf: 'start' }}>
          <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 16, color: '#18181B', marginBottom: 20 }}>Realizar corte</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F7F7F8', borderRadius: 9, gap: 10 }}>
              <span style={{ fontSize: 13, color: '#71717A' }}>Fondo inicial (ajustable hoy)</span>
              {canEditFloat ? (
                <input
                  type="number"
                  value={initialFloat}
                  onChange={e => setInitialFloat(Number(e.target.value) || 0)}
                  style={{ width: 100, padding: '4px 8px', textAlign: 'right', borderRadius: 6, border: '1.5px solid #E4E4E7', fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: '#18181B', outline: 'none' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#DC2626')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#E4E4E7')}
                />
              ) : (
                <button onClick={() => { setPinVal(''); setPinError(''); setShowPIN(true) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 7, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: '#18181B' }}
                  title="Requiere autorización del gerente en turno">
                  ${initialFloat.toLocaleString()} <Icon name="lock" size={12} color="#A1A1AA" />
                </button>
              )}
            </div>
            {[
              { label: 'Ventas en efectivo', value: `$${cashTotal.toLocaleString()}` },
              { label: 'Total esperado', value: `$${(cashTotal + initialFloat).toLocaleString()}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F7F7F8', borderRadius: 9 }}>
                <span style={{ fontSize: 13, color: '#71717A' }}>{label}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: '#18181B' }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: '#71717A', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Efectivo contado en caja
            </label>
            <input
              type="number"
              value={actualAmount}
              onChange={e => setActualAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0.00"
              style={{ width: '100%', padding: '14px 18px', borderRadius: 10, border: '2px solid #E4E4E7', fontSize: 22, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, outline: 'none', boxSizing: 'border-box', textAlign: 'center', color: '#18181B' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#DC2626')}
              onBlur={e => (e.currentTarget.style.borderColor = '#E4E4E7')}
            />
          </div>

          <button onClick={doCut} disabled={actualAmount === ''}
            style={{ width: '100%', padding: '13px', background: actualAmount === '' ? '#F4F4F5' : '#DC2626', border: 'none', borderRadius: 10, color: actualAmount === '' ? '#A1A1AA' : '#fff', fontFamily: 'Cooper Black, serif', fontSize: 16, cursor: actualAmount === '' ? 'default' : 'pointer', boxShadow: actualAmount === '' ? 'none' : '0 4px 16px rgba(220,38,38,0.25)', transition: 'all 0.15s' }}>
            Realizar corte de caja
          </button>
        </div>
      </div>

      {/* Manager PIN modal — autoriza modificar el fondo inicial */}
      {showPIN && (
        <div className="overlay anim-fade">
          <div className="anim-scale" style={{ background: '#FFFFFF', borderRadius: 20, padding: 28, width: 320, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, background: '#FEF2F2', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Icon name="lock" size={24} color="#DC2626" />
              </div>
              <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 18, color: '#18181B' }}>PIN Gerente</div>
              <div style={{ fontSize: 12.5, color: '#71717A', marginTop: 4 }}>Autorizar cambio de fondo inicial</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: i < pin.length ? '#DC2626' : '#E4E4E7',
                  border: `2px solid ${i < pin.length ? '#DC2626' : '#D4D4D8'}`,
                  transition: 'all 0.15s',
                }} />
              ))}
            </div>
            {pinError && <div style={{ fontSize: 12, color: '#DC2626', marginBottom: 10, fontWeight: 600 }}>{pinError}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                <button key={d} onClick={() => handlePINDigit(d)}
                  style={{ padding: '12px', fontSize: 18, fontFamily: 'Cooper Black, serif', background: '#F7F7F8', color: '#18181B', border: '1px solid #E4E4E7', borderRadius: 10, cursor: 'pointer' }}
                >{d}</button>
              ))}
              <button onClick={() => { setShowPIN(false); setPinVal(''); setPinError('') }}
                style={{ padding: '12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="x" size={16} color="#DC2626" />
              </button>
              <button onClick={() => handlePINDigit('0')}
                style={{ padding: '12px', fontSize: 18, fontFamily: 'Cooper Black, serif', background: '#F7F7F8', color: '#18181B', border: '1px solid #E4E4E7', borderRadius: 10, cursor: 'pointer' }}>0</button>
              <button onClick={() => setPinVal(p => p.slice(0, -1))}
                style={{ padding: '12px', background: '#F7F7F8', border: '1px solid #E4E4E7', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="chevronLeft" size={18} color="#71717A" />
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#A1A1AA' }}>PIN de gerente en turno (o admin)</div>
          </div>
        </div>
      )}
    </div>
  )
}
