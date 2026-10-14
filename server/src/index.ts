import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth'
import usersRoutes from './routes/users'
import rolesRoutes from './routes/roles'
import productsRoutes from './routes/products'
import ingredientsRoutes from './routes/ingredients'
import ordersRoutes from './routes/orders'
import extrasRoutes from './routes/extras'
import promotionsRoutes from './routes/promotions'
import cashRegistersRoutes from './routes/cashRegisters'
import auditRoutes from './routes/audit'
import settingsRoutes from './routes/settings'

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/roles', rolesRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/ingredients', ingredientsRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/extras', extrasRoutes)
app.use('/api/promotions', promotionsRoutes)
app.use('/api/cash-registers', cashRegistersRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/settings', settingsRoutes)

// Manejador de errores al final: cualquier excepción no atrapada en una
// ruta (incluyendo errores de Prisma) cae aquí en vez de tumbar el proceso
// o devolver un HTML de stack trace al cliente.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

const port = Number(process.env.PORT) || 4000
app.listen(port, () => {
  console.log(`POS-PIZZAS API escuchando en http://localhost:${port}`)
})
