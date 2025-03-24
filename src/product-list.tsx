import { useEffect, useState } from "react";
import { List, showToast, Toast } from "@raycast/api";
import { fetchProductsCached } from "./logic/api";
import { getLastUpdatedText, getUniqueProducts } from "./utils";
import { findPinnedProducts, getPinnedProductIds, pinProduct, unpinProduct } from "./logic/pin-product";
import { renderProductItem } from "./components/product-item";

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [pinnedProductIds, setPinnedProductIds] = useState<(number)[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  const fetchData = async (forceRefresh = false) => {
    setIsLoading(true);
    await showToast(Toast.Style.Animated, "Fetching data...");

    try {
      const cachedData = await fetchProductsCached(
        true, true, forceRefresh,
        (vendors) => showToast(Toast.Style.Animated, `Fetching products from ${vendors.length} vendors...`)
      );

      if (cachedData) {
        // Process products (deduplicate and sort)
        const uniqueProducts = getUniqueProducts(cachedData.products);
        uniqueProducts.sort((a, b) => b.discountRatio - a.discountRatio);

        // Set state
        setPinnedProductIds(await getPinnedProductIds());
        setProducts(uniqueProducts);
        setLastFetchTime(cachedData.lastFetchTimestamp);

        await showToast(Toast.Style.Success, `Found ${uniqueProducts.length} discounted products`);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      await showToast(Toast.Style.Failure, "Failed to fetch data");
    }

    setIsLoading(false);
  };

  // Handle pinning a product
  const handlePinProduct = async (product: Product) => {
    await pinProduct(product.productVariationId);
    setPinnedProductIds(prev => [...prev, product.productVariationId]);
    await showToast(Toast.Style.Success, "Product pinned");
  };

  const handleUnpinProduct = async (product: Product) => {
    await unpinProduct(product.productVariationId);
    setPinnedProductIds(prev => prev.filter(id => id !== product.productVariationId));
    await showToast(Toast.Style.Success, "Product unpinned");
  };

  // Load data on initial mount
  useEffect(() => {
    fetchData(false);
  }, []);

  const pinnedProducts = findPinnedProducts(products, pinnedProductIds);
  const unpinnedProducts = products.filter(product =>
    !pinnedProductIds.includes(product.productVariationId)
  );

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search products..."
    >
      {/* Pinned Section */}
      {pinnedProducts.length > 0 && (
        <List.Section title={`Pinned Products (${pinnedProducts.length})`}>
          {pinnedProducts.map((product) => renderProductItem({
            product,
            isPinned: true,
            onPinProduct: handlePinProduct,
            onUnpinProduct: handleUnpinProduct,
            onRefreshData: () => fetchData(true)
          }))}
        </List.Section>
      )}

      {/* Discounted Products */}
      <List.Section
        title={`Discounted Products (${products.length})`}
        subtitle={`Last updated: ${getLastUpdatedText(lastFetchTime)}`}
      >
        {unpinnedProducts.map((product) => renderProductItem({
          product,
          isPinned: false,
          onPinProduct: handlePinProduct,
          onUnpinProduct: handleUnpinProduct,
          onRefreshData: () => fetchData(true)
        }))}
      </List.Section>
    </List>
  );
}