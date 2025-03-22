import { useEffect, useState } from "react";
import { Action, ActionPanel, Icon, List, LocalStorage, showToast, Toast } from "@raycast/api";
import { fetchProducts, fetchVendors } from "./api";
import { formatPrice, getLastUpdatedText, getUniqueProducts } from "./utils";
import ProductDetailView from "./product-detail-view";

const CACHE_KEY_PRODUCTS = "cached_products";
const CACHE_KEY_VENDORS = "cached_vendors";
const CACHE_KEY_LAST_FETCH = "last_fetch_timestamp";
const CACHE_EXPIRATION = 60 * 60 * 1000; // 1 hour in milliseconds

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  const isCacheValid = (lastFetchTimestamp: number) => {
    return Date.now() - lastFetchTimestamp < CACHE_EXPIRATION;
  };

  const fetchData = async (forceRefresh = false) => {
    // Check if we have cached data and it's not expired
    if (!forceRefresh) {
      const cachedLastFetch = await LocalStorage.getItem<string>(CACHE_KEY_LAST_FETCH);
      const cachedProducts = await LocalStorage.getItem<string>(CACHE_KEY_PRODUCTS);

      if (cachedLastFetch && cachedProducts) {
        const lastFetchTimestamp = parseInt(cachedLastFetch, 10);
        if (isCacheValid(lastFetchTimestamp)) {
          const products = JSON.parse(cachedProducts);

          // Process products (deduplicate and sort)
          const uniqueProducts = getUniqueProducts(products);
          uniqueProducts.sort((a, b) => b.discountRatio - a.discountRatio);

          // Use cached data
          setProducts(uniqueProducts);
          setLastFetchTime(lastFetchTimestamp);
          setIsLoading(false);
          return;
        }
      }
    }

    // Fetch fresh data
    try {
      setIsLoading(true);
      await showToast(Toast.Style.Animated, "Fetching vendors...");

      const vendors = await fetchVendors();
      await showToast(Toast.Style.Animated, `Fetching products from ${vendors.length} vendors...`);

      const allProducts = [];
      for (const vendor of vendors) {
        const products = await fetchProducts(vendor.data.code);
        allProducts.push(...products);
      }

      // Process products (deduplicate and sort)
      const uniqueProducts = getUniqueProducts(allProducts);
      uniqueProducts.sort((a, b) => b.discountRatio - a.discountRatio);

      // Update state and cache
      const currentTime = Date.now();
      setProducts(uniqueProducts);
      setLastFetchTime(currentTime);

      // Store in cache
      await LocalStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(allProducts));
      await LocalStorage.setItem(CACHE_KEY_VENDORS, JSON.stringify(vendors));
      await LocalStorage.setItem(CACHE_KEY_LAST_FETCH, currentTime.toString());

      await showToast(Toast.Style.Success, `Found ${uniqueProducts.length} discounted products`);
    } catch (err) {
      console.error("Error fetching data:", err);
      await showToast(Toast.Style.Failure, "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on initial mount
  useEffect(() => {
    fetchData(false);
  }, []);

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search products..."
    >
      <List.Section
        title={`Discounted Products (${products.length})`}
        subtitle={`Last updated: ${getLastUpdatedText(lastFetchTime)}`}
      >
        {products.map((product) => (
          <List.Item
            key={product.productVariationId}
            // icon={{ source: product.main_image, fallback: Icon.List }}
            title={product.title}
            subtitle={product.vendorTitle}
            accessories={[
              {
                tag: {
                  value: `${product.discountRatio}% OFF`,
                  color: product.discountRatio >= 30 ? "#FF2D55" : "#FF9500"
                }
              },
              {
                text: formatPrice(product.price - product.discount),
                tooltip: `Original: ${formatPrice(product.price)}`
              }
            ]}
            actions={
              <ActionPanel>
                <Action.Push
                  title="Show details"
                  icon={Icon.List}
                  target={<ProductDetailView product={product} />}
                />
                <Action.CopyToClipboard
                  title="Copy Product Title"
                  content={product.title}
                />
                <Action.CopyToClipboard
                  title="Copy Product Details"
                  content={`${product.title}\nVendor: ${product.vendorTitle}\nPrice: ${formatPrice(product.price - product.discount)} (${product.discountRatio}% off)`}
                />
                <Action
                  title="Refresh Data"
                  icon={Icon.ArrowClockwise}
                  onAction={() => fetchData(true)}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}