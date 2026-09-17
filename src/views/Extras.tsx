import { useState } from 'react'
import { useApp } from '../context'
import Icon from '../components/Icon'
import Ticket from '../components/Ticket'

const CATEGORY_ICONS: Record<string, string> = {
  cat3: 'drink',
  cat4: 'bag',
  cat2: 'package',
  cat1: 'tag',
}

export default function Extras() {
  const { ingredients, ingredientCategories, addTicketItem, sidebarOpen, setSidebarOpen } = useApp()
  const [activeCat, setActiveCat] = useState<string | null>(null)

  const nonIngredientCats = ingredientCategories.filter(c => c.id !== 'cat1')
  const activeCatId = activeCat ?? nonIngredientCats[0]?.id ?? null
  const filtered = ingredients.filter(i => i.categoryId === activeCatId && i.stock > 0)

  function addExtra(ing: typeof ingredients[0]) {
    addTicketItem({
      id: `extra-${ing.id}-${Date.now()}`,
      type: 'extra',
      name: ing.name,
      quantity: 1,
      unitPrice: ing.customPrice ?? ing.cost,
      total: ing.customPrice ?? ing.cost,
    })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F7F7F8', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E4E7', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#71717A', display: 'flex' }}>
              <Icon name="menu" size={20} />
            </button>
          )}
          <div style={{ fontFamily: 'Cooper Black, serif', fontSize: 20, color: '#18181B' }}>Extras</div>
          <div style={{ fontSize: 12.5, color: '#A1A1AA', marginLeft: 4 }}>Bebidas y complementos</div>
        </div>

        {/* Category tabs */}
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E4E7', padding: '0 24px', display: 'flex', gap: 2, flexShrink: 0 }}>
          {nonIngredientCats.map(cat => {
            const active = activeCatId === cat.id
            return (
              <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                style={{
                  padding: '12px 18px', fontSize: 13.5, fontWeight: 600,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: active ? cat.color : '#A1A1AA',
                  borderBottom: `3px solid ${active ? cat.color : 'transparent'}`,
                  display: 'flex', alignItems: 'center', gap: 7,
                  transition: 'all 0.12s',
                }}
              >
                <Icon name={CATEGORY_ICONS[cat.id] || 'tag'} size={14} color={active ? cat.color : '#A1A1AA'} />
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* Products grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#A1A1AA' }}>
              <Icon name="package" size={40} color="#D4D4D8" />
              <div style={{ fontSize: 14, marginTop: 12 }}>Sin productos disponibles</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
              {filtered.map(ing => (
                <ExtraCard key={ing.id} ingredient={ing} onAdd={() => addExtra(ing)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Ticket />
    </div>
  )
}

function ExtraCard({ ingredient, onAdd }: { ingredient: any; onAdd: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onAdd}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#FFFFFF',
        border: `2px solid ${hover ? '#DC2626' : '#E4E4E7'}`,
        borderRadius: 14, padding: 16,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        cursor: 'pointer', transition: 'all 0.14s',
        transform: hover ? 'translateY(-2px)' : 'none',
        boxShadow: hover ? '0 8px 24px rgba(220,38,38,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: hover ? '#FEF2F2' : '#F7F7F8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.14s',
      }}>
        <Icon name="drink" size={24} color={hover ? '#DC2626' : '#71717A'} />
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#18181B', textAlign: 'center', lineHeight: 1.2 }}>{ingredient.name}</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: '#DC2626', textAlign: 'center', marginTop: 5 }}>
          ${ingredient.customPrice ?? ingredient.cost}
        </div>
        <div style={{ fontSize: 11, color: '#A1A1AA', textAlign: 'center', marginTop: 2 }}>{ingredient.stock} {ingredient.unit}</div>
      </div>
    </button>
  )
}
