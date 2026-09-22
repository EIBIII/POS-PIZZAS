import { useState } from 'react'
import { useApp } from '../context'
import Icon from '../components/Icon'
import type { Order, OrderStatus } from '../types'

const STATUS_COLORS: Record<string, [string, string]> = {
  nuevo: ['#2563EB', '#EFF6FF'],
  confirmado: ['#D97706', '#FFFBEB'],
  preparando: ['#D97706', '#FFFBEB'],
  cocinando: ['#D97706', '#FFFBEB'],
  listo: ['#16A34A', '#F0FDF4'],
  entregado: ['#71717A', '#F7F7F8'],
  cancelado: ['#DC2626', '#FEF2F2'],
}

const PAY_COLORS: Record<string, [string, string]> = {
  pendiente: ['#D97706', '#FFFBEB'],
  pagado: ['#16A34A', '#F0FDF4'],
  cancelado: ['#DC2626', '#FEF2F2'],
  reembolsado: ['#2563EB', '#EFF6FF'],
}

const MANAGER_ROLES = ['super_admin', 'admin', 'gerente']

export default function HistorialView() {
  const { orders, updateOrder, currentUser, users, addAudit } = useApp()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPay, setFilterPay] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [selected, setSelected] = useState<Order | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancel, setShowCancel] = useState(false)
  const [showPIN, setShowPIN] = useState(false)
  const [pinAction, setPinAction] = useState<'cancel' | 'refund' | null>(null)
  const [pin, setPinVal] = useState('')
  const [pinError, setPinError] = useState('')

  const isManager = MANAGER_ROLES.includes(currentUser?.role || '')

  const visible = orders.filter(o => {
    if (!isManager && o.createdBy !== currentUser?.id) return false
    if (search && !o.orderNumber.toLowerCase().includes(search.toLowerCase()) && !(o.customer || '').toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus !== 'all' && o.status !== filterStatus) return false
    if (filterPay !== 'all' && o.paymentStatus !== filterPay) return false
    if (filterDate === 'today') {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      if (o.createdAt < today) return false
    }
    return true
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const totalRevenue = visible.reduce((s, o) => s + o.total, 0)

  function requestManagerAction(action: 'cancel' | 'refund') {
    if (isManager) {
      if (action === 'cancel') setShowCancel(true)
      else handleRefund()
      return
    }
    setPinAction(action)
    setPinVal('')
    setPinError('')
    setShowPIN(true)
  }

  function handlePINDigit(d: string) {
    const newPin = pin + d
    setPinVal(newPin)
    if (newPin.length === 4) {
      const manager = users.find(u => MANAGER_ROLES.includes(u.role) && u.pin === newPin && u.active)
      if (manager) {
        setShowPIN(false)
        addAudit({ action: 'PIN gerente validado', module: 'Historial', detail: `${manager.name} autorizó acción en ${selected?.orderNumber}`, user: currentUser?.name || '' })
        if (pinAction === 'cancel') setShowCancel(true)
        else handleRefund()
      } else {
        setPinError('PIN incorrecto')
        setTimeout(() => { setPinVal(''); setPinError('') }, 1200)
      }
    }
  }

  function handleCancel() {
    if (!selected) return
    updateOrder(selected.id, { status: 'cancelado', paymentStatus: 'cancelado', cancelReason, cancelledBy: currentUser?.name })
    addAudit({ action: 'Cancelar pedido', module: 'Historial', detail: `${selected.orderNumber} — ${cancelReason}`, user: currentUser?.name || '' })
    setShowCancel(false)
    setSelected(null)
    setCancelReason('')
  }

  function handleRefund() {
    if (!selected) return
    updateOrder(selected.id, { paymentStatus: 'reembolsado' })
    addAudit({ action: 'Reembolsar pedido', module: 'Historial', detail: `${selected.orderNumber} — $${selected.total}`, user: currentUser?.name || '' })
    setSelected(null)
  }

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || userId

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F7F8' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E4E7', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 20, color: '#18181B' }}>Historial de Pedidos</div>
          <div style={{ fontSize: 12, color: '#A1A1AA', marginTop: 2 }}>
            {visible.length} pedidos · Total: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#DC2626', fontWeight: 700 }}>${totalRevenue.toLocaleString()}</span>
            {!isManager && <span style={{ marginLeft: 8, padding: '1px 6px', background: '#FFFBEB', color: '#D97706', borderRadius: 99, fontSize: 10.5, fontWeight: 600 }}>Solo tus pedidos</span>}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#FFFFFF', padding: '12px 24px', borderBottom: '1px solid #E4E4E7', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180, maxWidth: 320 }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
            <Icon name="search" size={14} color="#A1A1AA" />
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por pedido o cliente..."
            style={{ width: '100%', boxSizing: 'border-box', height: 36, padding: '0 12px 0 34px', fontSize: 13, background: '#F7F7F8', color: '#18181B', border: '1.5px solid #E4E4E7', borderRadius: 9, outline: 'none' }} />
        </div>

        <div style={{ width: 1, height: 22, background: '#E4E4E7' }} />

        <FilterSelect icon="filter" value={filterStatus} onChange={setFilterStatus}
          options={[['all', 'Todos los estados'], ...['nuevo', 'confirmado', 'preparando', 'cocinando', 'listo', 'entregado', 'cancelado'].map(s => [s, capitalize(s)] as [string, string])]} />
        <FilterSelect icon="cashRegister" value={filterPay} onChange={setFilterPay}
          options={[['all', 'Todos los pagos'], ...['pendiente', 'pagado', 'cancelado', 'reembolsado'].map(s => [s, capitalize(s)] as [string, string])]} />
        <FilterSelect icon="calendar" value={filterDate} onChange={setFilterDate}
          options={[['all', 'Todas las fechas'], ['today', 'Solo hoy']]} />

        {(search || filterStatus !== 'all' || filterPay !== 'all' || filterDate !== 'all') && (
          <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterPay('all'); setFilterDate('all') }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, height: 36, padding: '0 12px', fontSize: 12.5, fontWeight: 600, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 9, cursor: 'pointer' }}>
            <Icon name="x" size={12} color="#DC2626" /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FFFFFF', borderBottom: '2px solid #E4E4E7', position: 'sticky', top: 0, zIndex: 2 }}>
              {['Pedido', isManager ? 'Cajero' : '', 'Cliente', 'Consumo', 'Total', 'Pago', 'Estado', 'Fecha', ''].filter(Boolean).map(h => (
                <th key={h} style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((o, i) => {
              const [sc, sb] = STATUS_COLORS[o.status] || ['#A1A1AA', '#F7F7F8']
              const [pc, pb] = PAY_COLORS[o.paymentStatus] || ['#A1A1AA', '#F7F7F8']
              return (
                <tr key={o.id} onClick={() => setSelected(o)}
                  style={{
                    background: selected?.id === o.id ? '#FEF2F2' : i % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                    borderBottom: '1px solid #F4F4F5', cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (selected?.id !== o.id) (e.currentTarget as HTMLElement).style.background = '#F9FAFB' }}
                  onMouseLeave={e => { if (selected?.id !== o.id) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}
                >
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, fontWeight: 700, color: '#18181B' }}>{o.orderNumber}</div>
                  </td>
                  {isManager && <td style={{ padding: '11px 14px', fontSize: 12, color: '#71717A' }}>{getUserName(o.createdBy)}</td>}
                  <td style={{ padding: '11px 14px', fontSize: 13, color: '#3F3F46', fontWeight: 500 }}>{o.customer || 'Venta mostrador'}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 10.5, fontWeight: 600, background: '#F7F7F8', color: '#71717A', textTransform: 'capitalize' }}>{o.consumption}</span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13.5, fontWeight: 700, color: '#DC2626' }}>${o.total}</span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span className="badge" style={{ background: pb, color: pc }}>{o.paymentStatus}</span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span className="badge" style={{ background: sb, color: sc }}>{o.status}</span>
                  </td>
                  <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#A1A1AA' }}>
                    {o.createdAt.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })} {o.createdAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '11px 14px' }} onClick={e => e.stopPropagation()}>
                    {o.status !== 'cancelado' && o.status !== 'entregado' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setSelected(o); requestManagerAction('cancel') }}
                          style={{ padding: '3px 8px', fontSize: 10.5, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 5, cursor: 'pointer', fontWeight: 600 }}>
                          Cancelar
                        </button>
                        {o.paymentStatus === 'pagado' && (
                          <button onClick={() => { setSelected(o); requestManagerAction('refund') }}
                            style={{ padding: '3px 8px', fontSize: 10.5, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 5, cursor: 'pointer', fontWeight: 600 }}>
                            Reembolso
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {!visible.length && (
              <tr><td colSpan={9} style={{ padding: 48, textAlign: 'center', color: '#A1A1AA', fontSize: 14 }}>No hay pedidos</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order detail side panel */}
      {selected && !showCancel && !showPIN && (
        <div className="anim-slide-right" style={{
          position: 'fixed', right: 0, top: 0, bottom: 0, width: 340,
          background: '#FFFFFF', borderLeft: '1px solid #E4E4E7', padding: 20, overflowY: 'auto', zIndex: 50,
          boxShadow: '-4px 0 20px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 17, color: '#18181B' }}>{selected.orderNumber}</div>
              <div style={{ fontSize: 12.5, color: '#71717A', marginTop: 2 }}>{selected.customer || 'Venta mostrador'}</div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA', display: 'flex' }}>
              <Icon name="x" size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 5, marginBottom: 14, flexWrap: 'wrap' }}>
            {(() => { const [c, b] = STATUS_COLORS[selected.status] || ['#A1A1AA', '#F7F7F8']; return <span className="badge" style={{ background: b, color: c }}>{selected.status}</span> })()}
            {(() => { const [c, b] = PAY_COLORS[selected.paymentStatus] || ['#A1A1AA', '#F7F7F8']; return <span className="badge" style={{ background: b, color: c }}>{selected.paymentStatus}</span> })()}
          </div>

          {selected.items.map(item => (
            <div key={item.id} style={{ padding: '9px 0', borderBottom: '1px solid #F4F4F5', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B' }}>{item.name}</div>
                {item.details && <div style={{ fontSize: 11, color: '#A1A1AA', marginTop: 1 }}>{item.details}</div>}
                <div style={{ fontSize: 12, color: '#71717A', marginTop: 1 }}>x{item.quantity} · ${item.unitPrice}</div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: '#DC2626' }}>${item.total}</div>
            </div>
          ))}

          <div style={{ marginTop: 12, padding: 14, background: '#F7F7F8', borderRadius: 10 }}>
            {selected.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#16A34A', marginBottom: 4 }}>
                <span>Descuento</span><span>−${selected.discount}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Cooper Black, serif', fontSize: 15, color: '#18181B' }}>Total</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: '#DC2626' }}>${selected.total}</span>
            </div>
          </div>

          {selected.cancelReason && (
            <div style={{ marginTop: 12, padding: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#DC2626', marginBottom: 4 }}>CANCELADO</div>
              <div style={{ fontSize: 12.5, color: '#3F3F46' }}>{selected.cancelReason}</div>
              <div style={{ fontSize: 11, color: '#A1A1AA', marginTop: 4 }}>Por: {selected.cancelledBy}</div>
            </div>
          )}

          {selected.status !== 'cancelado' && selected.status !== 'entregado' && isManager && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Avanzar estado</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(['confirmado','preparando','cocinando','listo','entregado'] as OrderStatus[]).map(s => {
                  const [c, b] = STATUS_COLORS[s] || ['#A1A1AA', '#F7F7F8']
                  return (
                    <button key={s} onClick={() => { updateOrder(selected.id, { status: s }); setSelected({ ...selected, status: s }) }}
                      style={{ padding: '5px 10px', fontSize: 11, borderRadius: 7, cursor: 'pointer', fontWeight: 600, background: b, color: c, border: `1px solid ${c}30` }}
                    >{s}</button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manager PIN modal */}
      {showPIN && (
        <div className="overlay anim-fade">
          <div className="anim-scale" style={{ background: '#FFFFFF', borderRadius: 20, padding: 28, width: 320, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, background: '#FEF2F2', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Icon name="lock" size={24} color="#DC2626" />
              </div>
              <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 18, color: '#18181B' }}>PIN Gerente</div>
              <div style={{ fontSize: 12.5, color: '#71717A', marginTop: 4 }}>
                {pinAction === 'cancel' ? 'Cancelar' : 'Reembolsar'} pedido {selected?.orderNumber}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
              {[0,1,2,3].map(i => (
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
              {['1','2','3','4','5','6','7','8','9'].map(d => (
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
            <div style={{ fontSize: 11, color: '#A1A1AA' }}>PIN de cualquier gerente/admin</div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {showCancel && selected && (
        <div className="overlay anim-fade">
          <div className="anim-scale" style={{ background: '#FFFFFF', borderRadius: 16, padding: 24, width: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 18, color: '#18181B', marginBottom: 4 }}>Cancelar {selected.orderNumber}</div>
            <div style={{ fontSize: 12.5, color: '#71717A', marginBottom: 16 }}>Quedará registrado en auditoría</div>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
              placeholder="Motivo de cancelación..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', background: '#F7F7F8', color: '#18181B', border: '1px solid #E4E4E7', borderRadius: 9, resize: 'none', fontSize: 13 }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setShowCancel(false)} style={btnSec}>Volver</button>
              <button onClick={handleCancel} disabled={!cancelReason}
                style={{ ...btnPri, opacity: cancelReason ? 1 : 0.5 }}>Confirmar cancelación</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function FilterSelect({ icon, value, onChange, options }: { icon: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  const isDefault = value === 'all'
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
        <Icon name={icon} size={13} color={isDefault ? '#A1A1AA' : '#DC2626'} />
      </div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{
          height: 36, appearance: 'none', WebkitAppearance: 'none', boxSizing: 'border-box',
          padding: '0 26px 0 30px', fontSize: 12.5, fontWeight: 600,
          background: isDefault ? '#F7F7F8' : '#FEF2F2',
          color: isDefault ? '#3F3F46' : '#DC2626',
          border: `1.5px solid ${isDefault ? '#E4E4E7' : '#FECACA'}`,
          borderRadius: 9, outline: 'none', cursor: 'pointer', maxWidth: 180,
        }}>
        {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
      </select>
      <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
        <Icon name="chevronDown" size={12} color={isDefault ? '#A1A1AA' : '#DC2626'} />
      </div>
    </div>
  )
}
const btnPri: React.CSSProperties = { flex: 1, padding: '10px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700 }
const btnSec: React.CSSProperties = { flex: 1, padding: '10px', background: '#F7F7F8', color: '#3F3F46', border: '1px solid #E4E4E7', borderRadius: 9, cursor: 'pointer', fontSize: 13 }
