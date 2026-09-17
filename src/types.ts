export type UserRole = 'super_admin' | 'admin' | 'gerente' | 'cajero' | 'mesero' | 'cocinero' | 'repartidor'

export interface User {
  id: string
  name: string
  username: string
  password: string
  pin: string
  role: UserRole
  phone?: string
  email?: string
  active: boolean
  avatar?: string
}

export type PizzaSize = 'mediana' | 'grande' | 'jumbo'
export type Division = 'completa' | 'mitad' | 'cuartos'
export type OrderStatus = 'nuevo' | 'confirmado' | 'preparando' | 'cocinando' | 'listo' | 'entregado' | 'cancelado'
export type PaymentStatus = 'pendiente' | 'pagado' | 'cancelado' | 'reembolsado'
export type PaymentMethod = 'efectivo' | 'tarjeta'
export type ConsumptionType = 'local' | 'llevar' | 'delivery'

export interface IngredientCategory {
  id: string
  name: string
  color: string
}

export interface Ingredient {
  id: string
  name: string
  unit: string
  stock: number
  minStock: number
  cost: number
  customPrice?: number
  provider: string
  expiry?: string
  categoryId: string
}

export interface ProductIngredient {
  ingredientId: string
  grams: number
}

export interface Product {
  id: string
  name: string
  baseIngredients: ProductIngredient[]
  prices: { mediana: number; grande: number; jumbo: number }
  slices: { mediana: number; grande: number; jumbo: number }
  active: boolean
  specialty: boolean
}

export interface Extra {
  id: string
  name: string
  price: number
  icon: string
  active: boolean
  stock?: number
}

export interface TicketItem {
  id: string
  type: 'slice' | 'pizza' | 'extra'
  name: string
  quantity: number
  unitPrice: number
  total: number
  details?: string
  size?: PizzaSize
}

export interface Promotion {
  id: string
  name: string
  type: 'percent' | 'fixed'
  value: number
  active: boolean
  minAmount?: number
}

export interface Order {
  id: string
  orderNumber: string
  customer?: string
  consumption: ConsumptionType
  address?: string
  phone?: string
  deliveryCost?: number
  items: TicketItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  status: OrderStatus
  notes?: string
  size?: PizzaSize
  slices?: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
  cancelReason?: string
  cancelledBy?: string
}

export interface AuditEntry {
  id: string
  action: string
  module: string
  detail: string
  user: string
  timestamp: Date
}

export interface CashRegister {
  id: string
  openedBy: string
  openedAt: Date
  closedAt?: Date
  initialAmount: number
  expectedAmount: number
  actualAmount?: number
  difference?: number
  cashSales: number
  cardSales: number
  withdrawals: number
  status: 'open' | 'closed'
}

export interface InventoryMovement {
  id: string
  ingredientId: string
  ingredientName: string
  type: 'entrada' | 'salida' | 'ajuste' | 'merma'
  quantity: number
  reason: string
  user: string
  timestamp: Date
}

export const ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  super_admin: { ventas: true, pedidos: true, historial: true, cola: true, dashboard: true, usuarios: true, productos: true, inventario: true, reportes: true, configuracion: true, auditoria: true, corte: true },
  admin: { ventas: true, pedidos: true, historial: true, cola: true, dashboard: true, usuarios: true, productos: true, inventario: true, reportes: true, configuracion: true, auditoria: true, corte: true },
  gerente: { ventas: true, pedidos: true, historial: true, cola: true, dashboard: true, usuarios: false, productos: true, inventario: true, reportes: true, configuracion: false, auditoria: false, corte: true },
  cajero: { ventas: true, pedidos: true, historial: false, cola: true, dashboard: false, usuarios: false, productos: false, inventario: false, reportes: false, configuracion: false, auditoria: false, corte: true },
  mesero: { ventas: true, pedidos: true, historial: false, cola: true, dashboard: false, usuarios: false, productos: false, inventario: false, reportes: false, configuracion: false, auditoria: false, corte: false },
  cocinero: { ventas: false, pedidos: false, historial: false, cola: true, dashboard: false, usuarios: false, productos: false, inventario: false, reportes: false, configuracion: false, auditoria: false, corte: false },
  repartidor: { ventas: false, pedidos: false, historial: false, cola: true, dashboard: false, usuarios: false, productos: false, inventario: false, reportes: false, configuracion: false, auditoria: false, corte: false },
}
