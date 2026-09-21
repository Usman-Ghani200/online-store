import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Product } from '../types';

export default function ProductCard({ product }: { product: Product }) {
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="relative rounded-xl overflow-hidden bg-white border border-line aspect-square mb-3">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {onSale && (
          <span className="absolute top-2 left-2 bg-clay text-white text-[11px] font-medium px-2 py-1 rounded-full">
            Sale
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs font-medium text-charcoal">
            Out of stock
          </span>
        )}
      </div>
      <h3 className="font-display text-sm sm:text-base text-ink leading-snug line-clamp-2">{product.name}</h3>
      <div className="flex items-center gap-1 text-xs text-charcoal/60 mt-1">
        <Star size={12} className="fill-gold text-gold" />
        {product.rating} ({product.reviewCount})
      </div>
      <div className="mt-1 text-sm font-medium">
        {onSale ? (
          <span className="flex items-center gap-2">
            <span className="text-clay">Rs {product.price.toLocaleString()}</span>
            <span className="text-charcoal/40 line-through text-xs">
              Rs {product.compareAtPrice!.toLocaleString()}
            </span>
          </span>
        ) : (
          <span className="text-ink">Rs {product.price.toLocaleString()}</span>
        )}
      </div>
    </Link>
  );
}
