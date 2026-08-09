import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@legoshop.com';
  
  // Kiểm tra xem đã có admin chưa
  const existingAdmin = await prisma.users.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Tài khoản Admin đã tồn tại!');
    return;
  }

  // Mã hóa mật khẩu
  const password_hash = await bcrypt.hash('123456', 10);

  // Tạo tài khoản Admin
  const admin = await prisma.users.create({
    data: {
      email: adminEmail,
      password_hash,
      full_name: 'Châu Gia Admin (Admin)',
      phone: '0912345678',
      role: 'ADMIN', // 👈 Đặt quyền ADMIN ở đây
    },
  });

  console.log('Đã tạo tài khoản Admin thành công:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });