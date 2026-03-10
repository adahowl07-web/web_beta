const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

// Thông tin Momo từ .env file
const MOMO_CONFIG = {
    PARTNER_CODE: process.env.MOMO_PARTNER_CODE || 'MOMO_YOUR_PARTNER_CODE',
    ACCESS_KEY: process.env.MOMO_ACCESS_KEY || 'MOMO_YOUR_ACCESS_KEY',
    SECRET_KEY: process.env.MOMO_SECRET_KEY || 'MOMO_YOUR_SECRET_KEY',
    ENDPOINT: process.env.NODE_ENV === 'production'
        ? process.env.MOMO_ENDPOINT_PROD
        : process.env.MOMO_ENDPOINT_TEST,
};

// ⚠️ Cảnh báo nếu chưa cấu hình
if (MOMO_CONFIG.PARTNER_CODE.includes('YOUR_')) {
    console.warn('⚠️  CẢNH CÁO: Hãy cập nhật file .env với thông tin Momo của bạn!');
}

// Hàm tạo signature
function generateSignature(data, secretKey) {
    const message = Object.keys(data)
        .sort()
        .map(key => `${key}=${data[key]}`)
        .join('&');

    return crypto
        .createHmac('sha256', secretKey)
        .update(message)
        .digest('hex');
}

// API tạo payment link
async function createMomoPayment(req, res) {
    try {
        const { amount, orderId, orderInfo, returnUrl, notifyUrl } = req.body;

        // Tạo requestId duy nhất
        const requestId = `${Date.now()}`;

        // Dữ liệu gửi đến Momo
        const paymentData = {
            partnerCode: MOMO_CONFIG.PARTNER_CODE,
            partnerName: 'Aristino Store',
            storeId: '12345',
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo || 'Thanh toán đơn hàng',
            redirectUrl: returnUrl || 'http://localhost:3000/checkout.html',
            ipnUrl: notifyUrl || 'http://localhost:3000/api/momo-webhook',
            requestType: 'QR_CODE',
            extraData: '',
            lang: 'vi'
        };

        // Tạo signature
        const signature = generateSignature(paymentData, MOMO_CONFIG.SECRET_KEY);
        paymentData.signature = signature;

        console.log('Gửi request đến Momo:', paymentData);

        // Gửi request đến Momo
        const response = await axios.post(MOMO_CONFIG.ENDPOINT, paymentData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Response từ Momo:', response.data);

        res.json({
            success: true,
            data: response.data,
            qrCodeUrl: response.data.qrCodeUrl,
            payUrl: response.data.payUrl
        });

    } catch (error) {
        console.error('Lỗi tạo payment:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// Webhook nhận thông báo từ Momo
function handleMomoWebhook(req, res) {
    try {
        const data = req.body;
        console.log('Webhook từ Momo:', data);

        // Kiểm tra signature
        const signature = data.signature;
        delete data.signature;

        const expectedSignature = generateSignature(data, MOMO_CONFIG.SECRET_KEY);

        if (signature !== expectedSignature) {
            console.error('Signature không hợp lệ!');
            return res.json({ status: 1, message: 'Signature invalid' });
        }

        // Xử lý theo trạng thái thanh toán
        if (data.resultCode === 0) {
            console.log('✅ Thanh toán thành công:', data.orderId);
            // Cập nhật status đơn hàng trong database
            // updateOrderStatus(data.orderId, 'completed');
        } else {
            console.log('❌ Thanh toán thất bại:', data.resultCode);
            // updateOrderStatus(data.orderId, 'failed');
        }

        res.json({ status: 0, message: 'success' });

    } catch (error) {
        console.error('Lỗi xử lý webhook:', error.message);
        res.status(500).json({ status: 1, message: error.message });
    }
}

module.exports = {
    createMomoPayment,
    handleMomoWebhook
};
