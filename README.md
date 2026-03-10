# 🛍️ Aristino - E-Commerce với Thanh Toán Zalo Pay

## 🚀 Quick Start

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình Zalo Pay
1. Copy file `.env.example` thành `.env`
2. Lấy thông tin từ Zalo Pay Merchant:
   - `ZALOPAY_APP_ID`
   - `ZALOPAY_KEY1`
   - `ZALOPAY_KEY2`
3. Cập nhật vào file `.env`

### 3. Chạy server
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

### 4. Truy cập trang checkout
```
http://localhost:3000/checkout.html
```

---

## 📁 Cấu Trúc Dự Án

```
myproject/
├── client/                   # Frontend (HTML/CSS/JS)
│   ├── checkout.html        # Trang thanh toán
│   └── cart-drawer.js       # Giỏ hàng
├── server/                   # Backend (Node.js)
│   ├── app.js              # Server chính
│   └── zalopay-payment.js  # Xử lý thanh toán Zalo Pay
├── package.json             # Dependencies
├── .env                      # Biến môi trường (git ignore)
├── .env.example              # Template .env
├── README.md                 # File này
└── HUONG_DAN_ZALOPAY.md     # Hướng dẫn chi tiết
```

---

## 🔌 API Endpoints

| Method | URL | Mô Tả |
|--------|-----|-------|
| POST | `/api/zalopay/create-payment` | Tạo payment link |
| POST | `/api/zalopay-webhook` | Webhook từ Zalo Pay |
| GET | `/api/health` | Kiểm tra server |

---

## 🎯 Flow Thanh Toán Zalo Pay

```
┌─────────────────────┐
│  Người dùng chọn    │
│  thanh toán Zalo   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Frontend gửi request│
│ tạo payment link    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Backend gọi API     │
│ Zalo Pay để tạo link│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Redirect đến Zalo   │
│ thanh toán          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Người dùng thanh    │
│ toán trên Zalo app  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Zalo Pay gửi webhook│
│ xác nhận thanh toán │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Cập nhật status     │
│ đơn hàng "completed"│
└─────────────────────┘
```

---

## 🧪 Test Thanh Toán

### Trên Localhost (Test Mode)

1. Truy cập: `http://localhost:3000/checkout.html`
2. Thêm sản phẩm vào giỏ
3. Bấm "THANH TOÁN"
4. Điền thông tin giao hàng
5. Chọn "Zalo Pay" → "HOÀN TẤT ĐƠN HÀNG"
6. Bạn sẽ được chuyển đến Zalo Pay sandbox

### Tài Khoản Test Zalo Pay

- Điện thoại: `0987654321`
- Mật khẩu: `123456`
- PIN: `123456`

---

## ⚠️ Lưu Ý Bảo Mật

- ✅ Luôn dùng HTTPS trong production
- ✅ Không commit file `.env`
- ✅ Xác thực MAC signature từ Zalo Pay
- ✅ Kiểm tra webhook từ Zalo Pay hợp lệ
- ✅ Lưu Key1/Key2 an toàn

---

## 🆘 Troubleshooting

| Lỗi | Giải Pháp |
|-----|----------|
| "Kết nối server thất bại" | Chạy `npm start` |
| "App ID không hợp lệ" | Kiểm tra file `.env` |
| "MAC không hợp lệ" | Kiểm tra `ZALOPAY_KEY1` và `ZALOPAY_KEY2` |
| Webhook không nhận | Cấu hình URL webhook trong Zalo Pay |

---

## 📚 Tài Liệu

- [Zalo Pay Docs](https://docs.zalopay.vn/)
- [Hướng Dẫn Chi Tiết](./HUONG_DAN_ZALOPAY.md)

---

## 📞 Hỗ Trợ

Nếu có vấn đề:
1. Kiểm tra console log (F12)
2. Xem file `HUONG_DAN_ZALOPAY.md`
3. Liên hệ Zalo Pay support

---

**Happy Selling! 🎉**

