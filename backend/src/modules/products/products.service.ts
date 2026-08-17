import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Phục vụ cho findAll()
  async findAll(query?: any) {
  return this.prisma.products.findMany({
    include: {
      category: true,
      product_images: true,
      product_skus: true,
      discount: true, // 🟢 BẮT BUỘC: Nạp thông tin mã giảm giá
    },
    orderBy: { created_at: 'desc' },
  });
}

  // Giữ lại hàm cũ để tương thích các component khác đang dùng
  async getProducts(params?: { search?: string; category_id?: string; stock_status?: string; limit?: number }) {
    const { search, category_id, stock_status, limit = 50 } = params || {};
    const whereCondition: any = {};

    if (search && search.trim() !== '') {
      whereCondition.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { item_number: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    if (category_id && category_id.trim() !== '') {
      whereCondition.category_id = category_id;
    }

    const products = await this.prisma.products.findMany({
      where: whereCondition,
      include: {
        category: true,
        product_images: true,
        product_skus: true,
      },
      orderBy: { created_at: 'desc' },
      take: Number(limit),
    });

    const formattedProducts = products.map((p) => {
      const totalStock = (p.product_skus || []).reduce(
        (sum, sku) => sum + Number(sku.stock_quantity || 0),
        0,
      );
      return {
        ...p,
        total_stock: totalStock,
        is_out_of_stock: totalStock === 0,
      };
    });

    if (stock_status === 'OUT_OF_STOCK') {
      return formattedProducts.filter((p) => p.total_stock === 0);
    }
    if (stock_status === 'LOW_STOCK') {
      return formattedProducts.filter((p) => p.total_stock > 0 && p.total_stock <= 5);
    }
    if (stock_status === 'IN_STOCK') {
      return formattedProducts.filter((p) => p.total_stock > 5);
    }

    return formattedProducts;
  }

  // 2. Phục vụ cho findBySlug()
  async findBySlug(slug: string) {
  const product = await this.prisma.products.findUnique({
    where: { slug },
    include: {
      category: true,
      product_images: true,
      product_skus: true,
      discount: true, // 🟢 BẮT BUỘC: Nạp mã giảm giá cho trang chi tiết
      reviews: {
        include: {
          user: {
            select: { id: true, full_name: true, avatar_url: true },
          },
          media: true,
        },
        orderBy: { created_at: 'desc' },
      },
    },
  });

  if (!product) throw new NotFoundException('Không tìm thấy sản phẩm Lego!');
  return product;
}

  // 3. Phục vụ cho findOne()
  async findOne(id: string) {
  const product = await this.prisma.products.findUnique({
    where: { id },
    include: {
      category: true,
      product_images: true,
      product_skus: true,
      discount: true, // 🟢 Nạp mã giảm giá
    },
  });
  if (!product) throw new NotFoundException('Không tìm thấy sản phẩm Lego!');
  return product;
}

  // 4. Phục vụ cho create()
  async create(dto: CreateProductDto) {
    const { images, skus, category_id, ...productData } = dto as any;
    const slug = productData.slug || productData.name.toLowerCase().replace(/\s+/g, '-');

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.products.create({
        data: {
          ...productData,
          slug,
          category_id: category_id && category_id.trim() !== '' ? category_id : null,
          base_price: Number(productData.base_price || 0),
        },
      });

      if (images && images.length > 0) {
        await tx.product_images.createMany({
          data: images.map((img: any, idx: number) => ({
            product_id: product.id,
            image_url: img.image_url || img,
            is_primary: img.is_primary ?? idx === 0,
          })),
        });
      }

      if (skus && skus.length > 0) {
        await tx.product_skus.createMany({
          data: skus.map((s: any) => ({
            product_id: product.id,
            sku_code: s.sku_code || `SKU-${Date.now().toString().slice(-6)}`,
            box_condition: s.box_condition || 'NEW',
            price: Number(s.price || product.base_price),
            stock_quantity: Number(s.stock_quantity || 10),
          })),
        });
      }

      return tx.products.findUnique({
        where: { id: product.id },
        include: { category: true, product_images: true, product_skus: true },
      });
    });
  }

  // 5. Phục vụ cho update()
  // 5. Phục vụ cho update()
async update(id: string, dto: UpdateProductDto) {
  const existing = await this.prisma.products.findUnique({
    where: { id },
    include: { product_skus: true, product_images: true },
  });
  if (!existing) throw new NotFoundException('Sản phẩm không tồn tại!');

  const { images, skus, category_id, ...productData } = dto as any;

  return this.prisma.$transaction(async (tx) => {
    // 🟢 Xử lý cập nhật SKU mà không làm đứt khóa ngoại đơn hàng
    if (skus && Array.isArray(skus) && skus.length > 0) {
      for (const s of skus) {
        // Tìm SKU hiện có theo mã sku_code hoặc theo product_id
        const existingSku = existing.product_skus.find(
          (item) => (s.id && item.id === s.id) || (s.sku_code && item.sku_code === s.sku_code)
        ) || existing.product_skus[0];

        if (existingSku) {
          // Cập nhật lại số lượng và giá của SKU đã có
          await tx.product_skus.update({
            where: { id: existingSku.id },
            data: {
              sku_code: s.sku_code || existingSku.sku_code,
              box_condition: s.box_condition || existingSku.box_condition,
              price: Number(s.price !== undefined ? s.price : productData.base_price || existingSku.price),
              stock_quantity: Number(s.stock_quantity ?? 0),
            },
          });
        } else {
          // Nếu SKU hoàn toàn mới thì mới tạo mới
          await tx.product_skus.create({
            data: {
              product_id: id,
              sku_code: s.sku_code || `SKU-${Date.now().toString().slice(-6)}`,
              box_condition: s.box_condition || 'NEW',
              price: Number(s.price || productData.base_price || 0),
              stock_quantity: Number(s.stock_quantity ?? 0),
            },
          });
        }
      }
    }

    // 🟢 Xử lý hình ảnh
    if (images && Array.isArray(images)) {
      await tx.product_images.deleteMany({ where: { product_id: id } });
      if (images.length > 0) {
        await tx.product_images.createMany({
          data: images.map((img: any, idx: number) => ({
            product_id: id,
            image_url: img.image_url || img,
            is_primary: img.is_primary ?? idx === 0,
          })),
        });
      }
    }

    // 🟢 Cập nhật thông tin chung của sản phẩm
    return tx.products.update({
      where: { id },
      data: {
        ...productData,
        category_id: category_id && category_id.trim() !== '' ? category_id : null,
      },
      include: {
        category: true,
        product_images: true,
        product_skus: true,
      },
    });
  });
}

  // Alias tương thích cũ
  async updateProduct(id: string, dto: UpdateProductDto) {
    return this.update(id, dto);
  }

  // 6. Phục vụ cho remove()
  async remove(id: string) {
    const existing = await this.prisma.products.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sản phẩm không tồn tại!');

    return this.prisma.products.delete({
      where: { id },
    });
  }

  // 1. Áp dụng mã giảm giá trực tiếp lên nhiều sản phẩm
async applyDiscountToProducts(productIds: string[], discountId: string | null) {
  return this.prisma.products.updateMany({
    where: { id: { in: productIds } },
    data: { discount_id: discountId },
  });
}

// 2. Xóa hàng loạt sản phẩm
async deleteManyProducts(productIds: string[]) {
  return this.prisma.products.deleteMany({
    where: { id: { in: productIds } },
  });
}

  // Alias tương thích cũ
  async deleteProduct(id: string) {
    return this.remove(id);
  }
}