import { useApp } from '../context'
import Ticket from '../components/Ticket'
import Icon from '../components/Icon'

const SLICE_PRICE = 25

export default function MainPOS() {
  const { slices, setSlices, addTicketItem, orders, setView, setSidebarOpen, sidebarOpen } = useApp()

  const activeOrders = orders.filter(o => !['entregado', 'cancelado'].includes(o.status))

  function addSlicesToTicket() {
    if (slices <= 0) return
    addTicketItem({
      id: `slice-${Date.now()}`,
      type: 'slice',
      name: `Rebanada${slices > 1 ? 's' : ''} de pizza`,
      quantity: slices,
      unitPrice: SLICE_PRICE,
      total: slices * SLICE_PRICE,
    })
    setSlices(1)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', background: '#F7F7F8' }}>
        {/* Top bar */}
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E4E7', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#71717A', display: 'flex' }}>
              <Icon name="menu" size={20} />
            </button>
          )}
          <div>
            <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 20, color: '#18181B', lineHeight: 1 }}>Punto de Venta</div>
            <div style={{ fontSize: 12, color: '#A1A1AA', marginTop: 2 }}>
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {activeOrders.length > 0 && (
              <button onClick={() => setView('cola')} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
                background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8,
                fontSize: 12.5, fontWeight: 600, color: '#D97706', cursor: 'pointer',
              }}>
                <Icon name="chefHat" size={14} color="#D97706" />
                {activeOrders.length} pedido{activeOrders.length !== 1 ? 's' : ''} activo{activeOrders.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Slice counter */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 16, padding: '28px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20, textAlign: 'center' }}>
              Rebanadas — ${SLICE_PRICE} c/u
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
              <button onClick={() => setSlices(Math.max(1, slices - 1))}
                style={{
                  width: 56, height: 56, background: '#F7F7F8', color: '#18181B',
                  border: '1px solid #E4E4E7', borderRadius: 14, fontSize: 24, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EFEFEF')}
                onMouseLeave={e => (e.currentTarget.style.background = '#F7F7F8')}
              >
                <Icon name="minus" size={22} color="#18181B" strokeWidth={2.5} />
              </button>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 104, color: '#18181B', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {slices}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#DC2626', marginTop: 4 }}>
                  ${slices * SLICE_PRICE}
                </div>
              </div>

              <button onClick={() => setSlices(slices + 1)}
                style={{
                  width: 56, height: 56, background: '#DC2626', color: '#fff',
                  border: 'none', borderRadius: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(220,38,38,0.3)', transition: 'all 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#B91C1C')}
                onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}
              >
                <Icon name="plus" size={22} color="#fff" strokeWidth={2.5} />
              </button>
            </div>

            {/* Quick select */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                <button key={n} onClick={() => setSlices(n)}
                  style={{
                    width: 38, height: 38, background: slices === n ? '#DC2626' : '#F7F7F8',
                    color: slices === n ? '#fff' : '#3F3F46',
                    border: `1px solid ${slices === n ? '#DC2626' : '#E4E4E7'}`,
                    borderRadius: 9, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                    fontFamily: 'JetBrains Mono, monospace', transition: 'all 0.12s',
                  }}
                >{n}</button>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button onClick={addSlicesToTicket}
                style={{
                  padding: '11px 32px', background: '#DC2626', color: '#fff',
                  border: 'none', borderRadius: 10, cursor: 'pointer',
                  fontFamily: 'Cooper Black, serif', fontSize: 15, letterSpacing: '-0.01em',
                  boxShadow: '0 4px 16px rgba(220,38,38,0.25)', transition: 'all 0.12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#B91C1C'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#DC2626'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
              >
                Agregar al ticket
              </button>
            </div>
          </div>

          {/* Big action buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Extras', icon: 'shoppingBag', view: 'extras', desc: 'Bebidas y complementos' },
              { label: 'Pedido', icon: 'clipboard', view: 'pedido', desc: 'Configurar pizza' },
            ].map(item => (
              <ActionCard key={item.view} {...item as any} />
            ))}
          </div>

          {/* Active orders */}
          {activeOrders.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                Pedidos activos
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activeOrders.slice(0, 5).map(order => {
                  const STATUS = { nuevo: '#2563EB', confirmado: '#D97706', preparando: '#D97706', cocinando: '#D97706', listo: '#16A34A' } as Record<string,string>
                  const color = STATUS[order.status] || '#A1A1AA'
                  return (
                    <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 10 }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#18181B', minWidth: 70 }}>{order.orderNumber}</div>
                      <div style={{ flex: 1, fontSize: 13, color: '#3F3F46' }}>{order.customer || 'Venta mostrador'}</div>
                      <div style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: `${color}12`, color, textTransform: 'capitalize' }}>
                        {order.status}
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: '#DC2626' }}>${order.total}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <Ticket />
    </div>
  )
}

function ActionCard({ label, icon, view, desc }: { label: string; icon: string; view: string; desc: string }) {
  const { setView } = useApp()
  return (
    <button onClick={() => setView(view as any)}
      style={{
        height: 235, background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 16,
        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 14, transition: 'all 0.15s', padding: 20,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '#DC2626'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(220,38,38,0.1)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '#E4E4E7'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
        ;(e.currentTarget as HTMLElement).style.transform = 'none'
      }}
    >
      <div style={{ width: 64, height: 64, background: '#FEF2F2', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={30} color="#DC2626" />
      </div>
      <div>
        <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 20, color: '#18181B', textAlign: 'center' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#A1A1AA', textAlign: 'center', marginTop: 4 }}>{desc}</div>
      </div>
    </button>
  )
}
