function showTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabs = document.querySelectorAll('.tab-btn');

  loginForm.classList.remove('active');
  registerForm.classList.remove('active');
  tabs.forEach(btn => btn.classList.remove('active'));

  if (tab === 'login') {
    loginForm.classList.add('active');
    tabs[0].classList.add('active');
  } else {
    registerForm.classList.add('active');
    tabs[1].classList.add('active');
  }
}

function openAuthModal() {
  document.getElementById('authModal').classList.add('active');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('active');
  // Reset form fields
  document.getElementById('loginForm').reset();
  document.getElementById('registerForm').reset();
  // Ẩn lỗi (nếu có)
  const errors = document.querySelectorAll('.input-error');
  errors.forEach(e => e.textContent = '');
  // Ẩn mật khẩu nếu đang hiện
  document.querySelectorAll('.toggle-password').forEach(btn => {
    const input = btn.previousElementSibling;
    if (input && input.type === 'text') input.type = 'password';
    btn.classList.remove('show');
  });
}

// Gắn sự kiện click vào nút “Đăng nhập / Đăng ký”
document.addEventListener('DOMContentLoaded', () => {
  const authBtn = document.querySelector('a[href="#"][onclick]');
  if (!authBtn) {
    const btns = document.querySelectorAll('nav a');
    btns.forEach(btn => {
      if (btn.innerText.includes('Đăng nhập')) {
        btn.addEventListener('click', e => {
          e.preventDefault();
          openAuthModal();
        });
      }
    });
  }
});

function togglePassword(el) {
  const input = el.previousElementSibling;
  if (input.type === "password") {
    input.type = "text";
    el.classList.add('show');
  } else {
    input.type = "password";
    el.classList.remove('show');
  }
}
// ===== XỬ LÝ FORM ĐĂNG NHẬP =====
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  try {
    // Gửi dữ liệu đến backend
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token); // Lưu token
      closeAuthModal();
      // Lấy số dư tài khoản và hiển thị
      const balanceResponse = await fetch(`http://localhost:3000/balance/${username}`);
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        const balanceElement = document.getElementById('userBalance');
        if (balanceElement) {
          balanceElement.textContent = balanceData.balance.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
        }
      }
      window.location.href = 'trangchu.html'; // Chuyển hướng
    } else {
      alert(data.message || "Đăng nhập thất bại!");
    }
  } catch (error) {
    alert("Lỗi kết nối đến server!");
  }
});

// ===== XỬ LÝ FORM ĐĂNG KÝ =====
document.getElementById('registerForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = {
    username: document.getElementById('register-username').value,
    email: document.getElementById('register-email').value,
    password: document.getElementById('register-password').value,
    confirmPassword: document.getElementById('register-password2').value
  };

  if (formData.password !== formData.confirmPassword) {
    alert("Mật khẩu không khớp!");
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      showTab('login'); // Chuyển sang tab đăng nhập
    } else {
      alert(data.message || "Đăng ký thất bại!");
    }
  } catch (error) {
    alert("Lỗi kết nối đến server!");
  }
});
