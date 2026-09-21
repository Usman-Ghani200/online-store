import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function CartPage() {
  const {
    cart,
    products,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    cartDiscount,
    shippingFee,
    cartTotal,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    settings,
  } = useStore();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const navigate = useNavigate();

  const lines = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.id === item.variantId);
      return product ? { item, product, variant } : null;
    })
    .filter(Boolean) as { item: (typeof cart)[number]; product: (typeof products)[number]; variant?: any }[];

  const progress = Math.min(100, Math.round((cartSubtotal / settings.freeShippingThreshold) * 100));
  const remaining = Math.max(0, settings.freeShippingThreshold - cartSubtotal);

  const handleApply = () => {
    const res = applyPromoCode(code.trim());
    setMessage({ ok: res.success, text: res.message });
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-2xl text-ink mb-3">Your cart is empty</h1>
        <p className="text-charcoal/70 mb-6">Add something you like and it'll show up here.</p>
        <Link to="/products" className="bg-ink text-cream px-6 py-3 rounded-full text-sm font-medium">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-[1fr_360px] gap-10">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-ink mb-6">Your Cart</h1>

        {remaining > 0 ? (
          <div className="mb-6">
            <p className="text-sm text-charcoal/70 mb-2">
              Add Rs {remaining.toLocaleString()} more for free shipping
            </p>
            <div className="h-2 bg-line rounded-full overflow-hidden">
              <div className="h-full bg-gold-deep" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-gold-deep font-medium mb-6">You've unlocked free shipping 🎉</p>
        )}

        <div className="space-y-5">
          {lines.map(({ item, product, variant }) => (
            <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 border-b border-line pb-5">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-20 h-20 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{product.name}</h3>
                    {variant && <p className="text-xs text-charcoal/60">{variant.label}</p>}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId, item.variantId)}
                    aria-label="Remove item"
                    className="text-charcoal/40 hover:text-clay"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-line rounded-full">
                    <button
                      className="p-1.5"
                      onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button
                      className="p-1.5"
                      onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-sm font-medium">
                    Rs {((variant?.priceOverride ?? product.price) * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-line rounded-2xl p-6 h-fit">
        <h2 className="font-display text-lg mb-4">Order Summary</h2>

        <div className="mb-4">
          {appliedPromo ? (
            <div className="flex items-center justify-between text-sm bg-gold/10 border border-gold/30 rounded-lg px-3 py-2">
              <span>Code {appliedPromo} applied</span>
              <button onClick={removePromoCode} className="text-clay text-xs font-medium">
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Promo code"
                className="flex-1 border border-line rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleApply}
                className="border border-ink px-4 py-2 rounded-lg text-sm font-medium hover:bg-ink hover:text-cream"
              >
                Apply
              </button>
            </div>
          )}
          {message && (
            <p className={`text-xs mt-2 ${message.ok ? 'text-gold-deep' : 'text-clay'}`}>{message.text}</p>
          )}
        </div>

        <div className="space-y-2 text-sm border-t border-line pt-4">
          <div className="flex justify-between">
            <span className="text-charcoal/70">Subtotal</span>
            <span>Rs {cartSubtotal.toLocaleString()}</span>
          </div>
          {cartDiscount > 0 && (
            <div className="flex justify-between text-gold-deep">
              <span>Discount</span>
              <span>- Rs {cartDiscount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-charcoal/70">Shipping</span>
            <span>{shippingFee === 0 ? 'Free' : `Rs ${shippingFee.toLocaleString()}`}</span>
          </div>
          <div className="flex justify-between font-semibold text-base pt-2 border-t border-line">
            <span>Total</span>
            <span>Rs {cartTotal.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/checkout')}
          className="w-full mt-6 bg-ink text-cream py-3 rounded-full text-sm font-medium hover:bg-gold-deep hover:text-ink transition-colors"
        >
          Proceed to checkout
        </button>
      </div>
    </div>
  );
}
