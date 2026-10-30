const { Pool } = require("pg");

try {
  require("dotenv").config();
} catch (e) {
  console.log("dotenv missing - continuing");
}

console.log("DATABASE_URL EXISTS:", !!process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

pool.on("error", (err) => {
  console.error("PG POOL ERROR:");
  console.dir(err, { depth: null });
});

module.exports = pool;
