export interface CreateReviewDto {
  product_id: string;
  order_item_id: string;
  rating: number;
  comment: string;
}

export interface ReviewMedia {
  id: string;
  media_url: string;
  media_type: 'IMAGE' | 'VIDEO';
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  review_media?: ReviewMedia[];
}