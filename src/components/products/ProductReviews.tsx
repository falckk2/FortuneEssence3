'use client';

import { useState, useEffect } from 'react';
import { StarIcon, UserCircleIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
}

interface ProductReviewsProps {
  productId: string;
  userId?: string;
}

export function ProductReviews({ productId, userId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reviews?productId=${productId}`);
      const data = await response.json();
      if (data.success) {
        setReviews(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error('Du måste vara inloggad för att lämna en recension');
      return;
    }

    if (!title.trim() || !comment.trim()) {
      toast.error('Vänligen fyll i alla fält');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Tack för din recension!');
        setTitle('');
        setComment('');
        setRating(5);
        setShowForm(false);
        fetchReviews();
      } else {
        toast.error(data.error || 'Kunde inte skicka recension');
      }
    } catch (error) {
      toast.error('Ett fel uppstod');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
      });

      if (response.ok) {
        setReviews(reviews.map(r =>
          r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
        ));
        toast.success('Tack för din feedback!');
      }
    } catch (error) {
      console.error('Failed to mark review as helpful:', error);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0
      ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100
      : 0,
  }));

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="w-12 h-12 border-4 border-sage-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Reviews Summary */}
      <div className="bg-cream-50 rounded-2xl p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-5xl font-bold text-forest-800 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`h-6 w-6 ${
                    star <= Math.round(averageRating)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-forest-600">
              Baserat på {reviews.length} {reviews.length === 1 ? 'recension' : 'recensioner'}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {ratingDistribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm font-medium text-forest-700 w-12">
                  {star} stjärnor
                </span>
                <div className="flex-1 h-3 bg-cream-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-forest-600 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Write Review Button */}
        {userId && !showForm && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg hover:shadow-xl"
            >
              Skriv en recension
            </button>
          </div>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h3 className="text-xl font-serif font-bold text-forest-800 mb-4">
            Skriv din recension
          </h3>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">
                Betyg
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    {star <= (hoverRating || rating) ? (
                      <StarIcon className="h-8 w-8 text-yellow-400" />
                    ) : (
                      <StarIconOutline className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">
                Rubrik
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sammanfatta din upplevelse"
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none transition-colors"
                required
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">
                Din recension
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Berätta om din upplevelse med produkten..."
                rows={4}
                maxLength={1000}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none transition-colors resize-none"
                required
              />
              <p className="text-xs text-forest-500 mt-1">
                {comment.length}/1000 tecken
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Skickar...' : 'Skicka recension'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 rounded-full border-2 border-cream-300 text-forest-700 font-semibold hover:bg-cream-50 transition-all"
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-serif font-bold text-forest-800">
          Recensioner ({reviews.length})
        </h3>

        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl shadow-soft p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <UserCircleIcon className="h-10 w-10 text-sage-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-forest-800">
                        {review.userName}
                      </span>
                      {review.verified && (
                        <CheckBadgeIcon
                          className="h-5 w-5 text-green-600"
                          title="Verifierat köp"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-forest-600">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span>•</span>
                      <span>
                        {new Date(review.createdAt).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <h4 className="font-semibold text-forest-800 mb-2">{review.title}</h4>
              <p className="text-forest-700 leading-relaxed mb-4">{review.comment}</p>

              {/* Actions */}
              <div className="flex items-center gap-4 text-sm">
                <button
                  onClick={() => handleMarkHelpful(review.id)}
                  className="text-forest-600 hover:text-sage-700 transition-colors"
                >
                  Hjälpsam ({review.helpful})
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-forest-600">
            <p className="mb-2">Inga recensioner ännu</p>
            <p className="text-sm">Var den första att recensera denna produkt!</p>
          </div>
        )}
      </div>
    </div>
  );
}
