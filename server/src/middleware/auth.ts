import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || ''
if (!JWT_SECRET) {
  // Falla rápido: un servidor de un POS no debe arrancar con un secreto
  // vacío (cualquiera podría forjar un token de super_admin).
  throw new Error('Falta JWT_SECRET en las variables de entorno (ver server/.env.example).')
}

export interface AuthPayload {
  userId: string
  roleId: string
  name: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' })
}

// Exige un JWT válido en el header Authorization: Bearer <token>.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'No autenticado' })
  try {
    req.auth = jwt.verify(token, JWT_SECRET) as AuthPayload
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

// Exige que el rol autenticado tenga en `permissions` el módulo pedido en
// true. Se consulta en caliente contra la tabla Role (y no se embebe en el
// JWT) para que revocar un permiso en Usuarios aplique de inmediato, sin
// esperar a que expire el token de nadie.
export function requirePermission(moduleKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ error: 'No autenticado' })
    const { prisma } = await import('../db')
    const role = await prisma.role.findUnique({ where: { id: req.auth.roleId } })
    const permissions = (role?.permissions as Record<string, boolean>) || {}
    if (!permissions[moduleKey]) {
      return res.status(403).json({ error: `No tienes permiso de "${moduleKey}"` })
    }
    next()
  }
}
