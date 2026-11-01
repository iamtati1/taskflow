const bcrypt = require("bcrypt");
const { Pool } = require("pg");
require("dotenv").config();

// The connection string comes from the environment (server/.env locally).
// Never hardcode it: this repository is public.
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to server/.env or the environment.");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});
