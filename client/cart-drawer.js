// ===== CART DRAWER FUNCTIONS =====
function openCartDrawer() {
    updateCartDrawer();
    document.getElementById('cartDrawer').classList.add('active');
    document.getElementById('cartDrawerOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
    document.getElementById('cartDrawer').classList.remove('active');
    document.getElementById('cartDrawerOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function updateCartDrawer() {
    const cart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
    const body = document.getElementById('cartDrawerBody');
    const footer = document.getElementById('cartDrawerFooter');

    if (cart.length === 0) {
        body.innerHTML = `
            <div class="cart-drawer-empty">
                <div class="cart-drawer-empty-icon">🛒</div>
                <div class="cart-drawer-empty-text">Giỏ hàng trống</div>
            </div>
        `;
        footer.innerHTML = '';
        return;
    }

    let html = '';
    let totalPrice = 0;

    cart.forEach((item, index) => {
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        totalPrice += itemTotal;

        html += `
            <div class="cart-drawer-item">
                <div class="cart-drawer-item-image" style="background-image: url('${item.image}')"></div>
                <div class="cart-drawer-item-info">
                    <div class="cart-drawer-item-brand">${item.brand || 'ARISTINO'}</div>
                    <div class="cart-drawer-item-name">${item.name}</div>
                    ${item.size ? `<div class="cart-drawer-item-variant" style="cursor: pointer; text-decoration: underline;" onclick="editCartItemSize(${index})">Size: ${item.size}</div>` : ''}
                    <div class="cart-drawer-item-price">${itemTotal.toLocaleString('vi-VN')}₫</div>
                    <div class="cart-drawer-item-controls">
                        <div class="cart-qty-control">
                            <button class="cart-qty-btn" onclick="updateDrawerQuantity(${index}, -1)">−</button>
                            <input type="number" class="cart-qty-input" value="${item.quantity || 1}" readonly>
                            <button class="cart-qty-btn" onclick="updateDrawerQuantity(${index}, 1)">+</button>
                        </div>
                        <button class="cart-drawer-item-remove" onclick="removeDrawerItem(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    body.innerHTML = html;

    const shippingFee = 30000;
    const finalTotal = totalPrice + shippingFee;

    footer.innerHTML = `
        <div class="cart-drawer-summary">
            <div class="cart-drawer-summary-row">
                <span class="cart-drawer-summary-label">Tạm tính:</span>
                <span class="cart-drawer-summary-value">${totalPrice.toLocaleString('vi-VN')}₫</span>
            </div>
            <div class="cart-drawer-summary-row">
                <span class="cart-drawer-summary-label">Phí vận chuyển:</span>
                <span class="cart-drawer-summary-value">${shippingFee.toLocaleString('vi-VN')}₫</span>
            </div>
            <div class="cart-drawer-summary-row cart-drawer-summary-total">
                <span class="cart-drawer-summary-label">Tổng cộng:</span>
                <span class="cart-drawer-summary-value">${finalTotal.toLocaleString('vi-VN')}₫</span>
            </div>
        </div>
        <button class="cart-drawer-checkout-btn" onclick="handleDrawerCheckout()">THANH TOÁN</button>
    `;
}

function updateDrawerQuantity(index, change) {
    let cart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
    if (cart[index]) {
        const newQuantity = (cart[index].quantity || 1) + change;
        if (newQuantity > 0) {
            cart[index].quantity = newQuantity;
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDrawer();
            updateCartCount();
        }
    }
}

function removeDrawerItem(index) {
    let cart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDrawer();
    updateCartCount();
}

function handleDrawerCheckout() {
    const cart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
    if (cart.length === 0) {
        alert('Giỏ hàng trống!');
        return;
    }
    window.location.href = 'checkout.html';
}

function updateCartCount() {
    const cart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
}

// Initialize cart drawer overlay click handler
document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeCartDrawer);
    }
});
