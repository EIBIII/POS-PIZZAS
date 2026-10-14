# POS-PIZZAS API

Backend (Fase 2) del POS: Express + TypeScript + Prisma + PostgreSQL.
Persiste usuarios, roles, productos, ingredientes, pedidos (ventas),
extras, promociones, cortes de caja, auditoría y configuración —
reemplaza el estado en memoria del frontend (`src/context.tsx`).

No depende de dónde se hospede: todo se configura con `DATABASE_URL`, así
que corre igual en un Postgres local, Docker, o uno administrado
(Railway, Render, Supabase, Neon...).

## Requisitos

- Node 18+
- Un Postgres accesible (local, Docker, o en la nube)

## Arrancar en local

```bash
cd server
cp .env.example .env     # edita DATABASE_URL y JWT_SECRET
npm install
npm run prisma:migrate   # crea las tablas
npm run prisma:seed      # carga la misma data de demo del frontend
npm run dev               # http://localhost:4000
```

### Postgres rápido con Docker (si no tienes uno a la mano)

```bash
docker run --name pos-pizzas-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pos_pizzas -p 5432:5432 -d postgres:16
```

Eso coincide con el `DATABASE_URL` de ejemplo en `.env.example`.

> **Nota sobre cómo se validó este código:** se escribió y revisó aquí sin
> poder correr `npm run prisma:generate` (el sandbox donde lo armé bloquea
> la descarga de los binarios de Prisma por política de red, no es un
> problema del código). Por eso `npm install` sí instala todo, pero hasta
> que tú corras `prisma generate` en tu máquina (con internet normal, es
> parte de `prisma:migrate`) no hay cliente tipado real — revisé a mano
> cada ruta contra `schema.prisma` para que los nombres de modelos/campos
> cuadren, pero vale la pena que la primera vez que corras `npm run dev`
> pruebes los endpoints principales (login, crear pedido, crear producto)
> antes de darlo por bueno.

## Autenticación

Coincide con el flujo que ya existe en `src/views/Login.tsx` (elegir
usuario + PIN de 4 dígitos), no usuario/contraseña de formulario:

```
GET  /api/auth/users-for-login        -> lista pública (id, name, roleId) para la pantalla de login
POST /api/auth/login { userId, pin }  -> { token, user }
```

El resto de los endpoints piden `Authorization: Bearer <token>` y, según
la ruta, el permiso correspondiente del rol (igual que `hasPermission()`
en el frontend, pero validado en servidor — un permiso quitado en
Usuarios aplica de inmediato, no hasta que expire el token).

## Endpoints

| Recurso        | Rutas                                               | Permiso requerido |
|----------------|------------------------------------------------------|--------------------|
| Auth           | `POST /api/auth/login`, `GET /api/auth/users-for-login` | — (públicas) |
| Usuarios       | `GET/POST/PATCH/DELETE /api/users`                   | `usuarios` |
| Roles          | `GET/POST/PATCH/DELETE /api/roles`                   | `usuarios` |
| Productos      | `GET/POST/PATCH/DELETE /api/products`                | `productos` |
| Ingredientes   | `GET/POST/PATCH/DELETE /api/ingredients`, `/api/ingredients/categories`, `POST /api/ingredients/:id/movements` | `inventario` |
| Pedidos        | `GET/POST/PATCH /api/orders`                         | `pedidos` |
| Extras         | `GET/POST/PATCH/DELETE /api/extras`                  | `extras` |
| Promociones    | `GET/POST/PATCH/DELETE /api/promotions`               | `ventas` |
| Cortes de caja | `GET/POST /api/cash-registers`                        | `corte` |
| Auditoría      | `GET /api/audit` (lectura), `POST /api/audit` (cualquier usuario autenticado) | `auditoria` para leer |
| Configuración  | `GET /api/settings` (cualquier usuario autenticado), `PUT /api/settings` | `configuracion` para escribir |

## Decisiones de diseño

- **PIN y password se guardan con bcrypt**, nunca en texto plano (en el
  frontend actual, `src/data.ts`, están en claro — eso se queda así solo
  mientras no haya backend).
- **Los permisos no van en el JWT**: se consultan contra la tabla `Role`
  en cada request, así que revocar un permiso en Usuarios aplica de
  inmediato en vez de esperar a que expire el token de cada quien.
- **`items` de un pedido y `permissions` de un rol se guardan como JSON**
  en vez de normalizarse a más tablas — es la receta exacta de cada pizza
  (partes, sabores, extras) tal como ya la arma el frontend, no hay
  necesidad de romperla en más tablas para un MVP.
- **Movimientos de inventario** (`POST /api/ingredients/:id/movements`)
  si quedan registrados aquí (a diferencia del frontend actual, que solo
  ajusta el stock sin dejar rastro).
- **Pendiente / fuera de este alcance todavía**: descontar stock
  automáticamente al cobrar un pedido (hoy el stock solo baja si se
  ajusta a mano, igual que en el frontend); subir el logo como archivo
  en vez de URL; rate limiting; tests automatizados.

## Conectar el frontend

El frontend (`src/context.tsx`) sigue leyendo todo de `src/data.ts` en
memoria — todavía no llama a esta API. Ese cableado (reemplazar los
`useState` por `fetch`/`axios` contra estos endpoints, guardar el JWT,
etc.) es el siguiente paso una vez que decidas dónde se hospeda el
backend.
