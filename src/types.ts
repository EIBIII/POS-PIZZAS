export interface BusinessSettings {
  name: string
  address: string
  phone: string
  rfc: string
  tax: number
  logoUrl: string
  reportEmail: string
  currency: string
  timezone: string
  language: string
  autoLogout: number
  initialFloat: number
  ticketHeader: string
  ticketFooter: string
  ticketShowLogo: boolean
  printerWidth: number
  deliveryBaseRate: number
  deliveryFreeThreshold: number
  deliveryRadiusKm: number
  deliveryEstimatedMinutes: number
}

export type UserRole = string

export interface Role {
  id: string
  label: string
  color: string
  permissions: Record<string, boolean>
}

export const PERMISSION_MODULES: { key: string; label: string }[] = [
  { key: 'ventas', label: 'Ventas / POS' },
  { key: 'pedidos', label: 'Pedidos' },
  { key: 'extras', label: 'Extras' },
  { key: 'historial', label: 'Historial' },
  { key: 'cola', label: 'Cola de pedidos' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'usuarios', label: 'Usuarios' },
  { key: 'productos', label: 'Productos' },
  { key: 'inventario', label: 'Inventario' },
  { key: 'reportes', label: 'Reportes' },
  { key: 'configuracion', label: 'Configuración' },
  { key: 'auditoria', label: 'Auditoría' },
  { key: 'corte', label: 'Corte de caja' },
]

// Mapea cada vista (id usado en Sidebar/App) a su clave de permiso correspondiente
export const VIEW_PERMISSION_KEY: Record<string, string> = {
  main: 'ventas',
  pedido: 'pedidos',
  extras: 'extras',
  historial: 'historial',
  cola: 'cola',
  dashboard: 'dashboard',
  usuarios: 'usuarios',
  productos: 'productos',
  inventario: 'inventario',
  reportes: 'reportes',
  configuracion: 'configuracion',
  auditoria: 'auditoria',
  corte: 'corte',
}

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
  icon?: string
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


