import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { requireAuth, requirePermission } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

// Leer la configuración (nombre, logo, precio de rebanada, etc.) lo
// necesita casi toda la app para funcionar, así que solo pide sesión
// iniciada. Cambiarla sí requiere el permiso "configuracion".
router.get('/', async (_req, res) => {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } })
  if (!settings) return res.status(404).json({ error: 'Configuración no inicializada (corre el seed).' })
  res.json(settings)
})

const sizeMap = z.object({ mediana: z.number(), grande: z.number(), jumbo: z.number() })

const schema = z.object({
  name: z.string().min(1),
  address: z.string(),
  phones: z.array(z.string()),
  rfc: z.string(),
  tax: z.number(),
  logoUrl: z.string().optional(),
  reportEmail: z.string().optional(),
  currency: z.string(),
  timezone: z.string(),
  language: z.string(),
  autoLogout: z.number(),
  initialFloat: z.number(),
  slicePrice: z.number(),
  simplePizzaPrice: sizeMap,
  ticketHeader: z.string(),
  ticketFooter: z.string(),
  ticketShowLogo: z.boolean(),
  printerWidth: z.number(),
  deliveryBaseRate: z.number(),
  deliveryFreeThreshold: z.number(),
  deliveryRadiusKm: z.number(),
  deliveryEstimatedMinutes: z.number(),
})

router.put('/', requirePermission('configuracion'), async (req, res) => {
  const parsed = schema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...(parsed.data as z.infer<typeof schema>) },
  })
  res.json(settings)
})

export default router
