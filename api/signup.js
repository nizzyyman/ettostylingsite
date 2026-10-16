export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Please use the application form.' });
  }
  const allowed = new Set(['https://etto.ai', 'https://www.etto.ai', 'http://localhost:4173', 'http://127.0.0.1:4173']);
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (host) allowed.add(`https://${host}`);
  }
  if (req.headers.origin && !allowed.has(req.headers.origin)) return res.status(403).json({ error: 'Please submit from the ETTO website.' });
  let data;
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (!raw || Buffer.byteLength(raw) > 2048) return res.status(413).json({ error: 'The submission is too large.' });
    data = JSON.parse(raw);
  } catch { return res.status(400).json({ error: 'Please check your details and try again.' }); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return res.status(400).json({ error: 'Please check your details.' });
  if (data.website) return res.status(400).json({ error: 'Unable to accept this submission.' });
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const instagram = typeof data.instagram === 'string' ? data.instagram.trim() : '';
  if (!['client', 'stylist'].includes(data.role) || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[a-f0-9-]{36}$/i.test(data.id || '') ||
      (data.role === 'stylist' && !/^@?[a-zA-Z0-9._]{1,30}$/.test(instagram))) {
    return res.status(400).json({ error: 'Please enter a valid email and, for stylists, Instagram handle.' });
  }
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const token = process.env.GOOGLE_SHEETS_TOKEN;
  if (!url || !token) return res.status(503).json({ error: 'Applications are temporarily unavailable. Please try again shortly.' });
  try {
    const result = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, id: data.id, role: data.role, email, instagram: data.role === 'stylist' ? instagram : '' }),
      signal: AbortSignal.timeout(20000),
    });
    const saved = result.ok && (await result.json()).ok === true;
    if (!saved) throw new Error('Submission was not acknowledged');
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: 'We couldn’t confirm your submission. Please try again. Your details are still here.' });
  }
}
