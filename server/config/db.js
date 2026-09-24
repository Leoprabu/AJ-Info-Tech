const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'bvjskz9w9uillrpjcfvb-mysql.services.clever-cloud.com',
  user: 'uqbpamekwnznw9ux',
  password: 'i2IwXzorz7JflEVBFanG',            // ⚠️ set your MySQL password
  database: 'bvjskz9w9uillrpjcfvb',
  port: '3306',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});
module.exports = pool;
