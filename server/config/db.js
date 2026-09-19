const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',            // ⚠️ set your MySQL password
  database: 'ajinfotech',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});
module.exports = pool;