import { useState, useEffect, useCallback } from 'react';
import { reviewService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Star } from 'lucide-react';

const StarRating = ({ value, onChange, readonly = false, size = 24 }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1" onMouseLeave={() => !readonly && setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onChange && onChange(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            className={`transition-all duration-150 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
            aria-label={`${star} sao`}
          >
            <Star
              size={size}
              className={`transition-colors duration-150 ${
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-none text-gray-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

const ReviewSection = ({ productId }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [canReviewReason, setCanReviewReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      const res = await reviewService.getReviews(productId);
      setSummary(res.data);
    } catch {
      setSummary({ avgRating: 0, totalReviews: 0, reviews: [] });
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const fetchCanReview = useCallback(async () => {
    if (!user) return;
    try {
      const res = await reviewService.canReview(productId);
      setCanReview(res.data.canReview);
      setCanReviewReason(res.data.reason);
    } catch {
      setCanReview(false);
    }
  }, [productId, user]);

  useEffect(() => {
    fetchReviews();
    fetchCanReview();
  }, [fetchReviews, fetchCanReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Vui lòng chọn điểm đánh giá');
      return;
    }
    setSubmitting(true);
    try {
      await reviewService.createReview(productId, rating, comment);
      toast.success('Cảm ơn bạn đã đánh giá! ⭐');
      setComment('');
      setRating(5);
      setCanReview(false);
      setCanReviewReason('already_reviewed');
      await fetchReviews();
    } catch (err) {
      const msg = err.response?.data || 'Không thể gửi đánh giá';
      toast.error(typeof msg === 'string' ? msg : 'Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (r) => {
    const labels = { 1: 'Rất tệ', 2: 'Tệ', 3: 'Bình thường', 4: 'Tốt', 5: 'Tuyệt vời!' };
    return labels[r] || '';
  };

  const getReasonMessage = () => {
    if (!user) return 'Đăng nhập để đánh giá sản phẩm này';
    if (canReviewReason === 'already_reviewed') return 'Bạn đã đánh giá sản phẩm này rồi';
    if (canReviewReason === 'not_purchased') return 'Chỉ khách hàng đã mua và nhận hàng mới được đánh giá';
    return '';
  };

  return (
    <section className="mt-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Đánh giá sản phẩm</h2>
        {summary && summary.totalReviews > 0 && (
          <span className="px-3 py-0.5 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold border border-amber-200">
            {summary.totalReviews} đánh giá
          </span>
        )}
      </div>

      {/* Avg Rating Banner */}
      {summary && summary.totalReviews > 0 && (
        <div className="flex items-center gap-5 p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 mb-6">
          <div className="text-center">
            <div className="text-5xl font-black text-amber-500">{summary.avgRating.toFixed(1)}</div>
            <div className="text-sm text-gray-500 mt-1">trên 5</div>
          </div>
          <div>
            <StarRating value={Math.round(summary.avgRating)} readonly size={22} />
            <p className="text-sm text-gray-500 mt-1">{summary.totalReviews} đánh giá</p>
          </div>
        </div>
      )}

      {/* Write Review Form */}
      {canReview ? (
        <form
          onSubmit={handleSubmit}
          className="mb-8 p-5 rounded-2xl bg-white border border-green-100 shadow-sm"
        >
          <h3 className="font-semibold text-gray-800 mb-4">✍️ Viết đánh giá của bạn</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Điểm đánh giá</label>
            <div className="flex items-center gap-3">
              <StarRating value={rating} onChange={setRating} size={28} />
              <span className="text-sm font-semibold text-amber-600">{getRatingLabel(rating)}</span>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Nhận xét <span className="text-gray-400">(không bắt buộc)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none resize-none text-sm transition-all duration-200 bg-gray-50 focus:bg-white"
            />
            <div className="text-right text-xs text-gray-400 mt-1">{comment.length}/500</div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-md"
          >
            {submitting ? 'Đang gửi...' : '⭐ Gửi đánh giá'}
          </button>
        </form>
      ) : (
        getReasonMessage() && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-500 flex items-center gap-2">
            <span>ℹ️</span>
            <span>{getReasonMessage()}</span>
          </div>
        )
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : summary?.reviews?.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">💬</div>
          <p className="font-medium">Chưa có đánh giá nào</p>
          <p className="text-sm mt-1">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {summary?.reviews?.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {review.userName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{review.userName}</p>
                    <StarRating value={review.rating} readonly size={14} />
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed pl-12">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ReviewSection;
