import { create } from 'zustand';

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  stock: number;
}

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: 'ADMIN' | 'CLIENT';
  status: 'ACTIVE' | 'BLOCKED';
}

export interface AdminVoucher {
  id: string;
  code: string;
  discount_percent: number;
  max_discount: number;
  status: 'ACTIVE' | 'EXPIRED';
}

export interface AdminComment {
  id: string;
  user_name: string;
  product_name: string;
  rating: number;
  comment: string;
  status: 'APPROVED' | 'PENDING';
}

interface AdminState {
  categories: AdminCategory[];
  products: AdminProduct[];
  users: AdminUser[];
  vouchers: AdminVoucher[];
  comments: AdminComment[];

  // Actions Danh Mục
  addCategory: (item: Omit<AdminCategory, 'id'>) => void;
  deleteCategory: (id: string) => void;

  // Actions Sản Phẩm
  addProduct: (item: Omit<AdminProduct, 'id'>) => void;
  deleteProduct: (id: string) => void;

  // Actions Khách Hàng
  toggleBlockUser: (id: string) => void;

  // Actions Voucher
  addVoucher: (item: Omit<AdminVoucher, 'id'>) => void;
  deleteVoucher: (id: string) => void;

  // Actions Bình Luận
  toggleApproveComment: (id: string) => void;
  deleteComment: (id: string) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  categories: [
    { id: '1', name: 'LEGO Star Wars', slug: 'star-wars' },
    { id: '2', name: 'LEGO Technic', slug: 'technic' },
    { id: '3', name: 'LEGO Ninjago', slug: 'ninjago' },
  ],
  products: [
    { id: '1', name: 'LEGO Star Wars Millennium Falcon', slug: 'star-wars-falcon', price: 4500000, category: 'LEGO Star Wars', stock: 12 },
    { id: '2', name: 'LEGO Technic Bugatti Chiron', slug: 'technic-bugatti', price: 8900000, category: 'LEGO Technic', stock: 5 },
  ],
  users: [
    { id: 'u1', full_name: 'Châu Gia Huy', email: 'huy@example.com', role: 'ADMIN', status: 'ACTIVE' },
    { id: 'u2', full_name: 'Nguyen Van A', email: 'a@gmail.com', role: 'CLIENT', status: 'ACTIVE' },
  ],
  vouchers: [
    { id: 'v1', code: 'LEGO2026', discount_percent: 10, max_discount: 100000, status: 'ACTIVE' },
  ],
  comments: [
    { id: 'c1', user_name: 'Nguyen Van A', product_name: 'LEGO Technic Bugatti', rating: 5, comment: 'Sản phẩm quá đẹp!', status: 'APPROVED' },
  ],

  addCategory: (item) =>
    set((state) => ({
      categories: [...state.categories, { ...item, id: Date.now().toString() }],
    })),
  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),

  addProduct: (item) =>
    set((state) => ({
      products: [...state.products, { ...item, id: Date.now().toString() }],
    })),
  deleteProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),

  toggleBlockUser: (id) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id ? { ...u, status: u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' } : u
      ),
    })),

  addVoucher: (item) =>
    set((state) => ({
      vouchers: [...state.vouchers, { ...item, id: Date.now().toString() }],
    })),
  deleteVoucher: (id) =>
    set((state) => ({
      vouchers: state.vouchers.filter((v) => v.id !== id),
    })),

  toggleApproveComment: (id) =>
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === id ? { ...c, status: c.status === 'APPROVED' ? 'PENDING' : 'APPROVED' } : c
      ),
    })),
  deleteComment: (id) =>
    set((state) => ({
      comments: state.comments.filter((c) => c.id !== id),
    })),
}));