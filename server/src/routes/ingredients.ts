import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { requireAuth, requirePermission } from '../middleware/auth'

const router = Router()
router.use(requireAuth, requirePermission('inventario'))

const gramsBySize = z.object({ mediana: z.number(), grande: z.number(), jumbo: z.number() }).optional()

router.get('/categories', async (_req, res) => {
  res.json(await prisma.ingredientCategory.findMany({ orderBy: { name: 'asc' } }))
})

const categorySchema = z.object({ name: z.string().min(1), color: z.string().min(1), showInExtras: z.boolean().optional() })

router.post('/categories', async (req, res) => {
  const parsed = categorySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  res.status(201).json(await prisma.ingredientCategory.create({ data: parsed.data }))
})

router.patch('/categories/:id', async (req, res) => {
  const parsed = categorySchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  res.json(await prisma.ingredientCategory.update({ where: { id: req.params.id }, data: parsed.data }))
})

router.delete('/categories/:id', async (req, res) => {
  await prisma.ingredientCategory.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

router.get('/', async (_req, res) => {
  res.json(await prisma.ingredient.findMany({ include: { category: true }, orderBy: { name: 'asc' } }))
})

const schema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  stock: z.number().default(0),
  minStock: z.number().default(0),
  cost: z.number().default(0),
  customPrice: z.number().optional(),
  provider: z.string().optional(),
  expiry: z.string().datetime().optional(),
  icon: z.string().optional(),
  premium: z.boolean().optional(),
  extraGrams: gramsBySize,
  baseGrams: gramsBySize,
  categoryId: z.string().min(1),
})

router.post('/', async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { expiry, ...data } = parsed.data
  const ingredient = await prisma.ingredient.create({
    data: { ...data, expiry: expiry ? new Date(expiry) : undefined },
  })
  res.status(201).json(ingredient)
})

router.patch('/:id', async (req, res) => {
  const parsed = schema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { expiry, ...data } = parsed.data
  const ingredient = await prisma.ingredient.update({
    where: { id: req.params.id },
    data: { ...data, ...(expiry ? { expiry: new Date(expiry) } : {}) },
  })
  res.json(ingredient)
})

// Ajuste de stock (entrada/salida/ajuste), equivalente a applyMove() en
// src/views/Inventario.tsx — aquí sí queda registrado como movimiento.
const moveSchema = z.object({
  type: z.enum(['entrada', 'salida', 'ajuste']),
  quantity: z.number().positive(),
})

router.post('/:id/movements', async (req, res) => {
  const parsed = moveSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { type, quantity } = parsed.data
  const delta = type === 'salida' ? -quantity : quantity
  const current = await prisma.ingredient.findUnique({ where: { id: req.params.id } })
  if (!current) return res.status(404).json({ error: 'Ingrediente no encontrado' })
  const ingredient = await prisma.ingredient.update({
    where: { id: req.params.id },
    data: { stock: Math.max(0, current.stock + delta) },
  })
  res.json(ingredient)
})

router.delete('/:id', async (req, res) => {
  await prisma.ingredient.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

export default router
