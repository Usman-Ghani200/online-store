import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating';

export default function ProductListingPage() {
  const { products, categories } = useStore();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const activeCategory = params.get('category') ?? '';
  const [sort, setSort] = useState<SortKey>('relevance');
  const [maxPrice, setMaxPrice] = useState(6000);

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.price <= maxPrice);
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    if (activeCategory) list = list.filter((p) => p.category === activeCategory);
    switch (sort) {
      case 'price-asc':
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
    }
    return list;
  }, [products, q, activeCategory, sort, maxPrice]);

  const setCategory = (slug: string) => {
    const next = new URLSearchParams(params);
    if (slug) next.set('category', slug);
    else next.delete('category');
    setParams(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-[220px_1fr] gap-8">
      <aside className="space-y-8">
        <div>
          <h3 className="font-display text-lg mb-3">Category</h3>
          <div className="flex flex-col gap-2 text-sm">
            <button
              onClick={() => setCategory('')}
              className={`text-left ${!activeCategory ? 'text-gold-deep font-medium' : 'text-charcoal/80'}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.slug)}
                className={`text-left ${
                  activeCategory === c.slug ? 'text-gold-deep font-medium' : 'text-charcoal/80'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-display text-lg mb-3">Max price: Rs {maxPrice.toLocaleString()}</h3>
          <input
            type="range"
            min={500}
            max={6000}
            step={100}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-gold-deep"
          />
        </div>
      </aside>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl sm:text-3xl text-ink">
            {q ? `Results for "${q}"` : 'Shop All'}
          </h1>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="border border-line rounded-full px-4 py-2 text-sm bg-white"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="text-charcoal/60 text-sm">No products match these filters yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
