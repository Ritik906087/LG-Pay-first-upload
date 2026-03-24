"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDBClient = getDBClient;
exports.closeDBClient = closeDBClient;
const pg_1 = require("pg");
require("dotenv/config");
let pool;
async function getDBClient() {
    if (!process.env.SUPABASE_DB_URL) {
        throw new Error('Supabase database connection string (SUPABASE_DB_URL) is not defined in your .env.local file.');
    }
    if (!pool) {
        pool = new pg_1.Pool({
            connectionString: process.env.SUPABASE_DB_URL,
        });
    }
    return pool;
}
async function closeDBClient() {
    if (pool) {
        await pool.end();
    }
}
