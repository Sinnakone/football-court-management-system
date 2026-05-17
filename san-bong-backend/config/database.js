// config/database.js
// Cấu hình kết nối PostgreSQL sử dụng connection pool

const { Pool, types } = require('pg');
require('dotenv').config();

// PostgreSQL DATE should stay as YYYY-MM-DD strings in API JSON.
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT || 5432),
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME     || 'quan_ly_san_bong',
    max:      10,
});

const convertPlaceholders = (sql) => {
    let index = 0;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let result = '';

    for (let i = 0; i < sql.length; i += 1) {
        const char = sql[i];
        const next = sql[i + 1];

        if (char === "'" && !inDoubleQuote) {
            result += char;
            if (inSingleQuote && next === "'") {
                result += next;
                i += 1;
            } else {
                inSingleQuote = !inSingleQuote;
            }
            continue;
        }

        if (char === '"' && !inSingleQuote) {
            inDoubleQuote = !inDoubleQuote;
            result += char;
            continue;
        }

        if (char === '?' && !inSingleQuote && !inDoubleQuote) {
            index += 1;
            result += `$${index}`;
            continue;
        }

        result += char;
    }

    return result;
};

const db = {
    async execute(sql, params = []) {
        const query = convertPlaceholders(sql);
        const result = await pool.query(query, params);

        if (result.rows[0]?.id && /^\s*insert\s+/i.test(sql)) {
            result.insertId = result.rows[0].id;
        }
        result.affectedRows = result.rowCount;

        if (/^\s*insert\s+/i.test(sql)) {
            return [result, result];
        }

        return [result.rows, result];
    },

    query(sql, params = []) {
        return this.execute(sql, params);
    },
};

pool.connect()
    .then((client) => {
        console.log('✅ Kết nối PostgreSQL thành công!');
        client.release();
    })
    .catch((err) => {
        console.error('❌ Lỗi kết nối PostgreSQL:', err.message);
    });

module.exports = db;
