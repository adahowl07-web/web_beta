const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

// Thông tin Zalo Pay từ .env file
const ZALOPAY_CONFIG = {
    APP_ID: process.env.ZALOPAY_APP_ID || '12345',
    KEY1: process.env.ZALOPAY_KEY1 || 'your_key1',
    KEY2: process.env.ZALOPAY_KEY2 || 'your_key2',
    ENDPOINT: process.env.NODE_ENV === 'production'
        ? 'https://api.zalopay.vn/v001/tpc.listMerchantURLs'
        : 'https://sandbox.zalopay.vn/v001/tpc.listMerchantURLs'
};

// ⚠️ Cảnh báo nếu chưa cấu hình
if (ZALOPAY_CONFIG.APP_ID === '12345') {
    console.warn('⚠️  CẢNH CÁO: Hãy cập nhật file .env với thông tin Zalo Pay của bạn!');
}

// Hàm tạo HMAC
function generateHmac(data, key) {
    return crypto
        .createHmac('sha256', key)
        .update(data)
        .digest('hex');
}

// API tạo payment link
async function createZaloPayPayment(req, res) {
    try {
        const { amount, orderId, orderInfo, returnUrl, notifyUrl } = req.body;

        // Tạo timestamp
        const timestamp = Date.now();

        // Tạo dữ liệu request
        const data = {
            app_id: parseInt(ZALOPAY_CONFIG.APP_ID),
            app_trans_id: `${timestamp}`,
            app_user: 'user_' + timestamp,
            app_time: timestamp,
            amount: parseInt(amount) * 100, // Zalo Pay tính bằng xu (cent)
            app_data: '',
            embed_data: JSON.stringify({
                order_id: orderId,
                order_info: orderInfo,
                return_url: returnUrl
            }),
            item: '[]',
            description: orderInfo,
            mac: ''
        };

        // Tạo MAC signature
        const macData = `${data.app_id}|${data.app_trans_id}|${data.app_user}|${data.amount}|${data.app_time}|${data.embed_data}|${data.item}`;
        data.mac = generateHmac(macData, ZALOPAY_CONFIG.KEY1);

        console.log('Gửi request đến Zalo Pay:', {
            app_id: data.app_id,
            app_trans_id: data.app_trans_id,
            amount: data.amount / 100
        });

        // Gọi Zalo Pay API
        const response = await axios.post(
            'https://sandbox.zalopay.vn/v001/tpc.listMerchantURLs',
            data,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        console.log('Response từ Zalo Pay:', response.data);

        if (response.data.return_code === 1) {
            res.json({
                success: true,
                data: response.data,
                order_url: response.data.order_url,
                app_trans_id: data.app_trans_id
            });
        } else {
            res.json({
                success: false,
                error: response.data.return_message
            });
        }

    } catch (error) {
        console.error('Lỗi tạo payment:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// Webhook nhận thông báo từ Zalo Pay
function handleZaloPayWebhook(req, res) {
    try {
        const data = req.body;
        console.log('Webhook từ Zalo Pay:', data);

        // Kiểm tra MAC signature
        const macData = `${data.app_id}|${data.app_trans_id}|${data.mc_id}|${data.amount}|${data.app_time}|${data.ref}`;
        const expectedMac = generateHmac(macData, ZALOPAY_CONFIG.KEY2);

        if (data.mac !== expectedMac) {
            console.error('MAC không hợp lệ!');
            return res.json({ return_code: -1, message: 'MAC invalid' });
        }

        // Xử lý theo kết quả
        if (data.return_code === 1) {
            console.log('✅ Thanh toán Zalo Pay thành công:', data.app_trans_id);
            // updateOrderStatus(data.app_trans_id, 'completed');
        } else {
            console.log('❌ Thanh toán Zalo Pay thất bại:', data.return_code);
            // updateOrderStatus(data.app_trans_id, 'failed');
        }

        res.json({ return_code: 1, message: 'success' });

    } catch (error) {
        console.error('Lỗi xử lý webhook:', error.message);
        res.status(500).json({ return_code: -1, message: error.message });
    }
}

module.exports = {
    createZaloPayPayment,
    handleZaloPayWebhook
};
