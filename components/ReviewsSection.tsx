import React, { useEffect, useState } from 'react';

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url: string;
  time: number;
}

interface ReviewsResponse {
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReview[];
}

/**
 * Fetches and displays Google Place reviews via the serverless proxy at
 * /api/google-reviews (see api/google-reviews.ts). The Google Places API key
 * must stay server-side, so the browser never calls Google directly.
 */
export const ReviewsSection: React.FC = () => {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/google-reviews')
      .then((res) => {
        if (!res.ok) throw new Error('Unable to load reviews right now.');
        return res.json();
      })
      .then((json: ReviewsResponse) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const Stars: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < Math.round(rating) ? 'text-amber-400' : 'text-slate-700'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.447a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.784.57-1.838-.196-1.539-1.118l1.286-3.957a1 1 0 00-.363-1.118L2.98 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.958z" />
        </svg>
      ))}
    </div>
  );

  if (loading) {
    return (
      <section className="py-16 px-4 text-center text-slate-500 text-sm font-bold uppercase tracking-widest">
        Loading customer reviews…
      </section>
    );
  }

  if (error || !data || data.reviews.length === 0) {
    // Fail quietly on the public site rather than showing a broken widget.
    return null;
  }

  return (
    <section className="py-16 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">What Our Users Say</h2>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Stars rating={data.rating} />
          <span className="text-slate-300 font-bold">{data.rating.toFixed(1)}</span>
          <span className="text-slate-500 text-sm">({data.user_ratings_total} Google reviews)</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.reviews.slice(0, 6).map((review) => (
          <div key={review.time} className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img
                src={review.profile_photo_url}
                alt={review.author_name}
                className="w-10 h-10 rounded-full"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-white font-bold text-sm">{review.author_name}</p>
                <p className="text-slate-500 text-xs">{review.relative_time_description}</p>
              </div>
            </div>
            <Stars rating={review.rating} />
            <p className="text-slate-300 text-sm leading-relaxed line-clamp-5">{review.text}</p>
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <a
          href={`https://search.google.com/local/writereview?placeid=${encodeURIComponent(
            process.env.GOOGLE_PLACE_ID || ''
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black px-6 py-3 rounded-2xl uppercase text-xs tracking-widest hover:scale-105 transition-transform"
        >
          Leave a Google Review
        </a>
      </div>
    </section>
  );
};
