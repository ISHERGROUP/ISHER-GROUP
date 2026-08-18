const crypto = require('crypto');
module.exports = async function handler(req,res){
  const token = req.query && req.query.token;
  if(!token) return res.status(403).send('Access denied');
  try {
    const [product, expires, sig] = Buffer.from(token,'base64url').toString().split('|');
    const payload = `${product}|${expires}`;
    const expected = crypto.createHmac('sha256',process.env.RAZORPAY_KEY_SECRET).update(payload).digest('hex');
    if(product!=='cell-biology' || Date.now()>Number(expires) || !crypto.timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(sig,'hex'))) return res.status(403).send('Access expired');
    res.writeHead(302,{Location:'/biology-cell-notes.pdf'});res.end();
  } catch(e){res.status(403).send('Access denied');}
};