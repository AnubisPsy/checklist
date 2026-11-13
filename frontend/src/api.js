async function pedir(ruta, opciones = {}) {
  const res = await fetch(`/api${ruta}`, {
    headers: opciones.body ? { 'Content-Type': 'application/json' } : undefined,
    ...opciones,
  });
  if (!res.ok) {
    const datos = await res.json().catch(() => ({}));
    throw new Error(datos.error || `Error ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  tareas: (fecha) => pedir(`/tareas?fecha=${fecha}`),
  crear: (titulo, fecha) =>
    pedir('/tareas', { method: 'POST', body: JSON.stringify({ titulo, fecha }) }),
  marcar: (id, hecha) =>
    pedir(`/tareas/${id}`, { method: 'PATCH', body: JSON.stringify({ hecha }) }),
  borrar: (id) => pedir(`/tareas/${id}`, { method: 'DELETE' }),
  historial: () => pedir('/historial'),
};

// Fecha local del navegador en formato YYYY-MM-DD.
export function hoyLocal() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}
