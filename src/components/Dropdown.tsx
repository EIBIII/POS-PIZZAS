import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

export interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  value: string
  onChange: (v: string) => void
  options: DropdownOption[]
  placeholder?: string
  icon?: string
  accentColor?: string
  small?: boolean
}

// Reemplaza <select> nativo: el navegador no permite estilizar la lista
// desplegada de un <select> de forma consistente entre navegadores/SO, así
// que esto se dibuja completamente con nuestros propios estilos.
export default function Dropdown({ value, onChange, options, placeholder = 'Selecciona...', icon, accentColor = '#DC2626', small }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 6,
          padding: small ? '7px 8px' : '8px 10px', fontSize: small ? 12 : 12.5,
          background: '#F7F7F8', color: selected ? '#18181B' : '#A1A1AA',
          border: `1.5px solid ${open ? accentColor : '#E4E4E7'}`, borderRadius: 8,
          cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left',
        }}
      >
        {icon && <Icon name={icon} size={13} color={selected ? accentColor : '#A1A1AA'} />}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <Icon name="chevronDown" size={13} color="#A1A1AA" />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 50,
          background: '#FFFFFF', border: '1.5px solid #E4E4E7', borderRadius: 10,
          boxShadow: '0 12px 32px rgba(0,0,0,0.14)', maxHeight: 240, overflowY: 'auto', padding: 5,
        }}>
          {options.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 12.5, color: '#A1A1AA' }}>Sin opciones</div>
          )}
          {options.map(o => {
            const sel = o.value === value
            return (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false) }}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 7,
                  fontSize: 12.5, fontWeight: sel ? 700 : 500, cursor: 'pointer', border: 'none',
                  background: sel ? `${accentColor}14` : 'transparent', color: sel ? accentColor : '#3F3F46',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                }}
                onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = '#F7F7F8' }}
                onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
                {sel && <Icon name="check" size={12} color={accentColor} strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
