import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { requireAuth, requirePermission } from '../middleware/auth'

const router = Router()
router.use(requireAuth, requirePermission('extras'))

router.get('/', async (_req, res) => {
  res.json(await prisma.extra.findMany({ orderBy: { name: 'asc' } }))
})

const schema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  icon: z.string().optional(),
  active: z.boolean().optional(),
  stock: z.number().int().nonnegative().optional(),
})

router.post('/', async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  res.status(201).json(await prisma.extra.create({ data: parsed.data }))
})

router.patch('/:id', async (req, res) => {
  const parsed = schema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  res.json(await prisma.extra.update({ where: { id: req.params.id }, data: parsed.data }))
})

router.delete('/:id', async (req, res) => {
  await prisma.extra.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

export default router
