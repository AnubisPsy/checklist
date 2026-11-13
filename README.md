# Checklist diario

Checklist de tareas diarias con historial por día (cuántas se completaron).

- `frontend/`: React + Vite (JavaScript), iconos con lucide-react.
- `backend/`: Node.js + Express (JavaScript, sin compilación), PostgreSQL con `pg`.
- `db/esquema.sql`: tablas de la base (sin datos).

## Requisitos

- Node.js 22 o superior
- Un PostgreSQL accesible

## Correr en local

1. Crear la base y aplicar el esquema:

   ```sh
   createdb checklist
   psql "postgres://usuario:contrasena@localhost:5432/checklist" -f db/esquema.sql
   ```

2. Copiar `.env.example` a `.env` en la raíz y ajustar `DATABASE_URL`. En tu PC usa `192.168.1.201`
   en vez de `host.docker.internal`:

   ```sh
   cp .env.example .env
   ```

3. Backend (puerto 2021):

   ```sh
   cd backend
   npm install
   npm run dev      # lee ../.env y se reinicia al guardar
   ```

   `npm run dev` carga `../.env` automáticamente. En producción arranca con `node src/index.js`
   y toma `DATABASE_URL` del entorno.

   Comprobar: `curl http://localhost:2021/api/salud`

4. Frontend (puerto 2020, con proxy de `/api` hacia `http://localhost:2021`):

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

   Abrir http://localhost:2020

## API

| Método | Ruta                       | Descripción                                   |
| ------ | -------------------------- | --------------------------------------------- |
| GET    | `/api/salud`               | Comprueba la conexión a la base               |
| GET    | `/api/tareas?fecha=AAAA-MM-DD` | Tareas de un día                          |
| POST   | `/api/tareas`              | Crea una tarea `{ titulo, fecha }`            |
| PATCH  | `/api/tareas/:id`          | Marca o desmarca `{ hecha: true \| false }`   |
| DELETE | `/api/tareas/:id`          | Borra una tarea                               |
| GET    | `/api/historial`           | Por día: `total` y `completadas` (últimos 60) |

La fecha de "hoy" la envía el navegador según su zona horaria local.

## Docker

`compose.yaml` define dos servicios:

- `backend`: sin puertos publicados; alcanza el PostgreSQL del servidor por `host.docker.internal`.
- `web`: nginx en el puerto 80 del contenedor, publicado como `2020:80`; sirve el frontend y
  reenvía `/api/` al backend.

PostgreSQL no está en `compose.yaml`: se usa el que ya existe en el servidor. Con `.env` en la raíz:

```sh
docker compose up -d --build
```
