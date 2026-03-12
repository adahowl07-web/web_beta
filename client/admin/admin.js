/* ============================================================
   THE HILL - Admin Dashboard Shared JS
   ============================================================ */

const ADMIN_TOKEN_KEY = 'adminToken';
const API_BASE        = '/api/admin';

// ── Auth helpers ──────────────────────────────────────────
function getAdminToken() {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function requireAdminLogin() {
    if (!getAdminToken()) {
        window.location.href = '/admin/login.html';
    }
}

function adminLogout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    window.location.href = '/admin/login.html';
}

// ── API helper ─────────────────────────────────────────────
async function apiFetch(path, options = {}) {
    const token = getAdminToken();
    const defaultHeaders = { 'Content-Type': 'application/json' };
    if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;

    const res = await fetch(API_BASE + path, {
        ...options,
        headers: { ...defaultHeaders, ...(options.headers || {}) },
    });

    if (res.status === 401) {
        adminLogout();
        return null;
    }
    return res;
}

// ── Sidebar active link ─────────────────────────────────────
function setActiveSidebarItem() {
    const page = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href && href.split('/').pop() === page) {
            item.classList.add('active');
        }
    });
}

// ── Format price (VND) ─────────────────────────────────────
function formatPrice(value) {
    return Number(value).toLocaleString('vi-VN') + '₫';
}

// ── Show / hide loading overlay ────────────────────────────
function showLoading()  { const el = document.getElementById('loading');  if (el) el.classList.add('show');    }
function hideLoading()  { const el = document.getElementById('loading');  if (el) el.classList.remove('show'); }

// ── Show inline alert ──────────────────────────────────────
function showAlert(message, type = 'success', id = 'alert') {
    const el = document.getElementById(id);
    if (!el) return;
    el.className    = `alert alert-${type} show`;
    el.innerHTML    = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => el.classList.remove('show'), 5000);
}

// ── Image preview logic for a single input ─────────────────
function attachImagePreview(input, previewBox) {
    let debounceTimer;
    input.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const url = this.value.trim();
            if (url) {
                previewBox.innerHTML = `<img src="${url}" alt="preview"
                    onerror="this.parentElement.innerHTML='<i class=\\'fas fa-image\\'></i>';this.parentElement.classList.remove('has-image')"
                    onload="this.parentElement.classList.add('has-image')">`;
            } else {
                previewBox.innerHTML = '<i class="fas fa-image"></i>';
                previewBox.classList.remove('has-image');
            }
        }, 400);
    });
}

// ── Image fields dynamic builder ───────────────────────────
function buildImageField(url = '') {
    const row = document.createElement('div');
    row.className = 'image-field-row';
    row.innerHTML = `
        <div class="image-field-input">
            <input type="url" class="image-url-input" placeholder="Paste image URL here..." value="${url}">
        </div>
        <div class="image-preview-box ${url ? 'has-image' : ''}">
            ${url
                ? `<img src="${url}" alt="preview" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-image\\'></i>';this.parentElement.classList.remove('has-image')">`
                : '<i class="fas fa-image"></i>'}
        </div>
        <button type="button" class="btn-remove-image" title="Remove"><i class="fas fa-times"></i></button>
    `;

    const input      = row.querySelector('.image-url-input');
    const previewBox = row.querySelector('.image-preview-box');
    const removeBtn  = row.querySelector('.btn-remove-image');

    attachImagePreview(input, previewBox);
    removeBtn.addEventListener('click', () => row.remove());

    return row;
}

function initImageFields(container, addBtn, initialUrls = []) {
    // Render initial fields
    if (initialUrls.length === 0) {
        container.appendChild(buildImageField());
    } else {
        initialUrls.forEach(url => container.appendChild(buildImageField(url)));
    }

    // Add field button
    addBtn.addEventListener('click', () => container.appendChild(buildImageField()));
}

function collectImageUrls(container) {
    return Array.from(container.querySelectorAll('.image-url-input'))
        .map(i => i.value.trim())
        .filter(Boolean);
}

// ── DOMContentLoaded setup ─────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    setActiveSidebarItem();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', adminLogout);
});
