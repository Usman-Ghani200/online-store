import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const { products, settings, categories, promoBanners } = useStore();
  const featured = products.filter((p) => p.featured).slice(0, 8);

  return (
    <div>
      {/* full-bleed hero banner */}
      <section className="relative">
        <div className="w-full aspect-[4/5] sm:aspect-[16/7] md:aspect-[16/6] overflow-hidden">
          <img src={settings.heroImage} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12 w-full">
            <p className="text-cream/80 text-xs sm:text-sm font-medium mb-2">
              Trusted by shoppers across Pakistan
            </p>
            <h1 className="font-display text-2xl sm:text-4xl md:text-5xl leading-tight text-cream mb-3 sm:mb-4 max-w-xl">
              {settings.heroHeadline}
            </h1>
            <p className="text-cream/85 mb-5 sm:mb-6 max-w-md text-sm sm:text-base">{settings.heroSubheadline}</p>
            <Link
              to="/products"
              className="inline-block bg-gold-deep text-ink px-6 sm:px-7 py-2.5 sm:py-3 rounded-full text-sm font-medium hover:bg-cream transition-colors"
            >
              Shop the collection
            </Link>
          </div>
        </div>
      </section>

      {/* category rail */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 -mx-1 px-1">
          {categories.map((c) => {
            const Icon = (Icons as any)[c.icon] ?? Icons.Circle;
            return (
              <Link
                key={c.id}
                to={`/products?category=${c.slug}`}
                className="flex flex-col items-center gap-2 shrink-0 w-20 sm:w-24 text-center group"
              >
                <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border border-line overflow-hidden flex items-center justify-center group-hover:border-gold-deep transition-colors">
                  {c.image ? (
                    <img src={c.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Icon size={22} className="text-ink" />
                  )}
                </span>
                <span className="text-xs font-medium text-charcoal/80">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* top picks */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-14">
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-ink">Top Picks</h2>
          <Link to="/products" className="text-sm font-medium text-gold-deep hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* admin-managed promo tile grid — each tile links straight to the product or category it represents */}
      {promoBanners.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-14">
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-ink mb-4 sm:mb-6">Shop the Edit</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {promoBanners.map((b) => {
              const to = b.linkType === 'product' ? `/product/${b.link}` : `/products?category=${b.link}`;
              return (
                <Link key={b.id} to={to} className="relative rounded-xl overflow-hidden aspect-square group">
                  <img
                    src={b.image}
                    alt={b.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent flex items-end p-3 sm:p-4">
                    <span className="text-cream text-xs sm:text-sm font-medium">{b.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* promo banner strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
        <div className="bg-gold/15 border border-gold/40 rounded-2xl px-5 sm:px-8 py-8 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6">
          <div>
            <h3 className="font-display text-xl sm:text-2xl text-ink mb-2">First order? Take 10% off.</h3>
            <p className="text-charcoal/80 text-sm">
              Use code <span className="font-semibold text-ink">WELCOME10</span> at checkout on orders over Rs
              1,500.
            </p>
          </div>
          <Link
            to="/products"
            className="bg-ink text-cream px-6 py-3 rounded-full text-sm font-medium hover:bg-gold-deep hover:text-ink transition-colors shrink-0 w-full sm:w-auto text-center"
          >
            Start shopping
          </Link>
        </div>
      </section>
    </div>
  );
}
