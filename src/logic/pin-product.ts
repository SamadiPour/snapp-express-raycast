import { LocalStorage } from "@raycast/api";

const CACHE_KEY_PINNED_PRODUCTS = "pinned_products_ids";

// Get pinned product IDs from storage
export async function getPinnedProductIds(): Promise<(number)[]> {
  const pinnedProductIdsStr = await LocalStorage.getItem<string>(CACHE_KEY_PINNED_PRODUCTS);
  return pinnedProductIdsStr ? JSON.parse(pinnedProductIdsStr) : [];
}

// Pin a product by ID
export async function pinProduct(productId: number): Promise<void> {
  const pinnedProductIds = await getPinnedProductIds();
  if (!pinnedProductIds.includes(productId)) {
    pinnedProductIds.push(productId);
    await LocalStorage.setItem(CACHE_KEY_PINNED_PRODUCTS, JSON.stringify(pinnedProductIds));
  }
}

// Unpin a product
export async function unpinProduct(productId: number): Promise<void> {
  const pinnedProductIds = await getPinnedProductIds();
  const filteredProductIds = pinnedProductIds.filter(id => id !== productId);
  await LocalStorage.setItem(CACHE_KEY_PINNED_PRODUCTS, JSON.stringify(filteredProductIds));
}

// Check if a product is pinned
export async function isProductPinned(productId: number): Promise<boolean> {
  const pinnedProductIds = await getPinnedProductIds();
  return pinnedProductIds.includes(productId);
}

// Helper to find pinned products from a list of products
export function findPinnedProducts(allProducts: Product[], pinnedIds: (number)[]): Product[] {
  return allProducts.filter(product =>
    pinnedIds.includes(product.productVariationId)
  );
}