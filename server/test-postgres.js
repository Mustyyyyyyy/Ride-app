require("dotenv").config();
const { Pool } = require("pg");

console.log("Starting PostgreSQL test...");
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    const client = await pool.connect();
    console.log("PostgreSQL Connected Successfully");
    client.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }
}

test();