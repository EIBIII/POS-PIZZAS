import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { requireAuth, requirePermission } from '../middleware/auth'

const router = Router()
router.use(requireAuth, requirePermission('pedidos'))

router.get('/', async (req, res) => {
  const { status, paymentStatus, today } = req.query
  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (paymentStatus) where.paymentStatus = paymentStatus
  if (today === 'true') {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    where.createdAt = { gte: start }
  }
  res.json(await prisma.order.findMany({ where, orderBy: { createdAt: 'desc' } }))
})

async function nextOrderNumber(): Promise<string> {
  // Folio consecutivo PZZ-001, PZZ-002... Se calcula a partir del último
  // guardado en vez de mantener un contador aparte: así no se desincroniza
  // si el proceso se reinicia.
  const last = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' }, select: { orderNumber: true } })
  const lastNum = last ? parseInt(last.orderNumber.replace('PZZ-', ''), 10) || 0 : 0
  return `PZZ-${String(lastNum + 1).padStart(3, '0')}`
}

const itemSchema = z.object({
  id: z.string(),
  type: z.enum(['slice', 'pizza', 'extra']),
  name: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number(),
  total: z.number(),
  details: z.string().optional(),
  size: z.enum(['mediana', 'grande', 'jumbo']).optional(),
  pizzaParts: z.array(z.object({
    fractionLabel: z.string(),
    flavorName: z.string(),
    extras: z.array(z.object({ name: z.string(), qty: z.number() })),
  })).optional(),
})

const createSchema = z.object({
  customer: z.string().optional(),
  consumption: z.enum(['local', 'llevar', 'delivery']),
  address: z.string().optional(),
  phone: z.string().optional(),
  deliveryCost: z.number().optional(),
  items: z.array(itemSchema).min(1),
  subtotal: z.number(),
  discount: z.number().default(0),
  total: z.number(),
  paymentMethod: z.enum(['efectivo', 'tarjeta']),
  paymentStatus: z.enum(['pendiente', 'pagado', 'cancelado', 'reembolsado']),
  status: z.enum(['nuevo', 'confirmado', 'preparando', 'cocinando', 'listo', 'entregado', 'cancelado']),
  notes: z.string().optional(),
  size: z.enum(['mediana', 'grande', 'jumbo']).optional(),
  slices: z.number().optional(),
  scheduledFor: z.string().datetime().optional(),
})

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  if (!req.auth) return res.status(401).json({ error: 'No autenticado' })
  const { scheduledFor, ...data } = parsed.data

  const order = await prisma.order.create({
    data: {
      ...data,
      orderNumber: await nextOrderNumber(),
      createdById: req.auth.userId,
      ...(scheduledFor ? { scheduledFor: new Date(scheduledFor) } : {}),
    },
  })
  res.status(201).json(order)
})

const updateSchema = createSchema.partial()

router.patch('/:id', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { scheduledFor, ...data } = parsed.data
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { ...data, ...(scheduledFor ? { scheduledFor: new Date(scheduledFor) } : {}) },
  })
  res.json(order)
})

export default router
