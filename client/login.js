document.addEventListener('DOMContentLoaded', function() {
    // ========================
    // CONSTANTS
    // ========================
    const API_BASE = 'http://localhost:8083';
    const LOGIN_API_URL = `${API_BASE}/api/auth/login`;
    const AUTH_TOKEN_KEY = 'authToken';

    // ========================
    // TAB SWITCHING
    // ========================
    const tabs = document.querySelectorAll('.form-tab');
    const formContents = document.querySelectorAll('.form-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and forms
            tabs.forEach(t => t.classList.remove('active'));
            formContents.forEach(f => f.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding form
            this.classList.add('active');
            document.querySelector(`.form-content[data-form="${tabName}"]`).classList.add('active');
        });
    });

    // ========================
    // DOM ELEMENTS
    // ========================
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitButton = document.getElementById('submitButton');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // ========================
    // FORM VALIDATION
    // ========================
    
    /**
     * Validate and enable/disable submit button
     */
    function validateLoginForm() {
        const isEmailFilled = emailInput.value.trim() !== '';
        const isPasswordFilled = passwordInput.value.trim() !== '';
        submitButton.disabled = !(isEmailFilled && isPasswordFilled);
    }

    emailInput.addEventListener('input', validateLoginForm);
    passwordInput.addEventListener('input', validateLoginForm);

    // Initialize validation state
    validateLoginForm();

    // ========================
    // SIGNUP FORM VALIDATION
    // ========================
    const signupForm = document.getElementById('signupForm');
    const signupNameInput = document.getElementById('signup-name');
    const signupEmailInput = document.getElementById('signup-email');
    const signupPasswordInput = document.getElementById('signup-password');
    const signupConfirmInput = document.getElementById('signup-confirm');
    const signupButton = document.getElementById('signupButton');

    function validateSignupForm() {
        const isNameFilled = signupNameInput.value.trim() !== '';
        const isEmailFilled = signupEmailInput.value.trim() !== '';
        const isPasswordFilled = signupPasswordInput.value.trim() !== '';
        const isConfirmFilled = signupConfirmInput.value.trim() !== '';
        signupButton.disabled = !(isNameFilled && isEmailFilled && isPasswordFilled && isConfirmFilled);
    }

    signupNameInput.addEventListener('input', validateSignupForm);
    signupEmailInput.addEventListener('input', validateSignupForm);
    signupPasswordInput.addEventListener('input', validateSignupForm);
    signupConfirmInput.addEventListener('input', validateSignupForm);

    // Initialize signup validation
    validateSignupForm();

    // Keyboard events for signup fields
    signupConfirmInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !signupButton.disabled) {
            signupForm.dispatchEvent(new Event('submit'));
        }
    });

    // Keyboard events for form fields
    emailInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !submitButton.disabled) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });

    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !submitButton.disabled) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });

    // ========================
    // UTILITY FUNCTIONS
    // ========================
    
    /**
     * Display message (success or error)
     */
    function displayMessage(element, text, isError = false) {
        const otherMessage = isError ? successMessage : errorMessage;
        
        element.textContent = text;
        element.style.display = text ? 'block' : 'none';
        otherMessage.style.display = 'none';
    }

    /**
     * Focus on first invalid input
     */
    function focusFirstInvalidInput(inputs) {
        for (let input of inputs) {
            if (!input.value.trim()) {
                input.focus();
                return;
            }
        }
    }

    /**
     * Reset login button to original state
     */
    function resetSubmitButton() {
        submitButton.disabled = false;
        submitButton.textContent = 'Đăng nhập';
    }

    // ========================
    // LOGIN FORM SUBMISSION
    // ========================
    
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Validate inputs
        if (!email || !password) {
            displayMessage(errorMessage, 'Vui lòng điền đầy đủ thông tin', true);
            focusFirstInvalidInput([emailInput, passwordInput]);
            return;
        }

        // Disable button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Đang xử lý...';
        
        displayMessage(successMessage, 'Đang đăng nhập...', false);
        displayMessage(errorMessage, '', true);

        try {
            const response = await fetch(LOGIN_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok && data.token) {
                // Success
                displayMessage(successMessage, 'Đăng nhập thành công! Đang chuyển hướng...', false);
                localStorage.setItem(AUTH_TOKEN_KEY, data.token);

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else if (response.status === 401) {
                // Unauthorized
                displayMessage(errorMessage, data.message || 'Email hoặc mật khẩu không chính xác', true);
                resetSubmitButton();
                passwordInput.focus();
            } else {
                // Server error
                displayMessage(errorMessage, data.message || 'Đăng nhập không thành công. Vui lòng thử lại.', true);
                resetSubmitButton();
            }
        } catch (error) {
            console.error('Network Error:', error);
            displayMessage(
                errorMessage, 
                'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối.',
                true
            );
            resetSubmitButton();
            emailInput.focus();
        }
    });

    // ========================
    // SIGNUP FORM SUBMISSION
    // ========================
    
    signupForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const name = signupNameInput.value.trim();
        const email = signupEmailInput.value.trim();
        const password = signupPasswordInput.value.trim();
        const confirmPassword = signupConfirmInput.value.trim();

        // Validate inputs
        if (!name || !email || !password || !confirmPassword) {
            displayMessage(errorMessage, 'Vui lòng điền đầy đủ thông tin', true);
            focusFirstInvalidInput([signupNameInput, signupEmailInput, signupPasswordInput, signupConfirmInput]);
            return;
        }

        // Check password match
        if (password !== confirmPassword) {
            displayMessage(errorMessage, 'Mật khẩu xác nhận không khớp', true);
            signupConfirmInput.focus();
            return;
        }

        // Disable button and show loading state
        signupButton.disabled = true;
        signupButton.textContent = 'Đang xử lý...';
        
        displayMessage(successMessage, 'Đang tạo tài khoản...', false);
        displayMessage(errorMessage, '', true);

        try {
            const SIGNUP_API_URL = `${API_BASE}/api/auth/register`;
            const response = await fetch(SIGNUP_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: name, email, password })
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                // Success
                displayMessage(successMessage, 'Tạo tài khoản thành công! Vui lòng đăng nhập.', false);
                
                // Clear form
                signupNameInput.value = '';
                signupEmailInput.value = '';
                signupPasswordInput.value = '';
                signupConfirmInput.value = '';
                validateSignupForm();

                // Switch to login tab
                setTimeout(() => {
                    document.querySelector('[data-tab="login"]').click();
                }, 1500);
            } else {
                // Error
                displayMessage(errorMessage, data.message || 'Tạo tài khoản không thành công. Vui lòng thử lại.', true);
                signupButton.disabled = false;
                signupButton.textContent = 'Đăng ký';
            }
        } catch (error) {
            console.error('Network Error:', error);
            displayMessage(
                errorMessage, 
                'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối.',
                true
            );
            signupButton.disabled = false;
            signupButton.textContent = 'Đăng ký';
            signupNameInput.focus();
        }
    });

    // ========================
    // INITIAL FOCUS
    // ========================
    
    // Focus on email input on page load
    emailInput.focus();
});