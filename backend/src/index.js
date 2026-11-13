import express from 'express';
import { pool } from './db.js';

const PUERTO = 2021;
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

const app = express();
app.use(express.json({ limit: '10kb' }));

function fechaValida(fecha) {
  return typeof fecha === 'string' && FECHA_RE.test(fecha) && !Number.isNaN(Date.parse(fecha));
}

function idValido(id) {
  return /^\d+$/.test(id);
}

app.get('/api/salud', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ estado: 'ok', base: 'ok' });
  } catch (err) {
    console.error('Salud: sin conexión a la base:', err.message);
    res.status(503).json({ estado: 'error', base: 'sin conexión' });
  }
});

// Tareas de un día. La fecha la manda el cliente (su "hoy" local).
app.get('/api/tareas', async (req, res) => {
  const { fecha } = req.query;
  if (!fechaValida(fecha)) {
    return res.status(400).json({ error: 'Parámetro fecha requerido (YYYY-MM-DD)' });
  }
  const { rows } = await pool.query(
    'SELECT id, titulo, fecha, hecha FROM tareas WHERE fecha = $1 ORDER BY id',
    [fecha],
  );
  res.json(rows);
});

app.post('/api/tareas', async (req, res) => {
  const titulo = typeof req.body?.titulo === 'string' ? req.body.titulo.trim() : '';
  const { fecha } = req.body ?? {};
  if (!titulo || titulo.length > 200) {
    return res.status(400).json({ error: 'El título es obligatorio (máx. 200 caracteres)' });
  }
  if (!fechaValida(fecha)) {
    return res.status(400).json({ error: 'Fecha requerida (YYYY-MM-DD)' });
  }
  const { rows } = await pool.query(
    'INSERT INTO tareas (titulo, fecha) VALUES ($1, $2) RETURNING id, titulo, fecha, hecha',
    [titulo, fecha],
  );
  res.status(201).json(rows[0]);
});

app.patch('/api/tareas/:id', async (req, res) => {
  const { id } = req.params;
  const { hecha } = req.body ?? {};
  if (!idValido(id) || typeof hecha !== 'boolean') {
    return res.status(400).json({ error: 'Se requiere un id numérico y "hecha" booleano' });
  }
  const { rows } = await pool.query(
    'UPDATE tareas SET hecha = $1 WHERE id = $2 RETURNING id, titulo, fecha, hecha',
    [hecha, id],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
  res.json(rows[0]);
});

app.delete('/api/tareas/:id', async (req, res) => {
  const { id } = req.params;
  if (!idValido(id)) return res.status(400).json({ error: 'Id inválido' });
  const { rowCount } = await pool.query('DELETE FROM tareas WHERE id = $1', [id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
  res.status(204).end();
});

// Resumen por día: total de tareas y cuántas se completaron.
app.get('/api/historial', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT fecha,
            count(*)::int                      AS total,
            count(*) FILTER (WHERE hecha)::int AS completadas
       FROM tareas
      GROUP BY fecha
      ORDER BY fecha DESC
      LIMIT 60`,
  );
  res.json(rows);
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  const estado = err.status ?? 500;
  res.status(estado).json({ error: estado === 500 ? 'Error interno' : err.message });
});

const servidor = app.listen(PUERTO, () => {
  console.log(`Backend escuchando en el puerto ${PUERTO}`);
});

function cerrar() {
  servidor.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}
process.on('SIGTERM', cerrar);
process.on('SIGINT', cerrar);
