// server.js - FIXED
require('dotenv').config();
const express = require('express');
const path = require("path");
const cors = require('cors');

const app = express();
const Routes = require('./routes/index');

// CORS
const allowedOrigins = process.env.FRONT_END_URL;
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

app.use('/api',Routes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));