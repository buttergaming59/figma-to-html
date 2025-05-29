const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all origins
app.use(cors());

// MySQL connection config
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Thay đổi nếu bạn có mật khẩu
  database: 'sunwinstore_db'
};

// Connect to MySQL and create database and users table if not exists
async function initDB() {
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password
  });
  await connection.query('CREATE DATABASE IF NOT EXISTS `' + dbConfig.database + '`');
  await connection.end();

  const pool = await mysql.createPool(dbConfig);
  // Thêm cột avatarUrl và balance nếu chưa có
  await pool.query(
    'CREATE TABLE IF NOT EXISTS users (' +
    'id INT AUTO_INCREMENT PRIMARY KEY,' +
    'username VARCHAR(255) UNIQUE NOT NULL,' +
    'email VARCHAR(255) NOT NULL,' +
    'password VARCHAR(255) NOT NULL,' +
    "role ENUM('guest', 'admin') DEFAULT 'guest'," +
    "rank VARCHAR(50) DEFAULT 'Hạng Đồng'," +
    'avatarUrl VARCHAR(255) DEFAULT NULL,' +
    'balance DECIMAL(10,2) DEFAULT 0,' +
    'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' +
    ')'
  );

  // Kiểm tra và thêm cột avatarUrl nếu chưa có (MySQL không hỗ trợ IF NOT EXISTS cho ADD COLUMN trong tất cả phiên bản)
  try {
    await pool.query("ALTER TABLE users ADD COLUMN avatarUrl VARCHAR(255) DEFAULT NULL");
  } catch (err) {
    // Bỏ qua lỗi nếu cột đã tồn tại
  }

  // Kiểm tra và thêm cột balance nếu chưa có
  try {
    await pool.query("ALTER TABLE users ADD COLUMN balance DECIMAL(10,2) DEFAULT 0");
  } catch (err) {
    // Bỏ qua lỗi nếu cột đã tồn tại
  }

  return pool;
}

let pool;
initDB()
  .then(p => {
    pool = p;
    app.listen(port, () => {
      console.log('Server đang chạy tại http://localhost:' + port);
    });
  })
  .catch(err => {
    console.error('Lỗi kết nối DB:', err);
  });

// API lấy số dư tài khoản người dùng
app.get('/balance/:username', async (req, res) => {
  const username = req.params.username;
  try {
    const [rows] = await pool.query('SELECT balance FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }
    return res.json({ balance: rows[0].balance });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau.' });
  }
});

// API lấy thông tin người dùng (username, email, rank, balance, avatarUrl)
app.get('/userinfo/:username', async (req, res) => {
  const username = req.params.username;
  try {
    const [rows] = await pool.query('SELECT username, email, rank, balance, avatarUrl, created_at FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Người dùng không tồn tại.' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server, vui lòng thử lại sau.' });
  }
});

// API cập nhật thông tin người dùng (username, email)
app.put('/userinfo/:username', async (req, res) => {
  const usernameParam = req.params.username;
  const { username: newUsername, email: newEmail } = req.body;

  if (!newUsername || !newEmail) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ tên đăng nhập và email mới.' });
  }

  try {
    // Kiểm tra xem tên đăng nhập mới đã tồn tại chưa (ngoại trừ user hiện tại)
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE username = ? AND username != ?', [newUsername, usernameParam]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Tên đăng nhập mới đã được sử dụng.' });
    }

    // Cập nhật thông tin user
    const [result] = await pool.query('UPDATE users SET username = ?, email = ? WHERE username = ?', [newUsername, newEmail, usernameParam]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại hoặc không có thay đổi.' });
    }

    return res.json({ message: 'Cập nhật thông tin thành công!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau.' });
  }
});

// API đổi mật khẩu
app.post('/change-password/:username', async (req, res) => {
  const usernameParam = req.params.username;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới.' });
  }

  try {
    const [rows] = await pool.query('SELECT password FROM users WHERE username = ?', [usernameParam]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Mật khẩu cũ không đúng.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await pool.query('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, usernameParam]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không thể cập nhật mật khẩu.' });
    }

    return res.json({ message: 'Đổi mật khẩu thành công!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau.' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Backend đang chạy thành công!');
});

// Register route
app.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Mật khẩu không khớp.' });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (rows.length > 0) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);

    // Lấy lại thông tin user vừa tạo
    const [userRows] = await pool.query('SELECT username, email, rank, balance, avatarUrl, created_at FROM users WHERE id = ?', [result.insertId]);

    return res.status(201).json({ message: 'Đăng ký thành công!', user: userRows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau.' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }

    // Tạo token giả (bạn có thể thay bằng JWT)
    const token = 'fake-jwt-token-for-demo';

    return res.json({ message: 'Đăng nhập thành công!', token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau.' });
  }
});
