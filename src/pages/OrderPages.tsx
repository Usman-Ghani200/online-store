import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Printer, Search } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Order, OrderStatus } from '../types';

const statusSteps: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered'];

export function OrderConfirmationPage() {
  const { id } = useParams();
  const { orders, products } = useStore();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-charcoal/70 mb-4">We couldn't find that order.</p>
        <Link to="/" className="text-gold-deep font-medium hover:underline">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14 print:py-0">
      <div className="text-center mb-8 print:hidden">
        <CheckCircle2 size={48} className="text-gold-deep mx-auto mb-4" />
        <h1 className="font-display text-2xl sm:text-3xl text-ink mb-2">Order placed</h1>
        <p className="text-charcoal/70">Save your tracking ID to check on your order anytime.</p>
      </div>

      <div className="border border-line rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs text-charcoal/60">Tracking ID</p>
            <p className="font-display text-xl text-ink">{order.trackingId}</p>
          </div>
          <button
            onClick={() => window.print()}
            className="print:hidden flex items-center gap-1.5 text-sm border border-line rounded-full px-4 py-2 hover:bg-ink hover:text-cream"
          >
            <Printer size={14} /> Print
          </button>
        </div>

        <div className="space-y-3 border-t border-line pt-4">
          {order.items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            const variant = product?.variants.find((v) => v.id === item.variantId);
            if (!product) return null;
            return (
              <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm">
                <span>
                  {product.name} {variant ? `(${variant.label})` : ''} × {item.quantity}
                </span>
                <span>Rs {((variant?.priceOverride ?? product.price) * item.quantity).toLocaleString()}</span>
              </div>
            );
          })}
        </div>

        <div className="space-y-1 text-sm border-t border-line mt-4 pt-4">
          <div className="flex justify-between">
            <span className="text-charcoal/70">Subtotal</span>
            <span>Rs {order.subtotal.toLocaleString()}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-gold-deep">
              <span>Discount</span>
              <span>- Rs {order.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-charcoal/70">Shipping</span>
            <span>{order.shippingFee === 0 ? 'Free' : `Rs ${order.shippingFee.toLocaleString()}`}</span>
          </div>
          <div className="flex justify-between font-semibold pt-2 border-t border-line">
            <span>Total</span>
            <span>Rs {order.total.toLocaleString()}</span>
          </div>
        </div>

        <div className="text-sm text-charcoal/70 border-t border-line mt-4 pt-4 space-y-1">
          <p>{order.customerName} · {order.phone}</p>
          <p>
            {order.address}, {order.city}, {order.province} {order.postalCode}
          </p>
          <p>Payment: {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}</p>
        </div>
      </div>

      <Link
        to="/products"
        className="print:hidden block text-center mt-8 text-sm font-medium text-gold-deep hover:underline"
      >
        Continue shopping
      </Link>
    </div>
  );
}

export function TrackOrderPage() {
  const { findOrderByTrackingId } = useStore();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<Order | null | undefined>(undefined);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(findOrderByTrackingId(input) ?? null);
  };

  const currentStepIndex = result ? statusSteps.indexOf(result.status) : -1;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-14">
      <h1 className="font-display text-2xl sm:text-3xl text-ink mb-6">Track your order</h1>
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your tracking ID (e.g. WS-482913)"
          className="flex-1 border border-line rounded-full px-4 py-2.5 text-sm"
        />
        <button
          type="submit"
          className="bg-ink text-cream px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-1.5"
        >
          <Search size={14} /> Track
        </button>
      </form>

      {result === null && (
        <p className="text-sm text-clay">No order found with that tracking ID.</p>
      )}

      {result && (
        <div className="border border-line rounded-2xl p-6">
          <p className="text-sm text-charcoal/60 mb-1">Tracking ID</p>
          <p className="font-display text-xl text-ink mb-6">{result.trackingId}</p>

          {result.status === 'Cancelled' ? (
            <p className="text-clay font-medium text-sm">This order was cancelled.</p>
          ) : (
            <div className="flex justify-between">
              {statusSteps.map((step, i) => (
                <div key={step} className="flex-1 flex flex-col items-center relative">
                  {i > 0 && (
                    <div
                      className={`absolute top-3 -left-1/2 w-full h-0.5 ${
                        i <= currentStepIndex ? 'bg-gold-deep' : 'bg-line'
                      }`}
                    />
                  )}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold z-10 ${
                      i <= currentStepIndex ? 'bg-gold-deep text-ink' : 'bg-line text-charcoal/50'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs mt-2 text-center">{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
