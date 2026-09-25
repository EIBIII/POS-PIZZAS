import { useState } from "react"
import { useApp } from "../context"
import Ticket from "../components/Ticket"
import Icon from "../components/Icon"
import type { PizzaSize, ConsumptionType, PaymentMethod } from "../types"

const SIZES: { id: PizzaSize; label: string }[] = [
  { id: "mediana", label: "Mediana" },
  { id: "grande", label: "Grande" },
  { id: "jumbo", label: "Jumbo" },
]

const SLICE_OPTIONS = [8, 12, 16]

const NUM_PARTS_OPTIONS = [1, 2, 3, 4]

// Fracciones disponibles por parte. No hay combinaciones predeterminadas
// (no "1/2 y 1/2", no "3/4 y 1/4"): cada parte elige su propia fracción de
// forma independiente y el sistema valida que la suma total dé exactamente 1.
// "twelfths" es el valor sobre 12 (mínimo común múltiplo de 2,3,4) para poder
// sumar y validar fracciones de distinto denominador sin errores de punto flotante.
const FRACTIONS: { value: number; label: string; twelfths: number }[] = [
  { value: 1 / 4, label: "1/4", twelfths: 3 },
  { value: 1 / 3, label: "1/3", twelfths: 4 },
  { value: 1 / 2, label: "1/2", twelfths: 6 },
  { value: 2 / 3, label: "2/3", twelfths: 8 },
  { value: 3 / 4, label: "3/4", twelfths: 9 },
]

function defaultFractionFor(numParts: number): number {
  if (numParts === 2) return 1 / 2
  if (numParts === 3) return 1 / 3
  if (numParts === 4) return 1 / 4
  return 1
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function simplifyOverTwelve(n: number): string {
  if (n <= 0) return "0/1"
  const g = gcd(n, 12) || 1
  return `${n / g}/${12 / g}`
}

interface PizzaPart {
  fraction: number
  flavor: string
  extras: string[]
}

function makeParts(numParts: number): PizzaPart[] {
  const frac = defaultFractionFor(numParts)
  return Array.from({ length: numParts }, () => ({
    fraction: frac,
    flavor: "",
    extras: [],
  }))
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

// Colors for pizza division visualization
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

  function arcPath(
    startAngle: number,
    endAngle: number,
    radius: number = r,
  ): string {
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
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
            />
          )
        })}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="3"
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const inner = polarToCartesian(a, r * 0.6)
          const outer = polarToCartesian(a, r - 6)
          return (
            <line
              key={a}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1"
            />
          )
        })}
      </svg>

      <div
        style={{
          position: "absolute",
          bottom: -32,
          left: 0,
          right: 0,
          display: "flex",
          gap: 8,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {slices.map((s, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 5 }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: s.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: "#3F3F46",
                fontWeight: 500,
                whiteSpace: "nowrap",
                maxWidth: 80,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
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
  const [numParts, setNumParts] = useState(1)
  const [parts, setParts] = useState<PizzaPart[]>(() => makeParts(1))
  const [pizzaExtras, setPizzaExtras] = useState<string[]>([])
  const [payMethod, setPayMethod] = useState<PaymentMethod>("efectivo")
  const [notes, setNotes] = useState("")

  // Ingredientes de categoría "Ingredientes" para los extras de cada parte
  const ingredientItems = ingredients.filter((i) => i.categoryId === "cat1")

  const partsProducts = parts.map((p) => products.find((pr) => pr.id === p.flavor))

  function selectNumParts(n: number) {
    setNumParts(n)
    setParts(makeParts(n))
  }

  function updatePart(index: number, patch: Partial<PizzaPart>) {
    setParts((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  function toggleExtraForPart(index: number, ingId: string) {
    setParts((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p
        if (p.extras.includes(ingId)) {
          return { ...p, extras: p.extras.filter((x) => x !== ingId) }
        }
        if (p.extras.length >= 10) return p
        return { ...p, extras: [...p.extras, ingId] }
      }),
    )
  }

  function togglePizzaExtra(id: string) {
    setPizzaExtras((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  // Slices rules
  const availableSlices =
    size === "mediana" ? [8] : size === "grande" ? [8, 12] : [8, 12, 16]

  // Validación de fracciones: la suma de todas las partes debe dar
  // exactamente 1 entero. Se trabaja sobre doceavos (mcm de 2,3,4) para
  // evitar errores de punto flotante al sumar fracciones distintas.
  const totalTwelfths =
    numParts === 1
      ? 12
      : parts.reduce((s, p) => {
          const f = FRACTIONS.find((fr) => fr.value === p.fraction)
          return s + (f?.twelfths ?? 0)
        }, 0)
  const totalLabel = simplifyOverTwelve(totalTwelfths)
  const fractionsValid = totalTwelfths === 12

  const basePrice =
    numParts === 1
      ? partsProducts[0]?.prices[size] ?? 0
      : parts.reduce(
          (s, p, i) => s + Math.round(p.fraction * (partsProducts[i]?.prices[size] ?? 0)),
          0,
        )
  const extraIngPrice = parts.reduce((s, p) => s + p.extras.length * 20, 0)
  const pizzaExtrasPrice = pizzaExtras.reduce((s, id) => {
    const ex = PIZZA_EXTRAS_LIST.find((e) => e.id === id)
    return s + (ex?.price || 0)
  }, 0)
  const totalPrice = basePrice + extraIngPrice + pizzaExtrasPrice

  const allFlavorsSelected = parts.every((p) => p.flavor !== "")
  const isValid = allFlavorsSelected && (numParts === 1 || fractionsValid)
  const anyFlavorSelected = parts.some((p) => p.flavor !== "")
  const firstMissingIndex = parts.findIndex((p) => p.flavor === "")

  function handleAdd() {
    if (!isValid) return
    const sizeLabel = SIZES.find((s) => s.id === size)?.label
    const primaryProduct = partsProducts[0]
    if (!primaryProduct) return

    const partsLabel = parts
      .map((p, i) => {
        const prod = partsProducts[i]
        if (!prod) return ""
        const fracLabel =
          numParts === 1 ? "" : `${FRACTIONS.find((f) => f.value === p.fraction)?.label} `
        const extrasNames = p.extras
          .map((id) => ingredientItems.find((ig) => ig.id === id)?.name)
          .filter(Boolean)
        const extrasStr = extrasNames.length ? ` (+${extrasNames.join(", ")})` : ""
        return `${fracLabel}${prod.name}${extrasStr}`
      })
      .filter(Boolean)
      .join(" · ")

    const details = [
      partsLabel,
      pizzaExtras
        .map((id) => PIZZA_EXTRAS_LIST.find((e) => e.id === id)?.label)
        .filter(Boolean)
        .join(", "),
    ]
      .filter(Boolean)
      .join(" · ")

    const name =
      numParts === 1
        ? `${primaryProduct.name} ${sizeLabel}`
        : `${parts
            .map((_, i) => partsProducts[i]?.name)
            .filter(Boolean)
            .join(" / ")} ${sizeLabel}`

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

    // Reset sabores/extras pero mantiene tamaño y número de partes elegido
    setParts(makeParts(numParts))
    setPizzaExtras([])
    setNotes("")
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", background: "#F7F7F8" }}>
        {/* Top bar */}
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
          <div>
            <div
              style={{
                fontFamily: "Cooper Black, serif",
                fontSize: 20,
                color: "#18181B",
                lineHeight: 1,
              }}
            >
              Nuevo Pedido
            </div>
          </div>
          {/* Payment status panel */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#A1A1AA" }}>
              Método:
            </div>
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
                  border: `1px solid ${
                    payMethod === m ? "#DC2626" : "#E4E4E7"
                  }`,
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  transition: "all 0.12s",
                }}
              >
                <Icon
                  name={m === "efectivo" ? "receipt" : "tag"}
                  size={12}
                  color={payMethod === m ? "#fff" : "#71717A"}
                />
                {m === "efectivo" ? "Efectivo" : "Tarjeta"}
              </button>
            ))}
          </div>
        </div>

        <div
          className="pedido-grid"
          style={{
            padding: "20px 24px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Cliente + Consumo */}
            <Card title="Cliente y Consumo">
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Nombre del cliente"
                style={inputSt}
              />
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
                      border: `1px solid ${
                        consumption === c.id ? "#DC2626" : "#E4E4E7"
                      }`,
                      borderRadius: 8,
                      cursor: "pointer",
                      transition: "all 0.12s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                    }}
                  >
                    <Icon
                      name={c.icon}
                      size={12}
                      color={consumption === c.id ? "#fff" : "#71717A"}
                    />
                    {c.label}
                  </button>
                ))}
              </div>
              {consumption === "delivery" && (
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Dirección de entrega"
                    style={inputSt}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Teléfono"
                      style={{ ...inputSt, flex: 1 }}
                    />
                    <input
                      type="number"
                      value={deliveryCost}
                      onChange={(e) => setDeliveryCost(e.target.value)}
                      placeholder="Envío $"
                      style={{
                        ...inputSt,
                        width: 80,
                        flex: "none",
                        textAlign: "center",
                      }}
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Tamaño */}
            <Card title="Tamaño">
              <div style={{ display: "flex", gap: 8 }}>
                {SIZES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSize(s.id)
                      setSlices(
                        s.id === "mediana" ? 8 : s.id === "grande" ? 12 : 16,
                      )
                    }}
                    style={{
                      flex: 1,
                      padding: "12px 8px",
                      borderRadius: 10,
                      cursor: "pointer",
                      background: size === s.id ? "#FEF2F2" : "#F7F7F8",
                      border: `2px solid ${
                        size === s.id ? "#DC2626" : "#E4E4E7"
                      }`,
                      color: size === s.id ? "#DC2626" : "#3F3F46",
                      fontFamily:
                        size === s.id ? "Cooper Black, serif" : "inherit",
                      fontSize: 14,
                      fontWeight: size === s.id ? 700 : 500,
                      transition: "all 0.12s",
                      textAlign: "center",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Card>

            {/* Rebanadas */}
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
                        background:
                          slices === n
                            ? "#DC2626"
                            : avail
                              ? "#F7F7F8"
                              : "#FAFAFA",
                        color:
                          slices === n ? "#fff" : avail ? "#18181B" : "#D4D4D8",
                        border: `2px solid ${
                          slices === n
                            ? "#DC2626"
                            : avail
                              ? "#E4E4E7"
                              : "#F4F4F5"
                        }`,
                        borderRadius: 10,
                        cursor: avail ? "pointer" : "not-allowed",
                        transition: "all 0.12s",
                        opacity: avail ? 1 : 0.45,
                      }}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
              {size === "mediana" && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11.5,
                    color: "#D97706",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Icon name="info" size={13} color="#D97706" />
                  Mediana: solo disponible en 8 rebanadas
                </div>
              )}
              {size === "grande" && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11.5,
                    color: "#71717A",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Icon name="info" size={13} color="#71717A" />
                  Grande: 8 o 12 rebanadas
                </div>
              )}
            </Card>

            {/* División */}
            <Card title="División">
              <div style={{ fontSize: 12, color: "#71717A", marginBottom: 10 }}>
                ¿Cuántas partes?
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {NUM_PARTS_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => selectNumParts(n)}
                    style={{
                      flex: 1,
                      padding: "10px 6px",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      background: numParts === n ? "#FEF2F2" : "#F7F7F8",
                      border: `2px solid ${
                        numParts === n ? "#DC2626" : "#E4E4E7"
                      }`,
                      color: numParts === n ? "#DC2626" : "#3F3F46",
                      transition: "all 0.12s",
                      textAlign: "center",
                    }}
                  >
                    {n === 1 ? "Completa" : `${n} partes`}
                  </button>
                ))}
              </div>
              {numParts > 1 && (
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 12px",
                    borderRadius: 9,
                    background: fractionsValid ? "#F0FDF4" : "#FEF2F2",
                    border: `1px solid ${
                      fractionsValid ? "#86EFAC" : "#FCA5A5"
                    }`,
                  }}
                >
                  <Icon
                    name={fractionsValid ? "check" : "alertTriangle"}
                    size={14}
                    color={fractionsValid ? "#16A34A" : "#DC2626"}
                  />
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: fractionsValid ? "#16A34A" : "#DC2626",
                    }}
                  >
                    Total: {totalLabel} {fractionsValid ? "✓" : "✗"}
                  </span>
                </div>
              )}
            </Card>

            {/* Observaciones */}
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
            {/* Pizza visual */}
            <Card title="Vista Previa">
              <div style={{ display: "flex", justifyContent: "center", paddingBottom: 36 }}>
                <PizzaVisual
                  parts={parts.map((p, i) => ({
                    fractionValue: numParts === 1 ? 1 : p.fraction,
                    flavorName: partsProducts[i]?.name || "",
                  }))}
                />
              </div>
            </Card>

            {/* Partes: fracción, sabor e ingredientes extra independientes por parte */}
            {parts.map((part, i) => (
              <Card key={i} title={numParts === 1 ? "Sabor" : `Parte ${i + 1}`}>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {numParts > 1 && (
                    <div style={{ width: 90, flexShrink: 0 }}>
                      <div style={fieldLabelSt}>Fracción</div>
                      <select
                        value={part.fraction}
                        onChange={(e) =>
                          updatePart(i, { fraction: Number(e.target.value) })
                        }
                        style={selectSt}
                      >
                        {FRACTIONS.map((f) => (
                          <option key={f.label} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={fieldLabelSt}>Sabor</div>
                    <select
                      value={part.flavor}
                      onChange={(e) => updatePart(i, { flavor: e.target.value })}
                      style={selectSt}
                    >
                      <option value="">Selecciona...</option>
                      {products
                        .filter((p) => p.active)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — ${p.prices[size]}
                            {p.specialty ? " ★" : ""}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div style={fieldLabelSt}>
                  Ingredientes extra{numParts > 1 ? ` — Parte ${i + 1}` : ""} (
                  {part.extras.length}/10) — $20 c/u
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ingredientItems.map((ing) => {
                    const sel = part.extras.includes(ing.id)
                    return (
                      <button
                        key={ing.id}
                        onClick={() => toggleExtraForPart(i, ing.id)}
                        style={{
                          padding: "5px 10px",
                          fontSize: 12,
                          borderRadius: 8,
                          cursor: "pointer",
                          background: sel ? "#FEF2F2" : "#F7F7F8",
                          color: sel ? "#DC2626" : "#3F3F46",
                          border: `1px solid ${sel ? "#FCA5A5" : "#E4E4E7"}`,
                          fontWeight: sel ? 600 : 400,
                          transition: "all 0.12s",
                          opacity: !sel && part.extras.length >= 10 ? 0.4 : 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {sel && (
                          <Icon
                            name="check"
                            size={10}
                            color="#DC2626"
                            strokeWidth={2.5}
                          />
                        )}
                        {ing.name}
                      </button>
                    )
                  })}
                </div>
              </Card>
            ))}

            {/* Extras de pizza */}
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
                        transition: "all 0.12s",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{ex.label}</div>
                      <div
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: 12,
                          marginTop: 2,
                          color: sel ? "#D97706" : "#A1A1AA",
                        }}
                      >
                        +${ex.price}
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* Price summary + add button */}
            {anyFlavorSelected && (
              <div
                style={{ background: "#18181B", borderRadius: 14, padding: 18 }}
              >
                <div style={{ marginBottom: 12 }}>
                  {parts.map(
                    (p, i) =>
                      partsProducts[i] && (
                        <SummaryLine
                          key={i}
                          label={
                            numParts === 1
                              ? `${partsProducts[i]!.name} ${SIZES.find((s) => s.id === size)?.label}`
                              : `${FRACTIONS.find((f) => f.value === p.fraction)?.label} ${partsProducts[i]!.name}`
                          }
                          value={Math.round(
                            (numParts === 1 ? 1 : p.fraction) *
                              (partsProducts[i]!.prices[size] ?? 0),
                          )}
                        />
                      ),
                  )}
                  {parts.map(
                    (p, i) =>
                      p.extras.length > 0 && (
                        <SummaryLine
                          key={`extra-${i}`}
                          label={`${numParts > 1 ? `Parte ${i + 1}: ` : ""}${p.extras.length} extra${
                            p.extras.length > 1 ? "s" : ""
                          } ingrediente`}
                          value={p.extras.length * 20}
                        />
                      ),
                  )}
                  {pizzaExtras.map((id) => {
                    const ex = PIZZA_EXTRAS_LIST.find((e) => e.id === id)
                    return ex ? (
                      <SummaryLine key={id} label={ex.label} value={ex.price} />
                    ) : null
                  })}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 12,
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Cooper Black, serif",
                      fontSize: 16,
                      color: "#FFFFFF",
                    }}
                  >
                    Total pizza
                  </span>
                  <span
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#FBBF24",
                    }}
                  >
                    ${totalPrice}
                  </span>
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
                    boxShadow: isValid
                      ? "0 4px 16px rgba(220,38,38,0.4)"
                      : "none",
                    transition: "all 0.12s",
                  }}
                >
                  {firstMissingIndex !== -1
                    ? `Selecciona sabor — Parte ${firstMissingIndex + 1}`
                    : numParts > 1 && !fractionsValid
                      ? `Ajusta las fracciones (Total: ${totalLabel})`
                      : `Agregar al ticket — $${totalPrice}`}
                </button>
              </div>
            )}

            {!anyFlavorSelected && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px dashed #FCA5A5",
                  borderRadius: 12,
                  padding: 20,
                  textAlign: "center",
                }}
              >
                <Icon name="pizza" size={32} color="#FCA5A5" />
                <div
                  style={{
                    fontSize: 13,
                    color: "#DC2626",
                    marginTop: 8,
                    fontWeight: 500,
                  }}
                >
                  Selecciona un sabor del menú
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Ticket />
    </div>
  )
}

function Card({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E4E4E7",
        borderRadius: 14,
        padding: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: "#A1A1AA",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function SummaryLine({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 6,
      }}
    >
      <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 12.5,
          color: "rgba(255,255,255,0.6)",
        }}
      >
        ${value}
      </span>
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

const selectSt: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 12.5,
  background: "#F7F7F8",
  color: "#18181B",
  border: "1px solid #E4E4E7",
  borderRadius: 8,
  fontFamily: "Inter, sans-serif",
  cursor: "pointer",
}

const fieldLabelSt: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  color: "#A1A1AA",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: 6,
}
