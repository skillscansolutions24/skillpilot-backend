// routes/stripe.js
import express from 'express';
import Stripe from 'stripe';
import { db } from '../firebase.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 💳 1. Create Checkout Session
router.post('/create-checkout-session', async (req, res) => {
  const { userId, email } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: 'price_abc123', // ✅ Replace with your real Stripe Price ID
          quantity: 1,
        },
      ],
      success_url: 'https://skillpilot.app/subscribed',
      cancel_url: 'https://skillpilot.app/cancelled',
      metadata: { userId },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe error:', err.message);
    res.status(500).json({ error: 'Stripe checkout failed' });
  }
});

// 🔁 2. Stripe Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;

    try {
      await db.collection('users').doc(userId).set({
        subscribed: true,
        subscribedAt: new Date(),
      }, { merge: true });

      console.log(`✅ User ${userId} marked as subscribed in Firestore`);
    } catch (err) {
      console.error('❌ Firestore error:', err.message);
    }
  }

  res.status(200).json({ received: true });
});

export default router;
