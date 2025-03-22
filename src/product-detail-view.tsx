import { useEffect, useState } from "react";
import { Action, ActionPanel, List, LocalStorage, showToast, Toast } from "@raycast/api";
import { formatPrice } from "./utils";

const CACHE_KEY_PRODUCTS = "cached_products";
const CACHE_KEY_VENDORS = "cached_vendors";

export default function ProductDetailView({ product }: ProductDetailViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    const findProductAcrossVendors = async () => {
      try {
        setIsLoading(true);
        const cachedProducts = await LocalStorage.getItem<string>(CACHE_KEY_PRODUCTS);
        const cachedVendors = await LocalStorage.getItem<string>(CACHE_KEY_VENDORS);

        if (cachedProducts) {
          // Use cached data to find matching products
          const allProducts = JSON.parse(cachedProducts) as Product[];
          const productTitle = product.title.toLowerCase();

          // Find matching products by title
          const matches = allProducts.filter(
            p => p.title.toLowerCase() === productTitle
          );

          // Sort by discount percentage (highest first)
          matches.sort((a, b) => b.discountRatio - a.discountRatio);

          setVendorProducts(matches);
        } else {
          console.error("Error finding product");
        }

        if (cachedVendors) {
          console.log(cachedVendors);
          const allVendors = JSON.parse(cachedVendors) as Vendor[];
          setVendors(allVendors);
        }
      } catch (error) {
        console.error("Error finding product across vendors:", error);
        await showToast(Toast.Style.Failure, "Failed to find vendors");
      } finally {
        setIsLoading(false);
      }
    };

    findProductAcrossVendors();
  }, [product]);

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search vendors..."
      navigationTitle={`Vendors for ${product.title}`}
    >
      <List.Section title={`All Vendors Selling ${product.title}`}>
        {vendorProducts.map((vendorProduct) => {
          const vendor = vendors.find(value => value.data.code === vendorProduct.vendorCode);
          const isVendorPro = vendor?.data.is_pro || false;
          return (
            <List.Item
              key={`${vendorProduct.vendorCode}-${vendorProduct.productVariationId}`}
              title={vendorProduct.vendorTitle}
              subtitle={formatPrice(vendorProduct.price)}
              accessories={[
                {
                  tag: {
                    value: `${vendorProduct.discountRatio}% OFF`,
                    color: vendorProduct.discountRatio >= 30 ? "#FF2D55" : "#FF9500"
                  }
                },
                isVendorPro ? {
                  tag: {
                    value: "PRO",
                    color: "#007AFF"
                  }
                } : {},
                {
                  text: formatPrice(vendorProduct.price - vendorProduct.discount),
                  tooltip: `Original price: ${formatPrice(vendorProduct.price)}`
                }
              ]}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard
                    title="Copy Vendor Details"
                    content={`${product.title}\nVendor: ${vendorProduct.vendorTitle}\nPrice: ${formatPrice(vendorProduct.price - vendorProduct.discount)} (${vendorProduct.discountRatio}% off)`}
                  />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
}