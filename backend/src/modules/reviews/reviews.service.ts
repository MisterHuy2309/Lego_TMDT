import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { CreateReviewDto, QueryReviewDto, UpdateReviewDto } from './dto/reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. TẠO MỚI ĐÁNH GIÁ (KÈM UPLOAD ẢNH/VIDEO)
  async createReview(
    userId: string,
    dto: CreateReviewDto,
    files?: Express.Multer.File[],
  ) {
    // 1.1 Kiểm tra sản phẩm trong đơn hàng
    const orderItem = await this.prisma.order_items.findUnique({
      where: { id: dto.order_item_id },
      include: { order: true },
    });

    if (!orderItem) {
      throw new NotFoundException('Không tìm thấy thông tin sản phẩm đã mua');
    }

    if (orderItem.order.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền đánh giá sản phẩm này');
    }

    if (orderItem.order.status !== 'DELIVERED') {
      throw new BadRequestException('Chỉ có thể đánh giá sau khi đơn hàng đã giao thành công');
    }

    // 1.2 Kiểm tra xem item này đã được đánh giá chưa
    const existingReview = await this.prisma.reviews.findFirst({
      where: { order_item_id: dto.order_item_id },
    });

    if (existingReview) {
      throw new BadRequestException('Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi!');
    }

    // 1.3 Phân loại Media (Ảnh / Video)
    const mediaData = files?.map((file) => {
      const isVideo = file.mimetype.startsWith('video/');
      return {
        media_url: `/uploads/reviews/${file.filename}`,
        media_type: isVideo ? 'VIDEO' : 'IMAGE',
      };
    }) || [];

    // 1.4 Thực hiện Transaction tạo Review & Cập nhật điểm rating_avg của Product
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.reviews.create({
        data: {
          user_id: userId,
          product_id: dto.product_id,
          order_item_id: dto.order_item_id,
          rating: dto.rating,
          comment: dto.comment,
          media: {
            create: mediaData,
          },
        },
        include: {
          media: true,
          user: {
            select: { id: true, full_name: true, avatar_url: true },
          },
        },
      });

      // Cập nhật lại Rating trung bình (rating_avg) của sản phẩm
      const aggregate = await tx.reviews.aggregate({
        where: { product_id: dto.product_id },
        _avg: { rating: true },
      });

      await tx.products.update({
        where: { id: dto.product_id },
        data: {
          rating_avg: aggregate._avg.rating || 0,
        },
      });

      return review;
    });
  }

  // 2. LẤY DANH SÁCH BÌNH LUẬN CỦA SẢN PHẨM (PUBLIC)
  async getProductReviews(productId: string, query: QueryReviewDto) {
    const { rating, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const whereCondition: any = { product_id: productId };
    if (rating) {
      whereCondition.rating = rating;
    }

    const [reviews, total, ratingStats] = await Promise.all([
      this.prisma.reviews.findMany({
        where: whereCondition,
        include: {
          user: {
            select: { id: true, full_name: true, avatar_url: true },
          },
          media: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.reviews.count({ where: whereCondition }),
      // Thống kê số lượng theo từng nấc sao (5 sao, 4 sao...)
      this.prisma.reviews.groupBy({
        by: ['rating'],
        where: { product_id: productId },
        _count: { rating: true },
      }),
    ]);

    // Format lại thống kê sao
    const starsSummary = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingStats.forEach((stat) => {
      starsSummary[stat.rating] = stat._count.rating;
    });

    return {
      data: reviews,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
      stars_summary: starsSummary,
    };
  }

  // 3. XÓA BÌNH LUẬN (ADMIN HOẶC CHÍNH CHỦ)
  async deleteReview(reviewId: string, userId: string, isAdmin: boolean) {
    const review = await this.prisma.reviews.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Không tìm thấy bình luận');

    if (review.user_id !== userId && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    return this.prisma.reviews.delete({ where: { id: reviewId } });
  }


  // 4. CẬP NHẬT / SỬA BÌNH LUẬN & ĐÁNH GIÁ SAO
  async updateReview(
    reviewId: string,
    userId: string,
    dto: UpdateReviewDto,
    files?: Express.Multer.File[],
  ) {
    // 4.1 Kiểm tra sự tồn tại của review & chính chủ
    const review = await this.prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Không tìm thấy bài đánh giá');
    }

    if (review.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài đánh giá này');
    }

    // 4.2 Phân loại file Media mới (Ảnh / Video) nếu người dùng tải đính kèm mới
    const newMediaData = files?.map((file) => {
      const isVideo = file.mimetype.startsWith('video/');
      return {
        media_url: `/uploads/reviews/${file.filename}`,
        media_type: isVideo ? 'VIDEO' : 'IMAGE',
      };
    }) || [];

    // 4.3 Thực hiện cập nhật trong Transaction
    return this.prisma.$transaction(async (tx) => {
      const updatedReview = await tx.reviews.update({
        where: { id: reviewId },
        data: {
          ...(dto.rating !== undefined && { rating: dto.rating }),
          ...(dto.comment !== undefined && { comment: dto.comment }),
          ...(newMediaData.length > 0 && {
            media: {
              create: newMediaData, // Thêm các media mới tải lên
            },
          }),
        },
        include: {
          media: true,
          user: {
            select: { id: true, full_name: true, avatar_url: true },
          },
        },
      });

      // 4.4 Nếu người dùng sửa số sao (rating), cập nhật lại điểm trung bình (rating_avg) của sản phẩm
      if (dto.rating !== undefined && dto.rating !== review.rating) {
        const aggregate = await tx.reviews.aggregate({
          where: { product_id: review.product_id },
          _avg: { rating: true },
        });

        await tx.products.update({
          where: { id: review.product_id },
          data: {
            rating_avg: aggregate._avg.rating || 0,
          },
        });
      }

      return updatedReview;
    });
  }
}