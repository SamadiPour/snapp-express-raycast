import { useEffect, useState } from "react";
import { List, showToast, Toast } from "@raycast/api";
import { fetchProductsCached } from "./logic/api";
import { getLastUpdatedText, getUniqueProducts } from "./utils";
import { findPinnedProducts, getPinnedProducts, pinProduct, unpinProduct } from "./logic/pin-product";
import { ProductItem } from "./components/product-item";
import { MissingPinnedProduct } from "./components/missing-pinned-item";

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<MarketPartyProduct[]>([]);
  const [pinnedInfos, setPinnedInfos] = useState<PinnedProductInfo[]>([]);
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
  const handlePinProduct = async (product: MarketPartyProduct) => {
    await pinProduct(product);
    setPinnedInfos(prev => [...prev, product]);
    await showToast(Toast.Style.Success, "Product pinned");
  };

  const handleUnpinProduct = async (productId: number) => {
    await unpinProduct(productId);
    setPinnedInfos(prev => prev.filter(p => p.productVariationId !== productId));
    await showToast(Toast.Style.Success, "Product unpinned");
  };

  // Load data on initial mount
  useEffect(() => {
    fetchData(false);
  }, []);

  const { pinnedProducts, missingPinnedProducts } = findPinnedProducts(products, pinnedInfos);
  const pinnedProductIds = new Set(pinnedInfos.map(p => p.productVariationId));
  const unpinnedProducts = products.filter(product => !pinnedProductIds.has(product.productVariationId));

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
              key={product.productVariationId}
              product={product}
              isPinned={true}
              onPinProduct={handlePinProduct}
              onUnpinProduct={(p) => handleUnpinProduct(p.productVariationId)}
              onRefreshData={() => fetchData(true)}
            />
          )}

          {/* Missing pinned products */}
          {missingPinnedProducts.map((info) => (
            <MissingPinnedProduct
              key={`missing-${info.productVariationId}`}
              info={info}
              onUnpin={async () => {
                await handleUnpinProduct(info.productVariationId);
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
            key={product.productVariationId}
            product={product}
            isPinned={false}
            onPinProduct={handlePinProduct}
            onUnpinProduct={(p) => handleUnpinProduct(p.productVariationId)}
            onRefreshData={() => fetchData(true)}
          />
        )}
      </List.Section>
    </List>
  );
}