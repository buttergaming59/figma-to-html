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

// Thêm cột balance cho số dư tài khoản người dùng
async function addBalanceColumn() {
  try {
    const pool = await mysql.createPool(dbConfig);
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0");
  } catch (err) {
    console.error('Lỗi khi thêm cột balance:', err);
  }
}
addBalanceColumn();

// Connect to MySQL and create users table if not exists
async function initDB() {
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password
  });
  await connection.query('CREATE DATABASE IF NOT EXISTS `' + dbConfig.database + '`');
  await connection.end();

  const pool = await mysql.createPool(dbConfig);
  await pool.query(
    'CREATE TABLE IF NOT EXISTS users (' +
    'id INT AUTO_INCREMENT PRIMARY KEY,' +
    'username VARCHAR(255) UNIQUE NOT NULL,' +
    'email VARCHAR(255) NOT NULL,' +
    'password VARCHAR(255) NOT NULL,' +
    "role ENUM('guest', 'admin') DEFAULT 'guest'," +
    "rank VARCHAR(50) DEFAULT 'Hạng Đồng'," +
    'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' +
    ')'
  );
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
    await pool.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);

    return res.status(201).json({ message: 'Đăng ký thành công!' });
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
