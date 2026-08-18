const Razorpay = require('razorpay');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RAZORPAY_KEY_ID) {
    return res.status(500).json({ error: 'Server configuration error: RAZORPAY_KEY_ID is missing.' });
  }
  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: 'Server configuration error: RAZORPAY_KEY_SECRET is missing.' });
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID.trim(),
      key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
    });

    const order = await razorpay.orders.create({
      amount: 4900,
      currency: 'INR',
      receipt: `cell-${Date.now()}`,
      notes: { product: 'Cell Biology Notes' },
    });

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Razorpay create order failed:', error);
    const message = error && error.error && error.error.description
      ? error.error.description
      : (error && error.message ? error.message : 'Unable to create payment order');
    return res.status(500).json({ error: message });
  }
};
