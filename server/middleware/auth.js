const jwt = require('jsonwebtoken');
const SECRET = 'aj_infotech_2026_secret';

exports.SECRET = SECRET;
exports.auth = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ msg: 'No token' });
  try { req.user = jwt.verify(h.split(' ')[1], SECRET); next(); }
  catch { res.status(401).json({ msg: 'Session expired' }); }
};

exports.permit = (...keys) => (req, res, next) => {
  const u = req.user;
  if (['superadmin', 'admin'].includes(u.role)) return next();
  let perms = [];
  try { perms = JSON.parse(u.permissions || '[]'); } catch {}
  if (keys.some(k => perms.includes(k))) return next();
  res.status(403).json({ msg: 'Access denied' });
};