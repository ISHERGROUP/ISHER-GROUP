const Razorpay = require('razorpay');
const crypto = require('crypto');
const { getProducts } = require('./products');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: 'Razorpay server configuration is incomplete.' });
  }

  const { productId } = req.body || {};
  try {
    const products = await getProducts();
    const product = products[productId];
    if (!product || !product.active) {
      return res.status(400).json({ error: 'This note is not available for purchase yet.' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID.trim(),
      key_secret: process.env.RAZORPAY_KEY_SECRET.trim()
    });

    const order = await razorpay.orders.create({
      amount: product.amount,
      currency: product.currency || 'INR',
      receipt: `${productId}-${Date.now()}`.slice(0, 40),
      notes: { productId, title: product.title }
    });

    const proof = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${productId}|${order.id}`)
      .digest('hex');

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      productId,
      title: product.title,
      proof
    });
  } catch (error) {
    const message = error && error.error && error.error.description
      ? error.error.description
      : (error.message || 'Unable to create payment order');
    return res.status(500).json({ error: message });
  }
};
