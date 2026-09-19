// Generic CRUD factory — powers all simple modules
module.exports = (db, table, fields, order = 'id DESC') => {
  const r = require('express').Router();
  const safe = fn => (req, res) => fn(req, res).catch(e => {
    console.error('API Error:', e.message);
    if (!res.headersSent) res.status(500).json({ msg: e.message });
  });

  r.get('/', safe(async (req, res) => {
    const [rows] = await db.query(`SELECT * FROM ${table} ORDER BY ${order}`);
    res.json(rows);
  }));

  r.post('/', safe(async (req, res) => {
    const data = fields.map(f => req.body[f] ?? null);
    const [r2] = await db.query(
      `INSERT INTO ${table} (${fields.join(',')}) VALUES (?)`, [data]);
    res.json({ id: r2.insertId });
  }));

  r.put('/:id', safe(async (req, res) => {
    const pairs = fields.filter(f => req.body[f] !== undefined);
    if (pairs.length) await db.query(
      `UPDATE ${table} SET ${pairs.map(f => f + '=?').join(',')} WHERE id=?`,
      [...pairs.map(f => req.body[f]), req.params.id]);
    res.json({ ok: true });
  }));

  r.delete('/:id', safe(async (req, res) => {
    await db.query(`DELETE FROM ${table} WHERE id=?`, [req.params.id]);
    res.json({ ok: true });
  }));

  return r;
};