import { useState } from 'react'
import { useApp } from '../context'
import type { Ingredient, IngredientCategory } from '../types'
import Icon from '../components/Icon'

type StockFilter = 'todos' | 'bajo' | 'ok'

const BLANK_ING: Omit<Ingredient, 'id'> = { name: '', unit: 'g', stock: 0, minStock: 0, cost: 0, provider: '', categoryId: 'cat1' }
const BLANK_CAT: Omit<IngredientCategory, 'id'> = { name: '', color: '#DC2626' }

export default function Inventario() {
  const { ingredients, setIngredients, ingredientCategories, setIngredientCategories } = useApp()
  const [section, setSection] = useState<'ingredientes' | 'categorias'>('ingredientes')
  const [catFilter, setCatFilter] = useState<string>('todos')
  const [stockFilter, setStockFilter] = useState<StockFilter>('todos')
  const [selected, setSelected] = useState<Ingredient | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState<Omit<Ingredient, 'id'>>(BLANK_ING)
  const [editCat, setEditCat] = useState<IngredientCategory | null>(null)
  const [newCat, setNewCat] = useState(false)
  const [catForm, setCatForm] = useState<Omit<IngredientCategory, 'id'>>(BLANK_CAT)
  const [moveModal, setMoveModal] = useState<{ ing: Ingredient; type: 'entrada' | 'salida' | 'ajuste' } | null>(null)
  const [moveQty, setMoveQty] = useState(0)

  const filtered = ingredients.filter(ing => {
    const catOk = catFilter === 'todos' || ing.categoryId === catFilter
    const stockOk = stockFilter === 'todos' || (stockFilter === 'bajo' ? ing.stock <= ing.minStock : ing.stock > ing.minStock)
    return catOk && stockOk
  })

  function openIng(ing: Ingredient) {
    setSelected(ing)
    setIsNew(false)
    setForm({ name: ing.name, unit: ing.unit, stock: ing.stock, minStock: ing.minStock, cost: ing.cost, provider: ing.provider, categoryId: ing.categoryId, customPrice: ing.customPrice })
  }

  function openNew() {
    setIsNew(true)
    setSelected(null)
    setForm(BLANK_ING)
  }

  function saveIng() {
    if (!form.name) return
    if (selected) {
      setIngredients(ingredients.map(i => i.id === selected.id ? { ...selected, ...form } : i))
    } else {
      setIngredients([...ingredients, { ...form, id: `ing-${Date.now()}` }])
    }
    setSelected(null)
    setIsNew(false)
  }

  function deleteIng(id: string) {
    setIngredients(ingredients.filter(i => i.id !== id))
    setSelected(null)
  }

  function applyMove() {
    if (!moveModal) return
    setIngredients(ingredients.map(i => {
      if (i.id !== moveModal.ing.id) return i
      const delta = moveModal.type === 'salida' ? -moveQty : moveQty
      return { ...i, stock: Math.max(0, i.stock + delta) }
    }))
    setMoveModal(null)
    setMoveQty(0)
  }

  function saveCat() {
    if (!catForm.name) return
    if (editCat) {
      setIngredientCategories(ingredientCategories.map(c => c.id === editCat.id ? { ...editCat, ...catForm } : c))
    } else {
      setIngredientCategories([...ingredientCategories, { ...catForm, id: `cat-${Date.now()}` }])
    }
    setEditCat(null)
    setNewCat(false)
    setCatForm(BLANK_CAT)
  }

  const showPanel = selected !== null || isNew

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F7F8' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E4E7', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 20, color: '#18181B' }}>Inventario</div>
        {section === 'ingredientes' && (
          <button onClick={openNew}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: 700, boxShadow: '0 2px 8px rgba(220,38,38,0.25)' }}>
            <Icon name="plus" size={15} color="#fff" strokeWidth={2.5} /> Nuevo ingrediente
          </button>
        )}
        {section === 'categorias' && (
          <button onClick={() => { setNewCat(true); setEditCat(null); setCatForm(BLANK_CAT) }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: 700, boxShadow: '0 2px 8px rgba(220,38,38,0.25)' }}>
            <Icon name="plus" size={15} color="#fff" strokeWidth={2.5} /> Nueva categoría
          </button>
        )}
      </div>

      {/* Sub-nav */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E4E7', padding: '0 24px', display: 'flex', flexShrink: 0 }}>
        {([['ingredientes', 'package', 'Ingredientes'], ['categorias', 'tag', 'Categorías']] as const).map(([id, icon, label]) => (
          <button key={id} onClick={() => setSection(id as any)}
            style={{ padding: '12px 20px', fontSize: 13.5, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: section === id ? '#DC2626' : '#A1A1AA', borderBottom: `3px solid ${section === id ? '#DC2626' : 'transparent'}`, display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.12s' }}>
            <Icon name={icon} size={14} color={section === id ? '#DC2626' : '#A1A1AA'} />
            {label}
          </button>
        ))}
      </div>

      {section === 'categorias' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: newCat || editCat ? '1fr 340px' : '1fr', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ingredientCategories.map(cat => (
                <div key={cat.id} style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 4, background: cat.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#18181B' }}>{cat.name}</div>
                    <div style={{ fontSize: 12, color: '#A1A1AA', marginTop: 2 }}>{ingredients.filter(i => i.categoryId === cat.id).length} productos</div>
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => { setEditCat(cat); setNewCat(false); setCatForm({ name: cat.name, color: cat.color }) }}
                      style={{ width: 32, height: 32, background: 'none', border: '1px solid #E4E4E7', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="pencil" size={14} color="#71717A" />
                    </button>
                    <button onClick={() => setIngredientCategories(ingredientCategories.filter(c => c.id !== cat.id))}
                      style={{ width: 32, height: 32, background: 'none', border: '1px solid #E4E4E7', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="trash" size={14} color="#DC2626" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {(newCat || editCat) && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 14, padding: 22, alignSelf: 'start' }}>
                <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 15, color: '#18181B', marginBottom: 18 }}>{editCat ? 'Editar categoría' : 'Nueva categoría'}</div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#71717A', display: 'block', marginBottom: 5 }}>Nombre</label>
                  <input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E4E4E7', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#71717A', display: 'block', marginBottom: 5 }}>Color</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {['#DC2626', '#D97706', '#16A34A', '#2563EB', '#7C3AED', '#0891B2', '#DB2777'].map(c => (
                      <button key={c} onClick={() => setCatForm({ ...catForm, color: c })}
                        style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: catForm.color === c ? '3px solid #18181B' : '3px solid transparent', cursor: 'pointer' }} />
                    ))}
                    <input type="color" value={catForm.color} onChange={e => setCatForm({ ...catForm, color: e.target.value })} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setEditCat(null); setNewCat(false) }} style={{ flex: 1, padding: '9px', background: '#F7F7F8', border: '1px solid #E4E4E7', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', color: '#71717A' }}>Cancelar</button>
                  <button onClick={saveCat} style={{ flex: 2, padding: '9px', background: '#DC2626', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>Guardar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Filters bar */}
          <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E4E7', padding: '10px 24px', display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#A1A1AA', alignSelf: 'center', marginRight: 4 }}>STOCK</span>
            {([['todos', 'Todos'], ['bajo', 'Bajo'], ['ok', 'OK']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setStockFilter(id)}
                style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: stockFilter === id ? (id === 'bajo' ? '#FEF2F2' : '#DCFCE7') : '#F7F7F8', color: stockFilter === id ? (id === 'bajo' ? '#DC2626' : '#16A34A') : '#71717A', border: `1px solid ${stockFilter === id ? (id === 'bajo' ? '#FECACA' : '#86EFAC') : '#E4E4E7'}` }}>
                {label}
              </button>
            ))}
            <div style={{ width: 1, background: '#E4E4E7', margin: '0 4px' }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#A1A1AA', alignSelf: 'center', marginRight: 4 }}>CATEGORÍA</span>
            <button onClick={() => setCatFilter('todos')}
              style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: catFilter === 'todos' ? '#F4F4F5' : '#FAFAFA', color: catFilter === 'todos' ? '#18181B' : '#71717A', border: '1px solid #E4E4E7' }}>
              Todos
            </button>
            {ingredientCategories.map(cat => (
              <button key={cat.id} onClick={() => setCatFilter(cat.id)}
                style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: catFilter === cat.id ? `${cat.color}15` : '#FAFAFA', color: catFilter === cat.id ? cat.color : '#71717A', border: `1px solid ${catFilter === cat.id ? `${cat.color}40` : '#E4E4E7'}` }}>
                {cat.name}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Ingredient list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filtered.map(ing => {
                  const cat = ingredientCategories.find(c => c.id === ing.categoryId)
                  const isLow = ing.stock <= ing.minStock
                  return (
                    <button key={ing.id} onClick={() => openIng(ing)}
                      style={{ background: selected?.id === ing.id ? '#FEF2F2' : '#FFFFFF', border: `1.5px solid ${selected?.id === ing.id ? '#DC2626' : isLow ? '#FECACA' : '#E4E4E7'}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s' }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: cat?.color ?? '#A1A1AA', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181B' }}>{ing.name}</div>
                        <div style={{ fontSize: 11.5, color: '#A1A1AA', marginTop: 1 }}>{cat?.name} · {ing.provider}</div>
                      </div>
                      {isLow && <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>Stock bajo</span>}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: isLow ? '#DC2626' : '#18181B' }}>{ing.stock} <span style={{ fontSize: 11, fontWeight: 500, color: '#A1A1AA' }}>{ing.unit}</span></div>
                        <div style={{ fontSize: 11, color: '#A1A1AA', marginTop: 1 }}>Mín: {ing.minStock}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={e => { e.stopPropagation(); setMoveModal({ ing, type: 'entrada' }) }}
                          style={{ padding: '5px 9px', background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', color: '#16A34A' }}>+</button>
                        <button onClick={e => { e.stopPropagation(); setMoveModal({ ing, type: 'salida' }) }}
                          style={{ padding: '5px 9px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', color: '#DC2626' }}>−</button>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Detail panel */}
            {showPanel && (
              <div style={{ width: 360, background: '#FFFFFF', borderLeft: '1px solid #E4E4E7', overflowY: 'auto', flexShrink: 0 }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid #E4E4E7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 16, color: '#18181B' }}>{isNew ? 'Nuevo ingrediente' : 'Editar ingrediente'}</div>
                  <button onClick={() => { setSelected(null); setIsNew(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA' }}>
                    <Icon name="x" size={18} />
                  </button>
                </div>
                <div style={{ padding: 20 }}>
                  {([['name', 'Nombre', 'text'], ['unit', 'Unidad (g, kg, pz…)', 'text'], ['stock', 'Stock actual', 'number'], ['minStock', 'Stock mínimo', 'number'], ['cost', 'Costo unitario $', 'number'], ['provider', 'Proveedor', 'text']] as const).map(([key, label, type]) => (
                    <div key={key} style={{ marginBottom: 13 }}>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#71717A', display: 'block', marginBottom: 5 }}>{label}</label>
                      <input type={type} value={(form as any)[key] ?? ''} onChange={e => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E4E4E7', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: type === 'number' ? 'JetBrains Mono, monospace' : 'Inter, sans-serif' }} />
                    </div>
                  ))}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#71717A', display: 'block', marginBottom: 5 }}>Categoría</label>
                    <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E4E4E7', fontSize: 13.5, outline: 'none', background: '#FFFFFF' }}>
                      {ingredientCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {selected && <button onClick={() => deleteIng(selected.id)} style={{ padding: '9px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#DC2626' }}>Eliminar</button>}
                    <button onClick={() => { setSelected(null); setIsNew(false) }} style={{ flex: 1, padding: '9px', background: '#F7F7F8', border: '1px solid #E4E4E7', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', color: '#71717A' }}>Cancelar</button>
                    <button onClick={saveIng} style={{ flex: 2, padding: '9px', background: '#DC2626', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>Guardar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Movement modal */}
      {moveModal && (
        <div className="overlay anim-fade" onClick={() => setMoveModal(null)}>
          <div className="anim-scale" style={{ background: '#FFFFFF', borderRadius: 18, padding: 28, width: 320, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 18, color: '#18181B', marginBottom: 6 }}>
              {moveModal.type === 'entrada' ? 'Entrada de stock' : 'Salida de stock'}
            </div>
            <div style={{ fontSize: 13, color: '#71717A', marginBottom: 20 }}>{moveModal.ing.name}</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#71717A', marginBottom: 6 }}>Cantidad ({moveModal.ing.unit})</div>
            <input type="number" value={moveQty} onChange={e => setMoveQty(Number(e.target.value))} min={0}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E4E4E7', fontSize: 20, outline: 'none', boxSizing: 'border-box', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textAlign: 'center', marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setMoveModal(null)} style={{ flex: 1, padding: '10px', background: '#F7F7F8', border: '1px solid #E4E4E7', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#71717A' }}>Cancelar</button>
              <button onClick={applyMove} style={{ flex: 2, padding: '10px', background: moveModal.type === 'entrada' ? '#16A34A' : '#DC2626', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
                {moveModal.type === 'entrada' ? 'Agregar' : 'Descontar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
