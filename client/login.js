document.addEventListener('DOMContentLoaded', function() {
    
    // ✅ SỬA: Sử dụng API server thực tế thay vì mock
    const LOGIN_API_URL = 'http://localhost:8083/api/auth/login';
            
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitButton = document.getElementById('submitButton');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    function validateForm() {
        const isEmailFilled = emailInput.value.trim() !== '';
        const isPasswordFilled = passwordInput.value.trim() !== '';

        if (isEmailFilled && isPasswordFilled) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }
    }

    emailInput.addEventListener('input', validateForm);
    passwordInput.addEventListener('input', validateForm);

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault(); 

        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // ✅ SỬA: Gọi API server thực tế
        submitButton.disabled = true;
        submitButton.textContent = 'Đang xử lý...';

        fetch(LOGIN_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Đăng nhập thất bại');
            }
            return response.json();
        })
        .then(data => {
            // Lưu token nếu server trả về
            if (data.token) {
                localStorage.setItem('authToken', data.token);
            }
            
            successMessage.textContent = 'Đăng nhập thành công! Đang chuyển bạn đến trang chủ...';
            successMessage.style.display = 'block';

            setTimeout(function() {
                window.location.href = 'index.html'; 
            }, 2000);
        })
        .catch(error => {
            console.error('API Error:', error);
            errorMessage.textContent = 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.';
            errorMessage.style.display = 'block';
            submitButton.disabled = false;
            submitButton.textContent = 'SIGN IN';
        });
    });
});