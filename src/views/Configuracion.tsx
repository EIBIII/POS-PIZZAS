import { useState } from 'react'
import { useApp } from '../context'
import Icon from '../components/Icon'

interface ConfigSection {
  id: string
  label: string
  icon: string
}

const SECTIONS: ConfigSection[] = [
  { id: 'negocio', label: 'Negocio', icon: 'pizza' },
  { id: 'sistema', label: 'Sistema', icon: 'settings' },
  { id: 'ticket', label: 'Ticket e impresión', icon: 'receipt' },
  { id: 'delivery', label: 'Delivery', icon: 'bag' },
]

export default function Configuracion() {
  const { addAudit, currentUser } = useApp()
  const [active, setActive] = useState('negocio')
  const [saved, setSaved] = useState(false)

  const [biz, setBiz] = useState({ name: 'PIZZAIAS', address: 'Av. Insurgentes 420, CDMX', phone: '55 1234 5678', rfc: 'PIZ123456ABC', tax: 16 })
  const [sys, setSys] = useState({ currency: 'MXN', timezone: 'America/Mexico_City', language: 'es', autoLogout: 30 })
  const [ticket, setTicket] = useState({ header: 'PIZZAIAS', footer: 'Gracias por su visita', showLogo: true, printerWidth: 80 })
  const [delivery, setDelivery] = useState({ baseRate: 35, freeThreshold: 400, radiusKm: 5, estimatedMinutes: 45 })

  function save() {
    addAudit({ action: 'Actualización de configuración', module: 'Configuración', detail: `Sección: ${active}`, user: currentUser?.name ?? 'Sistema' })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F7F8' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E4E7', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 20, color: '#18181B' }}>Configuración</div>
        <button onClick={save}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', background: saved ? '#16A34A' : '#DC2626', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: 700, transition: 'background 0.2s', boxShadow: `0 2px 8px ${saved ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.25)'}` }}>
          <Icon name={saved ? 'check' : 'save'} size={15} color="#fff" strokeWidth={2.5} />
          {saved ? 'Guardado' : 'Guardar cambios'}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Side nav */}
        <div style={{ width: 220, background: '#FFFFFF', borderRight: '1px solid #E4E4E7', padding: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)}
                style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', background: active === s.id ? '#FEF2F2' : 'none', color: active === s.id ? '#DC2626' : '#71717A', border: `1px solid ${active === s.id ? '#FECACA' : 'transparent'}`, display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left', transition: 'all 0.12s' }}>
                <Icon name={s.icon} size={16} color={active === s.id ? '#DC2626' : '#A1A1AA'} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          <div style={{ maxWidth: 560 }}>
            {active === 'negocio' && (
              <Section title="Datos del negocio">
                <Field label="Nombre del establecimiento" value={biz.name} onChange={v => setBiz({ ...biz, name: v })} />
                <Field label="Dirección" value={biz.address} onChange={v => setBiz({ ...biz, address: v })} />
                <Field label="Teléfono" value={biz.phone} onChange={v => setBiz({ ...biz, phone: v })} />
                <Field label="RFC" value={biz.rfc} onChange={v => setBiz({ ...biz, rfc: v })} />
                <Field label="IVA (%)" value={String(biz.tax)} type="number" onChange={v => setBiz({ ...biz, tax: Number(v) })} />
              </Section>
            )}
            {active === 'sistema' && (
              <Section title="Sistema">
                <Field label="Moneda" value={sys.currency} onChange={v => setSys({ ...sys, currency: v })} />
                <Field label="Zona horaria" value={sys.timezone} onChange={v => setSys({ ...sys, timezone: v })} />
                <Field label="Idioma" value={sys.language} onChange={v => setSys({ ...sys, language: v })} />
                <Field label="Cierre de sesión automático (min)" value={String(sys.autoLogout)} type="number" onChange={v => setSys({ ...sys, autoLogout: Number(v) })} />
              </Section>
            )}
            {active === 'ticket' && (
              <Section title="Ticket e impresión">
                <Field label="Encabezado del ticket" value={ticket.header} onChange={v => setTicket({ ...ticket, header: v })} />
                <Field label="Pie de página" value={ticket.footer} onChange={v => setTicket({ ...ticket, footer: v })} />
                <Field label="Ancho del papel (mm)" value={String(ticket.printerWidth)} type="number" onChange={v => setTicket({ ...ticket, printerWidth: Number(v) })} />
                <Toggle label="Mostrar logo" value={ticket.showLogo} onChange={v => setTicket({ ...ticket, showLogo: v })} />
              </Section>
            )}
            {active === 'delivery' && (
              <Section title="Delivery">
                <Field label="Tarifa base ($)" value={String(delivery.baseRate)} type="number" onChange={v => setDelivery({ ...delivery, baseRate: Number(v) })} />
                <Field label="Mínimo para delivery gratis ($)" value={String(delivery.freeThreshold)} type="number" onChange={v => setDelivery({ ...delivery, freeThreshold: Number(v) })} />
                <Field label="Radio de cobertura (km)" value={String(delivery.radiusKm)} type="number" onChange={v => setDelivery({ ...delivery, radiusKm: Number(v) })} />
                <Field label="Tiempo estimado de entrega (min)" value={String(delivery.estimatedMinutes)} type="number" onChange={v => setDelivery({ ...delivery, estimatedMinutes: Number(v) })} />
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 17, color: '#18181B', marginBottom: 20 }}>{title}</div>
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 14, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#71717A', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1.5px solid #E4E4E7', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: type === 'number' ? 'JetBrains Mono, monospace' : 'Inter, sans-serif', transition: 'border-color 0.12s' }}
        onFocus={e => (e.currentTarget.style.borderColor = '#DC2626')}
        onBlur={e => (e.currentTarget.style.borderColor = '#E4E4E7')}
      />
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#3F3F46' }}>{label}</span>
      <button onClick={() => onChange(!value)}
        style={{ width: 44, height: 24, borderRadius: 12, background: value ? '#DC2626' : '#E4E4E7', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  )
}
