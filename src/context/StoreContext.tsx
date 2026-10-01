import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  storeSettings as seedSettings,
  categories as seedCategories,
  products as seedProducts,
  promoBanners as seedBanners,
  promoCodes as seedPromos,
  reviews as seedReviews,
} from '../data/mockData';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type QuerySnapshot,
} from 'firebase/firestore';

// Only things that belong to ONE visitor's browser stay in localStorage.
// Everything else (products, orders, reviews, promo codes, settings...) lives in Firebase Firestore.
const LS_KEYS = {
  cart: 'webstore_cart',
  appliedPromo: 'webstore_applied_promo',
  myOrders: 'webstore_my_orders', // orders placed from this browser
  pendingOrders: 'webstore_pending_orders', // orders not yet confirmed saved in the database
  adminHint: 'webstore_admin_hint', // just avoids a login-page flash on refresh; real security is in the database
  // fast first paint while fresh data loads
  cacheProducts: 'webstore_cache_products',
  cacheCategories: 'webstore_cache_categories',
  cacheBanners: 'webstore_cache_banners',
  cacheSettings: 'webstore_cache_settings',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

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
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function genTrackingId() {
  const n = (crypto.getRandomValues(new Uint32Array(1))[0] % 90000000) + 10000000;
  return `WS-${n}`;
}

const today = () => new Date().toISOString().slice(0, 10);

// ---------- database <-> app shape ----------
// Firestore stores the same shape the app uses. Optional values are stored as null.

const COL = {
  products: 'products',
  categories: 'categories',
  banners: 'promoBanners',
  reviews: 'reviews',
  promoCodes: 'promoCodes',
  orders: 'orders',
  tracking: 'tracking',
  admins: 'admins',
  settings: 'settings',
} as const;
const SETTINGS_DOC = 'store';

const num = (v: unknown, fallback = 0) => (v == null || v === '' ? fallback : Number(v));

const docToProduct = (id: string, r: Row): Product => ({
  id,
  name: r.name ?? '',
  description: r.description ?? '',
  category: r.category ?? '',
  price: num(r.price),
  compareAtPrice: r.compareAtPrice == null ? undefined : Number(r.compareAtPrice),
  images: r.images ?? [],
  variants: r.variants ?? [],
  stock: num(r.stock),
  rating: num(r.rating),
  reviewCount: num(r.reviewCount),
  featured: !!r.featured,
  createdAt: r.createdAt ?? today(),
});

function productToDoc(p: Partial<Product>): Row {
  const d: Row = {};
  if (p.name !== undefined) d.name = p.name;
  if (p.description !== undefined) d.description = p.description;
  if (p.category !== undefined) d.category = p.category;
  if (p.price !== undefined) d.price = p.price;
  if ('compareAtPrice' in p) d.compareAtPrice = p.compareAtPrice ?? null;
  if (p.images !== undefined) d.images = p.images;
  if (p.variants !== undefined) d.variants = p.variants;
  if (p.stock !== undefined) d.stock = p.stock;
  if (p.rating !== undefined) d.rating = p.rating;
  if (p.reviewCount !== undefined) d.reviewCount = p.reviewCount;
  if (p.featured !== undefined) d.featured = p.featured;
  return d;
}

const docToCategory = (id: string, r: Row): Category => ({
  id,
  name: r.name ?? '',
  icon: r.icon ?? 'Home',
  slug: r.slug ?? '',
  image: r.image ?? undefined,
});

const docToBanner = (id: string, r: Row): PromoBanner => ({
  id,
  image: r.image ?? '',
  label: r.label ?? '',
  linkType: r.linkType ?? 'product',
  link: r.link ?? '',
});

function bannerToDoc(b: Partial<PromoBanner>): Row {
  const d: Row = {};
  if (b.image !== undefined) d.image = b.image;
  if (b.label !== undefined) d.label = b.label;
  if (b.linkType !== undefined) d.linkType = b.linkType;
  if (b.link !== undefined) d.link = b.link;
  return d;
}

const docToPromo = (id: string, r: Row): PromoCode => ({
  id,
  code: r.code ?? '',
  discountPercent: num(r.discountPercent),
  active: !!r.active,
  minOrderValue: r.minOrderValue == null ? undefined : Number(r.minOrderValue),
});

function promoToDoc(p: Partial<PromoCode>): Row {
  const d: Row = {};
  if (p.code !== undefined) d.code = p.code;
  if (p.discountPercent !== undefined) d.discountPercent = p.discountPercent;
  if (p.active !== undefined) d.active = p.active;
  if ('minOrderValue' in p) d.minOrderValue = p.minOrderValue ?? null;
  return d;
}

const docToReview = (id: string, r: Row): Review => ({
  id,
  productId: r.productId ?? '',
  customerName: r.customerName ?? '',
  rating: num(r.rating),
  comment: r.comment ?? '',
  date: r.date ?? '',
  approved: !!r.approved,
});

const reviewToDoc = (r: Review): Row => ({
  productId: r.productId,
  customerName: r.customerName,
  rating: r.rating,
  comment: r.comment,
  date: r.date,
  approved: r.approved,
});

const docToOrder = (id: string, r: Row): Order => ({
  id,
  trackingId: r.trackingId ?? '',
  items: r.items ?? [],
  subtotal: num(r.subtotal),
  shippingFee: num(r.shippingFee),
  discount: num(r.discount),
  total: num(r.total),
  customerName: r.customerName ?? '',
  phone: r.phone ?? '',
  address: r.address ?? '',
  city: r.city ?? '',
  province: r.province ?? '',
  postalCode: r.postalCode ?? '',
  paymentMethod: r.paymentMethod,
  paymentStatus: r.paymentStatus,
  status: r.status,
  promoCode: r.promoCode ?? undefined,
  createdAt: r.createdAt ?? '',
});

const orderToDoc = (o: Order): Row => ({
  trackingId: o.trackingId,
  items: o.items,
  subtotal: o.subtotal,
  shippingFee: o.shippingFee,
  discount: o.discount,
  total: o.total,
  customerName: o.customerName,
  phone: o.phone,
  address: o.address,
  city: o.city,
  province: o.province,
  postalCode: o.postalCode ?? '',
  paymentMethod: o.paymentMethod,
  paymentStatus: o.paymentStatus,
  status: o.status,
  promoCode: o.promoCode ?? null,
  createdAt: o.createdAt,
});

// ---------- helpers ----------

// Lists the documents of a query/collection snapshot, oldest "position" first.
function inOrder(snap: QuerySnapshot) {
  return snap.docs
    .slice()
    .sort((a, b) => Number(a.data().position ?? 0) - Number(b.data().position ?? 0));
}

// Runs a read; if it fails the error is logged and null is returned, so one failed read does not blank the whole shop.
async function safe<T>(task: Promise<T>): Promise<T | null> {
  try {
    return await task;
  } catch (err) {
    console.error('Database read failed', err);
    return null;
  }
}

function authMessage(err: unknown): string {
  const code = (err as { code?: string } | null)?.code ?? '';
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-email'
  ) {
    return 'Wrong email or password.';
  }
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait a few minutes and try again.';
  if (code === 'auth/network-request-failed') return 'No internet connection.';
  return (err as { message?: string } | null)?.message ?? 'Login failed.';
}

// Firestore documents are limited to 1 MB, so pictures picked in the admin panel (base64 "data:" strings)
// are shrunk and compressed before saving. Normal web addresses (https://...) are left untouched.
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That image could not be read.'));
    img.src = src;
  });
}

async function compressImage(value: string, maxSize = 1000, keepTransparency = false): Promise<string> {
  if (!value.startsWith('data:')) return value;
  const img = await loadImage(value);
  if (!img.width || !img.height) return value;
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return value;
  if (!keepTransparency) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);
  return keepTransparency ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.8);
}

const MAX_DOC_CHARS = 900_000;
function assertFits(data: unknown, what: string) {
  if (JSON.stringify(data).length > MAX_DOC_CHARS) {
    throw new Error(`This ${what} is too large to save. Use fewer or smaller images.`);
  }
}

async function checkAdmin(): Promise<boolean> {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return false;
  try {
    return (await getDoc(doc(db, COL.admins, user.uid))).exists();
  } catch {
    return false;
  }
}

async function insertOrder(o: Order) {
  const trackRef = doc(db, COL.tracking, o.trackingId);
  // the tracking record is public, so its existence tells us this order was already saved on an earlier try
  if ((await getDoc(trackRef)).exists()) return;
  const batch = writeBatch(db);
  batch.set(doc(db, COL.orders, o.id), orderToDoc(o));
  batch.set(trackRef, { status: o.status, paymentStatus: o.paymentStatus });
  await batch.commit();
}

// Fills an EMPTY database with the sample store (categories, products, banners, promo code, settings, reviews).
async function seedSampleData() {
  const batch = writeBatch(db);
  seedCategories.forEach((c, i) =>
    batch.set(doc(db, COL.categories, c.id), { name: c.name, icon: c.icon, slug: c.slug, image: c.image ?? null, position: i })
  );
  seedProducts.forEach((p, i) =>
    batch.set(doc(db, COL.products, p.id), { ...productToDoc(p), createdAt: p.createdAt, position: i })
  );
  seedBanners.forEach((b, i) => batch.set(doc(db, COL.banners, b.id), { ...bannerToDoc(b), position: i }));
  seedPromos.forEach((p) => batch.set(doc(db, COL.promoCodes, p.id), promoToDoc(p)));
  seedReviews.forEach((r) => batch.set(doc(db, COL.reviews, r.id), reviewToDoc(r)));
  batch.set(doc(db, COL.settings, SETTINGS_DOC), seedSettings);
  await batch.commit();
}

interface StoreContextValue {
  loading: boolean;

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

  // customers (built from orders, admin only)
  customers: Customer[];

  // admin auth (Firebase Auth)
  isAdmin: boolean;
  loginAdmin: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logoutAdmin: () => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>(() => loadLS<Product[]>(LS_KEYS.cacheProducts, []));
  const [categoriesState, setCategoriesState] = useState<Category[]>(() =>
    loadLS<Category[]>(LS_KEYS.cacheCategories, [])
  );
  const [promoBannersState, setPromoBannersState] = useState<PromoBanner[]>(() =>
    loadLS<PromoBanner[]>(LS_KEYS.cacheBanners, [])
  );
  const [settings, setSettings] = useState<StoreSettings>(() =>
    loadLS<StoreSettings>(LS_KEYS.cacheSettings, seedSettings)
  );
  const [reviewsState, setReviewsState] = useState<Review[]>([]);
  const [promoCodesState, setPromoCodesState] = useState<PromoCode[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>(() => loadLS<Order[]>(LS_KEYS.myOrders, []));
  const [cart, setCart] = useState<CartItem[]>(() => loadLS<CartItem[]>(LS_KEYS.cart, []));
  const [appliedPromo, setAppliedPromo] = useState<string | null>(() =>
    loadLS<string | null>(LS_KEYS.appliedPromo, null)
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem(LS_KEYS.adminHint) === 'true');

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => saveLS(LS_KEYS.cacheProducts, products), [products]);
  useEffect(() => saveLS(LS_KEYS.cacheCategories, categoriesState), [categoriesState]);
  useEffect(() => saveLS(LS_KEYS.cacheBanners, promoBannersState), [promoBannersState]);
  useEffect(() => saveLS(LS_KEYS.cacheSettings, settings), [settings]);
  useEffect(() => saveLS(LS_KEYS.cart, cart), [cart]);
  useEffect(() => saveLS(LS_KEYS.myOrders, myOrders), [myOrders]);
  useEffect(() => saveLS(LS_KEYS.appliedPromo, appliedPromo), [appliedPromo]);

  const orders = isAdmin ? adminOrders : myOrders;

  // ---- loading from the database ----
  const flushingRef = useRef(false);
  const flushAgainRef = useRef(false);

  const loadAll = async (admin: boolean, allowSeed = true): Promise<void> => {
    const reviewsSource = admin
      ? collection(db, COL.reviews)
      : query(collection(db, COL.reviews), where('approved', '==', true));
    const [cats, prods, banners, sett, revs, promos] = await Promise.all([
      safe(getDocs(collection(db, COL.categories))),
      safe(getDocs(collection(db, COL.products))),
      safe(getDocs(collection(db, COL.banners))),
      safe(getDoc(doc(db, COL.settings, SETTINGS_DOC))),
      safe(getDocs(reviewsSource)),
      safe(getDocs(collection(db, COL.promoCodes))),
    ]);

    // First ever admin login on a brand-new database: fill it with the sample store.
    if (admin && allowSeed && cats?.empty && prods?.empty && sett && !sett.exists()) {
      try {
        await seedSampleData();
        return loadAll(admin, false);
      } catch (err) {
        console.error('Could not add the sample data', err);
      }
    }

    if (cats) setCategoriesState(inOrder(cats).map((d) => docToCategory(d.id, d.data())));
    if (prods) setProducts(inOrder(prods).map((d) => docToProduct(d.id, d.data())));
    if (banners) setPromoBannersState(inOrder(banners).map((d) => docToBanner(d.id, d.data())));
    if (sett && sett.exists()) setSettings({ ...seedSettings, ...(sett.data() as Partial<StoreSettings>) });
    if (revs) {
      setReviewsState(
        revs.docs.map((d) => docToReview(d.id, d.data())).sort((a, b) => a.date.localeCompare(b.date))
      );
    }
    if (promos) setPromoCodesState(promos.docs.map((d) => docToPromo(d.id, d.data())));

    if (admin) {
      const ord = await safe(getDocs(collection(db, COL.orders)));
      if (ord) {
        setAdminOrders(
          ord.docs.map((d) => docToOrder(d.id, d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        );
      }
    } else {
      setAdminOrders([]);
    }
  };

  // Orders that could not be saved (bad connection etc.) are kept and retried.
  const flushPendingOrders = async (): Promise<void> => {
    if (flushingRef.current) {
      flushAgainRef.current = true;
      return;
    }
    flushingRef.current = true;
    try {
      const pending = loadLS<Order[]>(LS_KEYS.pendingOrders, []);
      if (pending.length === 0) return;
      const saved = new Set<string>();
      for (const o of pending) {
        try {
          await insertOrder(o);
          saved.add(o.id);
        } catch (err) {
          console.error('Order not saved yet, will retry', err);
        }
      }
      const current = loadLS<Order[]>(LS_KEYS.pendingOrders, []);
      saveLS(
        LS_KEYS.pendingOrders,
        current.filter((o) => !saved.has(o.id))
      );
    } finally {
      flushingRef.current = false;
    }
    if (flushAgainRef.current) {
      flushAgainRef.current = false;
      await flushPendingOrders();
    }
  };

  // Shoppers see the latest status of orders they placed on this device.
  const refreshMyOrders = async () => {
    const mine = loadLS<Order[]>(LS_KEYS.myOrders, []).slice(0, 20);
    if (mine.length === 0) return;
    const updated = await Promise.all(
      mine.map(async (o) => {
        try {
          const snap = await getDoc(doc(db, COL.tracking, o.trackingId));
          if (!snap.exists()) return o;
          const d = snap.data();
          return { ...o, status: d.status as OrderStatus, paymentStatus: d.paymentStatus as PaymentStatus };
        } catch {
          return o;
        }
      })
    );
    setMyOrders((prev) => prev.map((o) => updated.find((u) => u.id === o.id) ?? o));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const admin = await checkAdmin();
      if (cancelled) return;
      setIsAdmin(admin);
      if (admin) localStorage.setItem(LS_KEYS.adminHint, 'true');
      else localStorage.removeItem(LS_KEYS.adminHint);
      await loadAll(admin);
      if (cancelled) return;
      setLoading(false);
      await flushPendingOrders();
      if (!admin) await refreshMyOrders();
    })().catch((err) => {
      console.error('Could not load store data', err);
      setLoading(false);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setIsAdmin(false);
        localStorage.removeItem(LS_KEYS.adminHint);
      }
    });
    // when the internet comes back, try to save any orders that were waiting
    const onOnline = () => void flushPendingOrders();
    window.addEventListener('online', onOnline);
    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener('online', onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Runs a database write. If it fails the admin is told, and the screen is reloaded to show the real data.
  const run = (label: string, task: () => Promise<void>) => {
    task().catch((err: unknown) => {
      console.error(`Could not ${label}`, err);
      const code = (err as { code?: string } | null)?.code;
      const msg =
        code === 'permission-denied'
          ? 'Permission denied. Your admin session may have expired, please log in again.'
          : ((err as { message?: string } | null)?.message ?? '');
      window.alert(`Could not ${label}. ${msg}`);
      void loadAll(isAdmin, false);
    });
  };

  // ---- catalog ----
  const addProduct: StoreContextValue['addProduct'] = (p) => {
    const id = genId('p');
    const createdAt = today();
    setProducts((prev) => [...prev, { ...p, id, createdAt }]);
    run('save the product', async () => {
      const images = await Promise.all(p.images.map((i) => compressImage(i)));
      const data = { ...productToDoc({ ...p, images }), createdAt, position: Date.now() };
      assertFits(data, 'product');
      await setDoc(doc(db, COL.products, id), data);
      setProducts((prev) => prev.map((x) => (x.id === id ? { ...x, images } : x)));
    });
  };
  const updateProduct: StoreContextValue['updateProduct'] = (id, patch) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    run('save the product', async () => {
      const finalPatch: Partial<Product> = { ...patch };
      delete finalPatch.id;
      delete finalPatch.createdAt;
      if (patch.images) finalPatch.images = await Promise.all(patch.images.map((i) => compressImage(i)));
      const data = productToDoc(finalPatch);
      assertFits(data, 'product');
      await updateDoc(doc(db, COL.products, id), data);
      const images = finalPatch.images;
      if (images) setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, images } : p)));
    });
  };
  const deleteProduct: StoreContextValue['deleteProduct'] = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    run('delete the product', async () => {
      await deleteDoc(doc(db, COL.products, id));
    });
  };

  // ---- cart (stays on the shopper's device) ----
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
    const promo = promoCodesState.find((p) => p.code.toUpperCase() === code.trim().toUpperCase());
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

    setMyOrders((prev) => [order, ...prev]);
    if (isAdmin) setAdminOrders((prev) => [order, ...prev]);

    // save to the database (kept in a retry list until it is confirmed saved)
    saveLS(LS_KEYS.pendingOrders, [...loadLS<Order[]>(LS_KEYS.pendingOrders, []), order]);
    void flushPendingOrders();

    clearCart();
    removePromoCode();
    return order;
  };

  // updates the order and its public tracking record together
  const saveOrderFields = async (id: string, fields: { status?: OrderStatus; paymentStatus?: PaymentStatus }) => {
    const order = adminOrders.find((o) => o.id === id);
    const batch = writeBatch(db);
    batch.update(doc(db, COL.orders, id), fields);
    if (order) batch.set(doc(db, COL.tracking, order.trackingId), fields, { merge: true });
    await batch.commit();
  };
  const updateOrderStatus: StoreContextValue['updateOrderStatus'] = (id, status) => {
    setAdminOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setMyOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    run('update the order', () => saveOrderFields(id, { status }));
  };
  const updateOrderPaymentStatus: StoreContextValue['updateOrderPaymentStatus'] = (id, paymentStatus) => {
    setAdminOrders((prev) => prev.map((o) => (o.id === id ? { ...o, paymentStatus } : o)));
    setMyOrders((prev) => prev.map((o) => (o.id === id ? { ...o, paymentStatus } : o)));
    run('update the order', () => saveOrderFields(id, { paymentStatus }));
  };
  const findOrderByTrackingId: StoreContextValue['findOrderByTrackingId'] = (trackingId) =>
    orders.find((o) => o.trackingId.toLowerCase() === trackingId.trim().toLowerCase());

  // customers are built from the orders (admin only)
  const customers = useMemo<Customer[]>(() => {
    const map = new Map<string, Customer>();
    for (const o of [...adminOrders].reverse()) {
      const existing = map.get(o.phone);
      if (existing) {
        if (!existing.addresses.includes(o.address)) existing.addresses.push(o.address);
        existing.orderIds.push(o.id);
      } else {
        map.set(o.phone, {
          id: `cust_${o.phone}`,
          name: o.customerName,
          phone: o.phone,
          addresses: [o.address],
          orderIds: [o.id],
        });
      }
    }
    return Array.from(map.values());
  }, [adminOrders]);

  // ---- reviews ----
  const submitReview: StoreContextValue['submitReview'] = (r) => {
    const review: Review = { ...r, id: genId('rev'), date: today(), approved: false };
    setReviewsState((prev) => [...prev, review]);
    run('submit the review', async () => {
      await setDoc(doc(db, COL.reviews, review.id), reviewToDoc(review));
    });
  };
  const approveReview: StoreContextValue['approveReview'] = (id) => {
    setReviewsState((prev) => prev.map((r) => (r.id === id ? { ...r, approved: true } : r)));
    run('approve the review', async () => {
      await updateDoc(doc(db, COL.reviews, id), { approved: true });
    });
  };
  const rejectReview: StoreContextValue['rejectReview'] = (id) => {
    setReviewsState((prev) => prev.filter((r) => r.id !== id));
    run('delete the review', async () => {
      await deleteDoc(doc(db, COL.reviews, id));
    });
  };

  // ---- promo codes admin ----
  const addPromoCode: StoreContextValue['addPromoCode'] = (p) => {
    const promo: PromoCode = { ...p, id: genId('promo') };
    setPromoCodesState((prev) => [...prev, promo]);
    run('save the promo code', async () => {
      await setDoc(doc(db, COL.promoCodes, promo.id), promoToDoc(promo));
    });
  };
  const updatePromoCode: StoreContextValue['updatePromoCode'] = (id, patch) => {
    setPromoCodesState((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    run('save the promo code', async () => {
      await updateDoc(doc(db, COL.promoCodes, id), promoToDoc(patch));
    });
  };
  const deletePromoCode: StoreContextValue['deletePromoCode'] = (id) => {
    setPromoCodesState((prev) => prev.filter((p) => p.id !== id));
    run('delete the promo code', async () => {
      await deleteDoc(doc(db, COL.promoCodes, id));
    });
  };

  // ---- settings ----
  const updateSettings: StoreContextValue['updateSettings'] = (patch) => {
    const merged: StoreSettings = { ...settingsRef.current, ...patch };
    setSettings(merged);
    run('save the settings', async () => {
      const heroImage = await compressImage(merged.heroImage, 1600);
      const logoUrl = merged.logoUrl ? await compressImage(merged.logoUrl, 400, true) : undefined;
      const final: StoreSettings = { ...merged, heroImage, logoUrl };
      assertFits(final, 'settings');
      await setDoc(doc(db, COL.settings, SETTINGS_DOC), final);
      setSettings((prev) => ({
        ...prev,
        heroImage: prev.heroImage === merged.heroImage ? heroImage : prev.heroImage,
        logoUrl: prev.logoUrl === merged.logoUrl ? logoUrl : prev.logoUrl,
      }));
    });
  };

  // ---- homepage content ----
  const updateCategoryImage: StoreContextValue['updateCategoryImage'] = (id, image) => {
    setCategoriesState((prev) => prev.map((c) => (c.id === id ? { ...c, image } : c)));
    run('save the category image', async () => {
      const url = await compressImage(image, 800);
      assertFits({ image: url }, 'image');
      await updateDoc(doc(db, COL.categories, id), { image: url });
      setCategoriesState((prev) => prev.map((c) => (c.id === id && c.image === image ? { ...c, image: url } : c)));
    });
  };
  const addPromoBanner: StoreContextValue['addPromoBanner'] = (b) => {
    const banner: PromoBanner = { ...b, id: genId('banner') };
    setPromoBannersState((prev) => [...prev, banner]);
    run('save the banner', async () => {
      const image = await compressImage(banner.image, 1000);
      const data = { ...bannerToDoc({ ...banner, image }), position: Date.now() };
      assertFits(data, 'banner');
      await setDoc(doc(db, COL.banners, banner.id), data);
      setPromoBannersState((prev) => prev.map((x) => (x.id === banner.id ? { ...x, image } : x)));
    });
  };
  const updatePromoBanner: StoreContextValue['updatePromoBanner'] = (id, patch) => {
    setPromoBannersState((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    run('save the banner', async () => {
      const finalPatch: Partial<PromoBanner> = { ...patch };
      delete finalPatch.id;
      if (patch.image) finalPatch.image = await compressImage(patch.image, 1000);
      const data = bannerToDoc(finalPatch);
      assertFits(data, 'banner');
      await updateDoc(doc(db, COL.banners, id), data);
      const image = finalPatch.image;
      if (image && patch.image) {
        setPromoBannersState((prev) =>
          prev.map((b) => (b.id === id && b.image === patch.image ? { ...b, image } : b))
        );
      }
    });
  };
  const deletePromoBanner: StoreContextValue['deletePromoBanner'] = (id) => {
    setPromoBannersState((prev) => prev.filter((b) => b.id !== id));
    run('delete the banner', async () => {
      await deleteDoc(doc(db, COL.banners, id));
    });
  };

  // ---- admin auth ----
  const loginAdmin: StoreContextValue['loginAdmin'] = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      return { ok: false, message: authMessage(err) };
    }
    if (!(await checkAdmin())) {
      await signOut(auth);
      return { ok: false, message: 'This account is not an admin.' };
    }
    setIsAdmin(true);
    localStorage.setItem(LS_KEYS.adminHint, 'true');
    await loadAll(true);
    return { ok: true };
  };
  const logoutAdmin = () => {
    void signOut(auth);
    setIsAdmin(false);
    localStorage.removeItem(LS_KEYS.adminHint);
    setAdminOrders([]);
    void loadAll(false, false);
  };

  const value: StoreContextValue = {
    loading,
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