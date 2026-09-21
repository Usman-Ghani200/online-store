import { useState } from 'react';
import { useStore } from '../context/StoreContext';

export default function AccountPage() {
  const { customers, orders } = useStore();
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState<typeof customers[number] | null>(null);
  const [searched, setSearched] = useState(false);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomer(customers.find((c) => c.phone === phone.trim()) ?? null);
    setSearched(true);
  };

  const myOrders = customer ? orders.filter((o) => customer.orderIds.includes(o.id)) : [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <h1 className="font-display text-2xl sm:text-3xl text-ink mb-6">My Account</h1>

      {!customer && (
        <form onSubmit={handleLookup} className="flex gap-2 mb-8 max-w-sm">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number used at checkout"
            className="flex-1 border border-line rounded-full px-4 py-2.5 text-sm"
          />
          <button type="submit" className="bg-ink text-cream px-5 py-2.5 rounded-full text-sm font-medium">
            Find
          </button>
        </form>
      )}

      {searched && !customer && (
        <p className="text-sm text-charcoal/60 mb-8">
          No account found for that number yet — it's created automatically after your first order.
        </p>
      )}

      {customer && (
        <div className="space-y-10">
          <div>
            <h2 className="font-display text-lg mb-3">Saved Addresses</h2>
            <ul className="space-y-2 text-sm text-charcoal/80">
              {customer.addresses.map((a, i) => (
                <li key={i} className="border border-line rounded-lg px-4 py-2.5">
                  {a}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg mb-3">Order History</h2>
            <div className="space-y-3">
              {myOrders.map((o) => (
                <div key={o.id} className="border border-line rounded-lg px-4 py-3 flex justify-between text-sm">
                  <div>
                    <p className="font-medium">{o.trackingId}</p>
                    <p className="text-charcoal/60">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Rs {o.total.toLocaleString()}</p>
                    <p className="text-charcoal/60">{o.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
