import { useState, useEffect } from 'react'
import { useApp } from '../context'
import Icon from './Icon'
import type { Order } from '../types'

const PAY_STATUS = {
  pendiente: { label: 'Pendiente', bg: '#FFFBEB', color: '#D97706', border: '#FCD34D' },
  pagado: { label: 'Pagado', bg: '#F0FDF4', color: '#16A34A', border: '#86EFAC' },
  cancelado: { label: 'Cancelado', bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
  reembolsado: { label: 'Reembolsado', bg: '#EFF6FF', color: '#2563EB', border: '#93C5FD' },
}

const MANAGER_ROLES = ['super_admin', 'admin', 'gerente']

export default function Ticket() {
  const { ticketItems, removeTicketItem, updateItemQty, clearTicket, activePromo, setActivePromo, promotions, addOrder, updateOrder, orders, generateOrderNumber, currentUser, users, addAudit, recalledOrderId, consumption, setConsumption, deliveryAddress, setDeliveryAddress, deliveryPhone, setDeliveryPhone, sidebarOpen, editPizzaItem } = useApp()
  const [payStatus, setPayStatus] = useState<keyof typeof PAY_STATUS>('pendiente')
  const [payMethod, setPayMethod] = useState<'efectivo' | 'tarjeta'>('efectivo')
  const [showConfirm, setShowConfirm] = useState(false)
  const [cashReceived, setCashReceived] = useState('')
  const [showPromoPIN, setShowPromoPIN] = useState<string | null>(null)
  const [promoPin, setPromoPin] = useState('')
  const [promoPinError, setPromoPinError] = useState('')
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduledFor, setScheduledFor] = useState('')

  const isManager = MANAGER_ROLES.includes(currentUser?.role || '')

  function requestPromo(promoId: string) {
    // Quitar una promo activa nunca requiere autorización, solo aplicar una nueva.
    if (activePromo?.id === promoId) {
      setActivePromo(null)
      return
    }
    if (isManager) {
      setActivePromo(promotions.find(p => p.id === promoId) || null)
      return
    }
    setPromoPin('')
    setPromoPinError('')
    setShowPromoPIN(promoId)
  }

  function handlePromoPINDigit(d: string) {
    const next = promoPin + d
    setPromoPin(next)
    if (next.length === 4) {
      const manager = users.find(u => MANAGER_ROLES.includes(u.role) && u.pin === next && u.active)
      if (manager) {
        const promo = promotions.find(p => p.id === showPromoPIN)
        setActivePromo(promo || null)
        addAudit({ action: 'PIN gerente validado', module: 'Ticket', detail: `${manager.name} autorizó promoción ${promo?.name || ''}`, user: currentUser?.name || '' })
        setShowPromoPIN(null)
        setPromoPin('')
      } else {
        setPromoPinError('PIN incorrecto')
        setTimeout(() => { setPromoPin(''); setPromoPinError('') }, 1200)
      }
    }
  }

  const recalledOrder = recalledOrderId ? orders.find(o => o.id === recalledOrderId) ?? null : null

  // Al recuperar un pedido pendiente al ticket, arranca limpio (sin
  // arrastrar el estado de pago que haya quedado de la venta anterior).
  useEffect(() => {
    if (recalledOrderId) {
      setPayStatus('pendiente')
      setCashReceived('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recalledOrderId])

  const subtotal = ticketItems.reduce((s, i) => s + i.total, 0)
  const discount = activePromo
    ? activePromo.type === 'percent' ? Math.round(subtotal * activePromo.value / 100) : activePromo.value
    : 0
  const total = Math.max(0, subtotal - discount)
  const change = payMethod === 'efectivo' && cashReceived ? Math.max(0, parseFloat(cashReceived) - total) : 0

  // El pago en efectivo con estado PAGADO solo se puede cobrar si ya se
  // capturó el efectivo recibido y este alcanza para cubrir el total.
  const cashRequired = payMethod === 'efectivo' && payStatus === 'pagado'
  const cashMissing = cashRequired && (!cashReceived || parseFloat(cashReceived) < total)
  const deliveryMissing = consumption === 'delivery' && !deliveryAddress.trim()
  const canCharge = ticketItems.length > 0 && !cashMissing && !deliveryMissing

  function handleCobrar() {
    if (!ticketItems.length || cashMissing || deliveryMissing) return

    const isPedido = ticketItems.some(i => i.type === 'pizza')

    if (recalledOrderId) {
      // Se está cobrando o editando un pedido que ya existía: se actualizan
      // también sus artículos y totales (por si se agregó/quitó algo), no
      // solo el estado de pago.
      updateOrder(recalledOrderId, {
        items: [...ticketItems],
        subtotal, discount, total,
        paymentMethod: payMethod,
        paymentStatus: payStatus,
        // Al pagarse: si no lleva pizza ya no hay nada pendiente (venta de
        // mostrador entregada de una vez); si lleva pizza sigue su curso en cocina.
        ...(payStatus === 'pagado' ? { status: isPedido ? 'confirmado' : 'entregado' } : {}),
        updatedAt: new Date(),
      })
    } else {
      const order: Order = {
        id: `o${Date.now()}`, orderNumber: generateOrderNumber(),
        consumption,
        ...(consumption === 'delivery' ? { address: deliveryAddress, phone: deliveryPhone } : {}),
        items: [...ticketItems],
        subtotal, discount, total,
        paymentMethod: payMethod, paymentStatus: payStatus,
        // Pendiente: los pedidos con pizza van a la cola de cocina (nuevo);
        // las rebanadas no requieren preparación y pasan directo a "listo",
        // esperando en Pedidos Activos a que el cliente pase a pagar.
        // Pagado: si lleva pizza sigue a cocina (confirmado); si es solo
        // venta de mostrador (sin pizza) ya no queda nada pendiente y se
        // entrega de una vez, por lo que desaparece de Pedidos Activos.
        status: payStatus === 'pendiente'
          ? (isPedido ? 'nuevo' : 'listo')
          : (isPedido ? 'confirmado' : 'entregado'),
        ...(scheduleEnabled && scheduledFor ? { scheduledFor: new Date(scheduledFor) } : {}),
        createdBy: currentUser?.id || '', createdAt: new Date(), updatedAt: new Date(),
      }
      addOrder(order)
    }
    clearTicket()
    setShowConfirm(false)
    setCashReceived('')
    setPayStatus('pendiente')
    setScheduleEnabled(false)
    setScheduledFor('')
  }

  const status = PAY_STATUS[payStatus]

  return (
    <div className="ticket-panel" style={{
      width: sidebarOpen ? 288 : 340, minWidth: sidebarOpen ? 288 : 340,
      background: '#F7F7F8',
      borderLeft: '1px solid #E4E4E7',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
      transition: 'width 0.15s, min-width 0.15s',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #E4E4E7', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 15, color: '#18181B' }}>Ticket</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{
              padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
              background: status.bg, color: status.color, border: `1px solid ${status.border}`,
            }}>{status.label}</div>
            {ticketItems.length > 0 && (
              <button
                onClick={clearTicket}
                style={{ padding: '4px 8px', fontSize: 11, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Icon name="trash" size={11} color="#DC2626" /> Limpiar
              </button>
            )}
          </div>
        </div>
        {recalledOrder && (
          <div style={{ marginTop: 8, padding: '6px 10px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 11, color: '#92400E', fontWeight: 600 }}>
            Cobrando pedido pendiente {recalledOrder.orderNumber}
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#FFFFFF', borderBottom: '1px solid #E4E4E7' }}>
        {!ticketItems.length ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#A1A1AA' }}>
            <div style={{ marginBottom: 10, opacity: 0.4 }}><Icon name="receipt" size={40} color="#A1A1AA" /></div>
            <div style={{ fontSize: 13 }}>Ticket vacío</div>
          </div>
        ) : ticketItems.map(item => (
          <div key={item.id} style={{ padding: '10px 14px', borderBottom: '1px solid #F4F4F5', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#18181B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
              {item.details && <div style={{ fontSize: 10.5, color: '#A1A1AA', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.details}</div>}
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#71717A', marginTop: 1 }}>${item.unitPrice}/u</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <button onClick={() => updateItemQty(item.id, item.quantity - 1)}
                style={{ width: 22, height: 22, background: '#F4F4F5', border: '1px solid #E4E4E7', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="minus" size={11} color="#71717A" />
              </button>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, width: 22, textAlign: 'center' }}>{item.quantity}</span>
              <button onClick={() => updateItemQty(item.id, item.quantity + 1)}
                style={{ width: 22, height: 22, background: '#F4F4F5', border: '1px solid #E4E4E7', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plus" size={11} color="#71717A" />
              </button>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: '#DC2626', minWidth: 44, textAlign: 'right' }}>${item.total}</div>
            {item.type === 'pizza' && (
              <button onClick={() => editPizzaItem(item)} title="Editar sabor/ingredientes"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#2563EB', display: 'flex' }}>
                <Icon name="pencil" size={13} />
              </button>
            )}
            <button onClick={() => removeTicketItem(item.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#D4D4D8', display: 'flex' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#DC2626'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#D4D4D8'}
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Consumption type */}
      <div style={{ padding: '8px 14px', background: '#F7F7F8', borderBottom: '1px solid #E4E4E7' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.06em', marginBottom: 5 }}>CONSUMO</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {([['local', 'Local', 'home'], ['llevar', 'Llevar', 'shoppingBag'], ['delivery', 'Delivery', 'bag']] as const).map(([id, label, icon]) => (
            <button key={id} onClick={() => setConsumption(id)}
              style={{
                flex: 1, padding: '7px 2px', fontSize: 11.5, fontWeight: 600,
                borderRadius: 7, cursor: 'pointer', border: `1px solid ${consumption === id ? '#DC2626' : '#E4E4E7'}`,
                background: consumption === id ? '#FEF2F2' : '#FFFFFF', color: consumption === id ? '#DC2626' : '#71717A',
                transition: 'all 0.12s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}
            >
              <Icon name={icon} size={13} color={consumption === id ? '#DC2626' : '#A1A1AA'} />
              {label}
            </button>
          ))}
        </div>
        {consumption === 'delivery' && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Dirección de entrega"
              style={{ width: '100%', padding: '7px 10px', fontSize: 12.5, background: '#FFFFFF', color: '#18181B', border: '1px solid #E4E4E7', borderRadius: 7, outline: 'none', boxSizing: 'border-box' }} />
            <input value={deliveryPhone} onChange={e => setDeliveryPhone(e.target.value)} placeholder="Teléfono de contacto"
              style={{ width: '100%', padding: '7px 10px', fontSize: 12.5, background: '#FFFFFF', color: '#18181B', border: '1px solid #E4E4E7', borderRadius: 7, outline: 'none', boxSizing: 'border-box' }} />
            {deliveryMissing && (
              <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 600 }}>Ingresa la dirección de entrega para poder cobrar.</div>
            )}
          </div>
        )}
      </div>

      {/* Programar pedido */}
      {!recalledOrder && (
        <div style={{ padding: '8px 14px', background: '#F7F7F8', borderBottom: '1px solid #E4E4E7' }}>
          <button onClick={() => setScheduleEnabled(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{
              width: 32, height: 18, borderRadius: 10, background: scheduleEnabled ? '#DC2626' : '#E4E4E7',
              position: 'relative', transition: 'background 0.15s', flexShrink: 0,
            }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: scheduleEnabled ? 16 : 2, transition: 'left 0.15s' }} />
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#3F3F46' }}>Programar para después</span>
          </button>
          {scheduleEnabled && (
            <input type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)}
              style={{ marginTop: 8, width: '100%', padding: '7px 10px', fontSize: 12.5, background: '#FFFFFF', color: '#18181B', border: '1px solid #E4E4E7', borderRadius: 7, outline: 'none', boxSizing: 'border-box' }} />
          )}
        </div>
      )}

      {/* Promos */}
      {promotions.filter(p => p.active).length > 0 && (
        <div style={{ padding: '8px 14px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#D97706', letterSpacing: '0.06em', marginBottom: 5 }}>PROMOCIONES</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {promotions.filter(p => p.active).map(p => (
              <button key={p.id} onClick={() => requestPromo(p.id)}
                style={{
                  padding: '3px 8px', fontSize: 10.5, borderRadius: 99, cursor: 'pointer', fontWeight: 500,
                  background: activePromo?.id === p.id ? '#D97706' : '#FEF3C7',
                  color: activePromo?.id === p.id ? '#fff' : '#92400E',
                  border: `1px solid ${activePromo?.id === p.id ? '#D97706' : '#FCD34D'}`,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                {activePromo?.id !== p.id && !isManager && <Icon name="lock" size={9} color="#92400E" />}
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Totals */}
      <div style={{ padding: '12px 14px', background: '#FFFFFF', borderBottom: '1px solid #E4E4E7' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 12.5, color: '#71717A' }}>Subtotal</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, color: '#71717A' }}>${subtotal}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 12.5, color: '#16A34A' }}>Descuento</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, color: '#16A34A' }}>−${discount}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, marginTop: 4, borderTop: '1px solid #F4F4F5' }}>
          <span style={{ fontFamily: 'Cooper Black, serif', fontSize: 16, color: '#18181B' }}>Total</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 700, color: '#DC2626' }}>${total}</span>
        </div>
      </div>

      {/* Payment Status */}
      <div style={{ padding: '8px 14px', background: '#F7F7F8', borderBottom: '1px solid #E4E4E7' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.06em', marginBottom: 5 }}>ESTADO DE PAGO</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['pendiente', 'pagado'] as const).map(k => {
            const v = PAY_STATUS[k]
            return (
              <button key={k} onClick={() => { setPayStatus(k); if (k === 'pendiente') setCashReceived('') }}
                style={{
                  flex: 1, padding: '6px 2px', fontSize: 11, fontWeight: 600,
                  borderRadius: 6, cursor: 'pointer', border: `1px solid ${payStatus === k ? v.border : '#E4E4E7'}`,
                  background: payStatus === k ? v.bg : '#FFFFFF', color: payStatus === k ? v.color : '#A1A1AA',
                  transition: 'all 0.12s',
                }}
              >{v.label}</button>
            )
          })}
        </div>
      </div>

      {/* Payment method */}
      <div style={{ padding: '8px 14px', background: '#F7F7F8', borderBottom: '1px solid #E4E4E7' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['efectivo', 'tarjeta'] as const).map(m => (
            <button key={m} onClick={() => setPayMethod(m)}
              style={{
                flex: 1, padding: '8px', fontSize: 12.5, fontWeight: 600,
                background: payMethod === m ? '#DC2626' : '#FFFFFF',
                color: payMethod === m ? '#fff' : '#3F3F46',
                border: `1px solid ${payMethod === m ? '#DC2626' : '#E4E4E7'}`,
                borderRadius: 8, cursor: 'pointer', transition: 'all 0.12s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <Icon name={m === 'efectivo' ? 'receipt' : 'tag'} size={13} color={payMethod === m ? '#fff' : '#71717A'} />
              {m === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
            </button>
          ))}
        </div>
        {payMethod === 'efectivo' && (
          <div style={{ marginTop: 8 }}>
            <input type="number" placeholder="Efectivo recibido" value={cashReceived} disabled={payStatus === 'pendiente'}
              onChange={e => setCashReceived(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px', fontSize: 13, fontFamily: 'JetBrains Mono, monospace',
                background: payStatus === 'pendiente' ? '#F4F4F5' : '#FFFFFF',
                color: payStatus === 'pendiente' ? '#A1A1AA' : '#18181B',
                border: '1px solid #E4E4E7', borderRadius: 7,
                cursor: payStatus === 'pendiente' ? 'not-allowed' : 'text',
                boxSizing: 'border-box',
              }}
            />
            {payStatus === 'pendiente' && (
              <div style={{ fontSize: 11, color: '#A1A1AA', marginTop: 5 }}>
                Se captura cuando venga a pagar (estado Pagado).
              </div>
            )}
            {payStatus === 'pagado' && cashReceived && parseFloat(cashReceived) >= total && (
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, color: '#16A34A', fontWeight: 600, marginTop: 5 }}>
                Cambio: ${change.toFixed(2)}
              </div>
            )}
            {cashRequired && cashMissing && (
              <div style={{ fontSize: 11.5, color: '#DC2626', fontWeight: 600, marginTop: 5 }}>
                {cashReceived
                  ? `El efectivo recibido no cubre el total. Faltan $${(total - parseFloat(cashReceived)).toFixed(2)}.`
                  : 'Ingresa el efectivo recibido para poder cobrar.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cobrar */}
      <div style={{ padding: '12px 14px', background: '#FFFFFF' }}>
        <button onClick={() => (payStatus === 'pagado' ? setShowConfirm(true) : handleCobrar())} disabled={!canCharge}
          style={{
            width: '100%', padding: '13px 8px', fontFamily: 'Cooper Black, serif', fontSize: 15, letterSpacing: '-0.01em',
            background: canCharge ? '#DC2626' : '#F4F4F5',
            color: canCharge ? '#fff' : '#A1A1AA',
            border: 'none', borderRadius: 10, cursor: canCharge ? 'pointer' : 'not-allowed',
            boxShadow: canCharge ? '0 4px 16px rgba(220,38,38,0.3)' : 'none',
            transition: 'all 0.14s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
          onMouseEnter={e => { if (canCharge) (e.currentTarget as HTMLElement).style.background = '#B91C1C' }}
          onMouseLeave={e => { if (canCharge) (e.currentTarget as HTMLElement).style.background = '#DC2626' }}
        >
          {recalledOrder
            ? (payStatus === 'pagado' ? `Cobrar ${recalledOrder.orderNumber}` : 'Guardar en activos')
            : (payStatus === 'pendiente' ? `Guardar pendiente · $${total}` : `Cobrar $${total}`)}
        </button>
      </div>

      {/* Confirm overlay */}
      {showConfirm && (
        <div className="overlay">
          <div className="anim-scale" style={{ background: '#FFFFFF', borderRadius: 16, padding: 28, width: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 18, color: '#18181B', marginBottom: 6 }}>Confirmar venta</div>
            <div style={{ fontSize: 13, color: '#71717A', marginBottom: 20 }}>
              Total: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#DC2626', fontWeight: 700, fontSize: 18 }}>${total}</span>
              {"  ·  "}{payMethod === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowConfirm(false)}
                style={{ flex: 1, padding: '11px', background: '#F7F7F8', color: '#3F3F46', border: '1px solid #E4E4E7', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Cancelar
              </button>
              <button onClick={handleCobrar}
                style={{ flex: 1, padding: '11px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'Cooper Black, serif', fontSize: 14 }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manager PIN modal — autoriza aplicar una promoción */}
      {showPromoPIN && (
        <div className="overlay anim-fade">
          <div className="anim-scale" style={{ background: '#FFFFFF', borderRadius: 20, padding: 28, width: 300, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <div style={{ width: 52, height: 52, background: '#FFFBEB', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Icon name="lock" size={24} color="#D97706" />
            </div>
            <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 17, color: '#18181B' }}>PIN Gerente</div>
            <div style={{ fontSize: 12, color: '#71717A', marginTop: 3, marginBottom: 16 }}>Autorizar promoción</div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ width: 13, height: 13, borderRadius: '50%', background: i < promoPin.length ? '#D97706' : '#E4E4E7' }} />
              ))}
            </div>
            {promoPinError && <div style={{ fontSize: 12, color: '#DC2626', marginBottom: 10, fontWeight: 600 }}>{promoPinError}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                <button key={d} onClick={() => handlePromoPINDigit(d)}
                  style={{ padding: '11px', fontSize: 16, fontFamily: 'Cooper Black, serif', background: '#F7F7F8', color: '#18181B', border: '1px solid #E4E4E7', borderRadius: 9, cursor: 'pointer' }}
                >{d}</button>
              ))}
              <button onClick={() => { setShowPromoPIN(null); setPromoPin('') }}
                style={{ padding: '11px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="x" size={15} color="#DC2626" />
              </button>
              <button onClick={() => handlePromoPINDigit('0')}
                style={{ padding: '11px', fontSize: 16, fontFamily: 'Cooper Black, serif', background: '#F7F7F8', color: '#18181B', border: '1px solid #E4E4E7', borderRadius: 9, cursor: 'pointer' }}>0</button>
              <button onClick={() => setPromoPin(p => p.slice(0, -1))}
                style={{ padding: '11px', background: '#F7F7F8', border: '1px solid #E4E4E7', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="chevronLeft" size={16} color="#71717A" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
