-- ============================================================
-- THE HILL Admin – PostgreSQL Schema
-- Mở pgAdmin4 → chọn database → Query Tool → paste → F5
-- ============================================================

-- ── Danh mục sản phẩm ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Seed danh mục mặc định
INSERT INTO categories (id, name) VALUES
    (1, 'Clothing'),
    (2, 'Accessories'),
    (3, 'Leather Goods'),
    (4, 'Brand')
ON CONFLICT (name) DO NOTHING;

-- ── Bảng sản phẩm ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(500)   NOT NULL,
    description TEXT,
    price       NUMERIC(15, 2) NOT NULL DEFAULT 0,
    category_id INT            REFERENCES categories (id) ON DELETE SET NULL,
    badge       VARCHAR(50),
    created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- Thêm cột category_id nếu bảng products đã tồn tại trước đó
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INT REFERENCES categories (id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge VARCHAR(50);

-- ── Ảnh sản phẩm ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
    id          SERIAL PRIMARY KEY,
    product_id  INT  NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    image_url   TEXT NOT NULL,
    sort_order  INT  NOT NULL DEFAULT 0
);

ALTER TABLE product_images ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- ── Kích thước ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sizes (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

INSERT INTO sizes (name) VALUES
    ('38'), ('39'), ('40'), ('41'), ('42'), ('43'),
    ('XS'), ('S'), ('M'), ('L'), ('XL'), ('2XL'), ('3XL')
ON CONFLICT (name) DO NOTHING;

-- ── Biến thể sản phẩm (product ↔ size) ───────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
    id         SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    size_id    INT NOT NULL REFERENCES sizes (id)    ON DELETE CASCADE,
    stock      INT NOT NULL DEFAULT 0,
    UNIQUE (product_id, size_id)
);

-- ── Đơn hàng ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id             SERIAL PRIMARY KEY,
    app_trans_id   VARCHAR(100),
    customer_name  VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(30),
    total_amount   NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status         VARCHAR(50)    NOT NULL DEFAULT 'pending',
    created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- Index để tìm kiếm nhanh theo trạng thái và mã giao dịch
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_app_trans_id ON orders (app_trans_id);
