// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stripeRoutes from './routes/stripe.js';
import './firebase.js'; // just initialize once

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// 🔗 Use Stripe route
app.use('/api', stripeRoutes);

// 🛠️ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
