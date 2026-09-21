export interface ProductVariant {
  id: string;
  label: string; // e.g. size or color name
  stock: number;
  priceOverride?: number;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  approved: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  variants: ProductVariant[];
  stock: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name, used as fallback when no image is set
  slug: string;
  image?: string; // admin-uploaded image, takes priority over the icon when present
}

export interface PromoBanner {
  id: string;
  image: string;
  label: string;
  linkType: 'product' | 'category';
  link: string; // productId when linkType is 'product', category slug when 'category'
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Unpaid' | 'Paid' | 'Refunded';
export type PaymentMethod = 'COD' | 'JazzCash' | 'Easypaisa';

export interface Order {
  id: string;
  trackingId: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  promoCode?: string;
  createdAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  active: boolean;
  minOrderValue?: number;
}

export interface StoreSettings {
  storeName: string;
  logoUrl?: string;
  shippingFee: number;
  freeShippingThreshold: number;
  heroHeadline: string;
  heroSubheadline: string;
  heroImage: string;
  announcementText: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  addresses: string[];
  orderIds: string[];
}
