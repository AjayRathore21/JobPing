import express from 'express';
import connectDB from './model/db.js';
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

connectDB(); // Connect to the database


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});