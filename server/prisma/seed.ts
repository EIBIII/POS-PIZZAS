// Carga la misma data de demo que trae el frontend (src/data.ts) para que
// el backend arranque con algo usable: roles, usuarios, categorías,
// ingredientes, productos, extras y configuración. Password/PIN de demo
// son los mismos que en el frontend ("1234" y el PIN de cada tarjeta en
// Login), pero aquí sí quedan hasheados con bcrypt. Cámbialos antes de
// usar esto en producción real.
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'PIZZAIAS',
      address: 'Av. Insurgentes 420, CDMX',
      phones: ['55 1234 5678'],
      rfc: 'PIZ123456ABC',
      tax: 16,
      logoUrl: '',
      reportEmail: '',
      currency: 'MXN',
      timezone: 'America/Mexico_City',
      language: 'es',
      autoLogout: 30,
      initialFloat: 500,
      slicePrice: 25,
      simplePizzaPrice: { mediana: 110, grande: 150, jumbo: 200 },
      ticketHeader: 'PIZZAIAS',
      ticketFooter: 'Gracias por su visita',
      ticketShowLogo: true,
      printerWidth: 80,
      deliveryBaseRate: 35,
      deliveryFreeThreshold: 400,
      deliveryRadiusKm: 5,
      deliveryEstimatedMinutes: 45,
    },
  })

  const ROLES = [
    { id: 'super_admin', label: 'Super Admin', color: '#DC2626', permissions: { ventas: true, pedidos: true, extras: true, historial: true, cola: true, dashboard: true, usuarios: true, productos: true, inventario: true, reportes: true, configuracion: true, auditoria: true, corte: true } },
    { id: 'admin', label: 'Admin', color: '#D97706', permissions: { ventas: true, pedidos: true, extras: true, historial: true, cola: true, dashboard: true, usuarios: true, productos: true, inventario: true, reportes: true, configuracion: true, auditoria: true, corte: true } },
    { id: 'gerente', label: 'Gerente', color: '#2563EB', permissions: { ventas: true, pedidos: true, extras: true, historial: true, cola: true, dashboard: true, usuarios: false, productos: true, inventario: true, reportes: true, configuracion: false, auditoria: false, corte: true } },
    { id: 'cajero', label: 'Cajero', color: '#16A34A', permissions: { ventas: true, pedidos: true, extras: true, historial: false, cola: true, dashboard: false, usuarios: false, productos: false, inventario: false, reportes: false, configuracion: false, auditoria: false, corte: true } },
    { id: 'mesero', label: 'Mesero', color: '#7C3AED', permissions: { ventas: true, pedidos: true, extras: true, historial: false, cola: true, dashboard: false, usuarios: false, productos: false, inventario: false, reportes: false, configuracion: false, auditoria: false, corte: false } },
    { id: 'cocinero', label: 'Cocinero', color: '#D97706', permissions: { ventas: false, pedidos: false, extras: false, historial: false, cola: true, dashboard: false, usuarios: false, productos: false, inventario: false, reportes: false, configuracion: false, auditoria: false, corte: false } },
    { id: 'repartidor', label: 'Repartidor', color: '#0891B2', permissions: { ventas: false, pedidos: false, extras: false, historial: false, cola: true, dashboard: false, usuarios: false, productos: false, inventario: false, reportes: false, configuracion: false, auditoria: false, corte: false } },
  ]
  for (const r of ROLES) {
    await prisma.role.upsert({ where: { id: r.id }, update: r, create: r })
  }

  const USERS = [
    { id: 'u1', name: 'Carlos Mendoza', username: 'admin', pin: '1111', roleId: 'super_admin', phone: '55-1234-5678', email: 'carlos@pizzaias.mx' },
    { id: 'u2', name: 'María López', username: 'gerente', pin: '2222', roleId: 'gerente', phone: '55-8765-4321', email: 'maria@pizzaias.mx' },
    { id: 'u3', name: 'José Ramírez', username: 'cajero1', pin: '3333', roleId: 'cajero', phone: '55-2345-6789', email: 'jose@pizzaias.mx' },
    { id: 'u4', name: 'Ana Torres', username: 'mesero1', pin: '4444', roleId: 'mesero', phone: '55-3456-7890', email: 'ana@pizzaias.mx' },
    { id: 'u5', name: 'Luis García', username: 'cocinero1', pin: '5555', roleId: 'cocinero', phone: '55-4567-8901', email: 'luis@pizzaias.mx' },
    { id: 'u6', name: 'Pedro Castillo', username: 'repartidor1', pin: '6666', roleId: 'repartidor', phone: '55-5678-9012', email: 'pedro@pizzaias.mx' },
  ]
  for (const u of USERS) {
    const { pin, ...rest } = u
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: { ...rest, password: await bcrypt.hash('1234', 10), pin: await bcrypt.hash(pin, 10), active: true },
    })
  }

  const CATEGORIES = [
    { id: 'cat1', name: 'Ingredientes', color: '#DC2626', showInExtras: false },
    { id: 'cat2', name: 'Materia Prima', color: '#D97706', showInExtras: true },
    { id: 'cat3', name: 'Bebidas', color: '#2563EB', showInExtras: true },
    { id: 'cat4', name: 'Empaques', color: '#16A34A', showInExtras: true },
  ]
  for (const c of CATEGORIES) {
    await prisma.ingredientCategory.upsert({ where: { id: c.id }, update: c, create: c })
  }

  const INGREDIENTS = [
    { id: 'i1', name: 'Salsa de tomate', unit: 'g', stock: 8500, minStock: 3000, cost: 0.035, provider: 'Alimentos Del Norte', categoryId: 'cat2', baseGrams: { mediana: 60, grande: 80, jumbo: 100 } },
    { id: 'i2', name: 'Queso mozzarella', unit: 'g', stock: 12000, minStock: 5000, cost: 0.12, provider: 'Lácteos Premium', categoryId: 'cat2', baseGrams: { mediana: 120, grande: 160, jumbo: 200 } },
    { id: 'i3', name: 'Jamón', unit: 'g', stock: 4200, minStock: 2000, cost: 0.095, provider: 'Carnes Selectas', categoryId: 'cat1', extraGrams: { mediana: 40, grande: 55, jumbo: 70 } },
    { id: 'i4', name: 'Piña en almíbar', unit: 'g', stock: 3500, minStock: 2000, cost: 0.045, provider: 'Abarrotes Central', categoryId: 'cat1', extraGrams: { mediana: 40, grande: 55, jumbo: 70 } },
    { id: 'i5', name: 'Pepperoni', unit: 'g', stock: 2800, minStock: 2000, cost: 0.13, provider: 'Carnes Selectas', categoryId: 'cat1', extraGrams: { mediana: 35, grande: 50, jumbo: 65 } },
    { id: 'i6', name: 'Chorizo', unit: 'g', stock: 1500, minStock: 2000, cost: 0.11, provider: 'Carnes Selectas', categoryId: 'cat1', extraGrams: { mediana: 35, grande: 50, jumbo: 65 } },
    { id: 'i7', name: 'Jalapeño', unit: 'g', stock: 2000, minStock: 1000, cost: 0.028, provider: 'Verduras Frescas', categoryId: 'cat1', extraGrams: { mediana: 20, grande: 30, jumbo: 40 } },
    { id: 'i8', name: 'Cebolla', unit: 'g', stock: 5000, minStock: 2000, cost: 0.018, provider: 'Verduras Frescas', categoryId: 'cat1', extraGrams: { mediana: 25, grande: 35, jumbo: 45 } },
    { id: 'i9', name: 'Pimiento morrón', unit: 'g', stock: 3200, minStock: 1500, cost: 0.04, provider: 'Verduras Frescas', categoryId: 'cat1', extraGrams: { mediana: 25, grande: 35, jumbo: 45 } },
    { id: 'i10', name: 'Champiñones', unit: 'g', stock: 2100, minStock: 1000, cost: 0.055, provider: 'Verduras Frescas', categoryId: 'cat1', extraGrams: { mediana: 30, grande: 40, jumbo: 50 } },
    { id: 'i11', name: 'Masa para pizza', unit: 'g', stock: 20000, minStock: 8000, cost: 0.025, provider: 'Panadería Artesanal', categoryId: 'cat2', baseGrams: { mediana: 600, grande: 750, jumbo: 845 } },
    { id: 'i12', name: 'Pollo cocido', unit: 'g', stock: 3800, minStock: 2000, cost: 0.085, provider: 'Carnes Selectas', categoryId: 'cat1', premium: true, extraGrams: { mediana: 40, grande: 55, jumbo: 70 } },
    { id: 'i13', name: 'Salsa BBQ', unit: 'g', stock: 2500, minStock: 1000, cost: 0.065, provider: 'Alimentos Del Norte', categoryId: 'cat2' },
    { id: 'i14', name: 'Queso gouda', unit: 'g', stock: 1800, minStock: 1000, cost: 0.145, provider: 'Lácteos Premium', categoryId: 'cat1', premium: true, extraGrams: { mediana: 30, grande: 45, jumbo: 60 } },
    { id: 'i15', name: 'Coca-Cola 600ml', unit: 'pza', stock: 48, minStock: 12, cost: 14, provider: 'Distribuidora Bebidas', categoryId: 'cat3' },
    { id: 'i16', name: 'Agua Natural 600ml', unit: 'pza', stock: 60, minStock: 12, cost: 7, provider: 'Distribuidora Bebidas', categoryId: 'cat3' },
  ]
  for (const i of INGREDIENTS) {
    await prisma.ingredient.upsert({ where: { id: i.id }, update: i, create: i })
  }

  const PRODUCTS: { id: string; name: string; baseIngredients: { ingredientId: string; grams: number }[]; prices: Record<string, number>; slices: Record<string, number>; specialty: boolean }[] = [
    { id: 'p1', name: 'Hawaiana', baseIngredients: [{ ingredientId: 'i3', grams: 100 }, { ingredientId: 'i4', grams: 80 }], prices: { mediana: 130, grande: 180, jumbo: 240 }, slices: { mediana: 8, grande: 12, jumbo: 16 }, specialty: false },
    { id: 'p2', name: 'Pepperoni', baseIngredients: [{ ingredientId: 'i5', grams: 120 }], prices: { mediana: 140, grande: 195, jumbo: 260 }, slices: { mediana: 8, grande: 12, jumbo: 16 }, specialty: false },
    { id: 'p3', name: 'Mexicana', baseIngredients: [{ ingredientId: 'i6', grams: 100 }, { ingredientId: 'i7', grams: 40 }, { ingredientId: 'i8', grams: 60 }], prices: { mediana: 145, grande: 200, jumbo: 270 }, slices: { mediana: 8, grande: 12, jumbo: 16 }, specialty: true },
    { id: 'p4', name: 'Vegetal', baseIngredients: [{ ingredientId: 'i9', grams: 70 }, { ingredientId: 'i10', grams: 80 }], prices: { mediana: 135, grande: 185, jumbo: 250 }, slices: { mediana: 8, grande: 12, jumbo: 16 }, specialty: false },
    { id: 'p5', name: 'Cuatro Quesos', baseIngredients: [{ ingredientId: 'i14', grams: 80 }], prices: { mediana: 155, grande: 215, jumbo: 290 }, slices: { mediana: 8, grande: 12, jumbo: 16 }, specialty: true },
    { id: 'p6', name: 'BBQ Pollo', baseIngredients: [{ ingredientId: 'i13', grams: 90 }, { ingredientId: 'i12', grams: 130 }, { ingredientId: 'i8', grams: 40 }], prices: { mediana: 150, grande: 210, jumbo: 280 }, slices: { mediana: 8, grande: 12, jumbo: 16 }, specialty: true },
  ]
  for (const p of PRODUCTS) {
    const { baseIngredients, ...rest } = p
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: { ...rest, active: true, baseIngredients: { create: baseIngredients } },
    })
  }

  const EXTRAS = [
    { id: 'e1', name: 'Coca-Cola', price: 25, icon: 'drink', stock: 48 },
    { id: 'e2', name: 'Agua Natural', price: 15, icon: 'water', stock: 60 },
    { id: 'e3', name: 'Agua Mineral', price: 18, icon: 'water', stock: 36 },
    { id: 'e4', name: 'Bolsa', price: 5, icon: 'bag', stock: 200 },
    { id: 'e5', name: 'Charola', price: 8, icon: 'plate', stock: 50 },
    { id: 'e6', name: 'Servilletas', price: 0, icon: 'napkin', stock: 500 },
    { id: 'e7', name: 'Jugo Naranja', price: 22, icon: 'juice', stock: 24 },
    { id: 'e8', name: 'Cerveza', price: 35, icon: 'beer', stock: 30 },
  ]
  for (const e of EXTRAS) {
    await prisma.extra.upsert({ where: { id: e.id }, update: e, create: { ...e, active: true } })
  }

  console.log('Seed completo. Usuarios demo con password "1234" y PIN como en Login.tsx (1111, 2222, ...).')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
