import { LocalStorage } from "@raycast/api";

const CACHE_KEY_PINNED_PRODUCTS = "pinned_products";

// Get pinned product info from storage
export async function getPinnedProducts(): Promise<PinnedProductInfo[]> {
  const pinnedProductsStr = await LocalStorage.getItem<string>(CACHE_KEY_PINNED_PRODUCTS);
  return pinnedProductsStr ? JSON.parse(pinnedProductsStr) : [];
}

// Pin a product - store more info now
export async function pinProduct(product: Product): Promise<void> {
  const pinnedProducts = await getPinnedProducts();
  if (!pinnedProducts.some(p => p.productVariationId === product.productVariationId)) {
    pinnedProducts.push({
      productVariationId: product.productVariationId,
      title: product.title
    });
    await LocalStorage.setItem(CACHE_KEY_PINNED_PRODUCTS, JSON.stringify(pinnedProducts));
  }
}

// Unpin a product
export async function unpinProduct(productId: number): Promise<void> {
  const pinnedProducts = await getPinnedProducts();
  const filteredProducts = pinnedProducts.filter(p => p.productVariationId !== productId);
  await LocalStorage.setItem(CACHE_KEY_PINNED_PRODUCTS, JSON.stringify(filteredProducts));
}

// Check if a product is pinned
export async function isProductPinned(productId: number): Promise<boolean> {
  const pinnedProducts = await getPinnedProducts();
  return pinnedProducts.some(p => p.productVariationId === productId);
}

// Helper to find pinned products from a list of products
export function findPinnedProducts(allProducts: Product[], pinnedInfos: PinnedProductInfo[]): {
  pinnedProducts: Product[],
  missingPinnedProducts: PinnedProductInfo[]
} {
  const pinnedIds = new Set(pinnedInfos.map(p => p.productVariationId));
  const pinned = allProducts.filter(product => pinnedIds.has(product.productVariationId));
  const availableIds = new Set(allProducts.map(p => p.productVariationId));
  const missing = pinnedInfos.filter(info => !availableIds.has(info.productVariationId));
  return { pinnedProducts: pinned, missingPinnedProducts: missing };
}
