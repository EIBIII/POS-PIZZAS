import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { requireAuth, requirePermission } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

// Leer la bitácora sí requiere el permiso "auditoria" (p. ej. un cajero no
// debería poder consultarla); pero cualquier usuario autenticado puede
// generar una entrada como efecto de su propia acción (cancelar un pedido,
// aplicar una promoción, etc.), aunque su rol no tenga ese permiso — si no,
// esas acciones dejarían de quedar registradas justo para los roles que
// más interesa auditar.
router.get('/', requirePermission('auditoria'), async (_req, res) => {
  res.json(await prisma.auditEntry.findMany({ orderBy: { timestamp: 'desc' }, take: 500 }))
})

// No hay PATCH/DELETE a propósito: una bitácora de auditoría solo debe crecer.
const schema = z.object({
  action: z.string().min(1),
  module: z.string().min(1),
  detail: z.string().min(1),
  user: z.string().min(1),
})

router.post('/', async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  res.status(201).json(await prisma.auditEntry.create({ data: parsed.data }))
})

export default router
