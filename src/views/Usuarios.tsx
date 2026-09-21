import { useState } from 'react'
import { useApp } from '../context'
import type { User, UserRole, Role } from '../types'
import { PERMISSION_MODULES } from '../types'
import Icon from '../components/Icon'

const COLOR_SWATCHES = ['#DC2626', '#D97706', '#2563EB', '#16A34A', '#7C3AED', '#0891B2', '#DB2777', '#65A30D']

const SECTIONS = ['usuarios', 'roles'] as const
type Section = typeof SECTIONS[number]

const BLANK: Omit<User, 'id'> = { name: '', username: '', password: '', pin: '', role: 'cajero', active: true }
const BLANK_ROLE_PERMS: Record<string, boolean> = Object.fromEntries(PERMISSION_MODULES.map(p => [p.key, false]))
const BLANK_ROLE = { label: '', color: COLOR_SWATCHES[0], permissions: { ...BLANK_ROLE_PERMS } }

function slugify(label: string) {
  return label.trim().toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'rol'
}

export default function Usuarios() {
  const { users, setUsers, roles, setRoles, currentUser } = useApp()
  const [section, setSection] = useState<Section>('usuarios')
  const [filter, setFilter] = useState<UserRole | 'todos'>('todos')
  const [editUser, setEditUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState(false)
  const [form, setForm] = useState<Omit<User, 'id'>>(BLANK)

  const [editRole, setEditRole] = useState<Role | null>(null)
  const [newRole, setNewRole] = useState(false)
  const [roleForm, setRoleForm] = useState<{ label: string; color: string; permissions: Record<string, boolean> }>(BLANK_ROLE)
  const [roleError, setRoleError] = useState('')

  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin'

  const filtered = users.filter(u => filter === 'todos' || u.role === filter)

  function saveUser() {
    if (!form.name || !form.username || !form.pin) return
    if (editUser) {
      setUsers(users.map(u => u.id === editUser.id ? { ...editUser, ...form } : u))
    } else {
      setUsers([...users, { ...form, id: `u${Date.now()}` }])
    }
    setEditUser(null)
    setNewUser(false)
    setForm(BLANK)
  }

  function openEdit(u: User) {
    setEditUser(u)
    setForm({ name: u.name, username: u.username, password: u.password, pin: u.pin, role: u.role, active: u.active, phone: u.phone, email: u.email })
    setNewUser(false)
  }

  function toggleActive(id: string) {
    setUsers(users.map(u => u.id === id ? { ...u, active: !u.active } : u))
  }

  function deleteUser(id: string) {
    setUsers(users.filter(u => u.id !== id))
  }

  const showForm = editUser !== null || newUser

  function openNewRole() {
    setEditRole(null)
    setNewRole(true)
    setRoleForm({ ...BLANK_ROLE, permissions: { ...BLANK_ROLE_PERMS } })
    setRoleError('')
  }

  function openEditRole(r: Role) {
    setEditRole(r)
    setNewRole(false)
    setRoleForm({ label: r.label, color: r.color, permissions: { ...r.permissions } })
    setRoleError('')
  }

  function closeRoleForm() {
    setEditRole(null)
    setNewRole(false)
    setRoleError('')
  }

  function toggleRoleFormPerm(key: string) {
    setRoleForm(f => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }))
  }

  function saveRole() {
    if (!roleForm.label.trim()) { setRoleError('El nombre del rol es obligatorio.'); return }
    if (editRole) {
      setRoles(roles.map(r => r.id === editRole.id ? { ...r, label: roleForm.label.trim(), color: roleForm.color, permissions: roleForm.permissions } : r))
    } else {
      let id = slugify(roleForm.label)
      if (roles.some(r => r.id === id)) id = `${id}_${Date.now().toString().slice(-4)}`
      setRoles([...roles, { id, label: roleForm.label.trim(), color: roleForm.color, permissions: roleForm.permissions }])
    }
    closeRoleForm()
  }

  function deleteRole(id: string) {
    if (users.some(u => u.role === id)) {
      setRoleError('No se puede eliminar: hay usuarios con este rol asignado.')
      return
    }
    setRoles(roles.filter(r => r.id !== id))
    setRoleError('')
  }

  // Toggle rápido de un permiso directo desde la tabla (sin abrir el panel de edición)
  function toggleTablePerm(roleId: string, permKey: string) {
    setRoles(roles.map(r => r.id === roleId ? { ...r, permissions: { ...r.permissions, [permKey]: !r.permissions[permKey] } } : r))
  }

  const showRoleForm = editRole !== null || newRole

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F7F8' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E4E7', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 20, color: '#18181B' }}>Gestión de Usuarios</div>
        {section === 'usuarios' && isSuperAdmin && (
          <button onClick={() => { setNewUser(true); setEditUser(null); setForm(BLANK) }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: 700, boxShadow: '0 2px 8px rgba(220,38,38,0.25)' }}>
            <Icon name="plus" size={15} color="#fff" strokeWidth={2.5} /> Nuevo usuario
          </button>
        )}
      </div>

      {/* Sub-nav */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E4E7', padding: '0 24px', display: 'flex', flexShrink: 0 }}>
        {([['usuarios', 'users', 'Usuarios'], ['roles', 'lock', 'Roles y Permisos']] as const).map(([id, icon, label]) => (
          <button key={id} onClick={() => setSection(id as Section)}
            style={{ padding: '12px 20px', fontSize: 13.5, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: section === id ? '#DC2626' : '#A1A1AA', borderBottom: `3px solid ${section === id ? '#DC2626' : 'transparent'}`, display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.12s' }}>
            <Icon name={icon} size={14} color={section === id ? '#DC2626' : '#A1A1AA'} />
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {section === 'usuarios' ? (
          <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr 380px' : '1fr', gap: 20 }}>
            {/* User list */}
            <div>
              {/* Role filter */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                <FilterChip label="Todos" active={filter === 'todos'} color="#71717A" onClick={() => setFilter('todos')} />
                {roles.map(r => <FilterChip key={r.id} label={r.label} active={filter === r.id} color={r.color} onClick={() => setFilter(r.id)} />)}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(u => {
                  const role = roles.find(r => r.id === u.role)
                  return (
                    <div key={u.id} style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, opacity: u.active ? 1 : 0.55 }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${role?.color ?? '#DC2626'}15`, border: `2px solid ${role?.color ?? '#DC2626'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'Cooper Black, serif', fontSize: 16, color: role?.color ?? '#DC2626' }}>{u.name.charAt(0)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#18181B' }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: '#A1A1AA', fontFamily: 'JetBrains Mono, monospace' }}>@{u.username}</div>
                      </div>
                      <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: `${role?.color ?? '#DC2626'}15`, color: role?.color ?? '#DC2626' }}>
                        {role?.label ?? u.role}
                      </span>
                      {isSuperAdmin && (
                        <div style={{ display: 'flex', gap: 5 }}>
                          <IconBtn icon="pencil" color="#71717A" onClick={() => openEdit(u)} />
                          <IconBtn icon="check" color={u.active ? '#16A34A' : '#A1A1AA'} onClick={() => toggleActive(u.id)} title={u.active ? 'Desactivar' : 'Activar'} />
                          {u.id !== currentUser?.id && <IconBtn icon="trash" color="#DC2626" onClick={() => deleteUser(u.id)} />}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Form panel */}
            {showForm && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 16, padding: 24, alignSelf: 'start', position: 'sticky', top: 0 }}>
                <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 16, color: '#18181B', marginBottom: 20 }}>{editUser ? 'Editar usuario' : 'Nuevo usuario'}</div>
                {([['name', 'Nombre completo', 'text'], ['username', 'Usuario', 'text'], ['password', 'Contraseña', 'password'], ['pin', 'PIN (4 dígitos)', 'text'], ['phone', 'Teléfono', 'text'], ['email', 'Email', 'email']] as const).map(([key, label, type]) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#71717A', display: 'block', marginBottom: 5 }}>{label}</label>
                    <input type={type} value={(form as any)[key] ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E4E4E7', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }} />
                  </div>
                ))}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#71717A', display: 'block', marginBottom: 5 }}>Rol</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E4E4E7', fontSize: 13.5, outline: 'none', fontFamily: 'Inter, sans-serif', background: '#FFFFFF' }}>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                  <button onClick={() => { setEditUser(null); setNewUser(false) }}
                    style={{ flex: 1, padding: '9px', background: '#F7F7F8', border: '1px solid #E4E4E7', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', color: '#71717A' }}>
                    Cancelar
                  </button>
                  <button onClick={saveUser}
                    style={{ flex: 2, padding: '9px', background: '#DC2626', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Roles CRUD */
          <div style={{ display: 'grid', gridTemplateColumns: showRoleForm ? '1fr 380px' : '1fr', gap: 20 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E4E4E7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 15, color: '#18181B' }}>Roles y permisos</div>
                  <div style={{ fontSize: 12, color: '#A1A1AA', marginTop: 3 }}>
                    {isSuperAdmin ? 'Da clic en un permiso para activarlo o desactivarlo, o edita el rol completo.' : 'Vista de solo lectura.'}
                  </div>
                </div>
                {isSuperAdmin && (
                  <button onClick={openNewRole}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: 700, boxShadow: '0 2px 8px rgba(220,38,38,0.25)', flexShrink: 0 }}>
                    <Icon name="plus" size={15} color="#fff" strokeWidth={2.5} /> Nuevo rol
                  </button>
                )}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F7F7F8' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#71717A', borderBottom: '1px solid #E4E4E7', position: 'sticky', left: 0, background: '#F7F7F8', minWidth: 160 }}>
                        Módulo
                      </th>
                      {roles.map(r => (
                        <th key={r.id} style={{ padding: '12px 16px', fontSize: 11.5, fontWeight: 700, color: r.color, borderBottom: '1px solid #E4E4E7', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            {r.label}
                            {isSuperAdmin && (
                              <span style={{ display: 'flex', gap: 3 }}>
                                <IconBtn icon="pencil" color="#71717A" onClick={() => openEditRole(r)} title="Editar rol" />
                                <IconBtn icon="trash" color="#DC2626" onClick={() => deleteRole(r.id)} title="Eliminar rol" />
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSION_MODULES.map((perm, idx) => (
                      <tr key={perm.key} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                        <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#18181B', borderBottom: '1px solid #F4F4F5', position: 'sticky', left: 0, background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                          {perm.label}
                        </td>
                        {roles.map(r => {
                          const has = r.permissions[perm.key]
                          return (
                            <td key={r.id} style={{ padding: '10px 16px', textAlign: 'center', borderBottom: '1px solid #F4F4F5' }}>
                              <button
                                disabled={!isSuperAdmin}
                                onClick={() => toggleTablePerm(r.id, perm.key)}
                                title={isSuperAdmin ? 'Clic para cambiar' : undefined}
                                style={{ display: 'inline-flex', width: 22, height: 22, background: has ? '#DCFCE7' : '#F4F4F5', borderRadius: 6, alignItems: 'center', justifyContent: 'center', border: 'none', cursor: isSuperAdmin ? 'pointer' : 'default', padding: 0 }}>
                                {has ? <Icon name="check" size={13} color="#16A34A" strokeWidth={2.5} /> : <Icon name="x" size={13} color="#D4D4D8" strokeWidth={2.5} />}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Role form panel */}
            {showRoleForm && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 16, padding: 24, alignSelf: 'start', position: 'sticky', top: 0 }}>
                <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 16, color: '#18181B', marginBottom: 20 }}>{editRole ? 'Editar rol' : 'Nuevo rol'}</div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#71717A', display: 'block', marginBottom: 5 }}>Nombre del rol</label>
                  <input type="text" value={roleForm.label} onChange={e => setRoleForm({ ...roleForm, label: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E4E4E7', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#71717A', display: 'block', marginBottom: 7 }}>Color</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {COLOR_SWATCHES.map(c => (
                      <button key={c} onClick={() => setRoleForm({ ...roleForm, color: c })}
                        style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: roleForm.color === c ? '3px solid #18181B' : '1px solid #E4E4E7', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#71717A', display: 'block', marginBottom: 7 }}>Permisos por módulo</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
                    {PERMISSION_MODULES.map(p => (
                      <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 7, background: '#F7F7F8', cursor: 'pointer', fontSize: 13 }}>
                        <input type="checkbox" checked={!!roleForm.permissions[p.key]} onChange={() => toggleRoleFormPerm(p.key)} />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>

                {roleError && <div style={{ marginTop: 10, fontSize: 12, color: '#DC2626', fontWeight: 600 }}>{roleError}</div>}

                <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                  <button onClick={closeRoleForm}
                    style={{ flex: 1, padding: '9px', background: '#F7F7F8', border: '1px solid #E4E4E7', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', color: '#71717A' }}>
                    Cancelar
                  </button>
                  <button onClick={saveRole}
                    style={{ flex: 2, padding: '9px', background: '#DC2626', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {section === 'roles' && roleError && !showRoleForm && (
          <div style={{ marginTop: 12, fontSize: 12.5, color: '#DC2626', fontWeight: 600 }}>{roleError}</div>
        )}
      </div>
    </div>
  )
}

function FilterChip({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: active ? `${color}15` : '#F7F7F8', color: active ? color : '#71717A', border: `1.5px solid ${active ? `${color}40` : '#E4E4E7'}`, transition: 'all 0.12s' }}>
      {label}
    </button>
  )
}

function IconBtn({ icon, color, onClick, title }: { icon: string; color: string; onClick: () => void; title?: string }) {
  return (
    <button onClick={onClick} title={title} style={{ width: 32, height: 32, background: 'none', border: '1px solid #E4E4E7', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}12`; (e.currentTarget as HTMLElement).style.borderColor = color }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.borderColor = '#E4E4E7' }}>
      <Icon name={icon} size={14} color={color} />
    </button>
  )
}
