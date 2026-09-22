const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'sql213.infinityfree.com',
  user: 'if0_42979206',
  password: 'wd8hTpXGm7XB',            // ⚠️ set your MySQL password
  database: 'if0_42979206_ajinfotech',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});
module.exports = pool;
