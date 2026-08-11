// Vercel serverless function.
// Runs on Vercel's server, so it is NOT blocked by browser CORS rules —
// this is what lets the tool fetch a page's HTML just from a URL.
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    res.status(400).json({ error: 'Missing "url" query parameter.' });
    return;
  }

  let target;
  try {
    target = new URL(url);
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      throw new Error('Only http/https URLs are allowed.');
    }
  } catch (e) {
    res.status(400).json({ error: 'Invalid URL.' });
    return;
  }

  try {
    const response = await fetch(target.toString(), {
      headers: {
        // Some sites block requests with no user agent
        'User-Agent': 'Mozilla/5.0 (compatible; SEOToolkitBot/1.0; +https://seo-generator-one.vercel.app)'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `Target site returned ${response.status}` });
      return;
    }

    const html = await response.text();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(html);
  } catch (e) {
    res.status(500).json({ error: 'Could not fetch that URL: ' + e.message });
  }
}
