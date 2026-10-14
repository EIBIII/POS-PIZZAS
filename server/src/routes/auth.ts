import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../db'
import { signToken } from '../middleware/auth'

const router = Router()

const pinLoginSchema = z.object({
  userId: z.string().min(1),
  pin: z.string().length(4),
})

// Login rápido de caja: se elige el usuario (como hoy en el frontend) y se
// captura su PIN de 4 dígitos. Coincide con el flujo que ya existe en
// src/views/Login.tsx — este endpoint es el reemplazo real de
// context.tsx#login() cuando el frontend se conecte a la API.
router.post('/login', async (req, res) => {
  const parsed = pinLoginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'userId y pin (4 dígitos) son requeridos' })
  const { userId, pin } = parsed.data

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } })
  if (!user || !user.active) return res.status(401).json({ error: 'Usuario no encontrado o inactivo' })

  const pinOk = await bcrypt.compare(pin, user.pin)
  if (!pinOk) return res.status(401).json({ error: 'PIN incorrecto' })

  const token = signToken({ userId: user.id, roleId: user.roleId, name: user.name })
  res.json({
    token,
    user: {
      id: user.id, name: user.name, username: user.username, role: user.roleId,
      phone: user.phone, email: user.email, active: user.active,
    },
  })
})

// Lista mínima y pública para la pantalla de selección de usuario del
// login (como la tarjeta de cada cajero en src/views/Login.tsx). Nunca
// expone password ni pin.
router.get('/users-for-login', async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, username: true, roleId: true },
    orderBy: { name: 'asc' },
  })
  res.json(users)
})

export default router
