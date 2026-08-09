import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoriesDto } from './dto/create-categories.dto';
import { UpdateCategoriesDto } from './dto/update-categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. TẠO DỰ ANH MỤC MỚI
  async create(dto: CreateCategoriesDto) {
    // Kiểm tra trùng slug
    const existingSlug = await this.prisma.categories.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new BadRequestException('Slug danh mục đã tồn tại!');
    }

    // Kiểm tra parent_id nếu có truyền vào
    if (dto.parent_id) {
      const parent = await this.prisma.categories.findUnique({
        where: { id: dto.parent_id },
      });
      if (!parent) {
        throw new NotFoundException('Danh mục cha không tồn tại!');
      }
    }

    return this.prisma.categories.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        image_url: dto.image_url || null,
        parent_id: dto.parent_id || null,
      },
    });
  }

  // 2. LẤY TẤT CẢ DANH MỤC (KÈM DANH MỤC CON CẤP 1)
  async findAll() {
    return this.prisma.categories.findMany({
      include: {
        children: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // 3. LẤY CHI TIẾT DANH MỤC THEO ID
  async findOne(id: string) {
    const category = await this.prisma.categories.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
      },
    });

    if (!category) throw new NotFoundException('Không tìm thấy danh mục!');
    return category;
  }

  // 4. LẤY CÂY DANH MỤC GỐC ĐẦY ĐỦ (TREE STRUCTURE)
  async findTree() {
    return this.prisma.categories.findMany({
      where: { parent_id: null }, // Chỉ lấy danh mục gốc
      include: {
        children: {
          include: {
            children: true, // Lấy tiếp cấp cháu
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // 5. CẬP NHẬT DANH MỤC
  async update(id: string, dto: UpdateCategoriesDto) {
    const category = await this.prisma.categories.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Không tìm thấy danh mục!');

    // Kiểm tra trùng slug nếu có thay đổi
    if (dto.slug && dto.slug !== category.slug) {
      const existingSlug = await this.prisma.categories.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (existingSlug) throw new BadRequestException('Slug đã tồn tại!');
    }

    // Xử lý parent_id
    if (dto.parent_id !== undefined && dto.parent_id !== null) {
      // 1. Không thể chọn chính nó làm cha
      if (dto.parent_id === id) {
        throw new BadRequestException('Danh mục không thể chọn chính nó làm danh mục cha!');
      }

      // 2. Kiểm tra danh mục cha mới có tồn tại không
      const parentCategory = await this.prisma.categories.findUnique({
        where: { id: dto.parent_id },
      });
      if (!parentCategory) {
        throw new NotFoundException('Danh mục cha được chọn không tồn tại!');
      }

      // 3. Phòng ngừa vòng lặp: Danh mục cha mới không được là con/cháu của danh mục hiện tại
      const isDescendant = await this.checkIsDescendant(id, dto.parent_id);
      if (isDescendant) {
        throw new BadRequestException('Không thể chọn danh mục con làm danh mục cha!');
      }
    }

    const { parent_id, ...updateData } = dto;

    return this.prisma.categories.update({
      where: { id },
      data: {
        ...updateData,
        parent_id: parent_id === undefined ? category.parent_id : (parent_id || null),
      },
    });
  }

  // 6. XÓA DANH MỤC (AN TOÀN CHO DANH MỤC CON)
  async remove(id: string) {
    const category = await this.prisma.categories.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Không tìm thấy danh mục!');

    // Chuyển các danh mục con thành danh mục gốc trước khi xóa cha
    await this.prisma.categories.updateMany({
      where: { parent_id: id },
      data: { parent_id: null },
    });

    return this.prisma.categories.delete({ where: { id } });
  }

  // 🛠️ HÀM PHỤ BỢ: KIỂM TRA MỐI QUAN HỆ CÂY CHA - CON
  private async checkIsDescendant(parentId: string, targetId: string): Promise<boolean> {
    const target = await this.prisma.categories.findUnique({
      where: { id: targetId },
    });

    if (!target || !target.parent_id) return false;
    if (target.parent_id === parentId) return true;

    // Đệ quy ngược lên danh mục cao hơn
    return this.checkIsDescendant(parentId, target.parent_id);
  }
}