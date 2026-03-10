# 🚀 Hướng Dẫn Tích Hợp Thanh Toán Momo Thực Tế

## ✅ Bước 1: Đăng Ký Tài Khoản Momo Merchant

1. Truy cập: **https://business.momo.vn/**
2. Đăng ký tài khoản merchant (nếu chưa có)
3. Đăng nhập vào dashboard
4. Vào menu: **Cài đặt** → **Thông tin API**
5. Lấy các thông tin sau:
   - **Partner Code** (Mã đối tác)
   - **Access Key** (Khóa truy cập)
   - **Secret Key** (Khóa bí mật)

---

## 📝 Bước 2: Cập Nhật Thông Tin Momo Trong Backend

1. Mở file: `server/momo-payment.js`

2. Tìm phần `MOMO_CONFIG` và cập nhật:

```javascript
const MOMO_CONFIG = {
    PARTNER_CODE: 'MOMO_YOUR_PARTNER_CODE',  // ← Thay bằng Partner Code của bạn
    ACCESS_KEY: 'MOMO_YOUR_ACCESS_KEY',      // ← Thay bằng Access Key
    SECRET_KEY: 'MOMO_YOUR_SECRET_KEY',      // ← Thay bằng Secret Key
    ENDPOINT: 'https://test.momo.vn/v1/direct_payment/qr_code',
};
```

**Ví dụ:**
```javascript
PARTNER_CODE: 'MOMOXXXXXXXXXX',
ACCESS_KEY: 'aXxxxxxxxxxxx',
SECRET_KEY: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
```

---

## 💻 Bước 3: Cài Đặt Dependencies

Chạy lệnh trong terminal tại thư mục project:

```bash
npm install
```

Lệnh này sẽ cài đặt:
- express (framework web)
- cors (cho phép các domain khác truy cập)
- axios (gửi HTTP request)
- dotenv (quản lý biến môi trường)

---

## 🎯 Bước 4: Chạy Backend Server

Chạy lệnh:

```bash
npm start
```

hoặc để tự động reload khi có thay đổi:

```bash
npm run dev
```

**Output mong đợi:**
```
🚀 Server chạy tại http://localhost:3000
📌 Hãy cập nhật MOMO_CONFIG với thông tin merchant của bạn!
```

---

## 🧪 Bước 5: Test Thanh Toán

### Cách 1: Test Trên Localhost

1. Truy cập: `http://localhost:3000/checkout.html`
2. Chọn sản phẩm → Bấm "THANH TOÁN"
3. Điền thông tin giao hàng
4. Chọn "Momo" → Bấm "HOÀN TẤT ĐƠN HÀNG"
5. Bạn sẽ được chuyển đến trang thanh toán Momo

### Cách 2: Test Ngõng Money (Demo Momo)

Momo cung cấp môi trường test:

```
Endpoint Test: https://test.momo.vn
```

Số điện thoại test Momo:
- **0912345678** (số test có sẵn)

---

## 🔐 Bước 6: Cấu Hình HTTPS Cho Production

Khi deploy thực tế, bạn cần HTTPS:

1. **Lấy SSL Certificate** từ:
   - Let's Encrypt (miễn phí)
   - Cloudflare (miễn phí)
   - AWS Certificate Manager

2. Cập nhật endpoint từ test sang production:

```javascript
// Thay
ENDPOINT: 'https://test.momo.vn/v1/direct_payment/qr_code'

// Thành
ENDPOINT: 'https://payment.momo.vn/v2/gateway/api/create'
```

---

## 📲 Bước 7: Setup Webhook (Quan Trọng!)

Webhook cho phép Momo gửi thông báo thanh toán về server của bạn.

### Cấu Hình Webhook:

1. Vào Momo Dashboard
2. Menu: **Cài đặt** → **Webhook**
3. Nhập URL Webhook của server bạn:

```
http://your-domain.com/api/momo-webhook
```

4. Chọn các sự kiện cần theo dõi:
   - ✅ **Giao dịch thành công**
   - ✅ **Giao dịch không thành công**

### Xử lý Webhook:

Khi người dùng thanh toán, Momo sẽ gửi thông tin:

```javascript
// Nhận từ Momo
{
    resultCode: 0,           // 0 = thành công
    orderId: 'ORDER-xxx',
    amount: 100000,
    transId: 'MOMO_TRANS_ID'
}

// Backend cập nhật database
if (resultCode === 0) {
    updateOrderStatus(orderId, 'completed');
}
```

---

## 🛠️ Bước 8: Xử Lý Return URL

Khi thanh toán xong, Momo sẽ redirect về URL bạn chỉ định.

Cập nhật `checkout.html` để xử lý:

```javascript
// Khi trang được load lại
window.addEventListener('load', function() {
    // Kiểm tra URL có tham số returncode không
    const urlParams = new URLSearchParams(window.location.search);
    const resultCode = urlParams.get('resultCode');

    if (resultCode === '0') {
        // Thanh toán thành công
        const pendingOrder = JSON.parse(localStorage.getItem('pendingOrder'));
        saveOrder(pendingOrder);
        alert('✅ Thanh toán thành công!');
    } else if (resultCode) {
        // Thanh toán thất bại
        alert('❌ Thanh toán thất bại: ' + resultCode);
    }
});
```

---

## 🔧 Khắc Phục Sự Cố

### Lỗi: "Kết nối server thất bại"
- Kiểm tra server đang chạy: `npm start`
- Kiểm tra URL: `http://localhost:3000`

### Lỗi: "Partner Code không hợp lệ"
- Kiểm tra thông tin MOMO_CONFIG
- Đảm bảo bạn copy đúng không có dấu cách

### Lỗi: "Signature không hợp lệ"
- Kiểm tra SECRET_KEY
- Đảm bảo thuật toán SHA256 đúng

---

## 📚 Tham Khảo Thêm

- **Tài liệu Momo API:** https://developers.momo.vn/
- **Github Examples:** https://github.com/momoapi/
- **Forum Support:** https://business.momo.vn/support

---

## ⚠️ Lưu Ý Bảo Mật

1. **KHÔNG BỎNG PUBLIC SECRET KEY trên frontend**
2. Luôn xác thực signature từ Momo
3. Sử dụng HTTPS trong production
4. Lưu các thông tin nhạy cảm trong file `.env`:

```
MOMO_PARTNER_CODE=xxx
MOMO_ACCESS_KEY=xxx
MOMO_SECRET_KEY=xxx
```

5. Thêm vào `.gitignore`:
```
.env
node_modules
```

---

## ✅ Checklist Hoàn Tất

- [ ] Đăng ký tài khoản Momo merchant
- [ ] Lấy Partner Code, Access Key, Secret Key
- [ ] Cập nhật thông tin vào `server/momo-payment.js`
- [ ] Cài đặt dependencies: `npm install`
- [ ] Chạy server: `npm start`
- [ ] Test thanh toán trên localhost
- [ ] Cấu hình webhook
- [ ] Deploy lên production
- [ ] Chuyển sang endpoint production

---

Nếu có vấn đề gì, hãy liên hệ hỗ trợ Momo hoặc kiểm tra console log (F12) để debug!
