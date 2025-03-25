export function formatPrice(price: number): string {
  return `${price.toLocaleString()} تومان`;
}

export function getLastUpdatedText(timestamp: Date | null): string {
  if (!timestamp) return "Never";

  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  return timestamp.toLocaleString();
}

export function getDiscountColor(discountRatio: number): string {
  if (discountRatio >= 30) {
    return "#FF2D55";
  } else if (discountRatio >= 15) {
    return "#FF9500";
  } else {
    return "#FFD700";
  }
}

export function getUniqueProducts(allProducts: MarketPartyProduct[]): MarketPartyProduct[] {
  const productMap = new Map<number, MarketPartyProduct>();

  allProducts.forEach((product) => {
    if (!productMap.has(product.productVariationId) || productMap.get(product.productVariationId)!.discountRatio < product.discountRatio) {
      productMap.set(product.productVariationId, product);
    }
  });

  return Array.from(productMap.values());
}

export function productDuplicateCount(allProducts: MarketPartyProduct[], product: MarketPartyProduct): number {
  return allProducts.filter(p => p.productVariationId === product.productVariationId).length;
}