import { useEffect, useState } from "react";
import { Action, ActionPanel, Icon, List, showToast, Toast } from "@raycast/api";
import { fetchProductsCached } from "./api";
import { formatPrice, getDiscountColor, getLastUpdatedText, getUniqueProducts } from "./utils";
import ProductVendorList from "./product-vendor-list";
import ProductDetails from "./product-details";

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
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

        // Use cached data
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
            title={product.title}
            subtitle={product.vendorTitle}
            accessories={[
              {
                tag: {
                  value: `${product.discountRatio}%`,
                  color: getDiscountColor(product.discountRatio)
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
                  target={<ProductVendorList product={product} />}
                />
                <Action.CopyToClipboard
                  title="Copy Product Title"
                  content={product.title}
                />
                <Action
                  title="Refresh Data"
                  icon={Icon.ArrowClockwise}
                  shortcut={{ modifiers: ["cmd"], key: "r" }}
                  onAction={() => fetchData(true)}
                />
                <Action.Push
                  title="Product details"
                  icon={Icon.List}
                  shortcut={{modifiers: [], key: "space"}}
                  target={<ProductDetails product={product} />}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}