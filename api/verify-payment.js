const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ success:false, error:'Missing payment details' });
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const expected = crypto.createHmac('sha256', secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(razorpay_signature, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a,b)) return res.status(400).json({ success:false, error:'Payment verification failed' });
  const expires = Date.now() + 30 * 60 * 1000;
  const payload = `cell-biology|${expires}`;
  const tokenSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const token = Buffer.from(`${payload}|${tokenSig}`).toString('base64url');
  res.status(200).json({ success:true, token });
};
