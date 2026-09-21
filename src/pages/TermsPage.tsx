import { useStore } from '../context/StoreContext';

export default function TermsPage() {
  const { settings } = useStore();
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
      <h1 className="font-display text-2xl sm:text-3xl text-ink mb-6">Terms &amp; Conditions</h1>
      <div className="space-y-5 text-sm text-charcoal/80 leading-relaxed">
        <p>
          By placing an order with {settings.storeName}, you agree to the terms below. Prices are listed in
          Pakistani Rupees (Rs) and include applicable taxes unless stated otherwise.
        </p>
        <p>
          Orders are processed within 1–2 business days. Delivery timelines vary by city and are shown at
          checkout. Cash on Delivery, JazzCash, and Easypaisa are accepted payment methods.
        </p>
        <p>
          Items may be returned within 7 days of delivery if unused and in original packaging. Contact us via
          WhatsApp to start a return or exchange.
        </p>
        <p>
          Promo codes cannot be combined and are subject to minimum order values shown at checkout. We reserve
          the right to update these terms at any time; continued use of the site means you accept the current
          version.
        </p>
      </div>
    </div>
  );
}
