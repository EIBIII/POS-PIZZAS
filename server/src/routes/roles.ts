import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { requireAuth, requirePermission } from '../middleware/auth'

const router = Router()
router.use(requireAuth, requirePermission('usuarios'))

router.get('/', async (_req, res) => {
  res.json(await prisma.role.findMany({ orderBy: { label: 'asc' } }))
})

const schema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  color: z.string().min(1),
  permissions: z.record(z.boolean()),
})

router.post('/', async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  res.status(201).json(await prisma.role.create({ data: parsed.data }))
})

router.patch('/:id', async (req, res) => {
  const parsed = schema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  res.json(await prisma.role.update({ where: { id: req.params.id }, data: parsed.data }))
})

router.delete('/:id', async (req, res) => {
  const inUse = await prisma.user.count({ where: { roleId: req.params.id } })
  if (inUse > 0) return res.status(409).json({ error: 'Hay usuarios con este rol, reasígnalos antes de borrarlo.' })
  await prisma.role.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

export default router
