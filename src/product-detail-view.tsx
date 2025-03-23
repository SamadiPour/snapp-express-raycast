import { useEffect, useState } from "react";
import { Action, ActionPanel, List, showToast, Toast } from "@raycast/api";
import { formatPrice, getDiscountColor } from "./utils";
import { fetchProductsCached } from "./api";

export default function ProductDetailView({ product }: ProductDetailViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    const findProductAcrossVendors = async () => {
      setIsLoading(true);

      try {
        const cachedData = await fetchProductsCached(false, false, false);
        if (cachedData) {
          if (cachedData.products) {
            // Use cached data to find matching products
            const allProducts = cachedData.products;
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

          setVendors(cachedData.vendors);
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
                isVendorPro ? {
                  tag: {
                    value: "PRO",
                    color: "#007AFF"
                  }
                } : {},
                {
                  tag: {
                    value: `${vendorProduct.discountRatio}%`,
                    color: getDiscountColor(product.discountRatio),
                  }
                },
                {
                  text: formatPrice(vendorProduct.price - vendorProduct.discount),
                  tooltip: `Original price: ${formatPrice(vendorProduct.price)}`
                }
              ]}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard
                    title="Copy Product Title"
                    content={product.title}
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