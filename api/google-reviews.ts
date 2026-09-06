import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Proxies Google Places "Place Details" reviews so the Places API key never
 * reaches the browser. Requires GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID
 * set as Vercel environment variables.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    res.status(500).json({ error: 'Google Places is not configured on the server.' });
    return;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      placeId
    )}&fields=rating,user_ratings_total,reviews&key=${apiKey}`;

    const googleRes = await fetch(url);
    const data = await googleRes.json();

    if (data.status !== 'OK') {
      res.status(502).json({ error: `Google Places error: ${data.status}` });
      return;
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({
      rating: data.result.rating ?? 0,
      user_ratings_total: data.result.user_ratings_total ?? 0,
      reviews: data.result.reviews ?? [],
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
}
