const express = require('express');
const cors = require('cors');
const { createZaloPayPayment, handleZaloPayWebhook } = require('./zalopay-payment');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('client')); // Phục vụ file HTML/CSS/JS

// Routes
app.post('/api/zalopay/create-payment', createZaloPayPayment);
app.post('/api/zalopay-webhook', handleZaloPayWebhook);

// Test route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
    console.log(`📌 Hãy cập nhật file .env với thông tin Zalo Pay của bạn!`);
});

