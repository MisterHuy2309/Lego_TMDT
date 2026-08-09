import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. THÊM VÀO GIỎ HÀNG
  async addToCart(userId: string, dto: AddToCartDto) {
    const sku = await this.prisma.product_skus.findUnique({
      where: { id: dto.sku_id },
    });

    if (!sku) throw new NotFoundException('Sản phẩm/Biến thể không tồn tại');
    if (sku.stock_quantity < dto.quantity) {
      throw new BadRequestException(`Số lượng trong kho không đủ (Còn lại: ${sku.stock_quantity})`);
    }

    const existingCartItem = await this.prisma.cart_items.findFirst({
      where: { user_id: userId, sku_id: dto.sku_id },
    });

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + dto.quantity;
      if (newQuantity > sku.stock_quantity) {
        throw new BadRequestException(`Tổng số lượng trong giỏ (${newQuantity}) vượt quá kho (${sku.stock_quantity})`);
      }

      return this.prisma.cart_items.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
      });
    }

    return this.prisma.cart_items.create({
      data: {
        user_id: userId,
        sku_id: dto.sku_id,
        quantity: dto.quantity,
      },
    });
  }

  // 2. LẤY CHI TIẾT GIỎ HÀNG (ĐÃ TỐI ƯU CÁCH TÍNH GIÁ & SELECT)
  async getCart(userId: string) {
    if (!userId) {
      return { items: [], subtotal: 0 };
    }

    const items = await this.prisma.cart_items.findMany({
      where: { user_id: userId },
      include: {
        sku: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                item_number: true,
                base_price: true,
                product_images: {
                  select: { image_url: true, is_primary: true },
                  take: 5,
                },
              },
            },
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    });

    let subtotal = 0;

    const formattedItems = items.map((item) => {
      const skuPrice = Number(item.sku?.price || 0);
      const basePrice = Number(item.sku?.product?.base_price || 0);
      const finalPrice = skuPrice > 0 ? skuPrice : basePrice;
      const itemSubtotal = finalPrice * item.quantity;
      subtotal += itemSubtotal;

      const primaryImage =
        item.sku?.product?.product_images?.find((img) => img.is_primary)?.image_url ||
        item.sku?.product?.product_images?.[0]?.image_url ||
        null;

      return {
        id: item.id,
        sku_id: item.sku_id,
        sku_code: item.sku?.sku_code || '',
        box_condition: item.sku?.box_condition || 'NEW',
        price: finalPrice,
        quantity: item.quantity,
        stock_quantity: item.sku?.stock_quantity || 0,
        product_name: item.sku?.product?.name || 'Sản phẩm LEGO',
        product_slug: item.sku?.product?.slug || '',
        item_number: item.sku?.product?.item_number || '',
        image_url: primaryImage,
        item_subtotal: itemSubtotal,
        sku: {
          ...item.sku,
          price: finalPrice,
          product: item.sku?.product,
        },
      };
    });

    return { items: formattedItems, subtotal };
  }

  // 3. CẬP NHẬT SỐ LƯỢNG MÓN HÀNG
  async updateQuantity(userId: string, cartItemId: string, dto: UpdateCartItemDto) {
    const cartItem = await this.prisma.cart_items.findFirst({
      where: { id: cartItemId, user_id: userId },
      include: { sku: true },
    });

    if (!cartItem) throw new NotFoundException('Sản phẩm không có trong giỏ hàng');

    if (dto.quantity <= 0) {
      return this.removeItem(userId, cartItemId);
    }

    if (dto.quantity > cartItem.sku.stock_quantity) {
      throw new BadRequestException(`Kho chỉ còn ${cartItem.sku.stock_quantity} sản phẩm`);
    }

    return this.prisma.cart_items.update({
      where: { id: cartItemId },
      data: { quantity: dto.quantity },
    });
  }

  // 4. XÓA MÓN HÀNG KHỎI GIỎ
  async removeItem(userId: string, cartItemId: string) {
    const cartItem = await this.prisma.cart_items.findFirst({
      where: { id: cartItemId, user_id: userId },
    });

    if (!cartItem) throw new NotFoundException('Món hàng không tồn tại trong giỏ');

    return this.prisma.cart_items.delete({ where: { id: cartItemId } });
  }
}