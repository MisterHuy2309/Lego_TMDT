import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryRevenueDto, TimePeriod } from './dto/query-analytics.dto';

// ==========================================
// INTERFACES ĐỊNH NGHĨA KIỂU DỮ LIỆU
// ==========================================
export interface LowStockItem {
  sku_code: string;
  product_name: string;
  box_condition: string | null;
  stock_quantity: number;
  status: string;
}

export interface SlowMovingItem {
  sku_code: string;
  product_name: string;
  stock_quantity: number;
  created_at: Date;
  days_in_stock: number;
}

export interface NewlyAddedItem {
  sku_code: string;
  product_name: string;
  stock_quantity: number;
  import_date: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. BÁO CÁO DOANH THU (NGÀY / TUẦN / THÁNG / NĂM)
  // ==========================================
  async getRevenueReport(query: QueryRevenueDto) {
    const { period } = query;
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case TimePeriod.DAY:
        startDate.setHours(0, 0, 0, 0); // Đầu ngày hôm nay
        break;
      case TimePeriod.WEEK: {
        const dayOfWeek = now.getDay();
        const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(now.getDate() - distanceToMonday);
        startDate.setHours(0, 0, 0, 0); // Đầu tuần này (Thứ 2)
        break;
      }
      case TimePeriod.MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Đầu tháng này
        break;
      case TimePeriod.YEAR:
        startDate = new Date(now.getFullYear(), 0, 1); // Đầu năm nay
        break;
    }

    // Lấy các đơn hàng đã thanh toán/giao thành công
    const orders = await this.prisma.orders.findMany({
      where: {
        created_at: { gte: startDate },
        status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] }, // Không tính đơn bị CANCELLED/PENDING
      },
      select: {
        total_amount: true,
        created_at: true,
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);

    return {
      period,
      start_date: startDate,
      total_orders: orders.length,
      total_revenue: totalRevenue,
    };
  }

  // ==========================================
  // 2. BÁO CÁO SẢN PHẨM BÁN CHẠY
  // ==========================================
  async getProductPerformance() {
    // Top 10 SKU bán chạy nhất
    const bestSellers = await this.prisma.order_items.groupBy({
      by: ['sku_id'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    // Lấy chi tiết thông tin các SKU bán chạy
    const bestSellerDetails = await Promise.all(
      bestSellers.map(async (item) => {
        const sku = await this.prisma.product_skus.findUnique({
          where: { id: item.sku_id },
          include: { product: { select: { name: true, slug: true, item_number: true } } },
        });
        return {
          sku_code: sku?.sku_code,
          product_name: sku?.product.name,
          item_number: sku?.product.item_number,
          total_sold: item._sum.quantity,
          current_stock: sku?.stock_quantity,
        };
      }),
    );

    return { best_sellers: bestSellerDetails };
  }

  // ==========================================
  // 3. QUẢN LÝ KHO HÀNG (SỐ LƯỢNG, CẢNH BÁO SẮP HẾT, VỊ TRÍ, TỒN KHO LÂU)
  // ==========================================
  async getInventoryReport(lowStockThreshold: number = 5) {
    const allSkus = await this.prisma.product_skus.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            item_number: true,
            created_at: true, // Ngày nhập sản phẩm vào hệ thống
          },
        },
        _count: {
          select: { order_items: true }, // Số lần được mua
        },
      },
      orderBy: { stock_quantity: 'asc' },
    });

    let totalStockItems = 0;
    // Khai báo mảng đi kèm Type cụ thể để tránh lỗi never[]
    const lowStockList: LowStockItem[] = [];
    const slowMovingList: SlowMovingItem[] = [];
    const newlyAddedList: NewlyAddedItem[] = [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    allSkus.forEach((sku) => {
      totalStockItems += sku.stock_quantity;

      // ⚠️ Hàng sắp hết (Tồn kho <= threshold)
      if (sku.stock_quantity <= lowStockThreshold) {
        lowStockList.push({
          sku_code: sku.sku_code,
          product_name: sku.product.name,
          box_condition: sku.box_condition,
          stock_quantity: sku.stock_quantity,
          status: sku.stock_quantity === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
        });
      }

      // 🐢 Hàng tồn kho lâu / Không bán được (Tạo > 30 ngày nhưng bán được 0 hoặc rất ít)
      if (sku.product.created_at <= thirtyDaysAgo && sku._count.order_items === 0 && sku.stock_quantity > 0) {
        slowMovingList.push({
          sku_code: sku.sku_code,
          product_name: sku.product.name,
          stock_quantity: sku.stock_quantity,
          created_at: sku.product.created_at,
          days_in_stock: Math.floor((Date.now() - new Date(sku.product.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        });
      }

      // 🆕 Sản phẩm mới nhập (Tạo trong vòng 30 ngày gần đây)
      if (sku.product.created_at >= thirtyDaysAgo) {
        newlyAddedList.push({
          sku_code: sku.sku_code,
          product_name: sku.product.name,
          stock_quantity: sku.stock_quantity,
          import_date: sku.product.created_at,
        });
      }
    });

    return {
      summary: {
        total_skus: allSkus.length,
        total_units_in_stock: totalStockItems, // Còn bao nhiêu hàng?
        location: 'KHO CHÍNH (MAIN WAREHOUSE - TẠI CỬA HÀNG)', // Hàng đang ở đâu?
      },
      low_stock_alerts: lowStockList,       // Hàng nào sắp hết?
      slow_moving_products: slowMovingList, // Hàng tồn kho lâu?
      newly_added_products: newlyAddedList, // Sản phẩm mới nhập
    };
  }
}