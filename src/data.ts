import type {
  User, Product, Extra, Ingredient, Order,
  AuditEntry, CashRegister, InventoryMovement,
  Promotion, IngredientCategory, Role
} from './types'

export const ROLES: Role[] = [
  { id: 'super_admin', label: 'Super Admin', color: '#DC2626', permissions: { ventas: true, pedidos: true, extras: true, historial: true, cola: true, dashboard: true, usuarios: true, productos: true, inventario: true, reportes: true, configuracion: true, auditoria: true, corte: true } },
  { id: 'admin', label: 'Admin', color: '#D97706', permissions: { ventas: true, pedidos: true, extras: true, historial: true, cola: true, dashboard: true, usuarios: true, productos: true, inventario: true, reportes: true, configuracion: true, auditoria: true, corte: true } },
  { id: 'gerente', label: 'Gerente', color: '#2563EB', permissions: { ventas: true, pedidos: true, extras: true, historial: true, cola: true, dashboard: true, usuarios: false, productos: true, inventario: true, reportes: true, configuracion: false, auditoria: false, corte: true } },
  { id: 'cajero', label: 'Cajero', color: '#16A34A', permissions: { ventas: true, pedidos: true, extras: true, historial: false, cola: true, dashboard: false, usuarios: false, productos: false, inventario: false, reportes: false, configuracion: false, auditoria: false, corte: true } },
  { id: 'mesero', label: 'Mesero', color: '#7C3AED', permissions: { ventas: true, pedidos: true, extras: true, historial: false, cola: true, dashboard: false, usuarios: false, productos: false, inventario: false, reportes: false, configuracion: false, auditoria: false, corte: false } },
  { id: 'cocinero', label: 'Cocinero', color: '#D97706', permissions: { ventas: false, pedidos: false, extras: false, historial: false, cola: true, dashboard: false, usuarios: false, productos: false, inventario: false, reportes: false, configuracion: false, auditoria: false, corte: false } },
  { id: 'repartidor', label: 'Repartidor', color: '#0891B2', permissions: { ventas: false, pedidos: false, extras: false, historial: false, cola: true, dashboard: false, usuarios: false, productos: false, inventario: false, reportes: false, configuracion: false, auditoria: false, corte: false } },
]

export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  { id: 'cat1', name: 'Ingredientes', color: '#DC2626' },
  { id: 'cat2', name: 'Materia Prima', color: '#D97706' },
  { id: 'cat3', name: 'Bebidas', color: '#2563EB' },
  { id: 'cat4', name: 'Empaques', color: '#16A34A' },
]

export const USERS: User[] = [
  { id: 'u1', name: 'Carlos Mendoza', username: 'admin', password: '1234', pin: '1111', role: 'super_admin', phone: '55-1234-5678', email: 'carlos@pizzaias.mx', active: true },
  { id: 'u2', name: 'María López', username: 'gerente', password: '1234', pin: '2222', role: 'gerente', phone: '55-8765-4321', email: 'maria@pizzaias.mx', active: true },
  { id: 'u3', name: 'José Ramírez', username: 'cajero1', password: '1234', pin: '3333', role: 'cajero', phone: '55-2345-6789', email: 'jose@pizzaias.mx', active: true },
  { id: 'u4', name: 'Ana Torres', username: 'mesero1', password: '1234', pin: '4444', role: 'mesero', phone: '55-3456-7890', email: 'ana@pizzaias.mx', active: true },
  { id: 'u5', name: 'Luis García', username: 'cocinero1', password: '1234', pin: '5555', role: 'cocinero', phone: '55-4567-8901', email: 'luis@pizzaias.mx', active: true },
  { id: 'u6', name: 'Pedro Castillo', username: 'repartidor1', password: '1234', pin: '6666', role: 'repartidor', phone: '55-5678-9012', email: 'pedro@pizzaias.mx', active: true },
]

export const INGREDIENTS: Ingredient[] = [
  { id: 'i1', name: 'Salsa de tomate', unit: 'g', stock: 8500, minStock: 3000, cost: 0.035, provider: 'Alimentos Del Norte', categoryId: 'cat2' },
  { id: 'i2', name: 'Queso mozzarella', unit: 'g', stock: 12000, minStock: 5000, cost: 0.12, provider: 'Lácteos Premium', categoryId: 'cat1' },
  { id: 'i3', name: 'Jamón', unit: 'g', stock: 4200, minStock: 2000, cost: 0.095, provider: 'Carnes Selectas', categoryId: 'cat1' },
  { id: 'i4', name: 'Piña en almíbar', unit: 'g', stock: 3500, minStock: 2000, cost: 0.045, provider: 'Abarrotes Central', categoryId: 'cat1' },
  { id: 'i5', name: 'Pepperoni', unit: 'g', stock: 2800, minStock: 2000, cost: 0.13, provider: 'Carnes Selectas', categoryId: 'cat1', expiry: '2025-08-20' },
  { id: 'i6', name: 'Chorizo', unit: 'g', stock: 1500, minStock: 2000, cost: 0.11, provider: 'Carnes Selectas', categoryId: 'cat1' },
  { id: 'i7', name: 'Jalapeño', unit: 'g', stock: 2000, minStock: 1000, cost: 0.028, provider: 'Verduras Frescas', categoryId: 'cat1' },
  { id: 'i8', name: 'Cebolla', unit: 'g', stock: 5000, minStock: 2000, cost: 0.018, provider: 'Verduras Frescas', categoryId: 'cat1' },
  { id: 'i9', name: 'Pimiento morrón', unit: 'g', stock: 3200, minStock: 1500, cost: 0.04, provider: 'Verduras Frescas', categoryId: 'cat1' },
  { id: 'i10', name: 'Champiñones', unit: 'g', stock: 2100, minStock: 1000, cost: 0.055, provider: 'Verduras Frescas', categoryId: 'cat1' },
  { id: 'i11', name: 'Masa para pizza', unit: 'g', stock: 20000, minStock: 8000, cost: 0.025, provider: 'Panadería Artesanal', categoryId: 'cat2' },
  { id: 'i12', name: 'Pollo cocido', unit: 'g', stock: 3800, minStock: 2000, cost: 0.085, provider: 'Carnes Selectas', categoryId: 'cat1' },
  { id: 'i13', name: 'Salsa BBQ', unit: 'g', stock: 2500, minStock: 1000, cost: 0.065, provider: 'Alimentos Del Norte', categoryId: 'cat2' },
  { id: 'i14', name: 'Queso gouda', unit: 'g', stock: 1800, minStock: 1000, cost: 0.145, provider: 'Lácteos Premium', categoryId: 'cat1' },
  { id: 'i15', name: 'Coca-Cola 600ml', unit: 'pza', stock: 48, minStock: 12, cost: 14, provider: 'Distribuidora Bebidas', categoryId: 'cat3' },
  { id: 'i16', name: 'Agua Natural 600ml', unit: 'pza', stock: 60, minStock: 12, cost: 7, provider: 'Distribuidora Bebidas', categoryId: 'cat3' },
]

export const PRODUCTS: Product[] = [
  {
    id: 'p1', name: 'Hawaiana',
    baseIngredients: [
      { ingredientId: 'i11', grams: 250 },
      { ingredientId: 'i1', grams: 80 },
      { ingredientId: 'i2', grams: 150 },
      { ingredientId: 'i3', grams: 100 },
      { ingredientId: 'i4', grams: 80 },
    ],
    prices: { mediana: 130, grande: 180, jumbo: 240 },
    slices: { mediana: 8, grande: 12, jumbo: 16 },
    active: true, specialty: false,
  },
  {
    id: 'p2', name: 'Pepperoni',
    baseIngredients: [
      { ingredientId: 'i11', grams: 250 },
      { ingredientId: 'i1', grams: 80 },
      { ingredientId: 'i2', grams: 180 },
      { ingredientId: 'i5', grams: 120 },
    ],
    prices: { mediana: 140, grande: 195, jumbo: 260 },
    slices: { mediana: 8, grande: 12, jumbo: 16 },
    active: true, specialty: false,
  },
  {
    id: 'p3', name: 'Mexicana',
    baseIngredients: [
      { ingredientId: 'i11', grams: 250 },
      { ingredientId: 'i1', grams: 80 },
      { ingredientId: 'i2', grams: 140 },
      { ingredientId: 'i6', grams: 100 },
      { ingredientId: 'i7', grams: 40 },
      { ingredientId: 'i8', grams: 60 },
    ],
    prices: { mediana: 145, grande: 200, jumbo: 270 },
    slices: { mediana: 8, grande: 12, jumbo: 16 },
    active: true, specialty: true,
  },
  {
    id: 'p4', name: 'Vegetal',
    baseIngredients: [
      { ingredientId: 'i11', grams: 250 },
      { ingredientId: 'i1', grams: 80 },
      { ingredientId: 'i2', grams: 130 },
      { ingredientId: 'i9', grams: 70 },
      { ingredientId: 'i10', grams: 80 },
    ],
    prices: { mediana: 135, grande: 185, jumbo: 250 },
    slices: { mediana: 8, grande: 12, jumbo: 16 },
    active: true, specialty: false,
  },
  {
    id: 'p5', name: 'Cuatro Quesos',
    baseIngredients: [
      { ingredientId: 'i11', grams: 250 },
      { ingredientId: 'i1', grams: 60 },
      { ingredientId: 'i2', grams: 100 },
      { ingredientId: 'i14', grams: 80 },
    ],
    prices: { mediana: 155, grande: 215, jumbo: 290 },
    slices: { mediana: 8, grande: 12, jumbo: 16 },
    active: true, specialty: true,
  },
  {
    id: 'p6', name: 'BBQ Pollo',
    baseIngredients: [
      { ingredientId: 'i11', grams: 250 },
      { ingredientId: 'i13', grams: 90 },
      { ingredientId: 'i2', grams: 140 },
      { ingredientId: 'i12', grams: 130 },
      { ingredientId: 'i8', grams: 40 },
    ],
    prices: { mediana: 150, grande: 210, jumbo: 280 },
    slices: { mediana: 8, grande: 12, jumbo: 16 },
    active: true, specialty: true,
  },
]

export const EXTRAS: Extra[] = [
  { id: 'e1', name: 'Coca-Cola', price: 25, icon: 'drink', active: true, stock: 48 },
  { id: 'e2', name: 'Agua Natural', price: 15, icon: 'water', active: true, stock: 60 },
  { id: 'e3', name: 'Agua Mineral', price: 18, icon: 'water', active: true, stock: 36 },
  { id: 'e4', name: 'Bolsa', price: 5, icon: 'bag', active: true, stock: 200 },
  { id: 'e5', name: 'Charola', price: 8, icon: 'plate', active: true, stock: 50 },
  { id: 'e6', name: 'Servilletas', price: 0, icon: 'napkin', active: true, stock: 500 },
  { id: 'e7', name: 'Jugo Naranja', price: 22, icon: 'juice', active: true, stock: 24 },
  { id: 'e8', name: 'Cerveza', price: 35, icon: 'beer', active: true, stock: 30 },
]

const now = new Date()
const yesterday = new Date(now.getTime() - 86400000)
const twoDaysAgo = new Date(now.getTime() - 172800000)

export const ORDERS: Order[] = [
  {
    id: 'o1', orderNumber: 'PZZ-001', customer: 'Juan Pérez', consumption: 'local',
    items: [
      { id: 'oi1', type: 'pizza', name: 'Pepperoni Grande', quantity: 1, unitPrice: 195, total: 195, size: 'grande' },
      { id: 'oi2', type: 'extra', name: 'Coca-Cola', quantity: 2, unitPrice: 25, total: 50 },
    ],
    subtotal: 245, discount: 0, total: 245, size: 'grande', slices: 12,
    paymentMethod: 'tarjeta', paymentStatus: 'pagado', status: 'entregado',
    createdBy: 'u3', createdAt: yesterday, updatedAt: yesterday,
  },
  {
    id: 'o2', orderNumber: 'PZZ-002', customer: 'Sandra Ruiz', consumption: 'llevar',
    items: [{ id: 'oi3', type: 'pizza', name: 'Mexicana Jumbo', quantity: 1, unitPrice: 270, total: 270, size: 'jumbo' }],
    subtotal: 270, discount: 20, total: 250, size: 'jumbo', slices: 16,
    paymentMethod: 'efectivo', paymentStatus: 'pagado', status: 'entregado',
    createdBy: 'u3', createdAt: yesterday, updatedAt: yesterday,
  },
  {
    id: 'o3', orderNumber: 'PZZ-003', customer: 'Roberto Sánchez', consumption: 'delivery',
    address: 'Calle Reforma 123', phone: '55-9999-0000', deliveryCost: 30,
    items: [
      { id: 'oi4', type: 'pizza', name: 'Hawaiana Mediana', quantity: 2, unitPrice: 130, total: 260, size: 'mediana' },
      { id: 'oi5', type: 'extra', name: 'Coca-Cola', quantity: 2, unitPrice: 25, total: 50 },
    ],
    subtotal: 340, discount: 0, total: 370, size: 'mediana', slices: 8,
    paymentMethod: 'efectivo', paymentStatus: 'pagado', status: 'entregado',
    createdBy: 'u4', createdAt: twoDaysAgo, updatedAt: twoDaysAgo,
  },
  {
    id: 'o4', orderNumber: 'PZZ-004', customer: 'Elena Vargas', consumption: 'local',
    items: [{ id: 'oi6', type: 'pizza', name: 'Cuatro Quesos Grande', quantity: 1, unitPrice: 215, total: 215, size: 'grande' }],
    subtotal: 215, discount: 0, total: 215, size: 'grande', slices: 12,
    paymentMethod: 'tarjeta', paymentStatus: 'pendiente', status: 'cocinando',
    createdBy: 'u3', createdAt: now, updatedAt: now,
  },
  {
    id: 'o5', orderNumber: 'PZZ-005', customer: 'Mario Díaz', consumption: 'local',
    items: [
      { id: 'oi7', type: 'pizza', name: 'BBQ Pollo Grande', quantity: 1, unitPrice: 210, total: 210, size: 'grande' },
      { id: 'oi8', type: 'extra', name: 'Agua Natural', quantity: 1, unitPrice: 15, total: 15 },
    ],
    subtotal: 225, discount: 0, total: 225, size: 'grande', slices: 12,
    paymentMethod: 'efectivo', paymentStatus: 'pendiente', status: 'preparando',
    createdBy: 'u4', createdAt: now, updatedAt: now,
  },
]

export const AUDIT_LOG: AuditEntry[] = [
  { id: 'a1', action: 'Modificar precio', module: 'Productos', detail: 'Pepperoni Grande: $185 → $195', user: 'Carlos Mendoza', timestamp: yesterday },
  { id: 'a2', action: 'Crear usuario', module: 'Usuarios', detail: 'Nuevo usuario: Pedro Castillo (repartidor)', user: 'Carlos Mendoza', timestamp: twoDaysAgo },
  { id: 'a3', action: 'Cancelar pedido', module: 'Pedidos', detail: 'PZZ-009 — Cliente no retiró', user: 'María López', timestamp: twoDaysAgo },
  { id: 'a4', action: 'Ajuste inventario', module: 'Inventario', detail: 'Queso mozzarella: +5 kg (entrada proveedor)', user: 'María López', timestamp: yesterday },
]

export const PROMOTIONS: Promotion[] = [
  { id: 'pr1', name: 'Descuento 10%', type: 'percent', value: 10, active: true, minAmount: 200 },
  { id: 'pr2', name: 'Descuento gerente $20', type: 'fixed', value: 20, active: true },
  { id: 'pr3', name: 'Descuento Total', type: 'percent', value: 100, active: true },

]

export const CASH_REGISTER: CashRegister = {
  id: 'cr1', openedBy: 'José Ramírez',
  openedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0),
  initialAmount: 500, expectedAmount: 1345,
  cashSales: 795, cardSales: 550, withdrawals: 0, status: 'open',
}

export const INVENTORY_MOVEMENTS: InventoryMovement[] = [
  { id: 'm1', ingredientId: 'i2', ingredientName: 'Queso mozzarella', type: 'entrada', quantity: 5000, reason: 'Compra proveedor', user: 'María López', timestamp: yesterday },
  { id: 'm2', ingredientId: 'i6', ingredientName: 'Chorizo', type: 'salida', quantity: 300, reason: 'Venta PZZ-002', user: 'Sistema', timestamp: yesterday },
  { id: 'm3', ingredientId: 'i5', ingredientName: 'Pepperoni', type: 'merma', quantity: 200, reason: 'Caducidad', user: 'Luis García', timestamp: twoDaysAgo },
]

let _counter = 6
export function generateOrderNumber(): string {
  return `PZZ-${String(_counter++).padStart(3, '0')}`
}
