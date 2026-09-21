import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import type { PaymentMethod } from '../types';

const provinces = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Gilgit-Baltistan', 'Azad Kashmir', 'Islamabad Capital Territory'];

export default function CheckoutPage() {
  const { cart, cartSubtotal, cartDiscount, shippingFee, cartTotal, placeOrder } = useStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    address: '',
    city: '',
    province: provinces[0],
    postalCode: '',
    paymentMethod: 'COD' as PaymentMethod,
  });

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const update = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const order = placeOrder(form);
    navigate(`/order-confirmation/${order.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl sm:text-3xl text-ink mb-8">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-[1fr_320px] gap-8 md:gap-10">
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium block mb-1">Full name</label>
            <input
              required
              value={form.customerName}
              onChange={(e) => update({ customerName: e.target.value })}
              className="w-full border border-line rounded-lg px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Phone number</label>
            <input
              required
              value={form.phone}
              onChange={(e) => update({ phone: e.target.value })}
              placeholder="03XX XXXXXXX"
              className="w-full border border-line rounded-lg px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Address</label>
            <input
              required
              value={form.address}
              onChange={(e) => update({ address: e.target.value })}
              placeholder="House no, street, area"
              className="w-full border border-line rounded-lg px-4 py-2.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">City</label>
              <input
                required
                value={form.city}
                onChange={(e) => update({ city: e.target.value })}
                className="w-full border border-line rounded-lg px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Postal code</label>
              <input
                value={form.postalCode}
                onChange={(e) => update({ postalCode: e.target.value })}
                className="w-full border border-line rounded-lg px-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Province</label>
            <select
              value={form.province}
              onChange={(e) => update({ province: e.target.value })}
              className="w-full border border-line rounded-lg px-4 py-2.5 text-sm bg-white"
            >
              {provinces.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Payment method</label>
            <div className="space-y-2">
              {(['COD', 'JazzCash', 'Easypaisa'] as PaymentMethod[]).map((m) => (
                <label
                  key={m}
                  className={`flex items-center gap-3 border rounded-lg px-4 py-3 text-sm cursor-pointer ${
                    form.paymentMethod === m ? 'border-ink' : 'border-line'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={form.paymentMethod === m}
                    onChange={() => update({ paymentMethod: m })}
                  />
                  {m === 'COD' ? 'Cash on Delivery' : m}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-line rounded-2xl p-6 h-fit">
          <h2 className="font-display text-lg mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
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
            type="submit"
            className="w-full mt-6 bg-ink text-cream py-3 rounded-full text-sm font-medium hover:bg-gold-deep hover:text-ink transition-colors"
          >
            Place order
          </button>
        </div>
      </form>
    </div>
  );
}
