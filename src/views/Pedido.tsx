import { useState } from "react"
import { useApp } from "../context"
import Ticket from "../components/Ticket"
import Icon from "../components/Icon"
import Dropdown from "../components/Dropdown"
import type { PizzaSize, ConsumptionType, PaymentMethod } from "../types"

const SIZES: { id: PizzaSize; label: string }[] = [
  { id: "mediana", label: "Mediana" },
  { id: "grande", label: "Grande" },
  { id: "jumbo", label: "Jumbo" },
]

const SLICE_OPTIONS = [8, 12, 16]
const MAX_PARTS = 4

// Fracciones disponibles, de mayor a menor. "Completa" (1/1) es la opción por
// defecto de la Parte 1: si el cajero la deja así, es una pizza de un solo
// sabor. No hay combinaciones predeterminadas (no "1/2 y 1/2" como bloque
// fijo): cada parte elige su fracción de forma independiente.
const FRACTIONS: { value: number; label: string; twelfths: number }[] = [
  { value: 1, label: "Completa (1/1)", twelfths: 12 },
  { value: 3 / 4, label: "3/4", twelfths: 9 },
  { value: 2 / 3, label: "2/3", twelfths: 8 },
  { value: 1 / 2, label: "1/2", twelfths: 6 },
  { value: 1 / 3, label: "1/3", twelfths: 4 },
  { value: 1 / 4, label: "1/4", twelfths: 3 },
]

function twelfthsOf(fraction: number): number {
  return FRACTIONS.find((f) => f.value === fraction)?.twelfths ?? 12
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function simplifyOverTwelve(n: number): string {
  if (n <= 0) return "0/1"
  const g = gcd(n, 12) || 1
  return `${n / g}/${12 / g}`
}

// Al abrirse una parte nueva, se le sugiere de una vez la fracción que
// completa el entero (si existe una opción exacta), para que "así
// sucesivamente" el cajero normalmente solo tenga que elegir el sabor.
// Twelfths de las fracciones reales de una parte (excluye "Completa", que
// solo tiene sentido si una sola parte cubre toda la pizza).
const PART_TWELFTHS = [3, 4, 6, 8, 9] // 1/4, 1/3, 1/2, 2/3, 3/4

// ¿Se puede llegar exactamente a 0 desde "remaining" usando como máximo
// "partsLeft" fracciones más? Evita ofrecer combinaciones sin salida, como
// 1/2 + 1/3, que dejarían un residuo de 1/6 imposible de completar.
function canComplete(remaining: number, partsLeft: number): boolean {
  if (remaining === 0) return true
  if (partsLeft <= 0) return false
  return PART_TWELFTHS.some((f) => f <= remaining && canComplete(remaining - f, partsLeft - 1))
}

function bestDefaultFraction(remainingTwelfths: number, partsLeftAfterThis: number): number {
  const exact = FRACTIONS.find((f) => f.twelfths === remainingTwelfths)
  if (exact) return exact.value
  const valid = FRACTIONS.filter(
    (f) => f.twelfths <= remainingTwelfths && canComplete(remainingTwelfths - f.twelfths, partsLeftAfterThis),
  ).sort((a, b) => b.twelfths - a.twelfths)
  return valid[0]?.value ?? FRACTIONS[FRACTIONS.length - 1].value
}

interface PizzaPart {
  fraction: number
  flavor: string
  extras: Record<string, number> // ingredientId -> cantidad
}

function extrasTotal(part: PizzaPart): number {
  return Object.values(part.extras).reduce((s, q) => s + q, 0)
}

const CONSUMPTION_OPTIONS: {
  id: ConsumptionType
  label: string
  icon: string
}[] = [
  { id: "local", label: "Local", icon: "home" },
  { id: "llevar", label: "Para llevar", icon: "shoppingBag" },
  { id: "delivery", label: "Delivery", icon: "arrowRight" },
]

const PIZZA_EXTRAS_LIST = [
  { id: "orilla-queso", label: "Orilla con queso", price: 30 },
  { id: "queso-extra", label: "Queso extra", price: 25 },
]

const PIZZA_COLORS = [
  "#DC2626",
  "#FBBF24",
  "#16A34A",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
]

function PizzaVisual({
  parts,
}: {
  parts: { fractionValue: number; flavorName: string }[]
}) {
  const r = 70
  const cx = 80,
    cy = 80

  function polarToCartesian(angle: number, radius: number = r) {
    const rad = ((angle - 90) * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  function arcPath(startAngle: number, endAngle: number, radius: number = r): string {
    const s = polarToCartesian(startAngle, radius)
    const e = polarToCartesian(endAngle, radius)
    const large = endAngle - startAngle > 180 ? 1 : 0
    return `M ${cx} ${cy} L ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y} Z`
  }

  let cursor = 0
  const slices =
    parts.length <= 1
      ? [
          {
            path: `M ${cx} ${cy} m -${r} 0 a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 -${r * 2} 0`,
            color: PIZZA_COLORS[0],
            label: parts[0]?.flavorName || "Sabor",
          },
        ]
      : parts.map((p, i) => {
          const start = cursor
          const sweep = Math.max(0, p.fractionValue) * 360
          cursor += sweep
          return {
            path: arcPath(start, cursor),
            color: PIZZA_COLORS[i % PIZZA_COLORS.length],
            label: p.flavorName || `Parte ${i + 1}`,
          }
        })

  const dividerAngles: number[] = []
  if (parts.length > 1) {
    let c = 0
    parts.forEach((p) => {
      dividerAngles.push(c)
      c += Math.max(0, p.fractionValue) * 360
    })
  }

  return (
    <div style={{ position: "relative" }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r + 4} fill="rgba(0,0,0,0.06)" />
        <circle cx={cx} cy={cy} r={r} fill="#FDE68A" />
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={0.85} />
        ))}
        {dividerAngles.map((a, i) => {
          const p = polarToCartesian(a)
          return (
            <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
          )
        })}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="3" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const inner = polarToCartesian(a, r * 0.6)
          const outer = polarToCartesian(a, r - 6)
          return (
            <line key={a} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          )
        })}
      </svg>

      <div style={{ position: "absolute", bottom: -32, left: 0, right: 0, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#3F3F46", fontWeight: 500, whiteSpace: "nowrap", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PedidoView() {
  const {
    products,
    ingredients,
    addTicketItem,
    consumption,
    setConsumption,
    deliveryAddress: address,
    setDeliveryAddress: setAddress,
    deliveryPhone: phone,
    setDeliveryPhone: setPhone,
  } = useApp()

  const [customer, setCustomer] = useState("")
  const [deliveryCost, setDeliveryCost] = useState("30")
  const [size, setSize] = useState<PizzaSize>("grande")
  const [slices, setSlices] = useState(12)
  const [parts, setParts] = useState<PizzaPart[]>([{ fraction: 1, flavor: "", extras: {} }])
  const [pizzaExtras, setPizzaExtras] = useState<string[]>([])
  const [payMethod, setPayMethod] = useState<PaymentMethod>("efectivo")
  const [notes, setNotes] = useState("")

  const ingredientItems = ingredients.filter((i) => i.categoryId === "cat1")
  const partsProducts = parts.map((p) => products.find((pr) => pr.id === p.flavor))

  function remainingBeforeIndex(index: number): number {
    return 12 - parts.slice(0, index).reduce((s, p) => s + twelfthsOf(p.fraction), 0)
  }

  function optionsForPart(index: number) {
    const remaining = remainingBeforeIndex(index)
    const partsLeftAfterThis = MAX_PARTS - index - 1
    return FRACTIONS.filter(
      (f) => f.twelfths <= remaining && canComplete(remaining - f.twelfths, partsLeftAfterThis),
    )
  }

  // Cambiar la fracción de una parte recorta lo que había después de ella
  // (ya no aplica) y, si aún no se completa el entero, abre automáticamente
  // la siguiente parte con la fracción restante sugerida.
  function updatePartFraction(index: number, value: number) {
    setParts((prev) => {
      const next = prev.slice(0, index + 1).map((p, i) => (i === index ? { ...p, fraction: value } : p))
      const used = next.reduce((s, p) => s + twelfthsOf(p.fraction), 0)
      if (used < 12 && next.length < MAX_PARTS) {
        const partsLeftAfter = MAX_PARTS - next.length - 1
        next.push({ fraction: bestDefaultFraction(12 - used, partsLeftAfter), flavor: "", extras: {} })
      }
      return next
    })
  }

  function updatePartFlavor(index: number, flavor: string) {
    setParts((prev) => prev.map((p, i) => (i === index ? { ...p, flavor } : p)))
  }

  function removePart(index: number) {
    if (index === 0) return
    setParts((prev) => {
      const next = prev.slice(0, index)
      const used = next.reduce((s, p) => s + twelfthsOf(p.fraction), 0)
      if (used < 12 && next.length < MAX_PARTS) {
        const partsLeftAfter = MAX_PARTS - next.length - 1
        next.push({ fraction: bestDefaultFraction(12 - used, partsLeftAfter), flavor: "", extras: {} })
      }
      return next
    })
  }

  function addExtraUnit(index: number, ingId: string) {
    setParts((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p
        return { ...p, extras: { ...p.extras, [ingId]: (p.extras[ingId] || 0) + 1 } }
      }),
    )
  }

  function removeExtraUnit(index: number, ingId: string) {
    setParts((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p
        const current = p.extras[ingId] || 0
        if (current <= 1) {
          const rest = { ...p.extras }
          delete rest[ingId]
          return { ...p, extras: rest }
        }
        return { ...p, extras: { ...p.extras, [ingId]: current - 1 } }
      }),
    )
  }

  function clearPartExtras(index: number) {
    setParts((prev) => prev.map((p, i) => (i === index ? { ...p, extras: {} } : p)))
  }

  function togglePizzaExtra(id: string) {
    setPizzaExtras((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const availableSlices = size === "mediana" ? [8] : size === "grande" ? [8, 12] : [8, 12, 16]

  const totalTwelfths = parts.reduce((s, p) => s + twelfthsOf(p.fraction), 0)
  const totalLabel = simplifyOverTwelve(totalTwelfths)
  const fractionsValid = totalTwelfths === 12

  // La pizza se cobra al precio de la parte más cara (no una suma
  // proporcional): el sabor más caro entre los elegidos define el precio
  // base de toda la pizza.
  const selectedPrices = partsProducts.filter(Boolean).map((p) => p!.prices[size])
  const basePrice = selectedPrices.length ? Math.max(...selectedPrices) : 0
  const extraIngPrice = parts.reduce((s, p) => s + extrasTotal(p) * 20, 0)
  const pizzaExtrasPrice = pizzaExtras.reduce((s, id) => {
    const ex = PIZZA_EXTRAS_LIST.find((e) => e.id === id)
    return s + (ex?.price || 0)
  }, 0)
  const totalPrice = basePrice + extraIngPrice + pizzaExtrasPrice

  // Una parte queda definida por su sabor o, si no se eligió uno del menú
  // (por ejemplo, una combinación de ingredientes que no existe como
  // producto), por tener al menos un ingrediente extra.
  const partIsDefined = (p: PizzaPart) => p.flavor !== "" || extrasTotal(p) > 0
  const allPartsDefined = parts.every(partIsDefined)
  const isValid = allPartsDefined && fractionsValid
  const anyFlavorSelected = parts.some(partIsDefined)
  const firstMissingIndex = parts.findIndex((p) => !partIsDefined(p))

  function handleAdd() {
    if (!isValid) return
    const sizeLabel = SIZES.find((s) => s.id === size)?.label

    function extrasNamesFor(p: PizzaPart) {
      return Object.entries(p.extras)
        .map(([id, qty]) => {
          const ing = ingredientItems.find((ig) => ig.id === id)
          if (!ing) return null
          return qty > 1 ? `${ing.name} x${qty}` : ing.name
        })
        .filter(Boolean) as string[]
    }

    const partsLabel = parts
      .map((p, i) => {
        const prod = partsProducts[i]
        const fracLabel = parts.length === 1 ? "" : `${FRACTIONS.find((f) => f.value === p.fraction)?.label} `
        const extrasNames = extrasNamesFor(p)
        if (prod) {
          const extrasStr = extrasNames.length ? ` (+${extrasNames.join(", ")})` : ""
          return `${fracLabel}${prod.name}${extrasStr}`
        }
        // Parte sin sabor del menú: se describe solo por sus ingredientes extra
        return extrasNames.length ? `${fracLabel}${extrasNames.join(", ")}` : ""
      })
      .filter(Boolean)
      .join(" · ")

    const details = [
      partsLabel,
      pizzaExtras.map((id) => PIZZA_EXTRAS_LIST.find((e) => e.id === id)?.label).filter(Boolean).join(", "),
    ]
      .filter(Boolean)
      .join(" · ")

    const flavorNames = parts.map((_, i) => partsProducts[i]?.name).filter(Boolean) as string[]
    const name =
      flavorNames.length > 0
        ? `${flavorNames.join(" / ")} ${sizeLabel}`
        : `Pizza personalizada ${sizeLabel}`

    addTicketItem({
      id: `pizza-${Date.now()}`,
      type: "pizza",
      name,
      quantity: 1,
      unitPrice: totalPrice,
      total: totalPrice,
      size,
      details,
    })

    setParts([{ fraction: 1, flavor: "", extras: {} }])
    setPizzaExtras([])
    setNotes("")
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", background: "#F7F7F8" }}>
        <div
          style={{
            background: "#FFFFFF",
            borderBottom: "1px solid #E4E4E7",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ fontFamily: "Cooper Black, serif", fontSize: 20, color: "#18181B", lineHeight: 1 }}>
            Nuevo Pedido
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#A1A1AA" }}>Método:</div>
            {(["efectivo", "tarjeta"] as PaymentMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => setPayMethod(m)}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  background: payMethod === m ? "#DC2626" : "#F7F7F8",
                  color: payMethod === m ? "#fff" : "#71717A",
                  border: `1px solid ${payMethod === m ? "#DC2626" : "#E4E4E7"}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Icon name={m === "efectivo" ? "receipt" : "tag"} size={12} color={payMethod === m ? "#fff" : "#71717A"} />
                {m === "efectivo" ? "Efectivo" : "Tarjeta"}
              </button>
            ))}
          </div>
        </div>

        <div className="pedido-grid" style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card title="Cliente y Consumo">
              <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nombre del cliente" style={inputSt} />
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                {CONSUMPTION_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setConsumption(c.id)}
                    style={{
                      flex: 1,
                      padding: "9px 8px",
                      fontSize: 12,
                      fontWeight: 500,
                      background: consumption === c.id ? "#DC2626" : "#F7F7F8",
                      color: consumption === c.id ? "#fff" : "#3F3F46",
                      border: `1px solid ${consumption === c.id ? "#DC2626" : "#E4E4E7"}`,
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                    }}
                  >
                    <Icon name={c.icon} size={12} color={consumption === c.id ? "#fff" : "#71717A"} />
                    {c.label}
                  </button>
                ))}
              </div>
              {consumption === "delivery" && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección de entrega" style={inputSt} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono" style={{ ...inputSt, flex: 1 }} />
                    <input
                      type="number"
                      value={deliveryCost}
                      onChange={(e) => setDeliveryCost(e.target.value)}
                      placeholder="Envío $"
                      style={{ ...inputSt, width: 80, flex: "none", textAlign: "center" }}
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Partes de la pizza: se abren dinámicamente según la fracción elegida */}
            {parts.map((part, i) => {
              const total = extrasTotal(part)
              return (
                <Card key={i} title={`Parte ${i + 1}`} onRemove={i > 0 ? () => removePart(i) : undefined}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 130, flexShrink: 0 }}>
                      <div style={fieldLabelSt}>Fracción</div>
                      <Dropdown
                        value={String(part.fraction)}
                        onChange={(v) => updatePartFraction(i, Number(v))}
                        options={optionsForPart(i).map((f) => ({ value: String(f.value), label: f.label }))}
                        small
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={fieldLabelSt}>Sabor</div>
                      <Dropdown
                        value={part.flavor}
                        onChange={(v) => updatePartFlavor(i, v)}
                        placeholder="Selecciona..."
                        options={products
                          .filter((p) => p.active)
                          .map((p) => ({ value: p.id, label: `${p.name} — $${p.prices[size]}${p.specialty ? " ★" : ""}` }))}
                        small
                      />
                    </div>
                  </div>

                  <div style={{ ...fieldLabelSt, marginBottom: total > 0 ? 4 : 6 }}>
                    Ingredientes extra — Parte {i + 1} ({total}) — $20 c/u
                  </div>
                  {total > 0 && (
                    <button onClick={() => clearPartExtras(i)}
                      style={{ display: "block", marginBottom: 8, background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#DC2626", padding: 0 }}>
                      Quitar todos
                    </button>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 6 }}>
                    {ingredientItems.map((ing) => {
                      const qty = part.extras[ing.id] || 0
                      const sel = qty > 0
                      return (
                        <div
                          key={ing.id}
                          style={{
                            display: "flex", alignItems: "stretch", justifyContent: "space-between",
                            borderRadius: 8, overflow: "hidden",
                            border: `1px solid ${sel ? "#FCA5A5" : "#E4E4E7"}`,
                          }}
                        >
                          <button
                            onClick={() => addExtraUnit(i, ing.id)}
                            style={{
                              flex: 1, minWidth: 0, padding: "5px 8px", fontSize: 12, cursor: "pointer", border: "none",
                              background: sel ? "#FEF2F2" : "#F7F7F8", color: sel ? "#DC2626" : "#3F3F46",
                              fontWeight: sel ? 600 : 400,
                              display: "flex", alignItems: "center", gap: 4,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}
                          >
                            {sel && <Icon name="check" size={10} color="#DC2626" strokeWidth={2.5} />}
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ing.name}</span>
                          </button>
                          {sel && (
                            <div style={{ display: "flex", alignItems: "center", background: "#FEF2F2", borderLeft: "1px solid #FCA5A5", flexShrink: 0 }}>
                              <button onClick={() => removeExtraUnit(i, ing.id)}
                                style={{ width: 22, border: "none", background: "none", cursor: "pointer", color: "#DC2626", fontWeight: 700, fontSize: 13 }}>
                                −
                              </button>
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#DC2626", minWidth: 14, textAlign: "center" }}>{qty}</span>
                              <button onClick={() => addExtraUnit(i, ing.id)}
                                style={{ width: 22, border: "none", background: "none", cursor: "pointer", color: "#DC2626", fontWeight: 700, fontSize: 13 }}>
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )
            })}

            {parts.length > 1 && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10,
                  background: fractionsValid ? "#F0FDF4" : "#FEF2F2",
                  border: `1px solid ${fractionsValid ? "#86EFAC" : "#FCA5A5"}`,
                }}
              >
                <Icon name={fractionsValid ? "check" : "alertTriangle"} size={15} color={fractionsValid ? "#16A34A" : "#DC2626"} />
                <span style={{ fontSize: 13, fontWeight: 700, color: fractionsValid ? "#16A34A" : "#DC2626" }}>
                  Total: {totalLabel} {fractionsValid ? "✓" : "✗"}
                </span>
              </div>
            )}

            <Card title="Observaciones">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Sin cebolla, bien cocida, etc."
                rows={2}
                style={{ ...inputSt, resize: "none", width: "100%" }}
              />
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card title="Vista Previa">
              <div style={{ display: "flex", justifyContent: "center", paddingBottom: 36 }}>
                <PizzaVisual
                  parts={parts.map((p, i) => ({
                    fractionValue: p.fraction,
                    flavorName: partsProducts[i]?.name || "",
                  }))}
                />
              </div>
            </Card>

            <Card title="Tamaño">
              <div style={{ display: "flex", gap: 8 }}>
                {SIZES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSize(s.id)
                      setSlices(s.id === "mediana" ? 8 : s.id === "grande" ? 12 : 16)
                    }}
                    style={{
                      flex: 1,
                      padding: "12px 8px",
                      borderRadius: 10,
                      cursor: "pointer",
                      background: size === s.id ? "#FEF2F2" : "#F7F7F8",
                      border: `2px solid ${size === s.id ? "#DC2626" : "#E4E4E7"}`,
                      color: size === s.id ? "#DC2626" : "#3F3F46",
                      fontFamily: size === s.id ? "Cooper Black, serif" : "inherit",
                      fontSize: 14,
                      fontWeight: size === s.id ? 700 : 500,
                      textAlign: "center",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Card>

            <Card title="Rebanadas">
              <div style={{ display: "flex", gap: 8 }}>
                {SLICE_OPTIONS.map((n) => {
                  const avail = availableSlices.includes(n)
                  return (
                    <button
                      key={n}
                      onClick={() => avail && setSlices(n)}
                      disabled={!avail}
                      style={{
                        flex: 1,
                        padding: "12px",
                        fontSize: 18,
                        fontFamily: "Cooper Black, serif",
                        background: slices === n ? "#DC2626" : avail ? "#F7F7F8" : "#FAFAFA",
                        color: slices === n ? "#fff" : avail ? "#18181B" : "#D4D4D8",
                        border: `2px solid ${slices === n ? "#DC2626" : avail ? "#E4E4E7" : "#F4F4F5"}`,
                        borderRadius: 10,
                        cursor: avail ? "pointer" : "not-allowed",
                        opacity: avail ? 1 : 0.45,
                      }}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
              {size === "mediana" && (
                <div style={{ marginTop: 8, fontSize: 11.5, color: "#D97706", display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="info" size={13} color="#D97706" />
                  Mediana: solo disponible en 8 rebanadas
                </div>
              )}
              {size === "grande" && (
                <div style={{ marginTop: 8, fontSize: 11.5, color: "#71717A", display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="info" size={13} color="#71717A" />
                  Grande: 8 o 12 rebanadas
                </div>
              )}
            </Card>

            <Card title="Extras de Pizza">
              <div style={{ display: "flex", gap: 8 }}>
                {PIZZA_EXTRAS_LIST.map((ex) => {
                  const sel = pizzaExtras.includes(ex.id)
                  return (
                    <button
                      key={ex.id}
                      onClick={() => togglePizzaExtra(ex.id)}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 12.5,
                        fontWeight: 500,
                        background: sel ? "#FFFBEB" : "#F7F7F8",
                        border: `2px solid ${sel ? "#FBBF24" : "#E4E4E7"}`,
                        color: sel ? "#D97706" : "#3F3F46",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{ex.label}</div>
                      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, marginTop: 2, color: sel ? "#D97706" : "#A1A1AA" }}>
                        +${ex.price}
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>

            {anyFlavorSelected && (
              <div style={{ background: "#18181B", borderRadius: 14, padding: 18 }}>
                <div style={{ marginBottom: 12 }}>
                  {parts.map(
                    (p, i) =>
                      partsProducts[i] && (
                        <SummaryLine
                          key={i}
                          label={
                            parts.length === 1
                              ? `${partsProducts[i]!.name} ${SIZES.find((s) => s.id === size)?.label}`
                              : `${FRACTIONS.find((f) => f.value === p.fraction)?.label} ${partsProducts[i]!.name}`
                          }
                          value={partsProducts[i]!.prices[size]}
                        />
                      ),
                  )}
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", marginBottom: 8, marginTop: -2 }}>
                    Se cobra el precio de la parte más cara
                  </div>
                  {parts.map(
                    (p, i) =>
                      extrasTotal(p) > 0 && (
                        <SummaryLine
                          key={`extra-${i}`}
                          label={`${parts.length > 1 ? `Parte ${i + 1}: ` : ""}${extrasTotal(p)} extra${extrasTotal(p) > 1 ? "s" : ""} ingrediente`}
                          value={extrasTotal(p) * 20}
                        />
                      ),
                  )}
                  {pizzaExtras.map((id) => {
                    const ex = PIZZA_EXTRAS_LIST.find((e) => e.id === id)
                    return ex ? <SummaryLine key={id} label={ex.label} value={ex.price} /> : null
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <span style={{ fontFamily: "Cooper Black, serif", fontSize: 16, color: "#FFFFFF" }}>Total pizza</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 22, fontWeight: 700, color: "#FBBF24" }}>${totalPrice}</span>
                </div>

                <button
                  onClick={handleAdd}
                  disabled={!isValid}
                  style={{
                    width: "100%",
                    marginTop: 14,
                    padding: "13px",
                    fontFamily: "Cooper Black, serif",
                    fontSize: 15,
                    background: isValid ? "#DC2626" : "rgba(255,255,255,0.1)",
                    color: isValid ? "#fff" : "rgba(255,255,255,0.3)",
                    border: "none",
                    borderRadius: 10,
                    cursor: isValid ? "pointer" : "not-allowed",
                    boxShadow: isValid ? "0 4px 16px rgba(220,38,38,0.4)" : "none",
                  }}
                >
                  {firstMissingIndex !== -1
                    ? `Elige un sabor o un ingrediente — Parte ${firstMissingIndex + 1}`
                    : !fractionsValid
                      ? `Ajusta las fracciones (Total: ${totalLabel})`
                      : `Agregar al ticket — $${totalPrice}`}
                </button>
              </div>
            )}

            {!anyFlavorSelected && (
              <div style={{ background: "#FEF2F2", border: "1px dashed #FCA5A5", borderRadius: 12, padding: 20, textAlign: "center" }}>
                <Icon name="pizza" size={32} color="#FCA5A5" />
                <div style={{ fontSize: 13, color: "#DC2626", marginTop: 8, fontWeight: 500 }}>Selecciona un sabor o un ingrediente extra</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Ticket />
    </div>
  )
}

function Card({ title, children, onRemove }: { title: string; children: React.ReactNode; onRemove?: () => void }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", borderRadius: 14, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#A1A1AA", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {title}
        </div>
        {onRemove && (
          <button onClick={onRemove} title="Quitar esta parte"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", color: "#D4D4D8" }}>
            <Icon name="x" size={14} color="#D4D4D8" />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function SummaryLine({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>{label}</span>
      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>${value}</span>
    </div>
  )
}

const inputSt: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  fontSize: 13,
  background: "#F7F7F8",
  color: "#18181B",
  border: "1px solid #E4E4E7",
  borderRadius: 9,
  fontFamily: "Inter, sans-serif",
}

const fieldLabelSt: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  color: "#A1A1AA",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: 6,
}
