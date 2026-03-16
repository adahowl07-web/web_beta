const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

// Thông tin Momo từ .env file
const MOMO_CONFIG = {
    PARTNER_CODE: process.env.MOMO_PARTNER_CODE || 'MOMO_YOUR_PARTNER_CODE',
    ACCESS_KEY: process.env.MOMO_ACCESS_KEY || 'MOMO_YOUR_ACCESS_KEY',
    SECRET_KEY: process.env.MOMO_SECRET_KEY || 'MOMO_YOUR_SECRET_KEY',
    ENDPOINT: process.env.NODE_ENV === 'production'
        ? (process.env.MOMO_ENDPOINT_PROD || 'https://payment.momo.vn/v2/gateway/api/create')
        : (process.env.MOMO_ENDPOINT_TEST || 'https://test-payment.momo.vn/v2/gateway/api/create'),
};

// ⚠️ Cảnh báo nếu chưa cấu hình
if (MOMO_CONFIG.PARTNER_CODE.includes('YOUR_')) {
    console.warn('⚠️  CẢNH CÁO: Hãy cập nhật file .env với thông tin Momo của bạn!');
}

function sign(raw, secretKey) {
    return crypto.createHmac('sha256', secretKey).update(raw).digest('hex');
}

// API tạo payment link
async function createMomoPayment(req, res) {
    try {
        const { amount, orderId, orderInfo, returnUrl, notifyUrl } = req.body;
        const normalizedAmount = parseInt(amount, 10);

        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'So tien khong hop le'
            });
        }

        // Tạo requestId duy nhất
        const requestId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const finalOrderId = orderId || `ORDER-${Date.now()}`;
        const redirectUrl = returnUrl || 'http://localhost:8081/checkout.html';
        const ipnUrl = notifyUrl || 'http://localhost:8081/api/momo-webhook';
        const requestType = 'captureWallet';
        const extraData = '';

        // Dữ liệu gửi đến Momo
        const paymentData = {
            partnerCode: MOMO_CONFIG.PARTNER_CODE,
            accessKey: MOMO_CONFIG.ACCESS_KEY,
            requestId: requestId,
            amount: `${normalizedAmount}`,
            orderId: finalOrderId,
            orderInfo: orderInfo || 'Thanh toan don hang',
            redirectUrl,
            ipnUrl,
            requestType,
            extraData,
            lang: 'vi'
        };

        const rawSignature =
            `accessKey=${paymentData.accessKey}` +
            `&amount=${paymentData.amount}` +
            `&extraData=${paymentData.extraData}` +
            `&ipnUrl=${paymentData.ipnUrl}` +
            `&orderId=${paymentData.orderId}` +
            `&orderInfo=${paymentData.orderInfo}` +
            `&partnerCode=${paymentData.partnerCode}` +
            `&redirectUrl=${paymentData.redirectUrl}` +
            `&requestId=${paymentData.requestId}` +
            `&requestType=${paymentData.requestType}`;

        // Tạo signature theo format MoMo v2
        const signature = sign(rawSignature, MOMO_CONFIG.SECRET_KEY);
        paymentData.signature = signature;

        console.log('Gửi request đến Momo:', paymentData);

        // Gửi request đến Momo
        const response = await axios.post(MOMO_CONFIG.ENDPOINT, paymentData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Response từ Momo:', response.data);

        if (response.data.resultCode !== 0) {
            return res.status(400).json({
                success: false,
                error: response.data.message || 'MoMo tra ve loi',
                data: response.data
            });
        }

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
        const data = { ...req.body };
        console.log('Webhook từ Momo:', data);

        // TODO: verify chữ ký IPN theo đúng tài liệu callback payload của MoMo khi đưa production.
        // Giai đoạn test vẫn phản hồi thành công để tránh timeout webhook.

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
