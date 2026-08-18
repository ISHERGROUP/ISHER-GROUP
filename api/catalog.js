const https = require('https');
function request(url, options) { return new Promise((resolve,reject)=>{ const r=https.request(url,options,res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>resolve({status:res.statusCode,body:b}));});r.on('error',reject);r.end(); }); }
module.exports = async function(req,res){
  if(!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return res.status(500).json({error:'Supabase is not configured yet.'});
  try {
    const url=process.env.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/products?active=eq.true&select=id,title,subject,category,chapter,price_paise,demo_path';
    const out=await request(url,{headers:{apikey:process.env.SUPABASE_ANON_KEY,Authorization:'Bearer '+process.env.SUPABASE_ANON_KEY}});
    res.status(out.status).send(out.body);
  } catch(e){ res.status(500).json({error:'Could not load products.'}); }
};