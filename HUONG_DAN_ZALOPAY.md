# 📱 Hướng Dẫn Tích Hợp Thanh Toán Zalo Pay

## ✅ Bước 1: Đăng Ký Zalo Pay Merchant

1. Truy cập: **https://merchant.zalopay.vn/**
2. Bấm **"Đăng ký"** hoặc **"Sign up"**
3. Điền thông tin:
   - Email
   - Mật khẩu
   - Tên công ty
   - Số điện thoại
   - Địa chỉ

4. Xác minh email
5. Nộp giấy tờ để duyệt

---

## 📝 Bước 2: Lấy Thông Tin API

Sau khi tài khoản được duyệt:

1. Đăng nhập vào: https://merchant.zalopay.vn/
2. Vào menu: **Quản lý ứng dụng** → **Thông tin ứng dụng**
3. Lấy 3 thông tin sau:
   - **App ID** (Mã ứng dụng)
   - **Key1** (Khóa mã hóa)
   - **Key2** (Khóa xác thực)

---

## 📋 Bước 3: Cấu Hình .env

1. Mở file `.env` (nếu chưa có, copy từ `.env.example`)

```bash
ZALOPAY_APP_ID=12345
ZALOPAY_KEY1=your_key1
ZALOPAY_KEY2=your_key2
PORT=3000
NODE_ENV=development
```

Thay `12345`, `your_key1`, `your_key2` bằng thông tin thực tế

---

## 💻 Bước 4: Cài Đặt & Chạy Server

```bash
# Cài dependencies
npm install

# Chạy server
npm start
```

Output:
```
🚀 Server chạy tại http://localhost:3000
📌 Hãy cập nhật file .env với thông tin Zalo Pay của bạn!
```

---

## 🧪 Bước 5: Test Thanh Toán

### Trên Localhost:

1. Vào: `http://localhost:3000/checkout.html`
2. Thêm sản phẩm vào giỏ
3. Bấm **"THANH TOÁN"**
4. Điền thông tin giao hàng
5. Chọn **"Zalo Pay"** → **"HOÀN TẤT ĐƠN HÀNG"**
6. Sẽ redirect đến Zalo Pay sandbox để thanh toán

---

## 📲 Bước 6: Test Trên Zalo Pay Sandbox

Zalo Pay cung cấp môi trường test:

**URL Test:** https://sandbox.zalopay.vn

**Tài khoản test:**
- Số điện thoại: **0987654321**
- Mật khẩu: **123456**
- PIN: **123456**

---

## 🔐 Bước 7: Cấu Hình Webhook

Webhook cho phép Zalo Pay gửi thông báo thanh toán về server:

1. Vào dashboard Zalo Pay
2. Menu: **Cài đặt** → **Webhook**
3. Nhập URL webhook:

**Develop:**
```
http://localhost:3000/api/zalopay-webhook
```

**Production:**
```
https://your-domain.com/api/zalopay-webhook
```

4. Test webhook để chắc chắn kết nối

---

## 🚀 Bước 8: Deploy Production

### Chuyển sang endpoint production:

Mở `server/zalopay-payment.js`, thay:

```javascript
// Từ:
ENDPOINT: 'https://sandbox.zalopay.vn/v001/tpc.listMerchantURLs'

// Thành:
ENDPOINT: 'https://api.zalopay.vn/v001/tpc.listMerchantURLs'
```

Hoặc cấu hình trong `.env`:

```
NODE_ENV=production
ZALOPAY_ENDPOINT_PROD=https://api.zalopay.vn/v001/tpc.listMerchantURLs
```

---

## 📚 Tài Liệu Zalo Pay

- **Trang chủ:** https://zalopay.vn
- **Merchant:** https://merchant.zalopay.vn
- **API Docs:** https://docs.zalopay.vn
- **Hỗ trợ:** support@zalopay.vn

---

## ⚠️ Lưu Ý Bảo Mật

- ✅ KHÔNG public Key1, Key2
- ✅ Luôn dùng HTTPS trong production
- ✅ Xác thực MAC signature từ Zalo Pay
- ✅ Kiểm tra webhook hợp lệ
- ✅ Lưu thông tin nhạy cảm trong `.env`

---

## 🆘 Troubleshooting

| Lỗi | Giải Pháp |
|-----|----------|
| "App ID không hợp lệ" | Kiểm tra file `.env` |
| "MAC không hợp lệ" | Kiểm tra Key1/Key2 |
| "Kết nối server lỗi" | Chạy `npm start` |
| Webhook không nhận | Cấu hình URL webhook trong Zalo Pay |

---

**Khi hoàn tất, bạn có thể thanh toán qua Zalo Pay! 🎉**
