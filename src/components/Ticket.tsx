import { useState } from 'react'
import { useApp } from '../context'
import Icon from './Icon'
import type { Order } from '../types'

const PAY_STATUS = {
  pendiente: { label: 'Pendiente', bg: '#FFFBEB', color: '#D97706', border: '#FCD34D' },
  pagado: { label: 'Pagado', bg: '#F0FDF4', color: '#16A34A', border: '#86EFAC' },
  cancelado: { label: 'Cancelado', bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
  reembolsado: { label: 'Reembolsado', bg: '#EFF6FF', color: '#2563EB', border: '#93C5FD' },
}

export default function Ticket() {
  const { ticketItems, removeTicketItem, updateItemQty, clearTicket, activePromo, setActivePromo, promotions, addOrder, updateOrder, orders, generateOrderNumber, currentUser, recalledOrderId } = useApp()
  const [payStatus, setPayStatus] = useState<keyof typeof PAY_STATUS>('pendiente')
  const [payMethod, setPayMethod] = useState<'efectivo' | 'tarjeta'>('efectivo')
  const [showConfirm, setShowConfirm] = useState(false)
  const [cashReceived, setCashReceived] = useState('')

  const recalledOrder = recalledOrderId ? orders.find(o => o.id === recalledOrderId) ?? null : null

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
  const canCharge = ticketItems.length > 0 && !cashMissing

  function handleCobrar() {
    if (!ticketItems.length || cashMissing) return

    if (recalledOrderId) {
      // Se está cobrando un pedido pendiente que ya estaba en cola/pedidos activos:
      // solo se actualiza su estado de pago (y se marca entregado si ya se pagó).
      updateOrder(recalledOrderId, {
        paymentMethod: payMethod,
        paymentStatus: payStatus,
        ...(payStatus === 'pagado' ? { status: 'entregado' } : {}),
      })
    } else {
      const isPedido = ticketItems.some(i => i.type === 'pizza')
      const order: Order = {
        id: `o${Date.now()}`, orderNumber: generateOrderNumber(),
        consumption: 'local',
        items: [...ticketItems],
        subtotal, discount, total,
        paymentMethod: payMethod, paymentStatus: payStatus,
        // Si queda pendiente de pago: los pedidos con pizza van a la cola de
        // cocina (nuevo); las rebanadas no requieren preparación, así que
        // pasan directo a "listo" y aparecen en Pedidos Activos hasta que
        // el cliente pase por ellas y se cobren desde aquí.
        status: payStatus === 'pendiente' ? (isPedido ? 'nuevo' : 'listo') : 'confirmado',
        createdBy: currentUser?.id || '', createdAt: new Date(), updatedAt: new Date(),
      }
      addOrder(order)
    }
    clearTicket()
    setShowConfirm(false)
    setCashReceived('')
    setPayStatus('pendiente')
  }

  const status = PAY_STATUS[payStatus]

  return (
    <div style={{
      width: 288, minWidth: 288,
      background: '#F7F7F8',
      borderLeft: '1px solid #E4E4E7',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
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

      {/* Promos */}
      {promotions.filter(p => p.active).length > 0 && (
        <div style={{ padding: '8px 14px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#D97706', letterSpacing: '0.06em', marginBottom: 5 }}>PROMOCIONES</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {promotions.filter(p => p.active).map(p => (
              <button key={p.id} onClick={() => setActivePromo(activePromo?.id === p.id ? null : p)}
                style={{
                  padding: '3px 8px', fontSize: 10.5, borderRadius: 99, cursor: 'pointer', fontWeight: 500,
                  background: activePromo?.id === p.id ? '#D97706' : '#FEF3C7',
                  color: activePromo?.id === p.id ? '#fff' : '#92400E',
                  border: `1px solid ${activePromo?.id === p.id ? '#D97706' : '#FCD34D'}`,
                  transition: 'all 0.12s',
                }}
              >{p.name}</button>
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
          {(Object.entries(PAY_STATUS) as [keyof typeof PAY_STATUS, typeof PAY_STATUS[keyof typeof PAY_STATUS]][]).map(([k, v]) => (
            <button key={k} onClick={() => setPayStatus(k)}
              style={{
                flex: 1, padding: '4px 2px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                borderRadius: 6, cursor: 'pointer', border: `1px solid ${payStatus === k ? v.border : '#E4E4E7'}`,
                background: payStatus === k ? v.bg : '#FFFFFF', color: payStatus === k ? v.color : '#A1A1AA',
                transition: 'all 0.12s',
              }}
            >{v.label}</button>
          ))}
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
            <input type="number" placeholder="Efectivo recibido" value={cashReceived} onChange={e => setCashReceived(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', fontSize: 13, background: '#FFFFFF', color: '#18181B', border: '1px solid #E4E4E7', borderRadius: 7, fontFamily: 'JetBrains Mono, monospace' }}
            />
            {cashReceived && parseFloat(cashReceived) >= total && (
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
        <button onClick={() => setShowConfirm(true)} disabled={!canCharge}
          style={{
            width: '100%', padding: '13px', fontFamily: 'Cooper Black, serif', fontSize: 16, letterSpacing: '-0.01em',
            background: canCharge ? '#DC2626' : '#F4F4F5',
            color: canCharge ? '#fff' : '#A1A1AA',
            border: 'none', borderRadius: 10, cursor: canCharge ? 'pointer' : 'not-allowed',
            boxShadow: canCharge ? '0 4px 16px rgba(220,38,38,0.3)' : 'none',
            transition: 'all 0.14s',
          }}
          onMouseEnter={e => { if (canCharge) (e.currentTarget as HTMLElement).style.background = '#B91C1C' }}
          onMouseLeave={e => { if (canCharge) (e.currentTarget as HTMLElement).style.background = '#DC2626' }}
        >
          {recalledOrder ? `Cobrar pedido ${recalledOrder.orderNumber}` : `Cobrar $${total}`}
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
    </div>
  )
}
