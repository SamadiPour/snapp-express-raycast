import { LocalStorage } from "@raycast/api";
import { getProductId } from "./product-utils";

const CACHE_KEY_PINNED_PRODUCTS = "pinned_products";

// Get pinned product info from storage
export async function getPinnedProducts(): Promise<PinnedProductInfo[]> {
  const pinnedProductsStr = await LocalStorage.getItem<string>(CACHE_KEY_PINNED_PRODUCTS);
  return pinnedProductsStr ? JSON.parse(pinnedProductsStr) : [];
}

// Pin a product - store more info now
export async function pinProduct(product: Product): Promise<PinnedProductInfo | null> {
  const pinnedProducts = await getPinnedProducts();
  const id = getProductId(product);
  if (!pinnedProducts.some(p => p.id === id)) {
    const pinnedProduct = {
      id: id,
      title: product.title
    } as PinnedProductInfo;
    pinnedProducts.push(pinnedProduct);
    await LocalStorage.setItem(CACHE_KEY_PINNED_PRODUCTS, JSON.stringify(pinnedProducts));
    return pinnedProduct;
  }
  return null;
}

// Unpin a product
export async function unpinProduct(productId: number): Promise<void> {
  const pinnedProducts = await getPinnedProducts();
  const filteredProducts = pinnedProducts.filter(p => p.id !== productId);
  await LocalStorage.setItem(CACHE_KEY_PINNED_PRODUCTS, JSON.stringify(filteredProducts));
}

// Check if a product is pinned
export async function isProductPinned(productId: number): Promise<boolean> {
  const pinnedProducts = await getPinnedProducts();
  return pinnedProducts.some(p => p.id === productId);
}

// Helper to find pinned products from a list of products
export function findPinnedProducts(allProducts: Product[], pinnedInfos: PinnedProductInfo[]): {
  pinnedProducts: Product[],
  missingPinnedProducts: PinnedProductInfo[]
} {
  const pinnedIds = new Set(pinnedInfos.map(p => p.id));
  const pinned = allProducts.filter(product => pinnedIds.has(getProductId(product)));
  const availableIds = new Set(allProducts.map(getProductId));
  const missing = pinnedInfos.filter(info => !availableIds.has(info.id));
  return { pinnedProducts: pinned, missingPinnedProducts: missing };
}
