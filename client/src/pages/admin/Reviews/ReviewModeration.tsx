import { useState, useEffect } from 'react';
import { Star, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { Spinner } from '../../../components/shared';

export default function ReviewModeration() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => { fetchReviews(); }, [flaggedOnly, page]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/reviews', { params: { flagged: flaggedOnly ? 'true' : undefined, page, limit: 20 } });
      setReviews(data.reviews);
      setTotal(data.total);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await api.delete(`/admin/reviews/${id}`);
    setReviews((p) => p.filter((r) => r._id !== id));
    toast.success('Review deleted');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1><p className="text-gray-500 text-sm">{total} reviews</p></div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => { setFlaggedOnly(e.target.checked); setPage(1); }} className="w-4 h-4 accent-orange-500" />
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-red-500" /> Show flagged only</span>
        </label>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm text-gray-400">No reviews found</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((review) => {
            const consumer = review.consumerId as Record<string, unknown>;
            return (
              <div key={review._id as string} className={`bg-white rounded-2xl p-5 shadow-sm ${review.isFlagged ? 'border-2 border-red-200' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 gradient-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {(consumer?.name as string)?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{consumer?.name as string}</p>
                      <p className="text-gray-400 text-xs capitalize">{review.targetType as string} review</p>
                    </div>
                  </div>
                  {review.isFlagged && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                </div>
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < (review.rating as number) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {typeof review.comment === 'string' && review.comment.trim() ? review.comment : <em className="text-gray-400">No comment</em>}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-gray-400 text-xs">{new Date(review.createdAt as string).toLocaleDateString()}</p>
                  <button onClick={() => handleDelete(review._id as string)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
        <span>{total} reviews</span>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Prev</button>
          <span className="px-3 py-1.5">{page}</span>
          <button disabled={reviews.length < 20} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
