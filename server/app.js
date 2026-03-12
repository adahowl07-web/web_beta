const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const { createZaloPayPayment, handleZaloPayWebhook } = require('./zalopay-payment');
const adminRoutes = require('./admin');

const app  = express();
const PORT = process.env.PORT || 8081;

// ── PostgreSQL connection pool ────────────────────────────────
const pool = new Pool({
    host    : process.env.PG_HOST     || 'localhost',
    port    : process.env.PG_PORT     || 5432,
    user    : process.env.PG_USER     || 'postgres',
    password: process.env.PG_PASSWORD || '',
    database: process.env.PG_DATABASE || 'thehill_db',
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + '/../client')); // Phục vụ file HTML/CSS/JS
app.use(express.static(__dirname + '/../client/admin')); // Cho phép truy cập /admin/...

// Routes
app.post('/api/zalopay/create-payment', createZaloPayPayment);
app.post('/api/zalopay-webhook', handleZaloPayWebhook);

// Admin routes
app.use('/api/admin', adminRoutes);

// ── GET /api/products?category_id=1 ──────────────────────────
// Lấy tất cả sản phẩm theo danh mục, kèm mảng ảnh (sorted by sort_order) và mảng size
app.get('/api/products', async (req, res) => {
    const { category_id } = req.query;

    try {
        // Step 1: Fetch products
        let productQuery = `
            SELECT p.id, p.name, p.price, p.description, p.badge,
                   p.category_id, c.name AS category_name, p.created_at
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
        `;
        const params = [];
        if (category_id) {
            params.push(parseInt(category_id));
            productQuery += ' WHERE p.category_id = $1';
        }
        productQuery += ' ORDER BY p.created_at DESC';
        const { rows: products } = await pool.query(productQuery, params);

        if (products.length === 0) return res.json([]);

        // Step 2: Fetch images for all products (ordered by sort_order → index 0 = thumbnail)
        const ids = products.map(p => p.id);
        const { rows: allImages } = await pool.query(
            `SELECT product_id, image_url FROM product_images
             WHERE product_id = ANY($1) ORDER BY sort_order, id`, [ids]
        );
        const imageMap = {};
        for (const img of allImages) {
            if (!imageMap[img.product_id]) imageMap[img.product_id] = [];
            imageMap[img.product_id].push(img.image_url);
        }

        // Step 3: Fetch sizes for all products
        const { rows: allSizes } = await pool.query(
            `SELECT pv.product_id, s.name FROM product_variants pv
             JOIN sizes s ON s.id = pv.size_id
             WHERE pv.product_id = ANY($1) ORDER BY s.name`, [ids]
        );
        const sizeMap = {};
        for (const sz of allSizes) {
            if (!sizeMap[sz.product_id]) sizeMap[sz.product_id] = [];
            sizeMap[sz.product_id].push(sz.name);
        }

        // Step 4: Combine
        const result = products.map(p => ({
            ...p,
            price: parseFloat(p.price),
            images: imageMap[p.id] || [],
            sizes: sizeMap[p.id] || [],
        }));

        res.json(result);
    } catch (err) {
        console.error('[GET /api/products]', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/categories ───────────────────────────────────────
app.get('/api/categories', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, name FROM categories ORDER BY id');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Test route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
    console.log(`📌 Hãy cập nhật file .env với thông tin Zalo Pay của bạn!`);
    console.log(`🔐 Admin panel: http://localhost:${PORT}/admin/login.html`);
});
