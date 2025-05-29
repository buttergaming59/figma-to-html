document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('username');
  if (!username) {
    alert('Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập trang quản lý tài khoản.');
    window.location.href = 'trangchu.html';
    return;
  }

  // Fetch user info from backend
  fetch(`http://localhost:3000/userinfo/${username}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Lỗi khi lấy thông tin người dùng.');
        return;
      }
      // Populate user info fields
      document.getElementById('profileUsername').textContent = data.username;
      document.getElementById('profileEmail').textContent = data.email;
      document.getElementById('profileRank').textContent = data.rank || 'Hạng Đồng';
      document.getElementById('profileBalance').textContent = data.balance.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
      if (data.created_at && !isNaN(Date.parse(data.created_at))) {
        document.getElementById('profileRegistrationDate').textContent = new Date(data.created_at).toLocaleDateString('vi-VN');
      } else {
        document.getElementById('profileRegistrationDate').textContent = 'Chưa có ngày đăng ký';
      }

      // Set avatar image
      const avatarImg = document.getElementById('profileAvatar');
      if (data.avatarUrl) {
        avatarImg.src = data.avatarUrl;
      } else {
        avatarImg.src = 'assets/svg/default-profile.svg';
      }

      // Set update form inputs
      document.getElementById('updateUsername').value = data.username;
      document.getElementById('updateEmail').value = data.email;
    })
    .catch(err => {
      console.error('Lỗi khi lấy thông tin người dùng:', err);
    });

  // Handle avatar image upload
  const avatarInput = document.getElementById('avatarInput');
  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh nhỏ hơn 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('profileAvatar').src = e.target.result;
    };
    reader.readAsDataURL(file);

    alert('Chức năng tải ảnh đại diện đang được phát triển.');
  });

  // Handle update info form submit
  const updateInfoForm = document.getElementById('updateInfoForm');
  updateInfoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newUsername = document.getElementById('updateUsername').value.trim();
    const newEmail = document.getElementById('updateEmail').value.trim();

    if (!newUsername || !newEmail) {
      alert('Vui lòng điền đầy đủ thông tin cập nhật.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/userinfo/${username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, email: newEmail })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Cập nhật thông tin thành công!');
        document.getElementById('profileUsername').textContent = newUsername;
        document.getElementById('profileEmail').textContent = newEmail;
        if (username !== newUsername) {
          localStorage.setItem('username', newUsername);
        }
      } else {
        alert(data.message || 'Cập nhật thông tin thất bại!');
      }
    } catch (error) {
      alert('Lỗi kết nối đến server!');
    }
  });

  // Handle change password form submit
  const changePasswordForm = document.getElementById('changePasswordForm');
  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmNewPassword = document.getElementById('confirmNewPassword').value.trim();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      alert('Vui lòng điền đầy đủ các trường mật khẩu.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert('Mật khẩu mới không khớp.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/change-password/${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        alert('Đổi mật khẩu thành công!');
        changePasswordForm.reset();
      } else {
        alert(data.message || 'Đổi mật khẩu thất bại!');
      }
    } catch (error) {
      alert('Lỗi kết nối đến server!');
    }
  });

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = 'trangchu.html';
    });
  }
});

