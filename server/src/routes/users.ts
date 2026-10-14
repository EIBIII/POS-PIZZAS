import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../db'
import { requireAuth, requirePermission } from '../middleware/auth'

const router = Router()
router.use(requireAuth, requirePermission('usuarios'))

function toPublic(u: { password: string; pin: string } & Record<string, unknown>) {
  const { password, pin, ...rest } = u
  return rest
}

router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({ include: { role: true }, orderBy: { name: 'asc' } })
  res.json(users.map(toPublic))
})

const createSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(4),
  pin: z.string().length(4),
  roleId: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  active: z.boolean().optional(),
})

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const data = parsed.data
  const user = await prisma.user.create({
    data: {
      ...data,
      password: await bcrypt.hash(data.password, 10),
      pin: await bcrypt.hash(data.pin, 10),
      active: data.active ?? true,
    },
  })
  res.status(201).json(toPublic(user))
})

const updateSchema = createSchema.partial()

router.patch('/:id', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const data = { ...parsed.data } as Record<string, unknown>
  if (typeof data.password === 'string') data.password = await bcrypt.hash(data.password, 10)
  if (typeof data.pin === 'string') data.pin = await bcrypt.hash(data.pin, 10)
  const user = await prisma.user.update({ where: { id: req.params.id }, data })
  res.json(toPublic(user))
})

router.delete('/:id', async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

export default router
