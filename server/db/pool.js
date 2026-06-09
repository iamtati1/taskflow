const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool(
  process.env.PG_CONNECTION_STRING
    ? {
      connectionString: process.env.PG_CONNECTION_STRING,
      ssl: {
        rejectUnauthorized: false,
      },
    }
    : {}
);

module.exports = pool;
