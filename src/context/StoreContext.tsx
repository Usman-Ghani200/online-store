import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type {
  Product,
  CartItem,
  Order,
  Review,
  PromoCode,
  StoreSettings,
  Customer,
  OrderStatus,
  PaymentStatus,
  Category,
  PromoBanner,
} from '../types';
import {
  products as seedProducts,
  promoCodes as seedPromoCodes,
  storeSettings as seedSettings,
  reviews as seedReviews,
  categories as seedCategories,
  promoBanners as seedPromoBanners,
} from '../data/mockData';

const LS_KEYS = {
  products: 'webstore_products',
  cart: 'webstore_cart',
  orders: 'webstore_orders',
  reviews: 'webstore_reviews',
  promoCodes: 'webstore_promocodes',
  settings: 'webstore_settings',
  customers: 'webstore_customers',
  appliedPromo: 'webstore_applied_promo',
  categories: 'webstore_categories',
  promoBanners: 'webstore_promo_banners',
};

function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveLS<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function genTrackingId() {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `WS-${rand}`;
}

interface StoreContextValue {
  // catalog
  products: Product[];
  addProduct: (p: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // cart
  cart: CartItem[];
  addToCart: (productId: string, variantId: string | undefined, quantity: number) => void;
  updateCartQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  clearCart: () => void;
  appliedPromo: string | null;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;
  cartSubtotal: number;
  cartDiscount: number;
  shippingFee: number;
  cartTotal: number;

  // orders
  orders: Order[];
  placeOrder: (details: {
    customerName: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    paymentMethod: Order['paymentMethod'];
  }) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateOrderPaymentStatus: (id: string, status: PaymentStatus) => void;
  findOrderByTrackingId: (trackingId: string) => Order | undefined;

  // reviews
  reviews: Review[];
  submitReview: (r: Omit<Review, 'id' | 'date' | 'approved'>) => void;
  approveReview: (id: string) => void;
  rejectReview: (id: string) => void;

  // promo codes (admin)
  promoCodes: PromoCode[];
  addPromoCode: (p: Omit<PromoCode, 'id'>) => void;
  updatePromoCode: (id: string, patch: Partial<PromoCode>) => void;
  deletePromoCode: (id: string) => void;

  // settings
  settings: StoreSettings;
  updateSettings: (patch: Partial<StoreSettings>) => void;

  // homepage content: categories (with images) and promo banner tiles
  categories: Category[];
  updateCategoryImage: (id: string, image: string) => void;
  promoBanners: PromoBanner[];
  addPromoBanner: (b: Omit<PromoBanner, 'id'>) => void;
  updatePromoBanner: (id: string, patch: Partial<PromoBanner>) => void;
  deletePromoBanner: (id: string) => void;

  // customers
  customers: Customer[];

  // admin auth
  isAdmin: boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => loadLS(LS_KEYS.products, seedProducts));
  const [cart, setCart] = useState<CartItem[]>(() => loadLS(LS_KEYS.cart, []));
  const [orders, setOrders] = useState<Order[]>(() => loadLS(LS_KEYS.orders, []));
  const [reviewsState, setReviewsState] = useState<Review[]>(() => loadLS(LS_KEYS.reviews, seedReviews));
  const [promoCodesState, setPromoCodesState] = useState<PromoCode[]>(() =>
    loadLS(LS_KEYS.promoCodes, seedPromoCodes)
  );
  const [settings, setSettings] = useState<StoreSettings>(() => loadLS(LS_KEYS.settings, seedSettings));
  const [categoriesState, setCategoriesState] = useState<Category[]>(() =>
    loadLS(LS_KEYS.categories, seedCategories)
  );
  const [promoBannersState, setPromoBannersState] = useState<PromoBanner[]>(() =>
    loadLS(LS_KEYS.promoBanners, seedPromoBanners)
  );
  const [customers, setCustomers] = useState<Customer[]>(() => loadLS(LS_KEYS.customers, []));
  const [appliedPromo, setAppliedPromo] = useState<string | null>(() => loadLS(LS_KEYS.appliedPromo, null));
  const [isAdmin, setIsAdmin] = useState<boolean>(() => sessionStorage.getItem('webstore_admin') === 'true');

  useEffect(() => saveLS(LS_KEYS.products, products), [products]);
  useEffect(() => saveLS(LS_KEYS.cart, cart), [cart]);
  useEffect(() => saveLS(LS_KEYS.orders, orders), [orders]);
  useEffect(() => saveLS(LS_KEYS.reviews, reviewsState), [reviewsState]);
  useEffect(() => saveLS(LS_KEYS.promoCodes, promoCodesState), [promoCodesState]);
  useEffect(() => saveLS(LS_KEYS.settings, settings), [settings]);
  useEffect(() => saveLS(LS_KEYS.categories, categoriesState), [categoriesState]);
  useEffect(() => saveLS(LS_KEYS.promoBanners, promoBannersState), [promoBannersState]);
  useEffect(() => saveLS(LS_KEYS.customers, customers), [customers]);
  useEffect(() => saveLS(LS_KEYS.appliedPromo, appliedPromo), [appliedPromo]);

  // ---- catalog ----
  const addProduct: StoreContextValue['addProduct'] = (p) => {
    setProducts((prev) => [
      ...prev,
      { ...p, id: genId('p'), createdAt: new Date().toISOString().slice(0, 10) },
    ]);
  };
  const updateProduct: StoreContextValue['updateProduct'] = (id, patch) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };
  const deleteProduct: StoreContextValue['deleteProduct'] = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // ---- cart ----
  const addToCart: StoreContextValue['addToCart'] = (productId, variantId, quantity) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId && c.variantId === variantId);
      if (existing) {
        return prev.map((c) =>
          c.productId === productId && c.variantId === variantId
            ? { ...c, quantity: c.quantity + quantity }
            : c
        );
      }
      return [...prev, { productId, variantId, quantity }];
    });
  };
  const updateCartQuantity: StoreContextValue['updateCartQuantity'] = (productId, variantId, quantity) => {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((c) => !(c.productId === productId && c.variantId === variantId))
        : prev.map((c) => (c.productId === productId && c.variantId === variantId ? { ...c, quantity } : c))
    );
  };
  const removeFromCart: StoreContextValue['removeFromCart'] = (productId, variantId) => {
    setCart((prev) => prev.filter((c) => !(c.productId === productId && c.variantId === variantId)));
  };
  const clearCart = () => setCart([]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return sum;
      const variant = product.variants.find((v) => v.id === item.variantId);
      const price = variant?.priceOverride ?? product.price;
      return sum + price * item.quantity;
    }, 0);
  }, [cart, products]);

  const activePromo = useMemo(
    () => promoCodesState.find((p) => p.code === appliedPromo && p.active),
    [appliedPromo, promoCodesState]
  );

  const cartDiscount = useMemo(() => {
    if (!activePromo) return 0;
    if (activePromo.minOrderValue && cartSubtotal < activePromo.minOrderValue) return 0;
    return Math.round((cartSubtotal * activePromo.discountPercent) / 100);
  }, [activePromo, cartSubtotal]);

  const shippingFee = useMemo(() => {
    if (cart.length === 0) return 0;
    return cartSubtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
  }, [cartSubtotal, cart.length, settings]);

  const cartTotal = Math.max(0, cartSubtotal - cartDiscount) + shippingFee;

  const applyPromoCode: StoreContextValue['applyPromoCode'] = (code) => {
    const promo = promoCodesState.find((p) => p.code.toUpperCase() === code.toUpperCase());
    if (!promo || !promo.active) {
      return { success: false, message: 'That promo code is not valid.' };
    }
    if (promo.minOrderValue && cartSubtotal < promo.minOrderValue) {
      return {
        success: false,
        message: `Add Rs ${promo.minOrderValue.toLocaleString()} more to use this code.`,
      };
    }
    setAppliedPromo(promo.code);
    return { success: true, message: `${promo.discountPercent}% discount applied.` };
  };
  const removePromoCode = () => setAppliedPromo(null);

  // ---- orders ----
  const placeOrder: StoreContextValue['placeOrder'] = (details) => {
    const order: Order = {
      id: genId('o'),
      trackingId: genTrackingId(),
      items: cart,
      subtotal: cartSubtotal,
      shippingFee,
      discount: cartDiscount,
      total: cartTotal,
      customerName: details.customerName,
      phone: details.phone,
      address: details.address,
      city: details.city,
      province: details.province,
      postalCode: details.postalCode,
      paymentMethod: details.paymentMethod,
      paymentStatus: details.paymentMethod === 'COD' ? 'Unpaid' : 'Paid',
      status: 'Pending',
      promoCode: appliedPromo ?? undefined,
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) => [order, ...prev]);

    setCustomers((prev) => {
      const existing = prev.find((c) => c.phone === details.phone);
      if (existing) {
        return prev.map((c) =>
          c.phone === details.phone
            ? {
                ...c,
                addresses: Array.from(new Set([...c.addresses, details.address])),
                orderIds: [...c.orderIds, order.id],
              }
            : c
        );
      }
      return [
        ...prev,
        {
          id: genId('cust'),
          name: details.customerName,
          phone: details.phone,
          addresses: [details.address],
          orderIds: [order.id],
        },
      ];
    });

    clearCart();
    removePromoCode();
    return order;
  };

  const updateOrderStatus: StoreContextValue['updateOrderStatus'] = (id, status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };
  const updateOrderPaymentStatus: StoreContextValue['updateOrderPaymentStatus'] = (id, paymentStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, paymentStatus } : o)));
  };
  const findOrderByTrackingId: StoreContextValue['findOrderByTrackingId'] = (trackingId) =>
    orders.find((o) => o.trackingId.toLowerCase() === trackingId.trim().toLowerCase());

  // ---- reviews ----
  const submitReview: StoreContextValue['submitReview'] = (r) => {
    setReviewsState((prev) => [
      ...prev,
      { ...r, id: genId('rev'), date: new Date().toISOString().slice(0, 10), approved: false },
    ]);
  };
  const approveReview: StoreContextValue['approveReview'] = (id) => {
    setReviewsState((prev) => prev.map((r) => (r.id === id ? { ...r, approved: true } : r)));
  };
  const rejectReview: StoreContextValue['rejectReview'] = (id) => {
    setReviewsState((prev) => prev.filter((r) => r.id !== id));
  };

  // ---- promo codes admin ----
  const addPromoCode: StoreContextValue['addPromoCode'] = (p) => {
    setPromoCodesState((prev) => [...prev, { ...p, id: genId('promo') }]);
  };
  const updatePromoCode: StoreContextValue['updatePromoCode'] = (id, patch) => {
    setPromoCodesState((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };
  const deletePromoCode: StoreContextValue['deletePromoCode'] = (id) => {
    setPromoCodesState((prev) => prev.filter((p) => p.id !== id));
  };

  // ---- settings ----
  const updateSettings: StoreContextValue['updateSettings'] = (patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  // ---- homepage content ----
  const updateCategoryImage: StoreContextValue['updateCategoryImage'] = (id, image) => {
    setCategoriesState((prev) => prev.map((c) => (c.id === id ? { ...c, image } : c)));
  };
  const addPromoBanner: StoreContextValue['addPromoBanner'] = (b) => {
    setPromoBannersState((prev) => [...prev, { ...b, id: genId('banner') }]);
  };
  const updatePromoBanner: StoreContextValue['updatePromoBanner'] = (id, patch) => {
    setPromoBannersState((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };
  const deletePromoBanner: StoreContextValue['deletePromoBanner'] = (id) => {
    setPromoBannersState((prev) => prev.filter((b) => b.id !== id));
  };

  // ---- admin auth ----
  const loginAdmin = (password: string) => {
    const ok = password === 'admin123' || password === 'admin';
    if (ok) {
      setIsAdmin(true);
      sessionStorage.setItem('webstore_admin', 'true');
    }
    return ok;
  };
  const logoutAdmin = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('webstore_admin');
  };

  const value: StoreContextValue = {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    cartSubtotal,
    cartDiscount,
    shippingFee,
    cartTotal,
    orders,
    placeOrder,
    updateOrderStatus,
    updateOrderPaymentStatus,
    findOrderByTrackingId,
    reviews: reviewsState,
    submitReview,
    approveReview,
    rejectReview,
    promoCodes: promoCodesState,
    addPromoCode,
    updatePromoCode,
    deletePromoCode,
    settings,
    updateSettings,
    categories: categoriesState,
    updateCategoryImage,
    promoBanners: promoBannersState,
    addPromoBanner,
    updatePromoBanner,
    deletePromoBanner,
    customers,
    isAdmin,
    loginAdmin,
    logoutAdmin,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}
