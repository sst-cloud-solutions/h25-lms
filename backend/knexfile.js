require('dotenv').config();

const base = {
  client: 'mysql2',
  pool: { min: 0, max: 10 },
  seeds: { directory: './seeds' },
};

const main = {
  ...base,
  migrations: { directory: './migrations' },
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sst',
    port: process.env.DB_PORT || 3306,
  },
};

module.exports = {
  main,
  base,
};
