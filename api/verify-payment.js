const crypto = require('crypto');
const { getProducts } = require('./products');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, productId, proof } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !productId || !proof) {
    return res.status(400).json({ success: false, error: 'Missing payment details' });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return res.status(500).json({ success: false, error: 'Payment verification is not configured' });

  try {
    const products = await getProducts();
    const product = products[productId];
    if (!product || !product.active) {
      return res.status(400).json({ success: false, error: 'Invalid product' });
    }

    const expectedProof = crypto.createHmac('sha256', secret)
      .update(`${productId}|${razorpay_order_id}`)
      .digest('hex');
    const aProof = Buffer.from(expectedProof, 'hex');
    const bProof = Buffer.from(proof, 'hex');
    if (aProof.length !== bProof.length || !crypto.timingSafeEqual(aProof, bProof)) {
      return res.status(400).json({ success: false, error: 'Invalid purchase request' });
    }

    const expected = crypto.createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(razorpay_signature, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(400).json({ success: false, error: 'Payment verification failed' });
    }

    const expires = Date.now() + 30 * 60 * 1000;
    const payload = `${productId}|${expires}`;
    const tokenSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const token = Buffer.from(`${payload}|${tokenSig}`).toString('base64url');

    return res.status(200).json({ success: true, token, productId, title: product.title });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Unable to verify payment' });
  }
};
