const express = require('express');
const router  = express.Router();
const { Pool } = require('pg');
const jwt     = require('jsonwebtoken');
require('dotenv').config();

// ── PostgreSQL connection pool ────────────────────────────────────────────────
const pool = new Pool({
    host    : process.env.PG_HOST     || 'localhost',
    port    : process.env.PG_PORT     || 5432,
    user    : process.env.PG_USER     || 'postgres',
    password: process.env.PG_PASSWORD || '',
    database: process.env.PG_DATABASE || 'thehill_db',
});

// ── Auto-migrate: ensure required columns exist ──────────────────────────────
(async function migrate() {
    try {
        await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INT REFERENCES categories(id) ON DELETE SET NULL`);
        await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS badge VARCHAR(50)`);
        console.log('[migrate] columns category_id & badge OK');
    } catch (err) {
        console.error('[migrate] Error:', err.message);
    }
})();

// ── JWT middleware ────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret-key';

function requireAuth(req, res, next) {
    const header = req.headers['authorization'];
    const token  = header && header.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        req.admin = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// ── POST /api/admin/login ─────────────────────────────────────────────────────
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const validUser = process.env.ADMIN_USERNAME || 'admin';
    const validPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === validUser && password === validPass) {
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
});

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const { rows: [{ total_products }] } = await pool.query('SELECT COUNT(*) AS total_products FROM products');
        const { rows: [{ total_images   }] } = await pool.query('SELECT COUNT(*) AS total_images   FROM product_images');

        let totalOrders = 0;
        let totalRevenue = 0;
        try {
            const { rows: [stats] } = await pool.query(`
                SELECT COUNT(*) AS total_orders,
                       COALESCE(SUM(total_amount), 0) AS total_revenue
                FROM orders
            `);
            totalOrders  = parseInt(stats.total_orders);
            totalRevenue = parseFloat(stats.total_revenue);
        } catch { /* orders table may not exist yet */ }

        res.json({
            totalProducts: parseInt(total_products),
            totalImages  : parseInt(total_images),
            totalOrders,
            totalRevenue,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/admin/categories ─────────────────────────────────────────────────
router.get('/categories', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, name FROM categories ORDER BY id');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/admin/sizes ──────────────────────────────────────────────────────
router.get('/sizes', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, name FROM sizes ORDER BY id');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/admin/products ───────────────────────────────────────────────────
router.get('/products', requireAuth, async (req, res) => {
    try {
        const { category_id } = req.query;
        const params = [];
        let where = '';
        if (category_id) {
            params.push(parseInt(category_id));
            where = 'WHERE p.category_id = $1';
        }

        const { rows } = await pool.query(`
            SELECT
                p.id,
                p.name,
                p.price,
                p.description,
                p.badge,
                p.category_id,
                c.name AS category_name,
                p.created_at,
                (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS thumbnail
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            ${where}
            ORDER BY p.created_at DESC
        `, params);
        res.json(rows);
    } catch (err) {
        console.error('[GET /products] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/admin/products/:id ───────────────────────────────────────────────
router.get('/products/:id', requireAuth, async (req, res) => {
    try {
        const { rows: products } = await pool.query(
            'SELECT * FROM products WHERE id = $1',
            [req.params.id]
        );
        if (!products.length) return res.status(404).json({ error: 'Product not found' });

        const { rows: images } = await pool.query(
            'SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY sort_order, id',
            [req.params.id]
        );

        // Lấy danh sách size_id của sản phẩm
        const { rows: variants } = await pool.query(
            'SELECT size_id FROM product_variants WHERE product_id = $1',
            [req.params.id]
        );

        res.json({
            ...products[0],
            images  : images.map(i => i.image_url),
            size_ids: variants.map(v => v.size_id),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/admin/products ──────────────────────────────────────────────────
router.post('/products', requireAuth, async (req, res) => {
    const { name, price, description, images = [], category_id, badge, size_ids = [] } = req.body;
    if (!name || price === undefined) {
        return res.status(400).json({ error: 'Name and price are required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { rows: [{ id: productId }] } = await client.query(
            'INSERT INTO products (name, description, price, category_id, badge) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [name, description || '', price, category_id || null, badge || null]
        );

        const validImages = images.filter(url => url && url.trim());
        for (let i = 0; i < validImages.length; i++) {
            await client.query(
                'INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3)',
                [productId, validImages[i].trim(), i]
            );
        }

        for (const sizeId of size_ids) {
            await client.query(
                'INSERT INTO product_variants (product_id, size_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [productId, sizeId]
            );
        }

        await client.query('COMMIT');
        res.json({ id: productId, message: 'Product created successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ── PUT /api/admin/products/:id ───────────────────────────────────────────────
router.put('/products/:id', requireAuth, async (req, res) => {
    const { name, price, description, images = [], category_id, badge, size_ids = [] } = req.body;
    if (!name || price === undefined) {
        return res.status(400).json({ error: 'Name and price are required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            'UPDATE products SET name = $1, description = $2, price = $3, category_id = $4, badge = $5 WHERE id = $6',
            [name, description || '', price, category_id || null, badge || null, req.params.id]
        );

        await client.query('DELETE FROM product_images WHERE product_id = $1', [req.params.id]);
        const validImages = images.filter(url => url && url.trim());
        for (let i = 0; i < validImages.length; i++) {
            await client.query(
                'INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3)',
                [req.params.id, validImages[i].trim(), i]
            );
        }

        await client.query('DELETE FROM product_variants WHERE product_id = $1', [req.params.id]);
        for (const sizeId of size_ids) {
            await client.query(
                'INSERT INTO product_variants (product_id, size_id) VALUES ($1, $2)',
                [req.params.id, sizeId]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ── PATCH /api/admin/products/:id/category ───────────────────────────────
// Update only the category_id (assign to page or remove from page)
router.patch('/products/:id/category', requireAuth, async (req, res) => {
    const { category_id } = req.body;       // null = remove from page
    try {
        const { rowCount } = await pool.query(
            'UPDATE products SET category_id = $1 WHERE id = $2',
            [category_id === null || category_id === '' ? null : parseInt(category_id), req.params.id]
        );
        if (rowCount === 0) return res.status(404).json({ error: 'Product not found' });
        res.json({ message: 'Category updated successfully' });
    } catch (err) {
        console.error('[PATCH /products/:id/category] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/admin/products/:id ────────────────────────────────────────────
router.delete('/products/:id', requireAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('[DELETE /products/:id] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/admin/orders ─────────────────────────────────────────────────────
router.get('/orders', requireAuth, async (req, res) => {
    try {
        const { status } = req.query;
        const params = [];
        let where = '';
        if (status) {
            params.push(status);
            where = 'WHERE status = $1';
        }
        const { rows } = await pool.query(`
            SELECT id, app_trans_id, customer_name, customer_email,
                   customer_phone, total_amount, status, created_at
            FROM orders
            ${where}
            ORDER BY created_at DESC
        `, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
