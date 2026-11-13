import pg from 'pg';

// Devolver DATE como texto 'YYYY-MM-DD' en vez de Date, para no mover el día por la zona horaria.
pg.types.setTypeParser(pg.types.builtins.DATE, (valor) => valor);

if (!process.env.DATABASE_URL) {
  console.error('Falta la variable de entorno DATABASE_URL');
  process.exit(1);
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});
