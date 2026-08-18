const fallbackProducts = {
  'cell-biology': {
    id: 'cell-biology',
    title: 'Cell Biology Notes',
    amount: 4900,
    currency: 'INR',
    file_path: '/biology-cell-notes.pdf',
    demo_path: '/demo-view.html',
    active: true
  }
};

async function getProducts() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return fallbackProducts;

  const response = await fetch(`${url}/rest/v1/products?active=eq.true&select=*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  if (!response.ok) return fallbackProducts;

  const rows = await response.json();
  const products = {};
  for (const row of rows) products[row.id] = row;
  return products;
}

module.exports = { fallbackProducts, getProducts };
