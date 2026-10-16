

const authenticateToken = require('./middleware/auth');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');




const app = express();
const port = Number(process.env.PORT || 5000);
app.use(cors());
app.use(express.json({ limit: '1mb' }));



app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      password.length < 8
    ) {
      return res.status(400).json({
        error: 'Name, valid email and password (at least 8 characters) are required'
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length > 100 || cleanEmail.length > 255 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Invalid name or email' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [cleanName, cleanEmail, passwordHash]
    );

    res.status(201).json({
      message: 'Registration successful',
      user: { id: result.insertId, name: cleanName, email: cleanEmail }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email is already registered' });
    }
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const [rows] = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (!rows.length ||
        !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return res.status(500).json({ error: 'Authentication is not configured' });
    }

    const user = rows[0];
const token = jwt.sign(
  {
    sub: String(user.id),
    name: user.name,
    email: user.email
  },
  process.env.JWT_SECRET,
  { expiresIn: '2h' }
);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    next(error);
  }
});



const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'shopapp',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shopsphere',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true
});

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'shopsphere-api', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'degraded', service: 'shopsphere-api', database: 'disconnected' });
  }
});

app.get('/api/products', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim();
    const category = String(req.query.category || '').trim();
    const minPrice = Number(req.query.minPrice);
    const maxPrice = Number(req.query.maxPrice);
    let sql = 'SELECT id, name, description, category, price, stock, image_url AS imageUrl FROM products WHERE 1=1';
    const params = [];
    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category && category !== 'All') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (Number.isFinite(minPrice) && req.query.minPrice !== undefined) {
      sql += ' AND price >= ?'; params.push(minPrice);
    }
    if (Number.isFinite(maxPrice) && req.query.maxPrice !== undefined) {
      sql += ' AND price <= ?'; params.push(maxPrice);
    }
    sql += ' ORDER BY created_at DESC, id DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ items: rows, count: rows.length });
  } catch (error) { next(error); }
});

app.get('/api/orders/:id', authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
`SELECT id, customer_name AS customerName,
        customer_email AS email, shipping_address AS address,
        total, status, created_at AS createdAt
 FROM orders
 WHERE id = ? AND user_id = ?`,
[req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

app.post('/api/orders', authenticateToken, async (req, res, next) =>{
const { address, items } = req.body || {};

if (
  typeof address !== 'string' ||
  !address.trim() ||
  !Array.isArray(items) ||
  items.length === 0
) {
  return res.status(400).json({
    error: 'Address and at least one item are required'
  });
}
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let total = 0;
    const validated = [];
    for (const item of items) {
      const id = Number(item.productId);
      const qty = Number(item.quantity);
      if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1 || qty > 99) {
        throw Object.assign(new Error('Invalid product or quantity'), { status: 400 });
      }
      const [rows] = await conn.query('SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE', [id]);
      if (!rows.length) throw Object.assign(new Error(`Product ${id} not found`), { status: 400 });
      const p = rows[0];
      if (p.stock < qty) throw Object.assign(new Error(`Not enough stock for ${p.name}`), { status: 409 });
      const price = Number(p.price);
      total += price * qty;
      validated.push({ ...p, price, qty });
    }
const [orderResult] = await conn.query(
  `INSERT INTO orders
   (user_id, customer_name, customer_email, shipping_address, total)
   VALUES (?, ?, ?, ?, ?)`,
  [
    req.user.id,
    req.user.name,
    req.user.email,
    address.trim(),
    total
  ]
);
    for (const p of validated) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)',
        [orderResult.insertId, p.id, p.name, p.price, p.qty]
      );
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [p.qty, p.id]);
    }
    await conn.commit();
    res.status(201).json({ orderId: orderResult.insertId, total: Number(total.toFixed(2)), status: 'pending' });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally { conn.release(); }
});

app.get('/api/orders/:id', async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      'SELECT id, customer_name AS customerName, customer_email AS email, shipping_address AS address, total, status, created_at AS createdAt FROM orders WHERE id = ?',
      [req.params.id]
    );
    if (!orders.length) return res.status(404).json({ error: 'Order not found' });
    const [items] = await pool.query(
      'SELECT product_id AS productId, product_name AS productName, unit_price AS unitPrice, quantity FROM order_items WHERE order_id = ?',
      [req.params.id]
    );
    res.json({ ...orders[0], items });
  } catch (error) { next(error); }
});

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Internal server error' });
});

app.listen(port, () => console.log(`ShopSphere API listening on port ${port}`));
