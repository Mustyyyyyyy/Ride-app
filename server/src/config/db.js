const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "oridedb",
  password: "12345",
  port: 5432,
});

pool.connect()
  .then(() => {
    console.log("PostgreSQL connected");
  })
  .catch((err) => {
    console.error("PostgreSQL connection error:", err);
  });

module.exports = pool;