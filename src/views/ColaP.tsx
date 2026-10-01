import { useState } from 'react'
import { useApp } from '../context'
import Icon from '../components/Icon'
import type { Order } from '../types'

const TABS = [
  { id: 'espera', label: 'En Espera', statuses: ['nuevo', 'confirmado'], color: '#2563EB' },
  { id: 'proceso', label: 'En Proceso', statuses: ['preparando', 'cocinando'], color: '#D97706' },
  { id: 'listo', label: 'Listo', statuses: ['listo'], color: '#16A34A' },
]

const SIZE_LABELS: Record<string, string> = { mediana: 'Mediana', grande: 'Grande', jumbo: 'Jumbo' }

function getETA(order: Order): string {
  const pizzas = order.items.filter(i => i.type === 'pizza').reduce((s, i) => s + i.quantity, 0)
  if (pizzas > 10) return '30 min'
  if (pizzas > 5) return '20-25 min'
  return '15 min'
}

export default function ColaPView() {
  const { orders, updateOrder, currentUser, products, ingredients } = useApp()
  const [activeTab, setActiveTab] = useState('espera')
  // Varias tarjetas (y varias partes dentro de una misma tarjeta) pueden
  // tener su información de ingredientes abierta al mismo tiempo.
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  const isKitchen = currentUser?.role === 'cocinero'

  function toggleExpand(key: string) {
    setExpandedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  // Solo entran a la cola de cocina los pedidos que incluyen pizza (requieren
  // preparación). Las ventas de solo rebanadas no pasan por aquí: se cobran
  // directo desde Pedidos Activos en el Punto de Venta.
  const allPizzaOrders = orders.filter(o => ['nuevo', 'confirmado', 'preparando', 'cocinando', 'listo'].includes(o.status) && o.items.some(i => i.type === 'pizza'))

  const now = Date.now()
  // Carga actual de la cola (pedidos ya liberados que siguen en proceso),
  // usada para estimar cuándo "entra" un pedido programado a En Espera.
  const queueCount = allPizzaOrders.filter(o => o.status !== 'listo' && (!o.scheduledFor || o.scheduledFor.getTime() <= now)).length
  const estimatedWaitMs = queueCount * 8 * 60000

  function isScheduledPending(o: Order): boolean {
    return !!o.scheduledFor && (o.scheduledFor.getTime() - now) > estimatedWaitMs
  }

  const scheduledOrders = allPizzaOrders.filter(isScheduledPending).sort((a, b) => (a.scheduledFor?.getTime() || 0) - (b.scheduledFor?.getTime() || 0))
  const allActive = allPizzaOrders.filter(o => !isScheduledPending(o))

  const tabOrders = activeTab === 'programados'
    ? scheduledOrders
    : allActive.filter(o => {
        const tab = TABS.find(t => t.id === activeTab)
        return tab?.statuses.includes(o.status)
      }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  const counts = [
    ...TABS.map(t => ({ ...t, count: allActive.filter(o => t.statuses.includes(o.status)).length })),
    { id: 'programados', label: 'Programados', color: '#7C3AED', count: scheduledOrders.length },
  ]

  function advanceOrder(order: Order) {
    const next: Record<string, string> = {
      nuevo: 'confirmado', confirmado: 'preparando', preparando: 'cocinando', cocinando: 'listo', listo: 'entregado',
    }
    updateOrder(order.id, { status: next[order.status] as any })
  }

  function releaseNow(order: Order) {
    updateOrder(order.id, { scheduledFor: new Date(0) })
  }

  function nextLabel(status: string): string {
    const map: Record<string, string> = {
      nuevo: 'Confirmar', confirmado: 'Preparar', preparando: 'Cocinar', cocinando: 'Listo', listo: 'Entregar',
    }
    return map[status] || 'Avanzar'
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F7F8' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E4E7', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 20, color: '#18181B' }}>Cola de Pedidos</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {counts.map(t => (
            <div key={t.id} style={{ padding: '5px 14px', background: `${t.color}10`, border: `1px solid ${t.color}25`, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 18, color: t.color, lineHeight: 1 }}>{t.count}</div>
              <div style={{ fontSize: 9.5, color: t.color, fontWeight: 600, letterSpacing: '0.05em' }}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E4E7', display: 'flex', padding: '0 24px', gap: 0, flexShrink: 0, overflowX: 'auto' }}>
        {counts.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '12px 20px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              background: 'none', border: 'none',
              color: activeTab === t.id ? t.color : '#A1A1AA',
              borderBottom: `3px solid ${activeTab === t.id ? t.color : 'transparent'}`,
              display: 'flex', alignItems: 'center', gap: 7,
            }}
          >
            {t.label}
            <span style={{
              padding: '1px 7px', borderRadius: 99, fontSize: 11, fontWeight: 700,
              background: activeTab === t.id ? `${t.color}15` : '#F4F4F5',
              color: activeTab === t.id ? t.color : '#A1A1AA',
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Orders grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {tabOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#A1A1AA' }}>
            <Icon name={activeTab === 'programados' ? 'calendar' : 'check'} size={40} color="#D4D4D8" />
            <div style={{ fontSize: 14, marginTop: 12 }}>
              {activeTab === 'programados' ? 'No hay pedidos programados pendientes de liberar' : 'No hay pedidos en esta sección'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14, alignItems: 'start' }}>
            {tabOrders.map(order => {
              const isScheduledTab = activeTab === 'programados'
              const tab = TABS.find(t => t.statuses.includes(order.status))
              const color = isScheduledTab ? '#7C3AED' : (tab?.color || '#A1A1AA')
              const elapsed = Math.floor((now - order.createdAt.getTime()) / 60000)
              return (
                <div key={order.id} style={{
                  background: '#FFFFFF', border: `1px solid ${color}30`,
                  borderTop: `3px solid ${color}`,
                  borderRadius: 12, padding: 16,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 15, color: '#18181B' }}>{order.orderNumber}</div>
                      <div style={{ fontSize: 12.5, color: '#71717A', marginTop: 1 }}>{order.customer || 'Venta mostrador'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {isScheduledTab ? (
                        <>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color, fontWeight: 700 }}>
                            {order.scheduledFor?.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#A1A1AA', marginTop: 2 }}>
                            {order.scheduledFor?.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color, fontWeight: 700 }}>
                            {getETA(order)}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#A1A1AA', marginTop: 2 }}>Hace {elapsed}m</div>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
                    <ConsTag type={order.consumption} />
                    <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 10.5, fontWeight: 600, background: '#F7F7F8', color: '#71717A', border: '1px solid #E4E4E7' }}>
                      {order.paymentMethod === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
                    </span>
                    {!isScheduledTab && (
                      <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 10.5, fontWeight: 600, background: `${color}10`, color, border: `1px solid ${color}25`, textTransform: 'capitalize' }}>
                        {order.status}
                      </span>
                    )}
                  </div>

                  {order.items.map(item => {
                    const hasParts = item.pizzaParts && item.pizzaParts.length > 0
                    return (
                      <div key={item.id} style={{ padding: '8px 0', borderTop: '1px solid #F4F4F5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#18181B' }}>
                            x{item.quantity} {item.type === 'pizza' && item.size ? SIZE_LABELS[item.size] : item.name}
                          </div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, fontWeight: 700, color: '#DC2626', flexShrink: 0 }}>${item.total}</div>
                        </div>

                        {hasParts ? (
                          <div style={{ marginTop: 5, display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {item.pizzaParts!.map((part, pi) => {
                              const key = `${order.id}::${item.id}::${pi}`
                              const open = expandedKeys.includes(key)
                              const product = products.find(p => p.name === part.flavorName)
                              return (
                                <div key={pi}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                    <div style={{ fontSize: 12, color: '#3F3F46', lineHeight: 1.4 }}>
                                      {part.fractionLabel && <strong style={{ color: '#18181B' }}>{part.fractionLabel}</strong>}{part.fractionLabel ? ' ' : ''}
                                      {part.flavorName || 'Sin sabor de menú'}
                                      {part.extras.length > 0 && (
                                        <span style={{ color: '#A1A1AA' }}>
                                          {' '}— {part.extras.map(e => (e.qty > 1 ? `${e.name} x${e.qty}` : e.name)).join(', ')}
                                        </span>
                                      )}
                                    </div>
                                    <button onClick={() => toggleExpand(key)} title="Ver ingredientes y gramos de esta parte"
                                      style={{ width: 20, height: 20, background: open ? '#2563EB' : '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <Icon name="info" size={11} color={open ? '#fff' : '#2563EB'} />
                                    </button>
                                  </div>
                                  {open && (
                                    <div style={{ marginTop: 4, padding: 9, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8 }}>
                                      {product ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: part.extras.length ? 7 : 0 }}>
                                          {product.baseIngredients.map((bi, j) => {
                                            const ing = ingredients.find(ig => ig.id === bi.ingredientId)
                                            return ing ? (
                                              <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                                                <span style={{ color: '#3F3F46' }}>{ing.name}</span>
                                                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#2563EB' }}>{bi.grams}g</span>
                                              </div>
                                            ) : null
                                          })}
                                        </div>
                                      ) : (
                                        <div style={{ fontSize: 11, color: '#A1A1AA', marginBottom: part.extras.length ? 7 : 0 }}>Sin receta base (combinación personalizada)</div>
                                      )}
                                      {part.extras.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: product ? 7 : 0, borderTop: product ? '1px dashed #BFDBFE' : 'none' }}>
                                          {part.extras.map((e, k) => (
                                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                                              <span style={{ color: '#2563EB', fontWeight: 600 }}>+ {e.name}</span>
                                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#2563EB' }}>x{e.qty}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          item.details && <div style={{ fontSize: 11, color: '#A1A1AA', marginTop: 2 }}>{item.details}</div>
                        )}
                      </div>
                    )
                  })}

                  {order.notes && (
                    <div style={{ marginTop: 8, padding: '7px 10px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 12, color: '#D97706' }}>
                      <Icon name="info" size={12} color="#D97706" /> {order.notes}
                    </div>
                  )}

                  {order.consumption === 'delivery' && (
                    <div style={{ marginTop: 8, padding: '7px 10px', background: '#F7F7F8', border: '1px solid #E4E4E7', borderRadius: 8, fontSize: 12, color: '#71717A' }}>
                      {order.address} · {order.phone}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                    {isScheduledTab ? (
                      (isKitchen || ['super_admin', 'admin', 'gerente', 'cajero', 'mesero'].includes(currentUser?.role || '')) && (
                        <button onClick={() => releaseNow(order)}
                          style={{ flex: 1, padding: '9px', fontSize: 12.5, fontWeight: 700, background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}>
                          Liberar ahora
                        </button>
                      )
                    ) : (
                      (isKitchen || ['super_admin', 'admin', 'gerente', 'cajero', 'mesero'].includes(currentUser?.role || '')) && (
                        <button onClick={() => advanceOrder(order)}
                          style={{
                            flex: 1, padding: '9px', fontSize: 12.5, fontWeight: 700,
                            background: color, color: '#fff', border: 'none', borderRadius: 8,
                            cursor: 'pointer', transition: 'opacity 0.12s',
                            boxShadow: `0 2px 8px ${color}40`,
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                        >
                          {nextLabel(order.status)}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ConsTag({ type }: { type: string }) {
  const map: Record<string, [string, string, string]> = {
    local: ['Local', '#2563EB', '#EFF6FF'],
    llevar: ['Llevar', '#D97706', '#FFFBEB'],
    delivery: ['Delivery', '#DC2626', '#FEF2F2'],
  }
  const [label, color, bg] = map[type] || ['?', '#A1A1AA', '#F7F7F8']
  return (
    <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 10.5, fontWeight: 600, background: bg, color, border: `1px solid ${color}25` }}>
      {label}
    </span>
  )
}
