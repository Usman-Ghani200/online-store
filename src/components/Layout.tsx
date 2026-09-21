import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  MapPin,
  MessageCircle,
  Home as HomeIcon,
  Percent,
  Truck,
  FileText,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Layout() {
  const { cart, settings, categories } = useStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const cartCount = cart.reduce((n, c) => n + c.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Shop All', to: '/products' },
    ...categories.slice(0, 5).map((c) => ({ label: c.name, to: `/products?category=${c.slug}` })),
    { label: 'Track Order', to: '/track-order' },
  ];

  // rows for the mobile drawer, styled like a Shopify-style category menu:
  // icon + label on the left, an optional badge or accent color on the right/text
  const drawerTopLinks = [
    { label: 'Home', to: '/', icon: HomeIcon },
    { label: 'Shop All', to: '/products', icon: ShoppingBag },
    { label: 'Sale', to: '/products', icon: Percent, badge: 'Up to 50%', accent: true },
    { label: 'Track Order', to: '/track-order', icon: Truck },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cream text-charcoal">
      {/* announcement strip */}
      <div className="bg-ink text-cream text-xs sm:text-sm overflow-hidden">
        <div className="whitespace-nowrap py-2 marquee-track inline-block">
          <span className="mx-8">{settings.announcementText}</span>
          <span className="mx-8">{settings.announcementText}</span>
        </div>
      </div>

      {/* main nav */}
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            className="lg:hidden p-2 -ml-2"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={22} />
          </button>

          <Link to="/" className="flex items-center gap-2 shrink-0">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.storeName} className="h-9 w-auto object-contain" />
            ) : (
              <span className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
                {settings.storeName}
              </span>
            )}
          </Link>

          <nav className="hidden lg:flex items-center gap-6 ml-6 text-sm font-medium">
            {navLinks.slice(0, 8).map((l) => (
              <Link key={l.label} to={l.to} className="hover:text-gold-deep transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              className="p-2 hover:text-gold-deep"
              aria-label="Search"
              onClick={() => setSearchOpen((v) => !v)}
            >
              <Search size={20} />
            </button>
            <Link to="/account" className="p-2 hover:text-gold-deep" aria-label="Account">
              <User size={20} />
            </Link>
            <Link to="/cart" className="relative p-2 hover:text-gold-deep" aria-label="Cart">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-clay text-white text-[10px] leading-none rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={handleSearch} className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
            <div className="flex items-center border border-line rounded-full px-4 py-2 bg-white">
              <Search size={16} className="text-charcoal/50 mr-2 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>
          </form>
        )}
      </header>

      {/* mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[280px] max-w-[85vw] bg-cream shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
              <span className="text-sm font-semibold tracking-wide text-ink">MENU</span>
              <button aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="p-1 -mr-1">
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto text-sm">
              {drawerTopLinks.map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center justify-between gap-3 px-5 py-3 border-b border-line ${
                    l.accent ? 'text-clay font-medium' : 'text-ink'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <l.icon size={16} className="shrink-0" />
                    {l.label}
                  </span>
                  {l.badge && (
                    <span className="bg-clay text-white text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0">
                      {l.badge}
                    </span>
                  )}
                </Link>
              ))}

              {categories.map((c) => {
                const Icon = (Icons as any)[c.icon] ?? Icons.Circle;
                return (
                  <Link
                    key={c.id}
                    to={`/products?category=${c.slug}`}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-5 py-3 border-b border-line text-ink"
                  >
                    <Icon size={16} className="shrink-0 text-charcoal/60" />
                    {c.name}
                  </Link>
                );
              })}

              <Link
                to="/terms"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 px-5 py-3 border-b border-line text-charcoal/70 text-sm"
              >
                <FileText size={16} className="shrink-0" />
                Terms &amp; Conditions
              </Link>
              <Link
                to="/account"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 px-5 py-4 text-ink font-medium"
              >
                <User size={16} className="shrink-0" />
                Login / Register
              </Link>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-ink text-cream mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid gap-10 sm:grid-cols-3">
          <div>
            <h3 className="font-display text-lg mb-3">About Us</h3>
            <p className="text-sm text-cream/70 leading-relaxed">
              {settings.storeName} sources everyday home, kitchen, and personal-care goods that are built to
              last, and delivers them across Pakistan at fair prices.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg mb-3">Location</h3>
            <p className="text-sm text-cream/70 leading-relaxed flex gap-2">
              <MapPin size={16} className="shrink-0 mt-0.5" />
              Suite 4, Textile Plaza, Shahrah-e-Faisal, Karachi
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg mb-3">Contact Us</h3>
            <p className="text-sm text-cream/70 leading-relaxed flex gap-2">
              <MessageCircle size={16} className="shrink-0 mt-0.5" />
              WhatsApp 0300 000 0000
            </p>
          </div>
        </div>
        <div className="border-t border-cream/10 py-5 text-center text-xs text-cream/50">
          All rights reserved © {new Date().getFullYear()} {settings.storeName}
        </div>
      </footer>
    </div>
  );
}
