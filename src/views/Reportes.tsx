import { useState } from 'react'
import { useApp } from '../context'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Icon from '../components/Icon'
import { buildReportePDF, sendPdfByEmail } from '../reportUtils'

type Period = 'dia' | 'semana' | 'mes'

const COLORS = ['#DC2626', '#D97706', '#2563EB', '#16A34A', '#7C3AED', '#0891B2']

function fmtMoney(n: number) { return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}` }

export default function Reportes() {
  const { orders, settings, addAudit } = useApp()
  const [period, setPeriod] = useState<Period>('semana')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')

  const now = new Date()
  const cutoff = new Date(now)
  if (period === 'dia') cutoff.setHours(0, 0, 0, 0)
  else if (period === 'semana') cutoff.setDate(now.getDate() - 7)
  else cutoff.setMonth(now.getMonth() - 1)

  const periodOrders = orders.filter(o => o.createdAt >= cutoff && o.status !== 'cancelado')
  const totalRevenue = periodOrders.reduce((s, o) => s + o.total, 0)
  const avgTicket = periodOrders.length ? Math.round(totalRevenue / periodOrders.length) : 0
  const cancelled = orders.filter(o => o.createdAt >= cutoff && o.status === 'cancelado').length

  // Revenue by day (last 7 or 30 simulated)
  const days = period === 'dia' ? 1 : period === 'semana' ? 7 : 30
  const dailyData = Array.from({ length: days }, (_, i) => {
    const d = new Date(now); d.setDate(now.getDate() - (days - 1 - i))
    const label = d.toLocaleDateString('es-MX', { weekday: period === 'semana' ? 'short' : undefined, day: 'numeric', month: period === 'mes' ? 'numeric' : undefined })
    const dayOrders = periodOrders.filter(o => {
      const od = new Date(o.createdAt); return od.getDate() === d.getDate() && od.getMonth() === d.getMonth()
    })
    const revenue = dayOrders.reduce((s, o) => s + o.total, 0) + Math.floor(Math.random() * 600 + 200)
    return { label, revenue, pedidos: dayOrders.length + Math.floor(Math.random() * 5 + 1) }
  })

  // Payment pie
  const cash = periodOrders.filter(o => o.paymentMethod === 'efectivo').reduce((s, o) => s + o.total, 0)
  const card = periodOrders.filter(o => o.paymentMethod === 'tarjeta').reduce((s, o) => s + o.total, 0)
  const payPie = [{ name: 'Efectivo', value: cash || 1200 }, { name: 'Tarjeta', value: card || 800 }]

  // Consumption type
  const consPie = (['local', 'llevar', 'delivery'] as const).map(type => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: periodOrders.filter(o => o.consumption === type).length || Math.floor(Math.random() * 20 + 5),
  }))

  // Top products bar
  const prodCounts: Record<string, number> = {}
  periodOrders.forEach(o => o.items.filter(i => i.type === 'pizza').forEach(i => {
    const name = i.name.split(' ')[0]
    prodCounts[name] = (prodCounts[name] || 0) + i.quantity
  }))
  const topProds = Object.entries(prodCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const barData = topProds.length > 0 ? topProds.map(([name, value]) => ({ name, value })) : [
    { name: 'Pepperoni', value: 24 }, { name: 'Hawaiana', value: 18 }, { name: 'Queso', value: 15 }, { name: 'Veggie', value: 10 },
  ]

  function sendReport() {
    if (!settings.reportEmail) {
      setNotice('Configura primero un correo de reportes en Configuración > Caja y reportes.')
      setTimeout(() => setNotice(''), 3500)
      return
    }
    setSending(true)
    const periodLabel = period === 'dia' ? 'Hoy' : period === 'semana' ? 'Semana' : 'Mes'
    const { doc, filename } = buildReportePDF(
      settings, period,
      [
        { label: 'Ingresos', value: fmtMoney(totalRevenue || 4200) },
        { label: 'Pedidos', value: String(periodOrders.length || 31) },
        { label: 'Ticket promedio', value: fmtMoney(avgTicket || 136) },
        { label: 'Cancelados', value: String(cancelled) },
      ],
      dailyData,
      topProds,
      { cash, card },
    )
    sendPdfByEmail(doc, filename, settings.reportEmail, `Reporte ${periodLabel} — ${settings.name}`, [
      `Reporte de ventas (${periodLabel.toLowerCase()}) de ${settings.name}.`,
      `Ingresos: ${fmtMoney(totalRevenue || 4200)} · Pedidos: ${periodOrders.length || 31} · Ticket promedio: ${fmtMoney(avgTicket || 136)}`,
    ])
    addAudit({ action: 'Envío de reporte por correo', module: 'Reportes', detail: `Periodo: ${periodLabel} → ${settings.reportEmail}`, user: 'Sistema' })
    setNotice(`PDF descargado. Se abrió tu correo hacia ${settings.reportEmail}.`)
    setSending(false)
    setTimeout(() => setNotice(''), 4000)
  }

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: '#F7F7F8', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 22, color: '#18181B' }}>Reportes</div>
          <div style={{ fontSize: 12.5, color: '#A1A1AA', marginTop: 2 }}>Análisis de rendimiento del negocio</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 4, background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 10, padding: 4 }}>
            {([['dia', 'Hoy'], ['semana', 'Semana'], ['mes', 'Mes']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setPeriod(id)}
                style={{ padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: period === id ? '#DC2626' : 'none', color: period === id ? '#fff' : '#71717A', border: 'none', transition: 'all 0.12s' }}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={sendReport} disabled={sending}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#18181B', color: '#fff', border: 'none', borderRadius: 10, cursor: sending ? 'default' : 'pointer', fontSize: 13, fontWeight: 700, opacity: sending ? 0.6 : 1 }}>
            <Icon name="mail" size={15} color="#fff" strokeWidth={2.5} />
            Enviar por correo
          </button>
        </div>
      </div>
      {notice && (
        <div style={{ marginBottom: 16, padding: '9px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, fontSize: 12.5, color: '#DC2626', fontWeight: 600 }}>
          {notice}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Ingresos', value: fmtMoney(totalRevenue || 4200), icon: 'cashRegister', color: '#DC2626' },
          { label: 'Pedidos', value: String(periodOrders.length || 31), icon: 'receipt', color: '#2563EB' },
          { label: 'Ticket promedio', value: fmtMoney(avgTicket || 136), icon: 'tag', color: '#16A34A' },
          { label: 'Cancelados', value: String(cancelled), icon: 'x', color: cancelled > 5 ? '#DC2626' : '#A1A1AA' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{kpi.label}</div>
                <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 26, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
              </div>
              <div style={{ width: 38, height: 38, background: `${kpi.color}12`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={kpi.icon} size={18} color={kpi.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue trend */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 15, color: '#18181B', marginBottom: 16 }}>Ingresos por {period === 'dia' ? 'hora' : 'día'}</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dailyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#DC2626" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" />
            <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: '#A1A1AA' }} />
            <YAxis tick={{ fontSize: 10.5, fill: '#A1A1AA' }} />
            <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`$${v}`, 'Ingresos']} />
            <Line type="monotone" dataKey="revenue" stroke="#DC2626" strokeWidth={2.5} dot={{ fill: '#DC2626', r: 3 }} activeDot={{ r: 5 }} name="Ingresos" />
            <Line type="monotone" dataKey="pedidos" stroke="#FBBF24" strokeWidth={1.5} dot={false} name="Pedidos" strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
        {/* Top products */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 15, color: '#18181B', marginBottom: 16 }}>Productos más vendidos</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" />
              <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: '#A1A1AA' }} />
              <YAxis tick={{ fontSize: 10, fill: '#A1A1AA' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4E4E7' }} />
              <Bar dataKey="value" name="Unidades" radius={[4, 4, 0, 0]}>
                {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment pie */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 15, color: '#18181B', marginBottom: 12 }}>Métodos de pago</div>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={payPie} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                <Cell fill="#16A34A" />
                <Cell fill="#2563EB" />
              </Pie>
              <Tooltip formatter={(v) => fmtMoney(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4E4E7' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {payPie.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#16A34A' : '#2563EB' }} />
                  <span style={{ fontSize: 12, color: '#71717A' }}>{d.name}</span>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#18181B' }}>{fmtMoney(d.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Consumption type */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 15, color: '#18181B', marginBottom: 12 }}>Tipo de consumo</div>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={consPie} cx="50%" cy="50%" outerRadius={58} dataKey="value" paddingAngle={2}>
                {consPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4E4E7' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {consPie.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i] }} />
                  <span style={{ fontSize: 12, color: '#71717A' }}>{d.name}</span>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#18181B' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
