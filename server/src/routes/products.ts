import { Router } from 'express'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { requireAuth, requirePermission } from '../middleware/auth'

const router = Router()
router.use(requireAuth, requirePermission('productos'))

router.get('/', async (_req, res) => {
  const products = await prisma.product.findMany({
    include: { baseIngredients: { include: { ingredient: true } } },
    orderBy: { name: 'asc' },
  })
  res.json(products)
})

const ingredientLine = z.object({ ingredientId: z.string().min(1), grams: z.number().positive() })

const schema = z.object({
  name: z.string().min(1),
  prices: z.object({ mediana: z.number(), grande: z.number(), jumbo: z.number() }),
  slices: z.object({ mediana: z.number(), grande: z.number(), jumbo: z.number() }),
  active: z.boolean().optional(),
  specialty: z.boolean().optional(),
  baseIngredients: z.array(ingredientLine),
})

router.post('/', async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { baseIngredients, ...data } = parsed.data
  const product = await prisma.product.create({
    data: {
      ...data,
      active: data.active ?? true,
      specialty: data.specialty ?? false,
      baseIngredients: { create: baseIngredients },
    },
    include: { baseIngredients: { include: { ingredient: true } } },
  })
  res.status(201).json(product)
})

router.patch('/:id', async (req, res) => {
  const parsed = schema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { baseIngredients, ...data } = parsed.data

  // Si mandan baseIngredients, se reemplaza la receta completa (más simple
  // y predecible que hacer diff de altas/bajas/cambios uno por uno).
  const product = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (baseIngredients) {
      await tx.productIngredient.deleteMany({ where: { productId: req.params.id } })
    }
    return tx.product.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(baseIngredients ? { baseIngredients: { create: baseIngredients } } : {}),
      },
      include: { baseIngredients: { include: { ingredient: true } } },
    })
  })
  res.json(product)
})

router.delete('/:id', async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

export default router
