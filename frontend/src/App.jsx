import { useCallback, useEffect, useState } from 'react';
import { Check, CalendarDays, History, ListChecks, Plus, Trash2 } from 'lucide-react';
import { api, hoyLocal } from './api.js';

function formatearFecha(fecha) {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function App() {
  const [hoy, setHoy] = useState(hoyLocal);
  const [tareas, setTareas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const [t, h] = await Promise.all([api.tareas(hoy), api.historial()]);
      setTareas(t);
      setHistorial(h);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [hoy]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Si la pestaña queda abierta pasada la medianoche, cambiar al nuevo día.
  useEffect(() => {
    const intervalo = setInterval(() => setHoy(hoyLocal()), 60_000);
    return () => clearInterval(intervalo);
  }, []);

  async function ejecutar(accion) {
    try {
      await accion();
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  function agregar(e) {
    e.preventDefault();
    const limpio = titulo.trim();
    if (!limpio) return;
    ejecutar(async () => {
      await api.crear(limpio, hoy);
      setTitulo('');
    });
  }

  const hechas = tareas.filter((t) => t.hecha).length;

  return (
    <main className="contenedor">
      <header className="cabecera">
        <ListChecks size={28} />
        <div>
          <h1>Checklist diario</h1>
          <p className="fecha">
            <CalendarDays size={16} /> {formatearFecha(hoy)}
          </p>
        </div>
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <section className="tarjeta">
        <div className="tarjeta-titulo">
          <h2>Hoy</h2>
          <span className="contador">
            {hechas} / {tareas.length}
          </span>
        </div>

        <form className="nueva" onSubmit={agregar}>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Nueva tarea"
            maxLength={200}
            aria-label="Nueva tarea"
          />
          <button type="submit" disabled={!titulo.trim()}>
            <Plus size={18} /> Agregar
          </button>
        </form>

        {cargando ? (
          <p className="vacio">Cargando...</p>
        ) : tareas.length === 0 ? (
          <p className="vacio">No hay tareas para hoy.</p>
        ) : (
          <ul className="lista">
            {tareas.map((t) => (
              <li key={t.id} className={t.hecha ? 'hecha' : ''}>
                <button
                  className="marca"
                  onClick={() => ejecutar(() => api.marcar(t.id, !t.hecha))}
                  aria-label={t.hecha ? 'Marcar como pendiente' : 'Marcar como hecha'}
                  aria-pressed={t.hecha}
                >
                  {t.hecha && <Check size={16} />}
                </button>
                <span className="texto">{t.titulo}</span>
                <button
                  className="borrar"
                  onClick={() => ejecutar(() => api.borrar(t.id))}
                  aria-label={`Borrar ${t.titulo}`}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="tarjeta">
        <div className="tarjeta-titulo">
          <h2>
            <History size={18} /> Historial
          </h2>
        </div>
        {historial.length === 0 ? (
          <p className="vacio">Todavía no hay historial.</p>
        ) : (
          <ul className="historial">
            {historial.map((d) => {
              const porcentaje = d.total ? Math.round((d.completadas / d.total) * 100) : 0;
              return (
                <li key={d.fecha}>
                  <span className="dia">{formatearFecha(d.fecha)}</span>
                  <div className="barra" aria-hidden="true">
                    <div style={{ width: `${porcentaje}%` }} />
                  </div>
                  <span className="cifras">
                    {d.completadas} de {d.total}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
