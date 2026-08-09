import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';// Chỉnh lại đường dẫn PrismaService theo dự án của bạn
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Lấy tất cả sản phẩm (Kèm theo thông tin Danh mục & Ảnh)
  async findAll() {
    return this.prisma.products.findMany({
      include: {
        category: true,
        product_images: true,
        product_skus: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  // 🟢 2. LẤY CHI TIẾT SẢN PHẨM THEO SLUG (Giải quyết dứt điểm lỗi ts(2339))
  async findBySlug(slug: string) {
    const product = await this.prisma.products.findUnique({
      where: { slug },
      include: {
        category: true,
        product_images: true,
        product_skus: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm Lego với slug: ${slug}`);
    }

    return product;
  }

  // 🟢 3. Lấy chi tiết sản phẩm theo ID
  async findOne(id: string) {
    const product = await this.prisma.products.findUnique({
      where: { id },
      include: {
        category: true,
        product_images: true,
        product_skus: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm Lego với ID: ${id}`);
    }

    return product;
  }

  // 4. Tạo mới sản phẩm (Kèm tạo Images & SKUs)
  async create(dto: CreateProductDto) {
    const { images, skus, ...productData } = dto as any;

    return this.prisma.products.create({
      data: {
        ...productData,
        product_images: images && images.length > 0 ? {
          create: images.map((img: any) => ({
            image_url: img.image_url,
            is_primary: img.is_primary ?? false,
          })),
        } : undefined,
        product_skus: skus && skus.length > 0 ? {
          create: skus.map((sku: any) => ({
            sku_code: sku.sku_code,
            box_condition: sku.box_condition || 'NEW',
            price: sku.price,
            stock_quantity: sku.stock_quantity || 0,
          })),
        } : undefined,
      },
      include: {
        category: true,
        product_images: true,
        product_skus: true,
      },
    });
  }

  // 5. Cập nhật sản phẩm
  // 🟢 CẬP NHẬT SẢN PHẨM & XỬ LÝ ẢNH AN TOÀN
  // 🟢 CẬP NHẬT SẢN PHẨM & XỬ LÝ ẢNH + CATEGORY AN TOÀN
  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id); // Kiểm tra sản phẩm có tồn tại không

    const { images, skus, category_id, ...productData } = dto as any;

    // Xử lý category_id: Nếu bị chuỗi rỗng "" thì ép về null, ngược lại giữ nguyên
    const formattedCategoryId =
      category_id && category_id.trim() !== '' ? category_id : null;

    // Nếu người dùng chọn category_id mới, kiểm tra xem danh mục đó có tồn tại không
    if (formattedCategoryId) {
      const categoryExists = await this.prisma.categories.findUnique({
        where: { id: formattedCategoryId },
      });
      if (!categoryExists) {
        throw new NotFoundException('Danh mục được chọn không tồn tại trong hệ thống!');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Xử lý ảnh nếu có gửi mảng images
      if (images && Array.isArray(images)) {
        await tx.product_images.deleteMany({
          where: { product_id: id },
        });

        if (images.length > 0) {
          await tx.product_images.createMany({
            data: images.map((img: any, index: number) => ({
              product_id: id,
              image_url: img.image_url || img,
              is_primary: img.is_primary ?? index === 0,
            })),
          });
        }
      }

      // 2. Cập nhật thông tin sản phẩm (với category_id đã chuẩn hóa)
      return tx.products.update({
        where: { id },
        data: {
          ...productData,
          category_id: formattedCategoryId,
        },
        include: {
          category: true,
          product_images: true,
          product_skus: true,
        },
      });
    });
  }

  // 6. Xóa sản phẩm
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.products.delete({
      where: { id },
    });
  }
}