import { useState } from "react"
import { useApp } from "../context"
import Ticket from "../components/Ticket"
import Icon from "../components/Icon"
import type {
  PizzaSize,
  Division,
  ConsumptionType,
  PaymentMethod,
} from "../types"

const SIZES: { id: PizzaSize label: string }[] = [
  { id: "mediana", label: "Mediana" },
  { id: "grande", label: "Grande" },
  { id: "jumbo", label: "Jumbo" },
]

const SLICE_OPTIONS = [8, 12, 16]

const DIVISION_OPTIONS: { id: Division label: string parts: number }[] = [
  { id: "completa", label: "Completa", parts: 1 },
  { id: "mitad", label: "½ y ½", parts: 2 },
  { id: "cuartos", label: "¾ y ¼", parts: 2 },
]

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
  division,
  flavor1Name,
  flavor2Name,
}: {
  division: Division
  flavor1Name: string
  flavor2Name: string
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

  const slices =
    division === "completa"
      ? [
          {
            path: `M ${cx} ${cy} m -${r} 0 a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 -${r * 2} 0`,
            color: PIZZA_COLORS[0],
            label: flavor1Name || "Sabor 1",
          },
        ]
      : division === "mitad"
        ? [
            {
              path: arcPath(0, 180),
              color: PIZZA_COLORS[0],
              label: flavor1Name || "Sabor 1",
            },
            {
              path: arcPath(180, 360),
              color: PIZZA_COLORS[1],
              label: flavor2Name || "Sabor 2",
            },
          ]
        : [
            {
              path: arcPath(0, 270),
              color: PIZZA_COLORS[0],
              label: flavor1Name || "Sabor 1",
            },
            {
              path: arcPath(270, 360),
              color: PIZZA_COLORS[1],
              label: flavor2Name || "Sabor 2",
            },
          ]

  return (
    <div style={{ position: "relative" }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        {/* Shadow */}
        <circle cx={cx} cy={cy} r={r + 4} fill="rgba(0,0,0,0.06)" />
        {/* Crust */}
        <circle cx={cx} cy={cy} r={r} fill="#FDE68A" />
        {/* Sections */}
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={0.85} />
        ))}
        {/* Center label ring */}
        {division !== "completa" && (
          <line
            x1={cx}
            y1={cy - r}
            x2={cx}
            y2={cy + r}
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="2"
          />
        )}
        {division === "cuartos" && (
          <line
            x1={cx}
            y1={cy}
            x2={cx + r}
            y2={cy}
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="2"
          />
        )}
        {/* Outer ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="3"
        />
        {/* Slice marks */}
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

      {/* Legend */}
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
    currentUser,
    setSidebarOpen,
    sidebarOpen,
  } = useApp()

  const [customer, setCustomer] = useState("")
  const [consumption, setConsumption] = useState<ConsumptionType>("local")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [deliveryCost, setDeliveryCost] = useState("30")
  const [size, setSize] = useState<PizzaSize>("grande")
  const [slices, setSlices] = useState(12)
  const [division, setDivision] = useState<Division>("completa")
  const [flavor1, setFlavor1] = useState("")
  const [flavor2, setFlavor2] = useState("")
  const [extraIngredients, setExtraIngredients] = useState<string[]>([])
  const [pizzaExtras, setPizzaExtras] = useState<string[]>([])
  const [payMethod, setPayMethod] = useState<PaymentMethod>("efectivo")
  const [notes, setNotes] = useState("")

  // Get ingredients of category "Ingredientes" for extra ingredients
  const ingredientItems = ingredients.filter((i) => i.categoryId === "cat1")

  const product1 = products.find((p) => p.id === flavor1)
  const product2 = products.find((p) => p.id === flavor2)

  const basePrice = product1 ? product1.prices[size] : 0
  const extraIngPrice = extraIngredients.length * 20
  const pizzaExtrasPrice = pizzaExtras.reduce((s, id) => {
    const ex = PIZZA_EXTRAS_LIST.find((e) => e.id === id)
    return s + (ex?.price || 0)
  }, 0)
  const totalPrice = basePrice + extraIngPrice + pizzaExtrasPrice

  const isValid = flavor1 !== "" && (division === "completa" || flavor2 !== "")

  // Slices rules
  const availableSlices =
    size === "mediana" ? [8] : size === "grande" ? [8, 12] : [8, 12, 16]

  function toggleExtraIng(id: string) {
    setExtraIngredients((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length < 10
          ? [...prev, id]
          : prev,
    )
  }

  function togglePizzaExtra(id: string) {
    setPizzaExtras((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  function handleAdd() {
    if (!product1) return
    const divLabel =
      division === "completa"
        ? ""
        : division === "mitad"
          ? `½ ${product1.name} / ½ ${product2?.name}`
          : `¾ ${product1.name} / ¼ ${product2?.name}`
    const extrasLabel = extraIngredients
      .map((id) => ingredientItems.find((i) => i.id === id)?.name || id)
      .join(", ")
    const details = [
      divLabel,
      extrasLabel,
      pizzaExtras
        .map((id) => PIZZA_EXTRAS_LIST.find((e) => e.id === id)?.label)
        .join(", "),
    ]
      .filter(Boolean)
      .join(" · ")

    addTicketItem({
      id: `pizza-${Date.now()}`,
      type: "pizza",
      name: `${product1.name} ${SIZES.find((s) => s.id === size)?.label}`,
      quantity: 1,
      unitPrice: totalPrice,
      total: totalPrice,
      size,
      details,
    })

    // Reset flavors/extras but keep config
    setFlavor1("")
    setFlavor2("")
    setExtraIngredients([])
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
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "#71717A",
              display: "flex",
              borderRadius: 6,
            }}
          >
            <Icon name="menu" size={20} />
          </button>
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
              <div style={{ display: "flex", gap: 8 }}>
                {DIVISION_OPTIONS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setDivision(d.id)
                      if (d.id === "completa") setFlavor2("")
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 6px",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      background: division === d.id ? "#FEF2F2" : "#F7F7F8",
                      border: `2px solid ${
                        division === d.id ? "#DC2626" : "#E4E4E7"
                      }`,
                      color: division === d.id ? "#DC2626" : "#3F3F46",
                      transition: "all 0.12s",
                      textAlign: "center",
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
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
            {/* Pizza visual + flavor selection */}
            <Card title="Menú y División Visual">
              <div
                style={{ display: "flex", gap: 20, alignItems: "flex-start" }}
              >
                {/* Pizza SVG */}
                <div style={{ flexShrink: 0, paddingBottom: 36 }}>
                  <PizzaVisual
                    division={division}
                    flavor1Name={
                      products.find((p) => p.id === flavor1)?.name || ""
                    }
                    flavor2Name={
                      products.find((p) => p.id === flavor2)?.name || ""
                    }
                  />
                </div>

                {/* Flavor selectors */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: "#A1A1AA",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    {division === "completa" ? "Sabor" : "Primer sabor"}{" "}
                    {division === "cuartos"
                      ? "(¾)"
                      : division === "mitad"
                        ? "(½)"
                        : ""}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    {products
                      .filter((p) => p.active)
                      .map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setFlavor1(p.id)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 12.5,
                            textAlign: "left",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background:
                              flavor1 === p.id ? "#FEF2F2" : "#F7F7F8",
                            border: `1px solid ${
                              flavor1 === p.id ? "#FCA5A5" : "#E4E4E7"
                            }`,
                            color: flavor1 === p.id ? "#DC2626" : "#3F3F46",
                            fontWeight: flavor1 === p.id ? 600 : 400,
                            transition: "all 0.12s",
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            {p.specialty && (
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: "#FBBF24",
                                  flexShrink: 0,
                                  display: "inline-block",
                                }}
                              />
                            )}
                            {p.name}
                          </span>
                          <span
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: 12,
                              fontWeight: 700,
                              color: flavor1 === p.id ? "#DC2626" : "#71717A",
                              flexShrink: 0,
                            }}
                          >
                            ${p.prices[size]}
                          </span>
                        </button>
                      ))}
                  </div>

                  {division !== "completa" && (
                    <div style={{ marginTop: 12 }}>
                      <div
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "#A1A1AA",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          marginBottom: 6,
                        }}
                      >
                        Segundo sabor {division === "cuartos" ? "(¼)" : "(½)"}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          maxHeight: 140,
                          overflowY: "auto",
                        }}
                      >
                        {products
                          .filter((p) => p.active && p.id !== flavor1)
                          .map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setFlavor2(p.id)}
                              style={{
                                padding: "7px 10px",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontSize: 12.5,
                                textAlign: "left",
                                display: "flex",
                                justifyContent: "space-between",
                                background:
                                  flavor2 === p.id ? "#FFFBEB" : "#F7F7F8",
                                border: `1px solid ${
                                  flavor2 === p.id ? "#FDE68A" : "#E4E4E7"
                                }`,
                                color: flavor2 === p.id ? "#D97706" : "#3F3F46",
                                fontWeight: flavor2 === p.id ? 600 : 400,
                                transition: "all 0.12s",
                              }}
                            >
                              <span>{p.name}</span>
                              <span
                                style={{
                                  fontFamily: "JetBrains Mono, monospace",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  flexShrink: 0,
                                }}
                              >
                                ${p.prices[size]}
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Ingredientes Extra */}
            <Card
              title={`Ingredientes Extra (${extraIngredients.length}/10) — $20 c/u`}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ingredientItems.map((ing) => {
                  const sel = extraIngredients.includes(ing.id)
                  return (
                    <button
                      key={ing.id}
                      onClick={() => toggleExtraIng(ing.id)}
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
                        opacity:
                          !sel && extraIngredients.length >= 10 ? 0.4 : 1,
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
            {flavor1 && (
              <div
                style={{ background: "#18181B", borderRadius: 14, padding: 18 }}
              >
                <div style={{ marginBottom: 12 }}>
                  {product1 && (
                    <SummaryLine
                      label={`${product1.name} ${SIZES.find((s) => s.id === size)?.label}`}
                      value={basePrice}
                    />
                  )}
                  {extraIngredients.length > 0 && (
                    <SummaryLine
                      label={`${extraIngredients.length} extra${
                        extraIngredients.length > 1 ? "s" : ""
                      } ingrediente`}
                      value={extraIngPrice}
                    />
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
                  {!flavor1
                    ? "Selecciona un sabor"
                    : !isValid
                      ? "Selecciona segundo sabor"
                      : `Agregar al ticket — $${totalPrice}`}
                </button>
              </div>
            )}

            {!flavor1 && (
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

function SummaryLine({ label, value }: { label: string value: number }) {
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
