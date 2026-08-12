'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { reviewsService, Review, ReviewMedia, ReviewResponse } from '@/services/reviews.service';
import { useAuthStore } from '@/store/useAuthStore';
import { Star, Upload, Trash2, Edit2, X, Loader2, MessageSquare, LogIn } from 'lucide-react';

interface ProductReviewsProps {
  productId: string;
  orderItemId?: string;
}

export default function ProductReviews({ productId, orderItemId }: ProductReviewsProps) {
  const user = useAuthStore((state) => state.user);

  const [reviewsData, setReviewsData] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 🟢 STATE DÙNG CHO LIGHTBOX PHÓNG TO HÌNH ÁNH / VIDEO
  const [activeMedia, setActiveMedia] = useState<{ url: string; type: 'IMAGE' | 'VIDEO' } | null>(null);

  // Filter & Form state
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | undefined>(undefined);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ url: string; type: 'IMAGE' | 'VIDEO' }[]>([]);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [productId, selectedStarFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewsService.getProductReviews(productId, 1, 10, selectedStarFilter);
      setReviewsData(data);
    } catch (error) {
      console.error('Lỗi lấy danh sách đánh giá:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    if (selectedFiles.length + filesArray.length > 5) {
      alert('Bạn chỉ được phép tải lên tối đa 5 file ảnh hoặc video!');
      return;
    }

    const newPreviews = filesArray.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? ('VIDEO' as const) : ('IMAGE' as const),
    }));

    setSelectedFiles((prev) => [...prev, ...filesArray]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Vui lòng đăng nhập để thực hiện bình luận!');
      return;
    }

    if (!comment.trim()) {
      alert('Vui lòng viết nhận xét của bạn!');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('rating', rating.toString());
      formData.append('comment', comment);

      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      if (editingReview) {
        await reviewsService.updateReview(editingReview.id, formData);
        alert('Cập nhật bài đánh giá thành công!');
      } else {
        formData.append('product_id', productId);
        formData.append('order_item_id', orderItemId || `review-item-${Date.now()}`);
        await reviewsService.createReview(formData);
        alert('Đã gửi đánh giá thành công!');
      }

      setEditingReview(null);
      setComment('');
      setRating(5);
      setSelectedFiles([]);
      setFilePreviews([]);
      fetchReviews();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (review: Review) => {
    setEditingReview(review);
    setRating(review.rating);
    setComment(review.comment || '');
    setSelectedFiles([]);
    setFilePreviews([]);
  };

  const handleDeleteClick = async (reviewId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài đánh giá này?')) return;
    try {
      await reviewsService.deleteReview(reviewId);
      alert('Xóa bình luận thành công!');
      fetchReviews();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể xóa bình luận!');
    }
  };

  const getMediaUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:3000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="mt-12 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
      <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-red-600" /> Đánh Giá & Bình Luận
      </h2>

      {/* THỐNG KÊ SAO */}
      {reviewsData?.stars_summary && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 flex flex-col md:flex-row items-center gap-6">
          <div className="text-center md:border-r md:pr-8 border-slate-200">
            <div className="text-4xl font-black text-slate-800">
              {reviewsData.pagination.total > 0
                ? (
                    Object.entries(reviewsData.stars_summary).reduce(
                      (acc: number, [star, count]: [string, unknown]) =>
                        acc + Number(star) * Number(count || 0),
                      0
                    ) / reviewsData.pagination.total
                  ).toFixed(1)
                : '0.0'}
            </div>
            <div className="flex items-center justify-center gap-1 my-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-xs text-slate-500">{reviewsData.pagination.total} đánh giá</span>
          </div>

          <div className="flex flex-wrap gap-2 flex-grow">
            <button
              type="button"
              onClick={() => setSelectedStarFilter(undefined)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                selectedStarFilter === undefined
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              Tất cả
            </button>
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedStarFilter(star)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center gap-1 ${
                  selectedStarFilter === star
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{star} Sao</span>
                <span className="opacity-60">
                  ({Number(reviewsData.stars_summary[star] || 0)})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KHU VỰC BÌNH LUẬN */}
      {!user ? (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center mb-8">
          <p className="text-slate-600 text-sm font-semibold mb-3">
            Vui lòng đăng nhập để viết nhận xét và tải ảnh/video thực tế cho bộ Lego này.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl transition shadow text-xs"
          >
            <LogIn className="w-4 h-4" /> Đăng Nhập Ngay
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-red-50/50 p-5 rounded-2xl border border-red-100 mb-8">
          <h3 className="font-bold text-slate-800 mb-3 text-sm">
            {editingReview ? 'Chỉnh sửa đánh giá của bạn' : 'Viết đánh giá cho sản phẩm này'}
          </h3>

          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                className="p-1 hover:scale-110 transition"
              >
                <Star
                  className={`w-6 h-6 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                />
              </button>
            ))}
            <span className="text-xs font-bold text-slate-600 ml-2">({rating}/5 Sao)</span>
          </div>

          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ nhận xét của bạn về bộ Lego này (độ hoàn thiện, khớp ghép, chất lượng màu sắc...)"
            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 mb-3"
          />

          {filePreviews.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {filePreviews.map((file, idx) => (
                <div key={idx} className="relative w-20 h-20 bg-slate-100 rounded-xl overflow-hidden border">
                  {file.type === 'IMAGE' ? (
                    <img src={file.url} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={file.url} className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute top-1 right-1 bg-black/60 text-white p-0.5 rounded-full hover:bg-red-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-4 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition">
              <Upload className="w-4 h-4 text-red-600" />
              <span>Thêm Ảnh/Video (Tối đa 5)</span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <div className="flex gap-2">
              {editingReview && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingReview(null);
                    setComment('');
                    setFilePreviews([]);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-slate-200 rounded-xl hover:bg-slate-300 transition"
                >
                  Hủy
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingReview ? 'Cập Nhật' : 'Gửi Đánh Giá'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* DANH SÁCH BÌNH LUẬN ĐÃ CÓ */}
      {loading ? (
        <div className="text-center py-8 text-slate-400">Đang tải đánh giá...</div>
      ) : !reviewsData?.data || reviewsData.data.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">Chưa có bình luận nào cho sản phẩm này.</div>
      ) : (
        <div className="space-y-6">
          {reviewsData.data.map((rev: Review) => {
            const isOwner = user?.id === rev.user_id;

            return (
              <div key={rev.id} className="border-b border-slate-100 pb-6 last:border-none">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-100 text-red-600 font-bold rounded-full flex items-center justify-center text-sm overflow-hidden shrink-0">
                      {rev.user?.avatar_url ? (
                        <img src={getMediaUrl(rev.user.avatar_url)} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        rev.user?.full_name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{rev.user?.full_name || 'Khách hàng'}</h4>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditClick(rev)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(rev.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition"
                        title="Xóa bình luận"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-slate-600 text-sm leading-relaxed mb-3">{rev.comment || 'Không có nhận xét viết tay.'}</p>

                {/* 🟢 DANH SÁCH ẢNH / VIDEO CÓ CLICK ĐỂ BẤM XEM PHÓNG TO */}
                {rev.media && rev.media.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {rev.media.map((m: ReviewMedia) => {
                      const src = getMediaUrl(m.media_url);
                      return (
                        <div
                          key={m.id}
                          onClick={() => setActiveMedia({ url: src, type: m.media_type })}
                          className="w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90 hover:scale-105 transition-all shadow-sm relative group"
                        >
                          {m.media_type === 'IMAGE' ? (
                            <img src={src} alt="media" className="w-full h-full object-cover" />
                          ) : (
                            <video src={src} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                            
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <span className="text-[11px] text-slate-400 block mt-2">
                  {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 🔴 LIGHTBOX MODAL PHÓNG TO NẰM CHÍNH GIỮA MÀN HÌNH */}
      {activeMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveMedia(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-auto h-auto flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} // Tránh click vào media bị đóng
          >
            {/* Nút Đóng Modal */}
            <button
              type="button"
              onClick={() => setActiveMedia(null)}
              className="absolute -top-12 right-0 md:-right-12 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition backdrop-blur-sm"
              title="Đóng xem ảnh"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Hiển thị Hình Ảnh / Video Phóng To */}
            {activeMedia.type === 'IMAGE' ? (
              <img
                src={activeMedia.url}
                alt="Phóng to"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            ) : (
              <video
                src={activeMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/10"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}