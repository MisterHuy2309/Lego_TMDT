import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // 📝 1. [CLIENT] TẠO ĐƠN HÀNG MỚI (Xử lý address_id thông minh & tự động fallback)
  async createOrder(userId: string, dto: CreateOrderDto) {
    // 1.1 Lấy giỏ hàng của user
    const cartItems = await this.prisma.cart_items.findMany({
      where: { user_id: userId },
      include: {
        sku: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestException('Giỏ hàng của bạn đang trống!');
    }

    // 🟢 1.2 XỬ LÝ ĐỊA CHỈ GIAO HÀNG THÔNG MINH (TRÁNH BỊ LỖI ADDRESS NOT FOUND)
    let targetAddressId: string | null = null;

    // Kiểm tra xem ID địa chỉ gửi lên có tồn tại trong CSDL của user không
    if (dto.address_id && dto.address_id.trim() !== '') {
      const existingAddress = await this.prisma.addresses.findFirst({
        where: { id: dto.address_id.trim(), user_id: userId },
      });

      if (existingAddress) {
        targetAddressId = existingAddress.id;
      }
    }

    // Nếu không tìm thấy theo dto.address_id -> Tìm địa chỉ mặc định hoặc địa chỉ đầu tiên của user
    if (!targetAddressId) {
      const defaultAddress = await this.prisma.addresses.findFirst({
        where: { user_id: userId, is_default: true },
      });

      const fallbackAddress =
        defaultAddress ||
        (await this.prisma.addresses.findFirst({
          where: { user_id: userId },
          orderBy: { is_default: 'desc' }, // 🟢 Đã sửa: dùng is_default chuẩn Prisma
        }));

      if (fallbackAddress) {
        targetAddressId = fallbackAddress.id;
      } else {
        // Nếu user chưa từng có bản ghi địa chỉ nào -> Tự khởi tạo từ User Info
        const userObj = await this.prisma.users.findUnique({
          where: { id: userId },
        });

        if (!userObj) {
          throw new NotFoundException('Tài khoản người dùng không tồn tại!');
        }

        const newAddress = await this.prisma.addresses.create({
          data: {
            user_id: userId,
            recipient_name: userObj.full_name || 'Khách hàng',
            phone: userObj.phone || '0900000000',
            street: 'Chưa cập nhật tên đường',
            ward: 'Chưa cập nhật',
            district: 'Chưa cập nhật',
            city: 'Đồng Nai',
            is_default: true,
          },
        });

        targetAddressId = newAddress.id;
      }
    }

    // 1.3 Tính toán tổng tiền & Kiểm tra tồn kho từng SKU
    let totalAmount = 0;
    const orderItemsData: any[] = [];

    for (const item of cartItems) {
      if (item.sku.stock_quantity < item.quantity) {
        throw new BadRequestException(
          `Sản phẩm ${item.sku.product?.name || 'Lego'} (${item.sku.box_condition || 'Mới'}) chỉ còn ${item.sku.stock_quantity} bộ trong kho!`,
        );
      }

      const itemPrice = Number(item.sku.price);
      const subtotal = itemPrice * item.quantity;
      totalAmount += subtotal;

      orderItemsData.push({
        sku_id: item.sku_id,
        quantity: item.quantity,
        price_at_purchase: itemPrice,
      });
    }

    // Sinh mã đơn hàng duy nhất (VD: LEGO-172350291)
    const generatedOrderCode = `LEGO-${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // 1.4 Transaction tạo đơn hàng, trừ kho SKU và xóa giỏ hàng
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.orders.create({
        data: {
          order_code: generatedOrderCode,
          user_id: userId,
          address_id: targetAddressId!, // 🟢 Khóa ngoại address_id hợp lệ 100%
          total_amount: totalAmount,
          status: 'PENDING',
          payment_method: dto.payment_method || 'COD',
          order_items: {
            create: orderItemsData,
          },
        },
        include: {
          order_items: true,
        },
      });

      // Trừ tồn kho SKU
      for (const item of cartItems) {
        await tx.product_skus.update({
          where: { id: item.sku_id },
          data: {
            stock_quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Xóa giỏ hàng sau khi tạo đơn thành công
      await tx.cart_items.deleteMany({
        where: { user_id: userId },
      });

      return order;
    });
  }

  // 📖 2. [CLIENT] XEM LỊCH SỬ ĐƠN HÀNG CÁ NHÂN
  async getMyOrders(userId: string) {
    return this.prisma.orders.findMany({
      where: { user_id: userId },
      include: {
        order_items: {
          include: {
            sku: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    product_images: {
                      where: { is_primary: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // 🟢 3. [ADMIN] LẤY TẤT CẢ ĐƠN HÀNG & TÍNH TỔNG DOANH THU REALTIME
  // backend/src/modules/orders/orders.service.ts

  // 🟢 3. [ADMIN] LẤY TẤT CẢ ĐƠN HÀNG & TÍNH TỔNG DOANH THU REALTIME
  async getAdminOrders(isAdmin: boolean) {
    if (!isAdmin) {
      throw new ForbiddenException('Bạn không có quyền truy cập quản trị!');
    }

    // Chỉ lấy những đơn hàng CHƯA BỊ ARCHIVED (chưa bị reset)
    const orders = await this.prisma.orders.findMany({
      where: {
        status: { not: 'ARCHIVED' as any }, // 🟢 LỌC BỎ CÁC ĐƠN ĐÃ RESET DOANH THU
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        order_items: {
          include: {
            sku: {
              include: {
                product: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // TỔNG DOANH THU: CHỈ CỘNG CÁC ĐƠN ĐÃ GIAO THÀNH CÔNG (DELIVERED) CHƯA RESET
    const totalRevenue = orders
      .filter((order) => order.status === 'DELIVERED')
      .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

    return {
      orders,
      total_revenue: totalRevenue,
      total_orders: orders.length,
      delivered_orders_count: orders.filter((o) => o.status === 'DELIVERED').length,
      pending_orders_count: orders.filter((o) => o.status === 'PENDING').length,
    };
  }

  // 🟢 4. [ADMIN] CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
  async updateOrderStatus(
    orderId: string,
    status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED',
    isAdmin: boolean,
  ) {
    if (!isAdmin) {
      throw new ForbiddenException('Bạn không có quyền thao tác quản trị!');
    }

    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { order_items: true },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng!');
    }

    // Nếu hủy đơn thì hoàn trả lại số lượng tồn kho cho SKU
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      return this.prisma.$transaction(async (tx) => {
        for (const item of order.order_items) {
          await tx.product_skus.update({
            where: { id: item.sku_id },
            data: {
              stock_quantity: {
                increment: item.quantity,
              },
            },
          });
        }

        return tx.orders.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
        });
      });
    }

    return this.prisma.orders.update({
      where: { id: orderId },
      data: {
        status,
      },
    });
  }
}