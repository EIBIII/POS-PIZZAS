import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useState } from 'react'
import { useApp } from '../context'
import Icon from '../components/Icon'
import { buildDashboardPDF, sendPdfByEmail } from '../reportUtils'

const REDS = ['#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FEE2E2']

export default function Dashboard() {
  const { orders, ingredients, settings, addAudit } = useApp()
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayOrders = orders.filter(o => o.createdAt >= today && o.status !== 'cancelado')
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0)
  const cashSales = todayOrders.filter(o => o.paymentMethod === 'efectivo').reduce((s, o) => s + o.total, 0)
  const cardSales = todayOrders.filter(o => o.paymentMethod === 'tarjeta').reduce((s, o) => s + o.total, 0)
  const activeOrders = orders.filter(o => ['confirmado','preparando','cocinando'].includes(o.status)).length
  const lowStock = ingredients.filter(i => i.stock <= i.minStock)

  // Pizza count by name
  const pizzaCounts: Record<string, number> = {}
  orders.filter(o => o.status !== 'cancelado').forEach(o => {
    o.items.filter(i => i.type === 'pizza').forEach(i => {
      const name = i.name.split(' ').slice(0, -1).join(' ')
      pizzaCounts[name] = (pizzaCounts[name] || 0) + i.quantity
    })
  })
  const topPizzas = Object.entries(pizzaCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Revenue by status for pie
  const statusCounts: Record<string, number> = {}
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1 })
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // Simulated hourly data
  const hourlyData = Array.from({ length: 10 }, (_, i) => ({
    hour: `${9 + i}:00`,
    ventas: Math.floor(Math.random() * 400 + 100),
    pedidos: Math.floor(Math.random() * 8 + 1),
  }))

  // Payment breakdown
  const payData = [
    { name: 'Efectivo', value: cashSales, color: '#16A34A' },
    { name: 'Tarjeta', value: cardSales, color: '#2563EB' },
  ].filter(d => d.value > 0)

  // Historial completo del día (todos los pedidos de hoy, incluyendo cancelados)
  const todayHistory = orders.filter(o => o.createdAt >= today)

  function sendDashboardReport() {
    if (!settings.reportEmail) {
      setNotice('Configura primero un correo de reportes en Configuración > Caja y reportes.')
      setTimeout(() => setNotice(''), 3500)
      return
    }
    setSending(true)
    const { doc, filename } = buildDashboardPDF(
      settings,
      [
        { label: 'Ventas hoy', value: `$${todayRevenue.toLocaleString()}` },
        { label: 'Efectivo', value: `$${cashSales.toLocaleString()}` },
        { label: 'Tarjeta', value: `$${cardSales.toLocaleString()}` },
        { label: 'En cocina', value: String(activeOrders) },
      ],
      todayHistory,
    )
    sendPdfByEmail(doc, filename, settings.reportEmail, `Dashboard del día — ${settings.name}`, [
      `Resumen del día de ${settings.name} (incluye historial de pedidos de hoy).`,
      `Ventas hoy: $${todayRevenue.toLocaleString()} · Pedidos: ${todayOrders.length} · En cocina: ${activeOrders}`,
    ])
    addAudit({ action: 'Envío de dashboard por correo', module: 'Dashboard', detail: `Historial del día → ${settings.reportEmail}`, user: 'Sistema' })
    setNotice(`PDF descargado. Se abrió tu correo hacia ${settings.reportEmail}.`)
    setSending(false)
    setTimeout(() => setNotice(''), 4000)
  }

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: '#F7F7F8', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 22, color: '#18181B' }}>Dashboard</div>
          <div style={{ fontSize: 12.5, color: '#A1A1AA', marginTop: 2 }}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <button onClick={sendDashboardReport} disabled={sending}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#18181B', color: '#fff', border: 'none', borderRadius: 10, cursor: sending ? 'default' : 'pointer', fontSize: 13, fontWeight: 700, opacity: sending ? 0.6 : 1 }}>
          <Icon name="mail" size={15} color="#fff" strokeWidth={2.5} />
          Enviar por correo (PDF)
        </button>
      </div>
      {notice && (
        <div style={{ marginBottom: 16, padding: '9px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, fontSize: 12.5, color: '#DC2626', fontWeight: 600 }}>
          {notice}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <KPI label="Ventas hoy" value={`$${todayRevenue.toLocaleString()}`} sub={`${todayOrders.length} pedidos`} color="#DC2626" icon="receipt" />
        <KPI label="Efectivo" value={`$${cashSales.toLocaleString()}`} sub="Hoy" color="#16A34A" icon="cashRegister" />
        <KPI label="Tarjeta" value={`$${cardSales.toLocaleString()}`} sub="Hoy" color="#2563EB" icon="tag" />
        <KPI label="En cocina" value={String(activeOrders)} sub="Pedidos activos" color={activeOrders > 4 ? '#DC2626' : '#D97706'} icon="chefHat" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Hourly sales */}
        <Card title="Ventas por hora">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={hourlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#A1A1AA' }} />
              <YAxis tick={{ fontSize: 10, fill: '#A1A1AA' }} />
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="ventas" stroke="#DC2626" strokeWidth={2} fill="url(#salesGrad)" name="Ventas $" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Payment breakdown pie */}
        <Card title="Métodos de pago">
          {payData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={payData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {payData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `$${v}`} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4E4E7' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                {payData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                    <span style={{ fontSize: 11.5, color: '#3F3F46' }}>{d.name}: <strong>${d.value}</strong></span>
                  </div>
                ))}
              </div>
            </>
          ) : <div style={{ fontSize: 13, color: '#A1A1AA', textAlign: 'center', padding: 20 }}>Sin ventas hoy</div>}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {/* Top pizzas bar */}
        <Card title="Pizzas más vendidas">
          {topPizzas.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={topPizzas.map(([name, value]) => ({ name: name.length > 10 ? name.slice(0, 8) + '…' : name, value }))} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#A1A1AA' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#3F3F46' }} width={70} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4E4E7' }} />
                <Bar dataKey="value" name="Unidades" radius={[0, 4, 4, 0]}>
                  {topPizzas.map((_, i) => <Cell key={i} fill={REDS[i] || '#FEE2E2'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ fontSize: 13, color: '#A1A1AA', padding: 20, textAlign: 'center' }}>Sin datos</div>}
        </Card>

        {/* Order status breakdown */}
        <Card title="Estado de pedidos">
          {statusData.map(({ name, value }) => {
            const colors: Record<string, string> = { nuevo: '#2563EB', confirmado: '#D97706', preparando: '#D97706', cocinando: '#D97706', listo: '#16A34A', entregado: '#71717A', cancelado: '#DC2626' }
            const c = colors[name] || '#A1A1AA'
            const max = Math.max(...statusData.map(s => s.value))
            return (
              <div key={name} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12.5, color: '#3F3F46', textTransform: 'capitalize' }}>{name}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, fontWeight: 700, color: c }}>{value}</span>
                </div>
                <div style={{ height: 5, background: '#F4F4F5', borderRadius: 3 }}>
                  <div style={{ height: 5, background: c, borderRadius: 3, width: `${(value / max) * 100}%`, transition: 'width 0.5s' }} />
                </div>
              </div>
            )
          })}
        </Card>

        {/* Stock alerts */}
        <Card title={`Stock bajo ${lowStock.length > 0 ? `(${lowStock.length})` : ''}`}>
          {lowStock.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 16, color: '#16A34A' }}>
              <Icon name="check" size={32} color="#86EFAC" />
              <div style={{ fontSize: 13, marginTop: 8 }}>Todo el inventario en orden</div>
            </div>
          ) : lowStock.map(ing => (
            <div key={ing.id} style={{ padding: '8px 10px', marginBottom: 6, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#18181B' }}>{ing.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#DC2626' }}>{ing.stock} {ing.unit}</span>
                <span style={{ fontSize: 11, color: '#A1A1AA' }}>Mín: {ing.minStock}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

function KPI({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon: string }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</div>
          <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 24, color, letterSpacing: '-0.01em' }}>{value}</div>
          <div style={{ fontSize: 11.5, color: '#A1A1AA', marginTop: 4 }}>{sub}</div>
        </div>
        <div style={{ width: 38, height: 38, background: `${color}12`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={18} color={color} />
        </div>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 14, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 14, color: '#18181B', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  )
}
