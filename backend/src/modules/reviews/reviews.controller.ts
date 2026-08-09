import {BadRequestException, Body,Controller,Delete, Get, Param,Patch,Post,Query, Request, UploadedFiles,UseGuards,UseInterceptors,} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation,ApiTags,} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';

import {
  CreateReviewDto,
  QueryReviewDto,
  UpdateReviewDto,
} from './dto/reviews.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews & Rating (Đánh giá & Bình luận sản phẩm)')
@Controller('api/v1/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // 📝 1. GỬI ĐÁNH GIÁ KÈM TẢI ẢNH/VIDEO (Tối đa 5 file)
  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Viết bình luận & Đánh giá sao kèm Tải lên Ảnh/Video' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: './uploads/reviews', // Thư mục lưu media review
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `review-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Hỗ trợ cả file Ảnh và Video
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4|mov|avi|mkv)$/)) {
          return cb(
            new BadRequestException('Chỉ hỗ trợ file ảnh (JPG, PNG) hoặc Video (MP4, MOV)'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 20 * 1024 * 1024 }, // Giới hạn tối đa 20MB cho cả Video
    }),
  )
  createReview(
    @Request() req: any,
    @Body() dto: CreateReviewDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.reviewsService.createReview(req.user.id, dto, files);
  }

  // 📖 2. XEM TẤT CẢ ĐÁNH GIÁ CỦA SẢN PHẨM (PUBLIC)
  @Get('product/:productId')
  @ApiOperation({ summary: 'Xem danh sách bình luận & thống kê sao của 1 sản phẩm' })
  getProductReviews(
    @Param('productId') productId: string,
    @Query() query: QueryReviewDto,
  ) {
    return this.reviewsService.getProductReviews(productId, query);
  }

  // ✏️ 3. SỬA BÌNH LUẬN & ĐÁNH GIÁ SAO (KÈM BỔ SUNG ẢNH/VIDEO)
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Chỉnh sửa bình luận, cập nhật số sao hoặc tải bổ sung ảnh/video' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: './uploads/reviews',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `review-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4|mov|avi|mkv)$/)) {
          return cb(
            new BadRequestException('Chỉ hỗ trợ file ảnh (JPG, PNG) hoặc Video (MP4, MOV)'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  updateReview(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateReviewDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.reviewsService.updateReview(id, req.user.id, dto, files);
  }

  // 🗑️ 4. XÓA BÌNH LUẬN
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Xóa bình luận của tôi (Hoặc Admin xóa)' })
  deleteReview(@Param('id') id: string, @Request() req: any) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.reviewsService.deleteReview(id, req.user.id, isAdmin);
  }
}