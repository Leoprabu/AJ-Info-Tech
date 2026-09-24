const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'http://sql309.infinityfree.com/',
  user: 'if0_42221348',
  password: 'Leoprabu037',            // ⚠️ set your MySQL password
  database: 'if0_42221348_ajinfotech',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});
module.exports = pool;
