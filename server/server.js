const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./config/db');
const crud = require('./routes/crud');
const { auth, permit, SECRET } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json({ limit: '60mb' }));

/* ---------- helpers ---------- */
const one = async (sql, params = []) => {
  const [rows] = await db.query(sql, params);
  return (rows && rows[0]) || {};
};
const all = async (sql, params = []) => {
  const [rows] = await db.query(sql, params);
  return rows || [];
};
const num = async sql => Number((await one(sql)).a || 0);
const wrap = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(e => {
    console.error('API Error:', e.message);
    if (!res.headersSent) res.status(500).json({ msg: 'Server error: ' + e.message });
  });
const curYM = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`; };
const todayStr = () => new Date().toISOString().slice(0, 10);

/* ---------------- BOOTSTRAP DB (schema embedded) ---------------- */
const SCHEMA = [
  `CREATE DATABASE IF NOT EXISTS ajinfotech`,
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100), username VARCHAR(50) UNIQUE,
    password VARCHAR(255), email VARCHAR(100), mobile VARCHAR(20),
    role VARCHAR(30) DEFAULT 'institute_admin',
    photo LONGTEXT, permissions TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    logo LONGTEXT, name VARCHAR(150), address TEXT, email VARCHAR(100),
    mobile VARCHAR(20), alt_mobile VARCHAR(20), website VARCHAR(100),
    gstin VARCHAR(30), pan VARCHAR(20), upi_id VARCHAR(60),
    gst_percent DECIMAL(5,2) DEFAULT 18, footer_note VARCHAR(255),
    sign_image LONGTEXT, seal_image LONGTEXT
  )`,
  `CREATE TABLE IF NOT EXISTS banks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_name VARCHAR(100), branch_name VARCHAR(100),
    ifsc VARCHAR(20), account_no VARCHAR(30)
  )`,
  `CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(100), fees DECIMAL(10,2), duration_days INT,
    current_offer VARCHAR(150),
    status ENUM('active','inactive') DEFAULT 'active'
  )`,
  `CREATE TABLE IF NOT EXISTS institute_enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enquiry_date DATE, name VARCHAR(100), mobile VARCHAR(20), course VARCHAR(100),
    source VARCHAR(30), ref_name VARCHAR(100), follow_up_date DATE,
    status ENUM('new','follow-up','converted') DEFAULT 'new',
    remark TEXT, converted TINYINT DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_no VARCHAR(25), student_type VARCHAR(10) DEFAULT 'new',
    photo LONGTEXT, name VARCHAR(100), father_name VARCHAR(100), mother_name VARCHAR(100),
    occupation VARCHAR(80), dob DATE, gender VARCHAR(10), mobile VARCHAR(20), email VARCHAR(100),
    course_id INT, aadhar VARCHAR(25), address TEXT, qualification VARCHAR(100),
    batch_timing VARCHAR(80), in_charge TEXT,
    full_fees DECIMAL(10,2), offer_fees DECIMAL(10,2), joined_date DATE
  )`,
  `CREATE TABLE IF NOT EXISTS trainers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id VARCHAR(25), name VARCHAR(100), mobile VARCHAR(20), email VARCHAR(100),
    address TEXT, aadhar VARCHAR(25), qualification VARCHAR(100), join_date DATE,
    salary DECIMAL(10,2), photo LONGTEXT,
    status ENUM('active','inactive') DEFAULT 'active', remarks TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS institute_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT, receipt_no VARCHAR(20), amount DECIMAL(10,2), amount_words TEXT,
    method VARCHAR(20), pay_date DATE, remark TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_no VARCHAR(25), name VARCHAR(100), course VARCHAR(100),
    certificate_image LONGTEXT, completed_date DATE,
    issued TINYINT DEFAULT 0, receiver_name VARCHAR(100),
    receiver_mobile VARCHAR(20), issue_date DATE
  )`,
  `CREATE TABLE IF NOT EXISTS alumni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_no VARCHAR(25), name VARCHAR(100), course VARCHAR(100),
    mobile VARCHAR(20), joined_date DATE, completed_date DATE
  )`,
  `CREATE TABLE IF NOT EXISTS it_enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enquiry_date DATE, company_name VARCHAR(150), name VARCHAR(100), mobile VARCHAR(20),
    project VARCHAR(200), source VARCHAR(30), ref_name VARCHAR(100), follow_up_date DATE,
    status ENUM('new','follow-up','converted') DEFAULT 'new',
    remark TEXT, converted TINYINT DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(150), client_name VARCHAR(100), project VARCHAR(200),
    mobile VARCHAR(20), email VARCHAR(100), aadhar VARCHAR(25), address TEXT,
    gst VARCHAR(30), monthly_pay DECIMAL(10,2),
    status ENUM('active','inactive') DEFAULT 'active'
  )`,
  `CREATE TABLE IF NOT EXISTS it_staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id VARCHAR(25), name VARCHAR(100), mobile VARCHAR(20), email VARCHAR(100),
    address TEXT, aadhar VARCHAR(25), qualification VARCHAR(100), join_date DATE,
    salary DECIMAL(10,2), photo LONGTEXT,
    status ENUM('active','inactive') DEFAULT 'active', remarks TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(25), project_name VARCHAR(200), company_name VARCHAR(150),
    client_id INT, payment_type ENUM('installment','monthly') DEFAULT 'installment',
    project_value DECIMAL(12,2), monthly_amount DECIMAL(10,2), installments INT DEFAULT 3,
    start_date DATE, status VARCHAR(20) DEFAULT 'planning', remarks TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS it_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT, receipt_no VARCHAR(20), amount DECIMAL(12,2), amount_words TEXT,
    method VARCHAR(20), pay_date DATE, remark TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_date DATE, category VARCHAR(60), description TEXT, amount DECIMAL(10,2),
    method VARCHAR(20), paid_to VARCHAR(100), voucher_no VARCHAR(25), remark TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS other_income (
    id INT AUTO_INCREMENT PRIMARY KEY,
    income_date DATE, source VARCHAR(60), description TEXT, amount DECIMAL(10,2),
    method VARCHAR(20), received_from VARCHAR(100), remark TEXT
  )`,
  /* ===== NEW: Monthly (Primary) Expenses ===== */
  `CREATE TABLE IF NOT EXISTS monthly_expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item VARCHAR(150) NOT NULL,
    amount DECIMAL(10,2) DEFAULT 0,
    base_amount DECIMAL(10,2) DEFAULT 0,
    source_type ENUM('manual','salary') DEFAULT 'manual',
    source_table VARCHAR(20) DEFAULT NULL,
    source_id INT DEFAULT NULL,
    status ENUM('pending','paid','complete') DEFAULT 'pending',
    paid_cycle DECIMAL(10,2) DEFAULT 0,
    last_reset_month VARCHAR(7) DEFAULT NULL,
    created_date DATE
  )`
];

/* ================= MONTHLY EXPENSES : AUTO ENGINE =================
   1) Auto-refill on the 10th of every month (carry-forward unpaid)
   2) Auto-sync staff names + salary from trainers & it_staff
=================================================================== */
async function runMonthlyReset() {
  const now = new Date();
  if (now.getDate() < 10) return;                       // only from the 10th onwards
  const ym = curYM();
  const rows = await all(
    `SELECT id, base_amount, last_reset_month FROM monthly_expenses
     WHERE (last_reset_month IS NULL OR last_reset_month <> ?) AND base_amount > 0`, [ym]);
  for (const r of rows) {
    let months = 1;
    if (r.last_reset_month) {
      const [y1, m1] = String(r.last_reset_month).split('-').map(Number);
      months = (now.getFullYear() - y1) * 12 + (now.getMonth() + 1 - m1);
      if (months < 1) months = 1;
    }
    // carry-forward: unpaid 10000 stays, next month 10000 + 10000 = 20000
    await db.query(
      `UPDATE monthly_expenses
       SET amount = amount + (base_amount * ?), paid_cycle = 0,
           status = 'pending', last_reset_month = ?
       WHERE id = ?`, [months, ym, r.id]);
  }
  if (rows.length) console.log(`✔ Monthly expenses auto-refilled for ${ym} (${rows.length} item(s))`);
}

async function syncStaffSalaries() {
  const trainers = await all(`SELECT id, name, salary FROM trainers WHERE status='active' AND salary > 0`);
  const itstaff  = await all(`SELECT id, name, salary FROM it_staff  WHERE status='active' AND salary > 0`);
  const ym = curYM();
  const list = [
    ...trainers.map(t => ({ ...t, tbl: 'trainer' })),
    ...itstaff.map(t => ({ ...t, tbl: 'it' }))
  ];
  for (const s of list) {
    const ex = await one(
      `SELECT id FROM monthly_expenses WHERE source_type='salary' AND source_table=? AND source_id=?`,
      [s.tbl, s.id]);
    if (ex.id) {
      await db.query(`UPDATE monthly_expenses SET item=?, base_amount=? WHERE id=?`,
        [s.name, s.salary, ex.id]);
    } else {
      await db.query(
        `INSERT INTO monthly_expenses
         (item, amount, base_amount, source_type, source_table, source_id, status, last_reset_month, created_date)
         VALUES (?,?,?,'salary',?,?, 'pending', ?, ?)`,
        [s.name, s.salary, s.salary, s.tbl, s.id, ym, todayStr()]);
    }
  }
}

(async () => {
  try {
    for (const stmt of SCHEMA) {
      try { await db.query(stmt); } catch (e) { console.error('⚠ SQL:', e.message); }
    }
    const u = await one('SELECT COUNT(*) c FROM users');
    if (!Number(u.c)) {
      const hash = await bcrypt.hash('admin123', 10);
      await db.query(
        `INSERT INTO users (name,username,password,email,role,permissions) VALUES (?,?,?,?,?,?)`,
        ['Super Admin', 'admin', hash, 'admin@ajinfotech.in', 'superadmin',
         JSON.stringify(['inst.enquiries','inst.students','inst.courses','inst.payment','inst.certificate','inst.trainers','inst.alumni','it.enquiries','it.clients','it.staffs','it.projects','it.payment','fin.expenses','fin.otherincome','fin.monthly','fin.accounts','fin.report'])]);
      console.log('✔ Seeded Super Admin → admin / admin123');
    }
    const s = await one('SELECT COUNT(*) c FROM settings');
    if (!Number(s.c)) await db.query(
      `INSERT INTO settings (name,address,email,mobile,gstin,gst_percent) VALUES (?,?,?,?,?,18)`,
      ['AJ INFO TECH',
       '12c, 1st Floor, Bus Stand Road, Merin Super Market, Jayankondam, Ariyalur- 621802',
       'info@ajinfotech.in', '9003485703', '33ANHPL4615N1ZT']);
    await runMonthlyReset().catch(e => console.error('⚠ reset:', e.message));
    await syncStaffSalaries().catch(e => console.error('⚠ salary sync:', e.message));
    console.log('✔ Database ready');
  } catch (e) {
    console.error('✖ Database error:', e.message);
    console.error('→ Check MySQL is running and credentials in server/config/db.js');
  }
})();

/* ---------------- AUTH ---------------- */
app.post('/api/auth/login', wrap(async (req, res) => {
  const { username, password } = req.body;
  const user = await one('SELECT * FROM users WHERE username=?', [username]);
  if (!user.id || !(await bcrypt.compare(password || '', user.password || '')))
    return res.status(401).json({ msg: 'Invalid username or password' });
  const token = jwt.sign({ id: user.id, role: user.role, permissions: user.permissions }, SECRET, { expiresIn: '1d' });
  res.json({ token });
}));

app.get('/api/auth/me', auth, wrap(async (req, res) => {
  res.json(await one('SELECT id,name,username,email,mobile,role,photo,permissions FROM users WHERE id=?', [req.user.id]));
}));

app.post('/api/auth/change-password', auth, wrap(async (req, res) => {
  const { old_password, new_password } = req.body;
  const u = await one('SELECT password FROM users WHERE id=?', [req.user.id]);
  if (!(await bcrypt.compare(old_password || '', u.password || '')))
    return res.status(400).json({ msg: 'Old password is incorrect' });
  await db.query('UPDATE users SET password=? WHERE id=?',
    [await bcrypt.hash(new_password, 10), req.user.id]);
  res.json({ ok: true });
}));

/* ---------------- USERS ---------------- */
app.get('/api/users', auth, permit('users'), wrap(async (req, res) => {
  res.json(await all('SELECT id,name,username,email,mobile,role,photo,permissions FROM users ORDER BY id'));
}));

app.post('/api/users', auth, permit('users'), wrap(async (req, res) => {
  const { name, username, password, email, mobile, role, photo, permissions } = req.body;
  const ex = await one('SELECT id FROM users WHERE username=?', [username]);
  if (ex.id) return res.status(400).json({ msg: 'Username already exists' });
  const [r] = await db.query(
    'INSERT INTO users (name,username,password,email,mobile,role,photo,permissions) VALUES (?,?,?,?,?,?,?,?)',
    [name, username, await bcrypt.hash(password, 10), email, mobile, role, photo || null,
     JSON.stringify(permissions || [])]);
  res.json({ id: r.insertId });
}));

app.put('/api/users/:id', auth, permit('users'), wrap(async (req, res) => {
  const b = req.body;
  await db.query('UPDATE users SET name=?,email=?,mobile=?,role=?,photo=?,permissions=? WHERE id=?',
    [b.name, b.email, b.mobile, b.role, b.photo || null, JSON.stringify(b.permissions || []), req.params.id]);
  if (b.password) await db.query('UPDATE users SET password=? WHERE id=?',
    [await bcrypt.hash(b.password, 10), req.params.id]);
  res.json({ ok: true });
}));

app.delete('/api/users/:id', auth, permit('users'), wrap(async (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ msg: 'Cannot delete yourself' });
  await db.query('DELETE FROM users WHERE id=?', [req.params.id]);
  res.json({ ok: true });
}));

/* ---------------- SETTINGS ---------------- */
app.get('/api/settings', auth, wrap(async (req, res) => {
  const s = await one('SELECT * FROM settings LIMIT 1');
  const banks = await all('SELECT * FROM banks');
  res.json({ ...s, banks });
}));

app.put('/api/settings', auth, permit('users'), wrap(async (req, res) => {
  const fields = ['logo','name','address','email','mobile','alt_mobile','website',
    'gstin','pan','upi_id','gst_percent','footer_note','sign_image','seal_image'];
  let st = await one('SELECT id FROM settings LIMIT 1');
  if (!st.id) { const [r] = await db.query('INSERT INTO settings (name) VALUES (?)', ['AJ INFO TECH']); st = { id: r.insertId }; }
  const data = fields.filter(f => req.body[f] !== undefined);
  if (data.length) await db.query(
    `UPDATE settings SET ${data.map(f => f + '=?').join(',')} WHERE id=?`,
    [...data.map(f => req.body[f]), st.id]);
  if (Array.isArray(req.body.banks)) {
    await db.query('DELETE FROM banks');
    for (const b of req.body.banks.slice(0, 3)) {
      if (b.bank_name || b.account_no)
        await db.query('INSERT INTO banks (bank_name,branch_name,ifsc,account_no) VALUES (?,?,?,?)',
          [b.bank_name, b.branch_name, b.ifsc, b.account_no]);
    }
  }
  res.json({ ok: true });
}));

/* ---------------- DASHBOARD STATS ---------------- */
app.get('/api/dashboard/stats', auth, wrap(async (req, res) => {
  const active   = await num('SELECT COUNT(*) a FROM students');
  const todayAdm = await num('SELECT COUNT(*) a FROM students WHERE joined_date=CURDATE()');
  const monthAdm = await num("SELECT COUNT(*) a FROM students WHERE MONTH(joined_date)=MONTH(CURDATE()) AND YEAR(joined_date)=YEAR(CURDATE())");
  const trainers = await num("SELECT COUNT(*) a FROM trainers WHERE status='active'");
  const batches  = await num('SELECT COUNT(DISTINCT batch_timing) a FROM students');
  const totalDue = await num('SELECT IFNULL(SUM(offer_fees),0) a FROM students');
  const instPaid = await num('SELECT IFNULL(SUM(p.amount),0) a FROM institute_payments p JOIN students s ON p.student_id=s.id');
  const colToday = await num('SELECT IFNULL(SUM(amount),0) a FROM institute_payments WHERE pay_date=CURDATE()');
  const colMonth = await num("SELECT IFNULL(SUM(amount),0) a FROM institute_payments WHERE MONTH(pay_date)=MONTH(CURDATE()) AND YEAR(pay_date)=YEAR(CURDATE())");
  const expToday = await num('SELECT IFNULL(SUM(amount),0) a FROM expenses WHERE expense_date=CURDATE()');
  const expMonth = await num("SELECT IFNULL(SUM(amount),0) a FROM expenses WHERE MONTH(expense_date)=MONTH(CURDATE()) AND YEAR(expense_date)=YEAR(CURDATE())");
  const actC = await num("SELECT COUNT(*) a FROM clients WHERE status='active'");
  const totC = await num('SELECT COUNT(*) a FROM clients');
  const actP = await num("SELECT COUNT(*) a FROM projects WHERE status IN ('planning','in process')");
  const totP = await num('SELECT COUNT(*) a FROM projects');
  const actE = await num("SELECT COUNT(*) a FROM it_staff WHERE status='active'");
  const totE = await num('SELECT COUNT(*) a FROM it_staff');
  const itMonth = await num("SELECT IFNULL(SUM(amount),0) a FROM it_payments WHERE MONTH(pay_date)=MONTH(CURDATE()) AND YEAR(pay_date)=YEAR(CURDATE())");

  const y = new Date().getFullYear();
  const A = () => Array(12).fill(0);
  const instI = A(), itI = A(), joins = A(), exps = A();

  (await all('SELECT pay_date d, amount v FROM institute_payments')).forEach(r => {
    const d = new Date(r.d); if (d.getFullYear() === y) instI[d.getMonth()] += Number(r.v); });
  (await all('SELECT pay_date d, amount v FROM it_payments')).forEach(r => {
    const d = new Date(r.d); if (d.getFullYear() === y) itI[d.getMonth()] += Number(r.v); });
  (await all('SELECT joined_date d FROM students')).forEach(r => {
    const d = new Date(r.d); if (d.getFullYear() === y) joins[d.getMonth()]++; });
  (await all('SELECT expense_date d, amount v FROM expenses')).forEach(r => {
    const d = new Date(r.d); if (d.getFullYear() === y) exps[d.getMonth()] += Number(r.v); });

  res.json({
    inst: { active, total: active, today: todayAdm, month: monthAdm, activeTrainers: trainers,
      activeBatches: batches, outstanding: Math.max(0, totalDue - instPaid),
      colToday, colMonth, expToday, expMonth },
    it: { activeClients: actC, totalClients: totC, activeProjects: actP, totalProjects: totP,
      activeEmployees: actE, totalEmployees: totE, monthIncome: itMonth },
    charts: { instIncome: instI, itIncome: itI, joins, expenses: exps }
  });
}));

/* ---------------- INSTITUTE : SPECIAL ROUTES ---------------- */
app.post('/api/inst/enquiries/:id/convert', auth, permit('inst.enquiries'), wrap(async (req, res) => {
  await db.query("UPDATE institute_enquiries SET converted=1, status='converted' WHERE id=?", [req.params.id]);
  res.json({ ok: true });
}));

app.post('/api/inst/students/:id/complete', auth, permit('inst.students'), wrap(async (req, res) => {
  const s = await one(
    'SELECT s.*, c.course_name FROM students s LEFT JOIN courses c ON s.course_id=c.id WHERE s.id=?', [req.params.id]);
  if (!s.id) return res.status(404).json({ msg: 'Not found' });
  const d = todayStr();
  await db.query('INSERT INTO alumni (application_no,name,course,mobile,joined_date,completed_date) VALUES (?,?,?,?,?,?)',
    [s.application_no, s.name, s.course_name, s.mobile, s.joined_date, d]);
  await db.query('DELETE FROM students WHERE id=?', [req.params.id]);
  res.json({ ok: true });
}));

app.get('/api/inst/billing', auth, permit('inst.payment'), wrap(async (req, res) => {
  const rows = await all(
    `SELECT s.id, s.application_no, s.name, s.mobile, s.joined_date, s.offer_fees,
            c.course_name, c.duration_days
     FROM students s LEFT JOIN courses c ON s.course_id=c.id ORDER BY s.id DESC`);
  const pays = await all('SELECT student_id, amount FROM institute_payments');
  const paidMap = {};
  pays.forEach(p => paidMap[p.student_id] = (paidMap[p.student_id] || 0) + Number(p.amount));
  const list = rows.map(s => {
    const fees = Number(s.offer_fees || 0), paid = paidMap[s.id] || 0, balance = fees - paid;
    const dur = Number(s.duration_days || 0);
    const n = dur <= 30 ? 1 : dur <= 60 ? 2 : dur <= 90 ? 3 : 4;
    const per = n ? fees / n : fees;
    const paidInst = per > 0 ? Math.min(n, Math.floor(paid / per + 1e-9)) : n;
    let status = 'good', nextDue = null;
    if (balance <= 0) status = 'paid';
    else if (paidInst < n && s.joined_date && dur) {
      const due = new Date(s.joined_date);
      due.setDate(due.getDate() + Math.round(dur / n) * (paidInst + 1));
      nextDue = due.toISOString().slice(0, 10);
      if (new Date() > due) status = 'overdue';
    }
    return { ...s, fees, paid, balance, installments: n, perInstallment: per,
      paidInstallments: paidInst, status, nextDue };
  });
  res.json(list);
}));

app.get('/api/inst/payments', auth, permit('inst.payment'), wrap(async (req, res) => {
  let sql = `SELECT p.*, s.name student_name, s.application_no, s.offer_fees,
             c.course_name, c.duration_days
             FROM institute_payments p
             LEFT JOIN students s ON p.student_id=s.id
             LEFT JOIN courses c ON s.course_id=c.id`;
  const params = [];
  if (req.query.student_id) { sql += ' WHERE p.student_id=?'; params.push(req.query.student_id); }
  sql += ' ORDER BY p.id DESC';
  res.json(await all(sql, params));
}));

app.post('/api/inst/payments', auth, permit('inst.payment'), wrap(async (req, res) => {
  const { student_id, amount, amount_words, method, pay_date, remark } = req.body;
  const last = await one('SELECT receipt_no FROM institute_payments ORDER BY id DESC LIMIT 1');
  let n = parseInt(String(last.receipt_no || '').replace('A', ''), 10);
  if (isNaN(n)) n = 0;
  const receipt_no = 'A' + String(n + 1).padStart(5, '0');
  const [r] = await db.query(
    'INSERT INTO institute_payments (student_id,receipt_no,amount,amount_words,method,pay_date,remark) VALUES (?,?,?,?,?,?,?)',
    [student_id, receipt_no, amount, amount_words, method, pay_date || todayStr(), remark || '']);
  res.json({ id: r.insertId, receipt_no });
}));

/* ---------------- IT SOLUTIONS : SPECIAL ROUTES ---------------- */
app.post('/api/it/enquiries/:id/convert', auth, permit('it.enquiries'), wrap(async (req, res) => {
  const e = await one('SELECT * FROM it_enquiries WHERE id=?', [req.params.id]);
  if (!e.id) return res.status(404).json({ msg: 'Not found' });
  await db.query("UPDATE it_enquiries SET converted=1, status='converted' WHERE id=?", [req.params.id]);
  await db.query('INSERT INTO clients (company_name,client_name,project,mobile,status) VALUES (?,?,?,?,?)',
    [e.company_name, e.name, e.project, e.mobile, 'active']);
  res.json({ ok: true });
}));

app.get('/api/it/projects-billing', auth, permit('it.payment'), wrap(async (req, res) => {
  const rows = await all(
    `SELECT p.*, c.company_name, c.client_name, c.address, c.gst, c.mobile
     FROM projects p LEFT JOIN clients c ON p.client_id=c.id ORDER BY p.id DESC`);
  const pays = await all('SELECT project_id, amount FROM it_payments');
  const paidMap = {};
  pays.forEach(p => paidMap[p.project_id] = (paidMap[p.project_id] || 0) + Number(p.amount));
  const list = rows.map(p => {
    const paid = paidMap[p.id] || 0;
    let payable;
    if (p.payment_type === 'monthly' && p.start_date) {
      const st = new Date(p.start_date), nw = new Date();
      const months = Math.max(1, (nw.getFullYear() - st.getFullYear()) * 12 + (nw.getMonth() - st.getMonth()) + 1);
      payable = Number(p.monthly_amount || 0) * months;
    } else payable = Number(p.project_value || 0);
    return { ...p, paid, payable, balance: payable - paid };
  });
  res.json(list);
}));

app.get('/api/it/payments', auth, permit('it.payment'), wrap(async (req, res) => {
  let sql = `SELECT p.*, pr.project_name, pr.payment_type, c.company_name, c.client_name, c.address, c.gst
             FROM it_payments p
             LEFT JOIN projects pr ON p.project_id=pr.id
             LEFT JOIN clients c ON pr.client_id=c.id`;
  const params = [];
  if (req.query.project_id) { sql += ' WHERE p.project_id=?'; params.push(req.query.project_id); }
  sql += ' ORDER BY p.id DESC';
  res.json(await all(sql, params));
}));

app.post('/api/it/payments', auth, permit('it.payment'), wrap(async (req, res) => {
  const { project_id, amount, amount_words, method, pay_date, remark } = req.body;
  const last = await one('SELECT receipt_no FROM it_payments ORDER BY id DESC LIMIT 1');
  let n = parseInt(String(last.receipt_no || '').replace(/Aj/i, ''), 10);
  if (isNaN(n)) n = 0;
  const receipt_no = 'Aj' + String(n + 1).padStart(5, '0');
  const [r] = await db.query(
    'INSERT INTO it_payments (project_id,receipt_no,amount,amount_words,method,pay_date,remark) VALUES (?,?,?,?,?,?,?)',
    [project_id, receipt_no, amount, amount_words, method, pay_date || todayStr(), remark || '']);
  res.json({ id: r.insertId, receipt_no });
}));

/* ============ MONTHLY (PRIMARY) EXPENSES ROUTES ============ */
app.get('/api/fin/monthly', auth, permit('fin.monthly'), wrap(async (req, res) => {
  await runMonthlyReset();          // auto-refill on/after 10th
  await syncStaffSalaries();        // auto-pull staff names + salary
  res.json(await all(`SELECT * FROM monthly_expenses
                      ORDER BY source_type='salary' DESC, item ASC`));
}));

app.post('/api/fin/monthly', auth, permit('fin.monthly'), wrap(async (req, res) => {
  const { item, amount } = req.body;
  if (!item || !Number(amount)) return res.status(400).json({ msg: 'Item and amount are required' });
  const [r] = await db.query(
    `INSERT INTO monthly_expenses (item, amount, base_amount, source_type, status, last_reset_month, created_date)
     VALUES (?,?,?,'manual','pending',?,?)`,
    [item, Number(amount), Number(amount), curYM(), todayStr()]);
  res.json({ id: r.insertId });
}));

app.put('/api/fin/monthly/:id', auth, permit('fin.monthly'), wrap(async (req, res) => {
  const b = req.body, sets = [], vals = [];
  if (b.item !== undefined)        { sets.push('item=?');        vals.push(b.item); }
  if (b.amount !== undefined)      { sets.push('amount=?');      vals.push(Number(b.amount)); }
  if (b.base_amount !== undefined) { sets.push('base_amount=?'); vals.push(Number(b.base_amount)); }
  if (sets.length) { vals.push(req.params.id);
    await db.query(`UPDATE monthly_expenses SET ${sets.join(',')} WHERE id=?`, vals); }
  res.json({ ok: true });
}));

app.delete('/api/fin/monthly/:id', auth, permit('fin.monthly'), wrap(async (req, res) => {
  // deletes only this monthly row — payment history in `expenses` is NEVER touched
  await db.query('DELETE FROM monthly_expenses WHERE id=?', [req.params.id]);
  res.json({ ok: true });
}));

// Pay — full or partial. Payment is recorded into `expenses` (books) automatically.
app.post('/api/fin/monthly/:id/pay', auth, permit('fin.monthly'), wrap(async (req, res) => {
  const { pay_type, amount, method } = req.body;
  const item = await one('SELECT * FROM monthly_expenses WHERE id=?', [req.params.id]);
  if (!item.id) return res.status(404).json({ msg: 'Item not found' });
  const pending = Number(item.amount);
  if (pending <= 0) return res.status(400).json({ msg: 'Already paid' });
  const pay = pay_type === 'full' ? pending : Number(amount);
  if (!pay || pay <= 0) return res.status(400).json({ msg: 'Enter a valid amount' });
  if (pay > pending) return res.status(400).json({ msg: 'Amount exceeds pending balance' });

  await db.query(
    `INSERT INTO expenses (expense_date, category, description, amount, method, paid_to, voucher_no, remark)
     VALUES (?,?,?,?,?,?,?,?)`,
    [todayStr(),
     item.source_type === 'salary' ? 'Salary' : 'Monthly Expense',
     `${item.item} — monthly expense payment${pay < pending ? ' (partial)' : ''}`,
     pay, method || 'Cash', item.item,
     'ME' + String(item.id).padStart(3, '0') + '-' + Date.now().toString().slice(-6),
     'Auto-recorded from Monthly Expenses']);

  const newAmount = Math.max(0, pending - pay);
  const newPaid = Number(item.paid_cycle || 0) + pay;
  const status = newAmount <= 0 ? 'paid' : 'pending';
  await db.query('UPDATE monthly_expenses SET amount=?, paid_cycle=?, status=? WHERE id=?',
    [newAmount, newPaid, status, req.params.id]);
  res.json({ ok: true, amount: newAmount, status });
}));

// Complete — clears pending amount WITHOUT recording an expense.
// Next month on the 10th the base amount is added again automatically.
app.post('/api/fin/monthly/:id/complete', auth, permit('fin.monthly'), wrap(async (req, res) => {
  await db.query(`UPDATE monthly_expenses SET amount=0, status='complete' WHERE id=?`, [req.params.id]);
  res.json({ ok: true });
}));

/* ---------------- FINANCE : SUMMARY (+ monthly expense cards) ---------------- */
app.get('/api/finance/summary', auth, permit('fin.accounts', 'fin.report'), wrap(async (req, res) => {
  const { from, to } = req.query;
  const has = !!(from && to);
  const P = has ? [from, to] : [];
  const rng = col => (has ? ` AND ${col} BETWEEN ? AND ?` : '');
  const g = async sql => all(sql, P);

  const [x1] = await g(`SELECT IFNULL(SUM(amount),0) v FROM institute_payments WHERE 1=1 ${rng('pay_date')}`);
  const [x2] = await g(`SELECT IFNULL(SUM(amount),0) v FROM it_payments WHERE 1=1 ${rng('pay_date')}`);
  const [x3] = await g(`SELECT IFNULL(SUM(amount),0) v FROM other_income WHERE 1=1 ${rng('income_date')}`);
  const [x4] = await g(`SELECT IFNULL(SUM(amount),0) v FROM expenses WHERE 1=1 ${rng('expense_date')}`);

  const rows = [
    ...(await g(`SELECT pay_date d,'Institute Fee' type, remark detail, amount v FROM institute_payments WHERE 1=1 ${rng('pay_date')}`)),
    ...(await g(`SELECT pay_date d,'IT Payment' type, remark detail, amount v FROM it_payments WHERE 1=1 ${rng('pay_date')}`)),
    ...(await g(`SELECT income_date d,'Other Income' type, remark detail, amount v FROM other_income WHERE 1=1 ${rng('income_date')}`)),
    ...(await g(`SELECT expense_date d,'Expense' type, description detail, amount v FROM expenses WHERE 1=1 ${rng('expense_date')}`))
  ].sort((a, b) => (b.d > a.d ? 1 : -1));

  const me = await one('SELECT IFNULL(SUM(paid_cycle),0) pt, IFNULL(SUM(amount),0) pd FROM monthly_expenses');

  const instIncome = Number(x1.v), itIncome = Number(x2.v),
        otherIncome = Number(x3.v), expenses = Number(x4.v);
  const totalIncome = instIncome + itIncome + otherIncome;
  res.json({ instIncome, itIncome, otherIncome, expenses, totalIncome,
    net: totalIncome - expenses, rows,
    meTotal: Number(me.pt),              // Monthly Expenses paid (this cycle)
    meOutstanding: Number(me.pd) });     // Outstanding unpaid (monthly expenses)
}));

/* ---------------- GENERIC CRUD MOUNTS ---------------- */
app.use('/api/inst/enquiries',    auth, permit('inst.enquiries'), crud(db, 'institute_enquiries', ['enquiry_date','name','mobile','course','source','ref_name','follow_up_date','status','remark','converted']));
app.use('/api/inst/students',     auth, permit('inst.students'),  crud(db, 'students', ['application_no','student_type','photo','name','father_name','mother_name','occupation','dob','gender','mobile','email','course_id','aadhar','address','qualification','batch_timing','in_charge','full_fees','offer_fees','joined_date']));
app.use('/api/inst/courses',      auth, permit('inst.courses'),   crud(db, 'courses', ['course_name','fees','duration_days','current_offer','status']));
app.use('/api/inst/trainers',     auth, permit('inst.trainers'),  crud(db, 'trainers', ['staff_id','name','mobile','email','address','aadhar','qualification','join_date','salary','photo','status','remarks']));
app.use('/api/inst/certificates', auth, permit('inst.certificate'), crud(db, 'certificates', ['certificate_no','name','course','certificate_image','completed_date','issued','receiver_name','receiver_mobile','issue_date']));
app.use('/api/inst/alumni',       auth, permit('inst.alumni'),    crud(db, 'alumni', ['application_no','name','course','mobile','joined_date','completed_date']));
app.use('/api/it/enquiries',      auth, permit('it.enquiries'),   crud(db, 'it_enquiries', ['enquiry_date','company_name','name','mobile','project','source','ref_name','follow_up_date','status','remark','converted']));
app.use('/api/it/clients',        auth, permit('it.clients'),     crud(db, 'clients', ['company_name','client_name','project','mobile','email','aadhar','address','gst','monthly_pay','status']));
app.use('/api/it/staffs',         auth, permit('it.staffs'),      crud(db, 'it_staff', ['staff_id','name','mobile','email','address','aadhar','qualification','join_date','salary','photo','status','remarks']));
app.use('/api/it/projects',       auth, permit('it.projects'),    crud(db, 'projects', ['project_id','project_name','company_name','client_id','payment_type','project_value','monthly_amount','installments','start_date','status','remarks']));
app.use('/api/fin/expenses',      auth, permit('fin.expenses'),   crud(db, 'expenses', ['expense_date','category','description','amount','method','paid_to','voucher_no','remark']));
app.use('/api/fin/otherincome',   auth, permit('fin.otherincome'), crud(db, 'other_income', ['income_date','source','description','amount','method','received_from','remark']));

/* ---------------- terminal error handler ---------------- */
app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  if (!res.headersSent) res.status(500).json({ msg: 'Server error: ' + err.message });
});

app.listen(5000, () => console.log('✔ AJ INFO TECH API running → http://localhost:5000'));