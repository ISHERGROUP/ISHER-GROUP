const crypto = require('crypto');
const { getProducts } = require('./products');

module.exports = async function handler(req, res) {
  const token = req.query && req.query.token;
  if (!token) return res.status(403).send('Access denied');
  try {
    const [productId, expires, sig] = Buffer.from(token, 'base64url').toString().split('|');
    if (Date.now() > Number(expires)) return res.status(403).send('Access expired');
    const payload = `${productId}|${expires}`;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(payload).digest('hex');
    const a = Buffer.from(expected, 'hex'), b = Buffer.from(sig || '', 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(403).send('Access denied');
    const products = await getProducts();
    const product = products[productId];
    if (!product || !product.active || !product.file_path) return res.status(404).send('PDF not available');
    res.writeHead(302, { Location: product.file_path });
    res.end();
  } catch (e) { return res.status(403).send('Access denied'); }
};
