import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateReviewDto,
  QueryReviewDto,
  UpdateReviewDto,
} from './dto/reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // 📝 1. TẠO MỚI ĐÁNH GIÁ (BÌNH LUẬN TỰ DO)
  async createReview(
    userId: string,
    dto: CreateReviewDto,
    files?: Express.Multer.File[],
  ) {
    // 1.1 Kiểm tra sự tồn tại của sản phẩm
    const product = await this.prisma.products.findUnique({
      where: { id: dto.product_id },
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm!');
    }

    // 1.2 Phân loại Media (Ảnh / Video)
    const mediaData =
      files?.map((file) => {
        const isVideo = file.mimetype.startsWith('video/');
        return {
          media_url: `/uploads/reviews/${file.filename}`,
          media_type: isVideo ? ('VIDEO' as const) : ('IMAGE' as const),
        };
      }) || [];

    // 1.3 Kiểm tra order_item_id hợp lệ
    const validOrderItemId =
      dto.order_item_id && !dto.order_item_id.startsWith('review-item-')
        ? dto.order_item_id
        : undefined;

    // 🟢 1.4 Build Object Data động chuẩn Type Prisma UncheckedInput
    const createData: any = {
      user_id: userId,
      product_id: dto.product_id,
      rating: Number(dto.rating),
    };

    if (dto.comment) {
      createData.comment = dto.comment;
    }

    if (validOrderItemId) {
      createData.order_item_id = validOrderItemId;
    }

    if (mediaData.length > 0) {
      createData.media = {
        create: mediaData,
      };
    }

    // 1.5 Transaction tạo Review & Cập nhật rating_avg
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.reviews.create({
        data: createData,
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

  // 📖 2. LẤY DANH SÁCH BÌNH LUẬN CỦA SẢN PHẨM (PUBLIC)
  async getProductReviews(productId: string, query: QueryReviewDto) {
    const { rating, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const whereCondition: any = { product_id: productId };
    if (rating) {
      whereCondition.rating = Number(rating);
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
        take: Number(limit),
      }),
      this.prisma.reviews.count({ where: whereCondition }),
      this.prisma.reviews.groupBy({
        by: ['rating'],
        where: { product_id: productId },
        _count: { rating: true },
      }),
    ]);

    const starsSummary: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingStats.forEach((stat) => {
      starsSummary[stat.rating] = stat._count.rating;
    });

    return {
      data: reviews,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / limit),
      },
      stars_summary: starsSummary,
    };
  }

  // ✏️ 3. CẬP NHẬT / SỬA BÌNH LUẬN
  async updateReview(
    reviewId: string,
    userId: string,
    dto: UpdateReviewDto,
    files?: Express.Multer.File[],
  ) {
    const review = await this.prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) throw new NotFoundException('Không tìm thấy bài đánh giá');
    if (review.user_id !== userId) throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài đánh giá này');

    const newMediaData =
      files?.map((file) => {
        const isVideo = file.mimetype.startsWith('video/');
        return {
          media_url: `/uploads/reviews/${file.filename}`,
          media_type: isVideo ? ('VIDEO' as const) : ('IMAGE' as const),
        };
      }) || [];

    const updateData: any = {};
    if (dto.rating !== undefined) updateData.rating = Number(dto.rating);
    if (dto.comment !== undefined) updateData.comment = dto.comment;
    if (newMediaData.length > 0) {
      updateData.media = { create: newMediaData };
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedReview = await tx.reviews.update({
        where: { id: reviewId },
        data: updateData,
        include: {
          media: true,
          user: {
            select: { id: true, full_name: true, avatar_url: true },
          },
        },
      });

      if (dto.rating !== undefined && Number(dto.rating) !== review.rating) {
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

  // 🗑️ 4. XÓA BÌNH LUẬN
  async deleteReview(reviewId: string, userId: string, isAdmin: boolean) {
    const review = await this.prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) throw new NotFoundException('Không tìm thấy bình luận');
    if (review.user_id !== userId && !isAdmin) throw new ForbiddenException('Bạn không có quyền xóa bình luận này');

    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.reviews.delete({
        where: { id: reviewId },
      });

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

      return deleted;
    });
  }
}