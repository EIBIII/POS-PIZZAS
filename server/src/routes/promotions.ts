import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { requireAuth, requirePermission } from '../middleware/auth'

const router = Router()
router.use(requireAuth, requirePermission('ventas'))

router.get('/', async (_req, res) => {
  res.json(await prisma.promotion.findMany({ orderBy: { name: 'asc' } }))
})

const schema = z.object({
  name: z.string().min(1),
  type: z.enum(['percent', 'fixed']),
  value: z.number().nonnegative(),
  active: z.boolean().optional(),
})

router.post('/', async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  res.status(201).json(await prisma.promotion.create({ data: parsed.data }))
})

router.patch('/:id', async (req, res) => {
  const parsed = schema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  res.json(await prisma.promotion.update({ where: { id: req.params.id }, data: parsed.data }))
})

router.delete('/:id', async (req, res) => {
  await prisma.promotion.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

export default router
