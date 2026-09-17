import { useState } from 'react'
import { useApp } from '../context'
import type { Product, ProductIngredient } from '../types'
import Icon from '../components/Icon'

const SIZES = ['mediana', 'grande', 'jumbo'] as const

const BLANK_PRODUCT: Omit<Product, 'id'> = {
  name: '',
  baseIngredients: [],
  prices: { mediana: 0, grande: 0, jumbo: 0 },
  slices: { mediana: 8, grande: 12, jumbo: 16 },
  active: true,
  specialty: false,
}

export default function Productos() {
  const { products, setProducts, ingredients } = useApp()
  const [filter, setFilter] = useState<'todos' | 'sencillas' | 'especialidades'>('todos')
  const [selected, setSelected] = useState<Product | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState<Omit<Product, 'id'>>(BLANK_PRODUCT)

  const filtered = products.filter(p => {
    if (filter === 'sencillas') return !p.specialty
    if (filter === 'especialidades') return p.specialty
    return true
  })

  function openProduct(p: Product) {
    setSelected(p)
    setIsNew(false)
    setForm({ name: p.name, baseIngredients: [...p.baseIngredients], prices: { ...p.prices }, slices: { ...p.slices }, active: p.active, specialty: p.specialty })
  }

  function openNew() {
    setIsNew(true)
    setSelected(null)
    setForm(BLANK_PRODUCT)
  }

  function saveProduct() {
    if (!form.name) return
    if (selected) {
      setProducts(products.map(p => p.id === selected.id ? { ...selected, ...form } : p))
    } else {
      setProducts([...products, { ...form, id: `prod-${Date.now()}` }])
    }
    setSelected(null)
    setIsNew(false)
  }

  function setIngGrams(ingredientId: string, grams: number) {
    const existing = form.baseIngredients.find(bi => bi.ingredientId === ingredientId)
    if (existing) {
      setForm({ ...form, baseIngredients: form.baseIngredients.map(bi => bi.ingredientId === ingredientId ? { ...bi, grams } : bi) })
    } else {
      setForm({ ...form, baseIngredients: [...form.baseIngredients, { ingredientId, grams }] })
    }
  }

  function removeIng(ingredientId: string) {
    setForm({ ...form, baseIngredients: form.baseIngredients.filter(bi => bi.ingredientId !== ingredientId) })
  }

  function addIngredient(ingredientId: string) {
    if (!form.baseIngredients.find(bi => bi.ingredientId === ingredientId)) {
      setForm({ ...form, baseIngredients: [...form.baseIngredients, { ingredientId, grams: 100 }] })
    }
  }

  const pizzaIngredients = ingredients.filter(i => i.categoryId === 'cat1')
  const showPanel = selected !== null || isNew

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F7F8' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E4E7', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 20, color: '#18181B' }}>Productos</div>
        <button onClick={openNew}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: 700, boxShadow: '0 2px 8px rgba(220,38,38,0.25)' }}>
          <Icon name="plus" size={15} color="#fff" strokeWidth={2.5} /> Nuevo producto
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E4E7', padding: '0 24px', display: 'flex', flexShrink: 0 }}>
        {([['todos', 'Todos'], ['sencillas', 'Sencillas'], ['especialidades', 'Especialidades']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)}
            style={{ padding: '12px 20px', fontSize: 13.5, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: filter === id ? '#DC2626' : '#A1A1AA', borderBottom: `3px solid ${filter === id ? '#DC2626' : 'transparent'}`, transition: 'all 0.12s' }}>
            {label}
            <span style={{ marginLeft: 7, padding: '1px 7px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: filter === id ? '#FEF2F2' : '#F4F4F5', color: filter === id ? '#DC2626' : '#A1A1AA' }}>
              {id === 'todos' ? products.length : products.filter(p => id === 'sencillas' ? !p.specialty : p.specialty).length}
            </span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Product list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(p => (
              <button key={p.id} onClick={() => openProduct(p)}
                style={{ background: selected?.id === p.id ? '#FEF2F2' : '#FFFFFF', border: `1.5px solid ${selected?.id === p.id ? '#DC2626' : '#E4E4E7'}`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s', opacity: p.active ? 1 : 0.5 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: p.specialty ? '#FFFBEB' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${p.specialty ? '#FDE68A' : '#FECACA'}` }}>
                  <Icon name="pizza" size={22} color={p.specialty ? '#D97706' : '#DC2626'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#18181B' }}>{p.name}</span>
                    {p.specialty && <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>Especialidad</span>}
                    {!p.active && <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: '#F4F4F5', color: '#A1A1AA' }}>Inactivo</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    {SIZES.map(s => (
                      <span key={s} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#71717A' }}>
                        {s.charAt(0).toUpperCase()}: <strong style={{ color: '#DC2626' }}>${p.prices[s]}</strong>
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: '#A1A1AA' }}>
                  {p.baseIngredients.length} ingredientes
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Config panel */}
        {showPanel && (
          <div style={{ width: 400, background: '#FFFFFF', borderLeft: '1px solid #E4E4E7', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #E4E4E7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 16, color: '#18181B' }}>{isNew ? 'Nuevo producto' : 'Editar producto'}</div>
              <button onClick={() => { setSelected(null); setIsNew(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA' }}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              {/* Name */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#71717A', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nombre</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E4E4E7', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Specialty toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '10px 12px', background: '#FFFBEB', borderRadius: 10, border: '1px solid #FDE68A' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#D97706' }}>Especialidad</span>
                <button onClick={() => setForm({ ...form, specialty: !form.specialty })}
                  style={{ width: 38, height: 22, borderRadius: 11, background: form.specialty ? '#D97706' : '#E4E4E7', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: form.specialty ? 19 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
              </div>

              {/* Prices */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Precios</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {SIZES.map(s => (
                    <div key={s}>
                      <label style={{ fontSize: 11, color: '#A1A1AA', display: 'block', marginBottom: 4, textTransform: 'capitalize' }}>{s}</label>
                      <input type="number" value={form.prices[s]} onChange={e => setForm({ ...form, prices: { ...form.prices, [s]: Number(e.target.value) } })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1.5px solid #E4E4E7', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'JetBrains Mono, monospace' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Slices */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Rebanadas por tamaño</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {SIZES.map(s => (
                    <div key={s}>
                      <label style={{ fontSize: 11, color: '#A1A1AA', display: 'block', marginBottom: 4, textTransform: 'capitalize' }}>{s}</label>
                      <input type="number" value={form.slices[s]} onChange={e => setForm({ ...form, slices: { ...form.slices, [s]: Number(e.target.value) } })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1.5px solid #E4E4E7', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'JetBrains Mono, monospace' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingredients with grams */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Ingredientes y gramos</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {form.baseIngredients.map(bi => {
                    const ing = ingredients.find(i => i.id === bi.ingredientId)
                    if (!ing) return null
                    return (
                      <div key={bi.ingredientId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#F7F7F8', border: '1px solid #E4E4E7', borderRadius: 8 }}>
                        <span style={{ flex: 1, fontSize: 13, color: '#18181B', fontWeight: 500 }}>{ing.name}</span>
                        <input type="number" value={bi.grams} onChange={e => setIngGrams(bi.ingredientId, Number(e.target.value))} min={1}
                          style={{ width: 70, padding: '4px 8px', borderRadius: 6, border: '1.5px solid #E4E4E7', fontSize: 12.5, outline: 'none', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }} />
                        <span style={{ fontSize: 11.5, color: '#A1A1AA' }}>g</span>
                        <button onClick={() => removeIng(bi.ingredientId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex' }}>
                          <Icon name="x" size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
                {/* Add ingredient */}
                <select onChange={e => { if (e.target.value) { addIngredient(e.target.value); e.target.value = '' } }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px dashed #D4D4D8', fontSize: 13, outline: 'none', color: '#71717A', background: '#FAFAFA', cursor: 'pointer' }}>
                  <option value="">+ Agregar ingrediente…</option>
                  {pizzaIngredients.filter(ing => !form.baseIngredients.find(bi => bi.ingredientId === ing.id)).map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setSelected(null); setIsNew(false) }}
                  style={{ flex: 1, padding: '10px', background: '#F7F7F8', border: '1px solid #E4E4E7', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', color: '#71717A' }}>
                  Cancelar
                </button>
                <button onClick={saveProduct}
                  style={{ flex: 2, padding: '10px', background: '#DC2626', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
                  Guardar producto
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
