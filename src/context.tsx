import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User, Order, Extra, Product, Ingredient, TicketItem, AuditEntry, Promotion, IngredientCategory, Role, BusinessSettings } from './types'
import { USERS, ORDERS, EXTRAS, PRODUCTS, INGREDIENTS, AUDIT_LOG, PROMOTIONS, INGREDIENT_CATEGORIES, ROLES, DEFAULT_SETTINGS, generateOrderNumber } from './data'

export type View =
  | 'login' | 'main' | 'pedido' | 'extras' | 'historial' | 'cola'
  | 'dashboard' | 'usuarios' | 'productos' | 'inventario'
  | 'reportes' | 'configuracion' | 'auditoria' | 'corte'

interface AppContextType {
  currentUser: User | null
  view: View
  setView: (v: View) => void
  login: (id: string, pin: string) => boolean
  logout: () => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void

  slices: number
  setSlices: (n: number) => void
  ticketItems: TicketItem[]
  addTicketItem: (item: TicketItem) => void
  removeTicketItem: (id: string) => void
  updateItemQty: (id: string, qty: number) => void
  clearTicket: () => void
  activePromo: Promotion | null
  setActivePromo: (p: Promotion | null) => void

  users: User[]
  setUsers: (u: User[]) => void
  roles: Role[]
  setRoles: (r: Role[]) => void
  hasPermission: (permKey: string) => boolean
  settings: BusinessSettings
  setSettings: (s: BusinessSettings) => void
  orders: Order[]
  addOrder: (o: Order) => void
  updateOrder: (id: string, patch: Partial<Order>) => void
  extras: Extra[]
  setExtras: (e: Extra[]) => void
  products: Product[]
  setProducts: (p: Product[]) => void
  ingredients: Ingredient[]
  setIngredients: (i: Ingredient[]) => void
  ingredientCategories: IngredientCategory[]
  setIngredientCategories: (c: IngredientCategory[]) => void
  auditLog: AuditEntry[]
  addAudit: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void
  promotions: Promotion[]
  setPromotions: (p: Promotion[]) => void
  generateOrderNumber: () => string
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [view, setView] = useState<View>('login')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [slices, setSlices] = useState(1)
  const [ticketItems, setTicketItems] = useState<TicketItem[]>([])
  const [activePromo, setActivePromo] = useState<Promotion | null>(null)
  const [users, setUsers] = useState<User[]>(USERS)
  const [roles, setRoles] = useState<Role[]>(ROLES)
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS)
  const [orders, setOrders] = useState<Order[]>(ORDERS)
  const [extras, setExtras] = useState<Extra[]>(EXTRAS)
  const [products, setProducts] = useState<Product[]>(PRODUCTS)
  const [ingredients, setIngredients] = useState<Ingredient[]>(INGREDIENTS)
  const [ingredientCategories, setIngredientCategories] = useState<IngredientCategory[]>(INGREDIENT_CATEGORIES)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(AUDIT_LOG)
  const [promotions, setPromotions] = useState<Promotion[]>(PROMOTIONS)

  function login(userId: string, pin: string): boolean {
    const user = users.find(u => u.id === userId && u.pin === pin && u.active)
    if (user) {
      setCurrentUser(user)
      setView(user.role === 'cocinero' || user.role === 'repartidor' ? 'cola' : 'main')
      return true
    }
    return false
  }

  function logout() {
    setCurrentUser(null)
    setView('login')
    setTicketItems([])
    setSlices(1)
    setActivePromo(null)
  }

  function addTicketItem(item: TicketItem) {
    setTicketItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id
          ? { ...i, quantity: i.quantity + item.quantity, total: (i.quantity + item.quantity) * i.unitPrice }
          : i)
      }
      return [...prev, item]
    })
  }

  function removeTicketItem(id: string) {
    setTicketItems(prev => prev.filter(i => i.id !== id))
  }

  function updateItemQty(id: string, qty: number) {
    if (qty <= 0) { removeTicketItem(id); return }
    setTicketItems(prev => prev.map(i => i.id === id
      ? { ...i, quantity: qty, total: qty * i.unitPrice } : i))
  }

  function clearTicket() { setTicketItems([]); setActivePromo(null); setSlices(1) }

  function addOrder(o: Order) {
    setOrders(prev => [o, ...prev])
    addAudit({ action: 'Nuevo pedido', module: 'Pedidos', detail: `${o.orderNumber} — ${o.customer || 'Sin nombre'} — $${o.total}`, user: currentUser?.name || 'Sistema' })
  }

  function updateOrder(id: string, patch: Partial<Order>) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch, updatedAt: new Date() } : o))
  }

  function hasPermission(permKey: string): boolean {
    if (!currentUser) return false
    const role = roles.find(r => r.id === currentUser.role)
    return role?.permissions[permKey] ?? false
  }

  function addAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>) {
    setAuditLog(prev => [{ ...entry, id: `a${Date.now()}`, timestamp: new Date() }, ...prev])
  }

  return (
    <AppContext.Provider value={{
      currentUser, view, setView, login, logout, sidebarOpen, setSidebarOpen,
      slices, setSlices,
      ticketItems, addTicketItem, removeTicketItem, updateItemQty, clearTicket,
      activePromo, setActivePromo,
      users, setUsers, roles, setRoles, hasPermission, settings, setSettings, orders, addOrder, updateOrder,
      extras, setExtras, products, setProducts,
      ingredients, setIngredients, ingredientCategories, setIngredientCategories,
      auditLog, addAudit,
      promotions, setPromotions,
      generateOrderNumber,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp outside AppProvider')
  return ctx
}
