import { useRef, useState } from 'react'
import { useApp } from '../context'
import type { BusinessSettings } from '../types'
import Icon from '../components/Icon'

interface ConfigSection {
  id: string
  label: string
  icon: string
}

const SECTIONS: ConfigSection[] = [
  { id: 'negocio', label: 'Negocio', icon: 'pizza' },
  { id: 'caja', label: 'Caja y reportes', icon: 'cashRegister' },
  { id: 'sistema', label: 'Sistema', icon: 'settings' },
  { id: 'ticket', label: 'Ticket e impresión', icon: 'receipt' },
  { id: 'delivery', label: 'Delivery', icon: 'bag' },
]

export default function Configuracion() {
  const { settings, setSettings, addAudit, currentUser } = useApp()
  const [active, setActive] = useState('negocio')
  const [saved, setSaved] = useState(false)
  const [draft, setDraft] = useState<BusinessSettings>(settings)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function patch(p: Partial<BusinessSettings>) {
    setDraft(d => ({ ...d, ...p }))
  }

  function save() {
    setSettings(draft)
    addAudit({ action: 'Actualización de configuración', module: 'Configuración', detail: `Sección: ${active}`, user: currentUser?.name ?? 'Sistema' })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleLogoFile(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => patch({ logoUrl: String(reader.result || '') })
    reader.readAsDataURL(file)
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
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#71717A', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Logo del comercio
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 14, background: draft.logoUrl ? '#FFFFFF' : '#DC2626', border: '1.5px solid #E4E4E7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {draft.logoUrl
                        ? <img src={draft.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <Icon name="pizza" size={28} color="#fff" strokeWidth={1.5} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => handleLogoFile(e.target.files?.[0] ?? null)} />
                      <button onClick={() => fileInputRef.current?.click()}
                        style={{ padding: '8px 14px', background: '#F7F7F8', border: '1px solid #E4E4E7', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color: '#18181B' }}>
                        {draft.logoUrl ? 'Cambiar logo' : 'Subir logo'}
                      </button>
                      {draft.logoUrl && (
                        <button onClick={() => patch({ logoUrl: '' })}
                          style={{ padding: '6px 14px', background: 'none', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#DC2626' }}>
                          Quitar logo
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#A1A1AA', marginTop: 8 }}>
                    Aparece en la pantalla de inicio de sesión, en lugar del ícono por defecto.
                  </div>
                </div>
                <Field label="Nombre del establecimiento" value={draft.name} onChange={v => patch({ name: v })} />
                <Field label="Dirección" value={draft.address} onChange={v => patch({ address: v })} />
                <Field label="Teléfono" value={draft.phone} onChange={v => patch({ phone: v })} />
                <Field label="RFC" value={draft.rfc} onChange={v => patch({ rfc: v })} />
                <Field label="IVA (%)" value={String(draft.tax)} type="number" onChange={v => patch({ tax: Number(v) })} />
              </Section>
            )}
            {active === 'caja' && (
              <Section title="Caja y reportes">
                <div>
                  <Field label="Fondo inicial de caja ($)" value={String(draft.initialFloat)} type="number" onChange={v => patch({ initialFloat: Number(v) })} />
                  <div style={{ fontSize: 11.5, color: '#A1A1AA', marginTop: -8 }}>
                    Monto con el que arranca la caja cada turno. Como puede variar de un día a otro, también se puede ajustar directamente desde Corte de Caja el día que aplique.
                  </div>
                </div>
                <div>
                  <Field label="Correo para reportes" value={draft.reportEmail} type="email" onChange={v => patch({ reportEmail: v })} />
                  <div style={{ fontSize: 11.5, color: '#A1A1AA', marginTop: -8 }}>
                    Dirección a la que se enviarán los reportes y métricas desde Dashboard y Reportes.
                  </div>
                </div>
              </Section>
            )}
            {active === 'sistema' && (
              <Section title="Sistema">
                <Field label="Moneda" value={draft.currency} onChange={v => patch({ currency: v })} />
                <Field label="Zona horaria" value={draft.timezone} onChange={v => patch({ timezone: v })} />
                <Field label="Idioma" value={draft.language} onChange={v => patch({ language: v })} />
                <Field label="Cierre de sesión automático (min)" value={String(draft.autoLogout)} type="number" onChange={v => patch({ autoLogout: Number(v) })} />
              </Section>
            )}
            {active === 'ticket' && (
              <Section title="Ticket e impresión">
                <Field label="Encabezado del ticket" value={draft.ticketHeader} onChange={v => patch({ ticketHeader: v })} />
                <Field label="Pie de página" value={draft.ticketFooter} onChange={v => patch({ ticketFooter: v })} />
                <Field label="Ancho del papel (mm)" value={String(draft.printerWidth)} type="number" onChange={v => patch({ printerWidth: Number(v) })} />
                <Toggle label="Mostrar logo" value={draft.ticketShowLogo} onChange={v => patch({ ticketShowLogo: v })} />
              </Section>
            )}
            {active === 'delivery' && (
              <Section title="Delivery">
                <Field label="Tarifa base ($)" value={String(draft.deliveryBaseRate)} type="number" onChange={v => patch({ deliveryBaseRate: Number(v) })} />
                <Field label="Mínimo para delivery gratis ($)" value={String(draft.deliveryFreeThreshold)} type="number" onChange={v => patch({ deliveryFreeThreshold: Number(v) })} />
                <Field label="Radio de cobertura (km)" value={String(draft.deliveryRadiusKm)} type="number" onChange={v => patch({ deliveryRadiusKm: Number(v) })} />
                <Field label="Tiempo estimado de entrega (min)" value={String(draft.deliveryEstimatedMinutes)} type="number" onChange={v => patch({ deliveryEstimatedMinutes: Number(v) })} />
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
