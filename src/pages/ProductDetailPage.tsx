import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Minus, Plus } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, reviews, submitReview } = useStore();
  const product = products.find((p) => p.id === id);
  const [activeImage, setActiveImage] = useState(0);
  const [variantId, setVariantId] = useState(product?.variants[0]?.id);
  const [qty, setQty] = useState(1);
  const [reviewText, setReviewText] = useState('');
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-charcoal/70 mb-4">We couldn't find that product.</p>
        <Link to="/products" className="text-gold-deep font-medium hover:underline">
          Back to shop
        </Link>
      </div>
    );
  }

  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const productReviews = reviews.filter((r) => r.productId === product.id && r.approved);
  const variant = product.variants.find((v) => v.id === variantId);
  const outOfStock = (variant?.stock ?? product.stock) <= 0;

  const handleAddToCart = () => {
    addToCart(product.id, variantId, qty);
  };

  const handleBuyNow = () => {
    addToCart(product.id, variantId, qty);
    navigate('/cart');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewText.trim()) return;
    submitReview({
      productId: product.id,
      customerName: reviewName.trim(),
      rating: reviewRating,
      comment: reviewText.trim(),
    });
    setSubmitted(true);
    setReviewText('');
    setReviewName('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <div className="rounded-2xl overflow-hidden bg-white border border-line aspect-square mb-3">
            <img src={product.images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-3 flex-wrap">
            {product.images.map((img, i) => (
              <button
                key={img}
                onClick={() => setActiveImage(i)}
                className={`w-16 h-16 rounded-lg overflow-hidden border ${
                  i === activeImage ? 'border-gold-deep' : 'border-line'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h1 className="font-display text-3xl text-ink mb-2">{product.name}</h1>
          <div className="flex items-center gap-1 text-sm text-charcoal/60 mb-4">
            <Star size={14} className="fill-gold text-gold" />
            {product.rating} · {product.reviewCount} reviews
          </div>
          <div className="mb-6">
            {onSale ? (
              <span className="flex items-center gap-3 text-xl">
                <span className="text-clay font-semibold">Rs {product.price.toLocaleString()}</span>
                <span className="text-charcoal/40 line-through text-base">
                  Rs {product.compareAtPrice!.toLocaleString()}
                </span>
              </span>
            ) : (
              <span className="text-xl font-semibold text-ink">Rs {product.price.toLocaleString()}</span>
            )}
          </div>
          <p className="text-charcoal/80 leading-relaxed mb-6">{product.description}</p>

          {product.variants.length > 1 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Options</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    disabled={v.stock === 0}
                    className={`px-4 py-2 rounded-full text-sm border ${
                      variantId === v.id ? 'border-ink bg-ink text-cream' : 'border-line'
                    } ${v.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-line rounded-full">
              <button className="p-2" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-sm">{qty}</span>
              <button className="p-2" onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">
                <Plus size={16} />
              </button>
            </div>
            <span className="text-sm text-charcoal/60">
              {outOfStock ? 'Out of stock' : `${variant?.stock ?? product.stock} in stock`}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              disabled={outOfStock}
              onClick={handleAddToCart}
              className="flex-1 border border-ink text-ink px-6 py-3 rounded-full text-sm font-medium hover:bg-ink hover:text-cream transition-colors disabled:opacity-40"
            >
              Add to cart
            </button>
            <button
              disabled={outOfStock}
              onClick={handleBuyNow}
              className="flex-1 bg-gold-deep text-ink px-6 py-3 rounded-full text-sm font-medium hover:bg-ink hover:text-cream transition-colors disabled:opacity-40"
            >
              Buy now
            </button>
          </div>
        </div>
      </div>

      {/* reviews */}
      <section className="mt-16 max-w-3xl">
        <h2 className="font-display text-2xl text-ink mb-6">Reviews</h2>
        <div className="space-y-5 mb-10">
          {productReviews.length === 0 && (
            <p className="text-sm text-charcoal/60">No reviews yet — be the first to share your thoughts.</p>
          )}
          {productReviews.map((r) => (
            <div key={r.id} className="border-b border-line pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{r.customerName}</span>
                <span className="flex items-center gap-0.5 text-xs text-gold-deep">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} size={12} className="fill-gold text-gold" />
                  ))}
                </span>
              </div>
              <p className="text-sm text-charcoal/80">{r.comment}</p>
            </div>
          ))}
        </div>

        {submitted ? (
          <p className="text-sm text-charcoal/70 bg-gold/10 border border-gold/30 rounded-xl px-4 py-3">
            Thanks — your review has been submitted and is awaiting approval.
          </p>
        ) : (
          <form onSubmit={handleReviewSubmit} className="space-y-3">
            <h3 className="font-medium text-sm">Write a review</h3>
            <input
              value={reviewName}
              onChange={(e) => setReviewName(e.target.value)}
              placeholder="Your name"
              className="w-full border border-line rounded-lg px-4 py-2 text-sm"
              required
            />
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setReviewRating(n)} aria-label={`${n} stars`}>
                  <Star size={18} className={n <= reviewRating ? 'fill-gold text-gold' : 'text-line'} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share what you think"
              rows={3}
              className="w-full border border-line rounded-lg px-4 py-2 text-sm"
              required
            />
            <button
              type="submit"
              className="bg-ink text-cream px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gold-deep hover:text-ink transition-colors"
            >
              Submit review
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
