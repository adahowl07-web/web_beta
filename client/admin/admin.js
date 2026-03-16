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

// Upload a product image file and return the local relative URL from backend.
async function uploadAdminImageFile(file, folderName) {
    const token = getAdminToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderName', folderName);

    let res;
    try {
        res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
        });
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error('Khong the ket noi API upload. Hay kiem tra backend Spring Boot dang chay va dung cong.');
        }
        throw error;
    }

    if (res.status === 401) {
        adminLogout();
        throw new Error('Unauthorized');
    }

    if (!res.ok) {
        let message = 'Upload failed';
        try {
            const data = await res.json();
            message = data.error || message;
        } catch (_) {
            // Keep fallback message if response is not JSON.
        }
        throw new Error(message);
    }

    return (await res.text()).trim();
}

// ── Product modal: drag-drop uploader + save flow ─────────
function initProductImageDropzone(dropzoneId = 'dropzone', inputId = 'productImageFile', previewId = 'imagePreview', previewGridId = 'imagePreviewGrid') {
    const dropzone = document.getElementById(dropzoneId);
    const fileInput = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const previewGrid = document.getElementById(previewGridId);

    if (!dropzone || !fileInput || !preview) {
        return null;
    }

    let selectedFiles = [];
    let objectUrls = [];

    function cleanupObjectUrls() {
        for (const url of objectUrls) {
            URL.revokeObjectURL(url);
        }
        objectUrls = [];
    }

    function setPrimaryPreview(url) {
        if (!url || selectedFiles.length === 0) {
            preview.src = '';
            preview.style.display = 'none';
            return;
        }
        preview.src = url;
        preview.style.display = 'block';
    }

    function renderPreviewGrid(urls) {
        if (!previewGrid) return;
        previewGrid.innerHTML = '';
        if (!urls || urls.length <= 1) {
            return;
        }

        for (let i = 1; i < urls.length; i++) {
            const img = document.createElement('img');
            img.src = urls[i];
            img.alt = 'Preview ' + (i + 1);
            img.className = 'preview-thumb';
            previewGrid.appendChild(img);
        }
    }

    function setSelected(files) {
        cleanupObjectUrls();
        selectedFiles = Array.isArray(files) ? files : [];
        if (selectedFiles.length > 0) {
            objectUrls = selectedFiles.map(file => URL.createObjectURL(file));
            setPrimaryPreview(objectUrls[0]);
            renderPreviewGrid(objectUrls);
            dropzone.classList.add('has-file');
        } else {
            setPrimaryPreview('');
            renderPreviewGrid([]);
            dropzone.classList.remove('has-file');
        }
    }

    function pickFromInput() {
        const files = fileInput.files && fileInput.files.length ? Array.from(fileInput.files) : [];
        setSelected(files);
    }

    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', pickFromInput);

    dropzone.addEventListener('dragover', e => {
        e.preventDefault();
        dropzone.classList.add('is-dragover');
    });

    dropzone.addEventListener('dragleave', e => {
        e.preventDefault();
        dropzone.classList.remove('is-dragover');
    });

    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.classList.remove('is-dragover');

        const files = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length
            ? Array.from(e.dataTransfer.files)
            : [];
        if (files.length === 0) {
            return;
        }

        setSelected(files);
    });

    return {
        getSelectedFiles: () => selectedFiles.slice(),
        clearSelection: () => {
            setSelected([]);
            fileInput.value = '';
        },
        setPreviewFromUrls: (urls) => {
            cleanupObjectUrls();
            selectedFiles = [];
            fileInput.value = '';
            dropzone.classList.remove('has-file');
            const list = Array.isArray(urls) ? urls.filter(Boolean) : [];
            setPrimaryPreview(list.length > 0 ? list[0] : '');
            renderPreviewGrid(list);
        }
    };
}

async function saveProduct(options) {
    const {
        isEdit,
        editProductId,
        name,
        price,
        categoryId,
        badge,
        description,
        sizeIds,
        existingImageUrls,
        selectedImageFiles,
        categoryFolderName
    } = options;

    const apiPath = isEdit ? `/products/${editProductId}` : '/products';
    const method = isEdit ? 'PUT' : 'POST';

    let images = Array.isArray(existingImageUrls) ? existingImageUrls.slice() : [];
    if (Array.isArray(selectedImageFiles) && selectedImageFiles.length > 0) {
        const uploadedUrls = [];
        for (const file of selectedImageFiles) {
            const uploadedUrl = await uploadAdminImageFile(file, categoryFolderName);
            uploadedUrls.push(uploadedUrl);
        }
        images = uploadedUrls;
    }

    const payload = {
        name: name.trim(),
        price: parseFloat(price),
        category_id: parseInt(categoryId, 10),
        badge: (badge || '').trim() || null,
        description: (description || '').trim(),
        images,
        size_ids: Array.isArray(sizeIds) ? sizeIds : []
    };

    try {
        return await apiFetch(apiPath, {
            method,
            body: JSON.stringify(payload)
        });
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error('Khong the ket noi API. Hay kiem tra backend Spring Boot dang chay va dung cong.');
        }
        throw error;
    }
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
