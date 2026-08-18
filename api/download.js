const crypto = require('crypto');
const { products } = require('./products');
module.exports = async function handler(req,res){
  const token = req.query && req.query.token;
  if(!token) return res.status(403).send('Access denied');
  try {
    const [productId, expires, sig] = Buffer.from(token,'base64url').toString().split('|');
    const product = products[productId];
    if(!product || !product.active || Date.now()>Number(expires)) return res.status(403).send('Access expired');
    const payload = `${productId}|${expires}`;
    const expected = crypto.createHmac('sha256',process.env.RAZORPAY_KEY_SECRET).update(payload).digest('hex');
    const a=Buffer.from(expected,'hex'), b=Buffer.from(sig,'hex');
    if(a.length!==b.length || !crypto.timingSafeEqual(a,b)) return res.status(403).send('Access denied');
    res.writeHead(302,{Location:product.file});res.end();
  } catch(e){res.status(403).send('Access denied');}
};
