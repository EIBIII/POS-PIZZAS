import { PrismaClient } from '@prisma/client'

// Cliente único de Prisma para todo el proceso (evita abrir una conexión
// nueva por request, y evita múltiples instancias en dev con tsx watch).
export const prisma = new PrismaClient()
