import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { requireAuth, requirePermission } from '../middleware/auth'

const router = Router()
router.use(requireAuth, requirePermission('corte'))

router.get('/', async (_req, res) => {
  res.json(await prisma.cashRegister.findMany({ orderBy: { openedAt: 'desc' } }))
})

const schema = z.object({
  openedAt: z.string().datetime(),
  closedAt: z.string().datetime().optional(),
  initialAmount: z.number(),
  expectedAmount: z.number(),
  actualAmount: z.number().optional(),
  difference: z.number().optional(),
  cashSales: z.number(),
  cardSales: z.number(),
  withdrawals: z.number().default(0),
  status: z.enum(['open', 'closed']),
  shortageReason: z.string().optional(),
})

router.post('/', async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  if (!req.auth) return res.status(401).json({ error: 'No autenticado' })
  const { openedAt, closedAt, ...rest } = parsed.data
  const cr = await prisma.cashRegister.create({
    data: {
      ...rest,
      openedAt: new Date(openedAt),
      closedAt: closedAt ? new Date(closedAt) : undefined,
      openedById: req.auth.userId,
    },
  })
  res.status(201).json(cr)
})

export default router
