import { CATEGORY_INFO } from "./event-config";

const PRICE_BY_CATEGORY: Record<string, number> = Object.fromEntries(
  CATEGORY_INFO.map((c) => [c.code, c.price])
);

export function getCategoryPrice(category: string): number {
  return PRICE_BY_CATEGORY[category] ?? 0;
}

export function calculateTotal(categories: string[]): number {
  return categories.reduce((sum, category) => sum + getCategoryPrice(category), 0);
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
