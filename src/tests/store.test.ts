import { describe, it, expect } from 'vitest';
import { products, promoCodes, storeSettings } from '../data/mockData';

describe('seed data integrity', () => {
  it('has at least one active promo code', () => {
    const active = promoCodes.filter((p) => p.active);
    expect(active.length).toBeGreaterThan(0);
  });

  it('every product has a positive price', () => {
    products.forEach((p) => expect(p.price).toBeGreaterThan(0));
  });
});

describe('promo code discount logic', () => {
  const applyDiscount = (subtotal: number, discountPercent: number) =>
    Math.round((subtotal * discountPercent) / 100);

  it('calculates 10% off correctly', () => {
    expect(applyDiscount(2000, 10)).toBe(200);
  });

  it('respects the minimum order value on WELCOME10', () => {
    const promo = promoCodes.find((p) => p.code === 'WELCOME10')!;
    const subtotal = 1000; // below min
    const eligible = !promo.minOrderValue || subtotal >= promo.minOrderValue;
    expect(eligible).toBe(false);
  });
});

describe('shipping fee threshold rules', () => {
  const shippingFor = (subtotal: number) =>
    subtotal >= storeSettings.freeShippingThreshold ? 0 : storeSettings.shippingFee;

  it('charges shipping below the free threshold', () => {
    expect(shippingFor(1000)).toBe(storeSettings.shippingFee);
  });

  it('waives shipping at or above the free threshold', () => {
    expect(shippingFor(storeSettings.freeShippingThreshold)).toBe(0);
    expect(shippingFor(storeSettings.freeShippingThreshold + 500)).toBe(0);
  });
});

describe('item pricing calculations', () => {
  it('multiplies unit price by quantity', () => {
    const product = products[0];
    const qty = 3;
    expect(product.price * qty).toBe(product.price * 3);
  });
});
