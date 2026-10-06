import { useState } from 'react'
import { useApp } from '../context'
import Icon from '../components/Icon'

const MODULE_COLORS: Record<string, string> = {
  'Pedidos': '#2563EB',
  'Inventario': '#16A34A',
  'Usuarios': '#7C3AED',
  'Productos': '#D97706',
  'Configuración': '#0891B2',
  'Caja': '#DC2626',
  'Sistema': '#71717A',
}

export default function Auditoria() {
  const { auditLog } = useApp()
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string>('todos')

  const modules = Array.from(new Set(auditLog.map(a => a.module)))
  const filtered = auditLog.filter(a => {
    const matchModule = moduleFilter === 'todos' || a.module === moduleFilter
    const matchSearch = !search || a.action.toLowerCase().includes(search.toLowerCase()) || a.user.toLowerCase().includes(search.toLowerCase()) || a.detail.toLowerCase().includes(search.toLowerCase())
    return matchModule && matchSearch
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  function fmtTime(d: Date) {
    return d.toLocaleString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F7F8' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E4E7', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 20, color: '#18181B' }}>Auditoría</div>
          <div style={{ fontSize: 12, color: '#A1A1AA', marginTop: 2 }}>{filtered.length} registros</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E4E7', padding: '12px 24px', display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: '#F7F7F8', border: '1.5px solid #E4E4E7', borderRadius: 9, flex: '0 0 240px' }}>
          <Icon name="search" size={14} color="#A1A1AA" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…"
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13.5, color: '#18181B', width: '100%' }} />
        </div>
        {/* Module filter */}
        <button onClick={() => setModuleFilter('todos')}
          style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: moduleFilter === 'todos' ? '#F4F4F5' : '#FAFAFA', color: moduleFilter === 'todos' ? '#18181B' : '#71717A', border: '1px solid #E4E4E7' }}>
          Todos
        </button>
        {modules.map(mod => {
          const c = MODULE_COLORS[mod] || '#71717A'
          const active = moduleFilter === mod
          return (
            <button key={mod} onClick={() => setModuleFilter(mod)}
              style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: active ? `${c}15` : '#FAFAFA', color: active ? c : '#71717A', border: `1px solid ${active ? `${c}40` : '#E4E4E7'}` }}>
              {mod}
            </button>
          )
        })}
      </div>

      {/* Log */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#A1A1AA' }}>
            <Icon name="search" size={40} color="#D4D4D8" />
            <div style={{ fontSize: 14, marginTop: 12 }}>Sin registros encontrados</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(entry => {
              const color = MODULE_COLORS[entry.module] || '#71717A'
              return (
                <div key={entry.id} style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderLeft: `3px solid ${color}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="clipboard" size={16} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#18181B' }}>{entry.action}</span>
                      <span style={{ padding: '1px 7px', borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: `${color}15`, color }}>
                        {entry.module}
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#71717A', marginTop: 3 }}>{entry.detail}</div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                      <span style={{ fontSize: 11.5, color: '#A1A1AA', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="users" size={11} color="#D4D4D8" /> {entry.user}
                      </span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#A1A1AA' }}>
                        {fmtTime(entry.timestamp)}
                      </span>
                    </div>
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
