const crypto = require('crypto');
const { getProducts } = require('./products');

module.exports = async function handler(req, res) {
  const token = req.query && req.query.token;
  if (!token) return res.status(403).send('Access denied');

  try {
    const [productId, expires, sig] = Buffer.from(token, 'base64url').toString().split('|');
    if (Date.now() > Number(expires)) return res.status(403).send('Access expired');

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return res.status(500).send('Payment system is not configured');
    const expected = crypto.createHmac('sha256', secret).update(`${productId}|${expires}`).digest('hex');
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(sig || '', 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(403).send('Access denied');

    const products = await getProducts();
    const product = products[productId];
    if (!product || !product.active || !product.file_path) return res.status(404).send('PDF not available');

    const base = process.env.SUPABASE_URL;
    const adminKey = process.env.SUPABASE_SECRET_KEY;
    if (!base || !adminKey) return res.status(500).send('Storage is not configured');

    const objectPath = String(product.file_path).replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');
    const response = await fetch(`${base}/storage/v1/object/sign/notes/${objectPath}`, {
      method: 'POST',
      headers: {
        apikey: adminKey,
        Authorization: `Bearer ${adminKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ expiresIn: 600 })
    });

    if (!response.ok) {
      const message = await response.text();
      return res.status(500).send(`Unable to prepare download: ${message}`);
    }

    const data = await response.json();
    const signed = data.signedURL || data.signedUrl;
    if (!signed) return res.status(500).send('Unable to prepare download');

    const location = signed.startsWith('http') ? signed : `${base}/storage/v1${signed}`;
    res.writeHead(302, { Location: location, 'Cache-Control': 'no-store' });
    res.end();
  } catch (e) {
    return res.status(500).send('Unable to prepare download');
  }
};
