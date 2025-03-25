import { useEffect, useState } from "react";
import { List, showToast, Toast } from "@raycast/api";
import { fetchProductsCached } from "./logic/api";
import { getLastUpdatedText } from "./utils";
import { findPinnedProducts, getPinnedProducts, pinProduct, unpinProduct } from "./logic/pin-product";
import { ProductItem } from "./components/product-item";
import { MissingPinnedProduct } from "./components/missing-pinned-item";
import { getProductId, getUniqueProducts } from "./logic/product-utils";

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [pinnedInfos, setPinnedInfos] = useState<PinnedProductInfo[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  const fetchData = async (forceRefresh = false) => {
    setIsLoading(true);
    await showToast(Toast.Style.Animated, "Fetching data...");

    try {
      const cachedData = await fetchProductsCached(
        true, true, forceRefresh,
        (message) => showToast(Toast.Style.Animated, message)
      );

      if (cachedData) {
        // Process products (deduplicate and sort)
        const allProducts : Product[] = [...cachedData.marketPartyProducts, ...cachedData.dailyDiscountProducts];
        const uniqueProducts = getUniqueProducts(allProducts);
        uniqueProducts.sort((a, b) => b.discountRatio - a.discountRatio);

        // Set state
        setPinnedInfos(await getPinnedProducts());
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
    const pinned = await pinProduct(product);
    if (pinned) {
      setPinnedInfos(prev => [...prev, pinned]);
      await showToast(Toast.Style.Success, "Product pinned");
    }
  };

  const handleUnpinProduct = async (productId: number) => {
    await unpinProduct(productId);
    setPinnedInfos(prev => prev.filter(p => p.id !== productId));
    await showToast(Toast.Style.Success, "Product unpinned");
  };

  // Load data on initial mount
  useEffect(() => {
    fetchData(false);
  }, []);

  const { pinnedProducts, missingPinnedProducts } = findPinnedProducts(products, pinnedInfos);
  const pinnedProductIds = new Set(pinnedInfos.map(p => p.id));
  const unpinnedProducts = products.filter(product => !pinnedProductIds.has(getProductId(product)));

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search products..."
    >
      {/* Pinned Section */}
      {(pinnedProducts.length > 0 || missingPinnedProducts.length > 0) && (
        <List.Section title={`Pinned Products (${pinnedProducts.length + missingPinnedProducts.length})`}>
          {/* Available pinned products */}
          {pinnedProducts.map((product) =>
            <ProductItem
              key={getProductId(product)}
              product={product}
              isPinned={true}
              onPinProduct={handlePinProduct}
              onUnpinProduct={(p) => handleUnpinProduct(getProductId(p))}
              onRefreshData={() => fetchData(true)}
            />
          )}

          {/* Missing pinned products */}
          {missingPinnedProducts.map((info) => (
            <MissingPinnedProduct
              key={`missing-${info.id}`}
              info={info}
              onUnpin={async () => {
                await handleUnpinProduct(info.id);
              }}
            />
          ))}
        </List.Section>
      )}

      {/* Discounted Products */}
      <List.Section
        title={`Discounted Products (${products.length})`}
        subtitle={`Last updated: ${getLastUpdatedText(lastFetchTime)}`}
      >
        {unpinnedProducts.map((product) =>
          <ProductItem
            key={getProductId(product)}
            product={product}
            isPinned={false}
            onPinProduct={handlePinProduct}
            onUnpinProduct={(p) => handleUnpinProduct(getProductId(p))}
            onRefreshData={() => fetchData(true)}
          />
        )}
      </List.Section>
    </List>
  );
}