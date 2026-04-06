const { Pool } = require("pg");

const pool = new Pool({
  host: 'dpg-d6ql2e7kijhs73b7rfag-a.oregon-postgres.render.com',
  port: 5432,
  database: 'oride_db',
  user: 'oride_db_user',
  password: '3tlzVbNAG6NvMeE9u6MA9oNf7C5VB3X6',
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
});

pool
  .connect()
  .then(() => {
    console.log("Connected to PostgreSQL");
  })
  .catch((err) => {
    console.error("PostgreSQL connection error:", err);
  });

module.exports = pool;