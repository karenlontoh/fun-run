import { CATEGORY_INFO, PAYMENT } from "./event-config";

const PRICE_BY_CATEGORY: Record<string, number> = Object.fromEntries(
  CATEGORY_INFO.map((c) => [c.code, c.price])
);

export function getCategoryPrice(category: string): number {
  return PRICE_BY_CATEGORY[category] ?? 0;
}

export function calculateTotal(categories: string[]): number {
  return categories.reduce((sum, category) => sum + getCategoryPrice(category), 0);
}

// Appends the event's unique code to an amount's last digits — this is the
// exact figure registrants should transfer, so it's what gets stored as
// total_amount and shown everywhere (form, success page, verify, admin).
export function addUniqueCode(amount: number): number {
  return amount + Number(PAYMENT.uniqueCode);
}

export function calculateTransferAmount(categories: string[]): number {
  return addUniqueCode(calculateTotal(categories));
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
