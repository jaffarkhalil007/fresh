import { useState, useRef } from 'react';
import { Star, Trash2, User, Upload, X, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { callAdminData } from '@/lib/adminData';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  verified_purchase?: boolean | null;
  profiles: { full_name: string | null } | null;
}

interface ReviewComment {
  text?: string | null;
  clerkUserId?: string;
  authorName?: string;
  images?: string[];
}

interface ProductReviewsProps {
  productId: string;
  onCountChange?: (count: number) => void;
  onStatsChange?: (stats: { count: number; averageRating: number }) => void;
}

const parseComment = (raw: string | null): ReviewComment => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as ReviewComment;
  } catch {}
  return { text: raw };
};

/* ── Star display with half-star support ── */
const StarDisplay = ({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClass = size === 'lg' ? 'h-7 w-7' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.floor(rating);
        const half = !filled && n === Math.ceil(rating) && rating % 1 >= 0.3;
        return (
          <span key={n} className="relative inline-block">
            {/* Empty base */}
            <Star className={`${sizeClass} fill-[#e5e7eb] text-[#e5e7eb]`} />
            {/* Full or half fill */}
            {(filled || half) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: half ? '50%' : '100%' }}
              >
                <Star className={`${sizeClass} fill-[#f97316] text-[#f97316]`} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
};

/* ── Interactive star picker ── */
const StarPicker = ({ rating, onRatingChange }: { rating: number; onRatingChange: (r: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onRatingChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="cursor-pointer transition-transform hover:scale-110"
        >
          <Star
            className={`h-6 w-6 ${n <= (hover || rating) ? 'fill-[#f97316] text-[#f97316]' : 'fill-[#e5e7eb] text-[#e5e7eb]'}`}
          />
        </button>
      ))}
    </div>
  );
};

const ProductReviews = ({ productId, onCountChange, onStatsChange }: ProductReviewsProps) => {
  const { user, isAdmin } = useAuth();
  const { getToken } = useClerkAuth();
  const queryClient = useQueryClient();
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`id, product_id, user_id, rating, comment, created_at, verified_purchase, profiles(full_name)`)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
  });

  // Check via DB function: has user received a delivered order containing this product?
  const { data: isVerifiedPurchaser = false, isLoading: verifyLoading } = useQuery({
    queryKey: ['verified-purchase', productId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc('has_purchased_product', {
        p_product_id: productId,
        p_clerk_user_id: user.id,
      });
      if (error) return false;
      return data === true;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  // Notify parent of live count + average every render
  if (typeof onCountChange === 'function') onCountChange(reviews.length);
  if (typeof onStatsChange === 'function') onStatsChange({ count: reviews.length, averageRating });

  const userReview = reviews.find((r) => {
    if (r.user_id === user?.id) return true;
    try { return parseComment(r.comment).clerkUserId === user?.id; } catch { return false; }
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    if (!files.length) return;
    setReviewImages(files);
    setReviewImagePreviews(files.map((f) => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const uploadReviewImages = async (): Promise<string[]> => {
    if (!reviewImages.length) return [];
    setIsUploadingImages(true);
    const urls: string[] = [];
    try {
      for (const file of reviewImages) {
        const ext = file.name.split('.').pop();
        const path = `reviews/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('review-images').upload(path, file);
        if (!error) {
          urls.push(supabase.storage.from('review-images').getPublicUrl(path).data.publicUrl);
        } else {
          const fallbackPath = `review-images/${path}`;
          const { error: e2 } = await supabase.storage.from('product-images').upload(fallbackPath, file);
          if (!e2) urls.push(supabase.storage.from('product-images').getPublicUrl(fallbackPath).data.publicUrl);
        }
      }
    } finally {
      setIsUploadingImages(false);
    }
    return urls;
  };

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');
      const authorName = user.fullName || user.firstName || user.email || null;
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({ user_id: user.id, full_name: authorName }, { onConflict: 'user_id' })
        .select('id').single();
      if (profileError) throw profileError;

      const imageUrls = await uploadReviewImages();
      const commentData: ReviewComment = {
        text: newComment.trim() || null,
        clerkUserId: user.id,
        authorName,
        ...(imageUrls.length && { images: imageUrls }),
      };
      const { data, error } = await callAdminData({
        action: 'create_review',
        reviewData: {
          product_id: productId,
          user_id: user.id,
          profile_id: profile?.id || null,
          rating: newRating,
          comment: JSON.stringify(commentData),
          verified_purchase: isVerifiedPurchaser === true,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['products', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setNewComment(''); setNewRating(5);
      setReviewImages([]); setReviewImagePreviews([]);
      toast.success('Review submitted!');
    },
    onError: () => toast.error('Failed to submit review'),
  });

  const deleteReview = useMutation({
    mutationFn: async (reviewId: string) => {
      const { data, error } = await callAdminData({ action: 'delete_review', reviewId, userId: user?.id });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['products', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Review deleted');
    },
    onError: () => toast.error('Failed to delete review'),
  });

  return (
    <div className="space-y-0">

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between pb-5 border-b border-[#e8e3e5]">
        <h3 className="font-serif text-2xl text-[#242024]">Customer Reviews</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2.5">
            <StarDisplay rating={averageRating} size="md" />
            <span className="text-sm font-semibold text-[#242024]">{averageRating.toFixed(1)}</span>
            <span className="text-sm text-[#9a9298]">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
          </div>
        )}
      </div>

      {/* ── Write-a-review form ── */}
      {user && !userReview && isVerifiedPurchaser ? (
        <div className="py-6 border-b border-[#e8e3e5]">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#186049]">Write a Review</h4>
            <span className="inline-flex items-center gap-1 rounded bg-[#186049] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white">
              <ShieldCheck className="h-2.5 w-2.5" /> Verified Purchase
            </span>
          </div>
          <form
            onSubmit={async (e) => { e.preventDefault(); setIsSubmitting(true); try { await submitReview.mutateAsync(); } finally { setIsSubmitting(false); } }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs text-[#716b70]">Your Rating</label>
              <StarPicker rating={newRating} onRatingChange={setNewRating} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#716b70]">Your Review (optional)</label>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={3}
                maxLength={500}
                className="rounded-xl border-[#d8cfd3] bg-[#f9f7f6] text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#186049] focus-visible:ring-[#186049]/20 resize-none"
              />
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#777077]">Photos (optional, up to 3)</label>
              <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
              <div
                onClick={() => reviewImages.length < 3 && imageInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-[#d8cfd3] p-5 text-center transition-all hover:border-[#186049] hover:bg-white ${reviewImages.length >= 3 ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {reviewImagePreviews.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {reviewImagePreviews.map((src, i) => (
                      <div key={i} className="relative">
                        <img src={src} alt="" className="h-16 w-16 rounded-lg object-cover border border-[#186049]" />
                        <button
                          type="button"
                          onClick={() => { setReviewImages((p) => p.filter((_, j) => j !== i)); setReviewImagePreviews((p) => p.filter((_, j) => j !== i)); }}
                          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#242024] text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {reviewImages.length < 3 && (
                      <div
                        onClick={(e) => { e.stopPropagation(); imageInputRef.current?.click(); }}
                        className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[#d8cfd3] text-[#9a9298] hover:border-[#186049] hover:text-[#186049]"
                      >
                        <Upload className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-[#186049]" />
                    <div className="text-xs font-medium text-[#5f595d]">Click to add review photos</div>
                    <div className="text-[10px] text-[#9a9298]">PNG, JPG up to 3 images</div>
                  </>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isUploadingImages}
              className="flex h-11 items-center justify-center gap-2 bg-[#186049] px-8 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-all hover:bg-[#145240] disabled:opacity-60 rounded"
            >
              {isSubmitting || isUploadingImages ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Review'}
            </button>
          </form>
        </div>
      ) : !user ? (
        <div className="py-6 border-b border-[#e8e3e5] text-center">
          <p className="text-sm text-[#716b70]">
            Please <a href="/auth" className="text-[#186049] font-medium hover:underline">sign in</a> to leave a review
          </p>
        </div>
      ) : userReview ? (
        <div className="py-4 border-b border-[#e8e3e5]">
          <p className="text-sm text-[#186049] font-medium flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" /> You've reviewed this product
          </p>
        </div>
      ) : user && !verifyLoading && !isVerifiedPurchaser ? (
        <div className="py-6 border-b border-[#e8e3e5]">
          <div className="flex items-start gap-3 rounded-xl bg-[#f4f0ed] px-4 py-3.5">
            <ShieldCheck className="h-4 w-4 text-[#9a9298] mt-0.5 shrink-0" />
            <p className="text-xs text-[#716b70] leading-relaxed">
              Only customers who have <span className="font-medium text-[#242024]">purchased and received</span> this product can leave a review.
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Reviews list ── */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#186049]" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-[#9a9298]">No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div>
          {reviews.map((review, idx) => {
            const parsed = parseComment(review.comment);
            const displayName = parsed.authorName ||
              review.profiles?.full_name ||
              (review.user_id === user?.id ? user?.fullName || user?.firstName || user?.email : null) ||
              'Anonymous';
            const canDelete = isAdmin || review.user_id === user?.id || parsed.clerkUserId === user?.id;

            return (
              <div key={review.id} className={`py-6 ${idx < reviews.length - 1 ? 'border-b border-[#e8e3e5]' : ''}`}>
                {/* Row 1: Stars + Date */}
                <div className="flex items-center justify-between mb-3">
                  <StarDisplay rating={review.rating} size="md" />
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#9a9298]">
                      {format(new Date(review.created_at), 'MM/dd/yyyy')}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => deleteReview.mutate(review.id)}
                        className="text-[#c4b8be] hover:text-rose-500 transition-colors"
                        title="Delete review"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: Avatar + Name */}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-[#f4f0ed] border border-[#e8e3e5] shrink-0">
                    <User className="h-4 w-4 text-[#9a9298]" />
                  </div>
                  <span className="text-sm font-semibold text-[#242024]">{displayName}</span>
                  {review.verified_purchase === true && (
                    <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-[#186049] text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                      <ShieldCheck className="h-2.5 w-2.5" /> Verified
                    </span>
                  )}
                </div>

                {/* Row 3: Review text */}
                {parsed.text && (
                  <p className="text-sm text-[#5f595d] leading-relaxed mb-3">{parsed.text}</p>
                )}

                {/* Review images */}
                {parsed.images && parsed.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {parsed.images.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={`Review photo ${i + 1}`}
                          className="h-20 w-20 rounded-lg object-cover border border-[#e8e3e5] hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
