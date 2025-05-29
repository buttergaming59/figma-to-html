const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Backend đang chạy thành công!');
});

app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});