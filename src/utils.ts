export function formatPrice(price: number): string {
  return `${price.toLocaleString()} تومان`;
}

export function getLastUpdatedText(timestamp: number | null): string {
  if (!timestamp) return "Never";

  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  return new Date(timestamp).toLocaleString();
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

export function getUniqueProducts(allProducts: Product[]): Product[] {
  const productMap = new Map<number, Product>();

  allProducts.forEach((product) => {
    if (!productMap.has(product.productVariationId) || productMap.get(product.productVariationId)!.discountRatio < product.discountRatio) {
      productMap.set(product.productVariationId, product);
    }
  });

  return Array.from(productMap.values());
}

export function productDuplicateCount(allProducts: Product[], product: Product): number {
  return allProducts.filter(p => p.productVariationId === product.productVariationId).length;
}