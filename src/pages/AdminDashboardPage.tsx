import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Plus, Trash2, X, Upload } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Product, OrderStatus, PaymentStatus } from '../types';

type Tab = 'overview' | 'content' | 'products' | 'orders' | 'reviews' | 'promos' | 'settings';

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminDashboardPage() {
  const { isAdmin, logoutAdmin } = useStore();
  const [tab, setTab] = useState<Tab>('overview');
  const navigate = useNavigate();

  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'content', label: 'Homepage Content' },
    { key: 'products', label: 'Products' },
    { key: 'orders', label: 'Orders' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'promos', label: 'Promo Codes' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-ink text-cream px-6 py-4 flex items-center justify-between">
        <h1 className="font-display text-xl">Admin Dashboard</h1>
        <button
          onClick={() => {
            logoutAdmin();
            navigate('/');
          }}
          className="text-sm border border-cream/30 rounded-full px-4 py-1.5 hover:bg-cream hover:text-ink"
        >
          Log out
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-2 overflow-x-auto mb-8 border-b border-line">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 shrink-0 ${
                tab === t.key ? 'border-gold-deep text-ink' : 'border-transparent text-charcoal/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab />}
        {tab === 'content' && <ContentTab />}
        {tab === 'products' && <ProductsTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'reviews' && <ReviewsTab />}
        {tab === 'promos' && <PromosTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line rounded-xl p-5 bg-white">
      <p className="text-xs text-charcoal/60 mb-1">{label}</p>
      <p className="font-display text-2xl text-ink">{value}</p>
    </div>
  );
}

function OverviewTab() {
  const { orders, products, customers } = useStore();
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const lowStock = products.filter((p) => p.stock <= 5);

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Revenue" value={`Rs ${revenue.toLocaleString()}`} />
        <StatCard label="Total Orders" value={String(orders.length)} />
        <StatCard label="Active Customers" value={String(customers.length)} />
        <StatCard label="Low Stock Items" value={String(lowStock.length)} />
      </div>
      {lowStock.length > 0 && (
        <div className="border border-clay/30 bg-clay/5 rounded-xl p-5">
          <h3 className="font-medium text-sm mb-2 text-clay">Low stock alerts</h3>
          <ul className="text-sm space-y-1">
            {lowStock.map((p) => (
              <li key={p.id}>
                {p.name} — {p.stock} left
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ContentTab() {
  const {
    settings,
    updateSettings,
    categories,
    updateCategoryImage,
    promoBanners,
    addPromoBanner,
    updatePromoBanner,
    deletePromoBanner,
    products,
  } = useStore();

  const [newBannerLabel, setNewBannerLabel] = useState('');
  const [newBannerLinkType, setNewBannerLinkType] = useState<'product' | 'category'>('product');
  const [newBannerLink, setNewBannerLink] = useState(products[0]?.id ?? '');
  const [newBannerImage, setNewBannerImage] = useState<string | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateSettings({ logoUrl: await readFileAsDataURL(file) });
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateSettings({ heroImage: await readFileAsDataURL(file) });
  };

  const handleCategoryUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateCategoryImage(id, await readFileAsDataURL(file));
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewBannerImage(await readFileAsDataURL(file));
  };

  const handleAddBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerImage || !newBannerLabel.trim() || !newBannerLink) return;
    addPromoBanner({
      image: newBannerImage,
      label: newBannerLabel.trim(),
      linkType: newBannerLinkType,
      link: newBannerLink,
    });
    setNewBannerLabel('');
    setNewBannerImage(null);
  };

  const handleBannerReplaceImage = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updatePromoBanner(id, { image: await readFileAsDataURL(file) });
  };

  return (
    <div className="space-y-12 max-w-3xl">
      {/* logo */}
      <div>
        <h2 className="font-display text-xl mb-1">Site Logo</h2>
        <p className="text-sm text-charcoal/60 mb-4">
          Shown in the header in place of the store name. Upload a transparent PNG or SVG for best results.
        </p>
        <div className="flex items-center gap-4">
          <div className="w-24 h-16 border border-line rounded-lg bg-white flex items-center justify-center overflow-hidden">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-xs text-charcoal/40">No logo</span>
            )}
          </div>
          <label className="text-sm font-medium border border-line rounded-full px-4 py-2 flex items-center gap-1.5 cursor-pointer">
            <Upload size={14} /> Upload logo
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>
          {settings.logoUrl && (
            <button
              onClick={() => updateSettings({ logoUrl: undefined })}
              className="text-sm text-clay font-medium"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* hero banner */}
      <div>
        <h2 className="font-display text-xl mb-1">Homepage Hero Banner</h2>
        <p className="text-sm text-charcoal/60 mb-4">The large image at the top of the homepage.</p>
        <div className="w-full max-w-md aspect-[16/7] border border-line rounded-xl overflow-hidden mb-3 bg-white">
          <img src={settings.heroImage} alt="Hero" className="w-full h-full object-cover" />
        </div>
        <label className="text-sm font-medium border border-line rounded-full px-4 py-2 inline-flex items-center gap-1.5 cursor-pointer">
          <Upload size={14} /> Upload new banner image
          <input type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
        </label>
      </div>

      {/* category images */}
      <div>
        <h2 className="font-display text-xl mb-1">Category Images</h2>
        <p className="text-sm text-charcoal/60 mb-4">
          Shown in the circular category rail on the homepage. Falls back to an icon until you upload one.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 border border-line rounded-xl p-3 bg-white">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-line bg-cream shrink-0">
                {c.image && <img src={c.image} alt="" className="w-full h-full object-cover" />}
              </div>
              <span className="text-sm font-medium flex-1">{c.name}</span>
              <label className="text-xs font-medium border border-line rounded-full px-3 py-1.5 cursor-pointer">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleCategoryUpload(c.id, e)}
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* promo banner tiles */}
      <div>
        <h2 className="font-display text-xl mb-1">Promo Banner Tiles</h2>
        <p className="text-sm text-charcoal/60 mb-4">
          The "Shop the Edit" image grid on the homepage. Point each tile at a specific product or a whole
          category — clicking the image takes shoppers straight there.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {promoBanners.map((b) => (
            <div key={b.id} className="flex items-center gap-3 border border-line rounded-xl p-3 bg-white">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-cream shrink-0">
                <img src={b.image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <input
                  value={b.label}
                  onChange={(e) => updatePromoBanner(b.id, { label: e.target.value })}
                  className="text-sm font-medium w-full border-b border-transparent focus:border-line outline-none mb-1"
                />
                <div className="flex gap-1.5">
                  <select
                    value={b.linkType}
                    onChange={(e) => {
                      const linkType = e.target.value as 'product' | 'category';
                      const link = linkType === 'product' ? products[0]?.id ?? '' : categories[0]?.slug ?? '';
                      updatePromoBanner(b.id, { linkType, link });
                    }}
                    className="text-xs bg-white border border-line rounded px-1.5 py-1"
                  >
                    <option value="product">Product</option>
                    <option value="category">Category</option>
                  </select>
                  {b.linkType === 'product' ? (
                    <select
                      value={b.link}
                      onChange={(e) => updatePromoBanner(b.id, { link: e.target.value })}
                      className="text-xs bg-white border border-line rounded px-1.5 py-1 flex-1 min-w-0"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={b.link}
                      onChange={(e) => updatePromoBanner(b.id, { link: e.target.value })}
                      className="text-xs bg-white border border-line rounded px-1.5 py-1 flex-1 min-w-0"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <label className="text-xs font-medium border border-line rounded-full px-3 py-1.5 cursor-pointer shrink-0">
                Replace
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleBannerReplaceImage(b.id, e)}
                />
              </label>
              <button onClick={() => deletePromoBanner(b.id)} className="text-charcoal/40 hover:text-clay shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddBanner} className="border border-line rounded-xl p-4 bg-white space-y-3">
          <h3 className="text-sm font-medium">Add a new tile</h3>
          <input
            placeholder="Label, e.g. Weekend Deals"
            value={newBannerLabel}
            onChange={(e) => setNewBannerLabel(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <select
              value={newBannerLinkType}
              onChange={(e) => {
                const linkType = e.target.value as 'product' | 'category';
                setNewBannerLinkType(linkType);
                setNewBannerLink(linkType === 'product' ? products[0]?.id ?? '' : categories[0]?.slug ?? '');
              }}
              className="border border-line rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="product">Links to a product</option>
              <option value="category">Links to a category</option>
            </select>
            {newBannerLinkType === 'product' ? (
              <select
                value={newBannerLink}
                onChange={(e) => setNewBannerLink(e.target.value)}
                className="flex-1 min-w-0 border border-line rounded-lg px-3 py-2 text-sm bg-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={newBannerLink}
                onChange={(e) => setNewBannerLink(e.target.value)}
                className="flex-1 min-w-0 border border-line rounded-lg px-3 py-2 text-sm bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-3">
            {newBannerImage && (
              <img src={newBannerImage} alt="" className="w-12 h-12 rounded-lg object-cover" />
            )}
            <label className="text-xs font-medium border border-line rounded-full px-3 py-1.5 cursor-pointer flex items-center gap-1">
              <Upload size={12} /> Choose image
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerImageUpload} />
            </label>
          </div>
          <button
            type="submit"
            disabled={!newBannerImage || !newBannerLabel.trim()}
            className="bg-ink text-cream px-5 py-2 rounded-full text-sm font-medium disabled:opacity-40"
          >
            Add tile
          </button>
        </form>
      </div>
    </div>
  );
}

function emptyProduct(defaultCategorySlug: string): Omit<Product, 'id' | 'createdAt'> {
  return {
    name: '',
    description: '',
    category: defaultCategorySlug,
    price: 0,
    images: [],
    variants: [{ id: 'v1', label: 'Standard', stock: 0 }],
    stock: 0,
    rating: 0,
    reviewCount: 0,
    featured: false,
  };
}

function ProductsTab() {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useStore();
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Omit<Product, 'id' | 'createdAt'>>(emptyProduct(categories[0]?.slug ?? ''));
  const [showForm, setShowForm] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const startNew = () => {
    setEditing(null);
    setDraft(emptyProduct(categories[0]?.slug ?? ''));
    setShowForm(true);
  };

  const startEdit = (p: Product) => {
    setEditing(p);
    setDraft(p);
    setShowForm(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((d) => ({ ...d, images: [...d.images, reader.result as string] }));
    };
    reader.readAsDataURL(file);
  };

  const addImageUrl = () => {
    if (imageUrl.trim()) {
      setDraft((d) => ({ ...d, images: [...d.images, imageUrl.trim()] }));
      setImageUrl('');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateProduct(editing.id, draft);
    else addProduct(draft);
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-xl">Products</h2>
        <button
          onClick={startNew}
          className="flex items-center gap-1.5 bg-ink text-cream px-4 py-2 rounded-full text-sm font-medium"
        >
          <Plus size={16} /> New product
        </button>
      </div>

      <div className="grid gap-3">
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-4 border border-line rounded-xl p-3 bg-white">
            <img src={p.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover" />
            <div className="flex-1">
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-xs text-charcoal/60">
                Rs {p.price.toLocaleString()} · {p.stock} in stock
              </p>
            </div>
            <button onClick={() => startEdit(p)} className="text-sm font-medium text-gold-deep">
              Edit
            </button>
            <button onClick={() => deleteProduct(p.id)} className="text-charcoal/40 hover:text-clay">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="bg-cream rounded-2xl p-6 w-full max-w-lg my-8 max-h-[90vh] overflow-y-auto space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-display text-lg">{editing ? 'Edit product' : 'New product'}</h3>
              <button type="button" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>

            <input
              required
              placeholder="Product name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full border border-line rounded-lg px-4 py-2 text-sm"
            />
            <textarea
              placeholder="Description"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={3}
              className="w-full border border-line rounded-lg px-4 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                required
                placeholder="Price"
                value={draft.price || ''}
                onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                className="border border-line rounded-lg px-4 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Stock"
                value={draft.stock || ''}
                onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })}
                className="border border-line rounded-lg px-4 py-2 text-sm"
              />
            </div>
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              className="w-full border border-line rounded-lg px-4 py-2 text-sm bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            <div>
              <label className="text-xs font-medium block mb-1">Images</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {draft.images.map((img, i) => (
                  <div key={i} className="relative w-14 h-14">
                    <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, images: d.images.filter((_, idx) => idx !== i) }))}
                      className="absolute -top-1.5 -right-1.5 bg-clay text-white rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 border border-line rounded-lg px-3 py-1.5 text-xs"
                />
                <button type="button" onClick={addImageUrl} className="text-xs font-medium border border-line rounded-lg px-3">
                  Add
                </button>
                <label className="text-xs font-medium border border-line rounded-lg px-3 flex items-center gap-1 cursor-pointer">
                  <Upload size={12} /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
              />
              Feature on homepage
            </label>

            <button
              type="submit"
              className="w-full bg-ink text-cream py-3 rounded-full text-sm font-medium hover:bg-gold-deep hover:text-ink"
            >
              {editing ? 'Save changes' : 'Create product'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function OrdersTab() {
  const { orders, updateOrderStatus, updateOrderPaymentStatus } = useStore();
  const [filter, setFilter] = useState<OrderStatus | 'All'>('All');
  const statuses: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const paymentStatuses: PaymentStatus[] = ['Unpaid', 'Paid', 'Refunded'];

  const filtered = filter === 'All' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-display text-xl mr-4">Orders</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as OrderStatus | 'All')}
          className="border border-line rounded-full px-4 py-1.5 text-sm bg-white"
        >
          <option>All</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <p className="text-sm text-charcoal/60">No orders in this view yet.</p>}
        {filtered.map((o) => (
          <div key={o.id} className="border border-line rounded-xl p-4 bg-white flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[160px]">
              <p className="font-medium text-sm">{o.trackingId}</p>
              <p className="text-xs text-charcoal/60">{o.customerName} · {o.phone}</p>
            </div>
            <p className="text-sm font-medium">Rs {o.total.toLocaleString()}</p>
            <select
              value={o.status}
              onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
              className="border border-line rounded-full px-3 py-1.5 text-xs bg-white"
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              value={o.paymentStatus}
              onChange={(e) => updateOrderPaymentStatus(o.id, e.target.value as PaymentStatus)}
              className="border border-line rounded-full px-3 py-1.5 text-xs bg-white"
            >
              {paymentStatuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsTab() {
  const { reviews, products, approveReview, rejectReview } = useStore();
  const pending = reviews.filter((r) => !r.approved);
  const approved = reviews.filter((r) => r.approved);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display text-xl mb-4">Pending Reviews</h2>
        {pending.length === 0 && <p className="text-sm text-charcoal/60">Nothing waiting for approval.</p>}
        <div className="space-y-3">
          {pending.map((r) => {
            const product = products.find((p) => p.id === r.productId);
            return (
              <div key={r.id} className="border border-line rounded-xl p-4 bg-white">
                <p className="text-sm font-medium">{product?.name}</p>
                <p className="text-xs text-charcoal/60 mb-2">
                  {r.customerName} · {r.rating}★
                </p>
                <p className="text-sm mb-3">{r.comment}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveReview(r.id)}
                    className="text-xs font-medium bg-ink text-cream px-4 py-1.5 rounded-full"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectReview(r.id)}
                    className="text-xs font-medium border border-line px-4 py-1.5 rounded-full"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl mb-4">Approved Reviews</h2>
        <div className="space-y-2">
          {approved.map((r) => (
            <div key={r.id} className="text-sm border-b border-line pb-2">
              {r.customerName} — {r.rating}★ — {r.comment}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PromosTab() {
  const { promoCodes, addPromoCode, updatePromoCode, deletePromoCode } = useStore();
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState(10);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    addPromoCode({ code: code.trim().toUpperCase(), discountPercent: discount, active: true });
    setCode('');
    setDiscount(10);
  };

  return (
    <div>
      <h2 className="font-display text-xl mb-4">Promo Codes</h2>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          placeholder="CODE"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="border border-line rounded-lg px-4 py-2 text-sm"
        />
        <input
          type="number"
          value={discount}
          onChange={(e) => setDiscount(Number(e.target.value))}
          className="w-24 border border-line rounded-lg px-4 py-2 text-sm"
        />
        <span className="self-center text-sm text-charcoal/60">%</span>
        <button type="submit" className="bg-ink text-cream px-4 py-2 rounded-full text-sm font-medium">
          Add
        </button>
      </form>

      <div className="space-y-2">
        {promoCodes.map((p) => (
          <div key={p.id} className="flex items-center gap-4 border border-line rounded-xl p-3 bg-white">
            <span className="font-medium text-sm flex-1">{p.code}</span>
            <span className="text-sm">{p.discountPercent}% off</span>
            <button
              onClick={() => updatePromoCode(p.id, { active: !p.active })}
              className={`text-xs font-medium px-3 py-1 rounded-full ${
                p.active ? 'bg-gold/20 text-gold-deep' : 'bg-line text-charcoal/60'
              }`}
            >
              {p.active ? 'Active' : 'Inactive'}
            </button>
            <button onClick={() => deletePromoCode(p.id)} className="text-charcoal/40 hover:text-clay">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab() {
  const { settings, updateSettings } = useStore();
  const [form, setForm] = useState(settings);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
  };

  return (
    <form onSubmit={handleSave} className="max-w-lg space-y-4">
      <h2 className="font-display text-xl mb-2">Store Settings</h2>
      <div>
        <label className="text-xs font-medium block mb-1">Store name</label>
        <input
          value={form.storeName}
          onChange={(e) => setForm({ ...form, storeName: e.target.value })}
          className="w-full border border-line rounded-lg px-4 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium block mb-1">Shipping fee (Rs)</label>
          <input
            type="number"
            value={form.shippingFee}
            onChange={(e) => setForm({ ...form, shippingFee: Number(e.target.value) })}
            className="w-full border border-line rounded-lg px-4 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Free shipping over (Rs)</label>
          <input
            type="number"
            value={form.freeShippingThreshold}
            onChange={(e) => setForm({ ...form, freeShippingThreshold: Number(e.target.value) })}
            className="w-full border border-line rounded-lg px-4 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium block mb-1">Hero headline</label>
        <input
          value={form.heroHeadline}
          onChange={(e) => setForm({ ...form, heroHeadline: e.target.value })}
          className="w-full border border-line rounded-lg px-4 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1">Hero subheadline</label>
        <input
          value={form.heroSubheadline}
          onChange={(e) => setForm({ ...form, heroSubheadline: e.target.value })}
          className="w-full border border-line rounded-lg px-4 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1">Announcement bar text</label>
        <input
          value={form.announcementText}
          onChange={(e) => setForm({ ...form, announcementText: e.target.value })}
          className="w-full border border-line rounded-lg px-4 py-2 text-sm"
        />
      </div>
      <button type="submit" className="bg-ink text-cream px-6 py-3 rounded-full text-sm font-medium">
        Save settings
      </button>
    </form>
  );
}
