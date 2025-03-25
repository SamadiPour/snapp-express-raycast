import { useEffect, useState } from "react";
import { Action, ActionPanel, List, showToast, Toast } from "@raycast/api";
import { formatPrice, getDiscountColor } from "./utils";
import { fetchProductsCached } from "./logic/api";
import { compareProducts, getProductId } from "./logic/product-utils";

export default function ProductVendorList({ product }: ProductProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    const findProductAcrossVendors = async () => {
      setIsLoading(true);

      try {
        const cachedData = await fetchProductsCached(false, false, false);
        if (cachedData) {
          // Use cached data to find matching products
          const allProducts = [...cachedData.marketPartyProducts, ...cachedData.dailyDiscountProducts];
          const productTitle = product.title.toLowerCase();

          // Find matching products by title
          let matches = allProducts.filter(
            p => p.title.toLowerCase() === productTitle
          );

          // remove products with same vendor code
          matches = matches.filter((value, index, self) =>
            index === self.findIndex((t) => (
              t.vendorCode === value.vendorCode
            ))
          );

          // Sort by final price and then discount
          matches.sort(compareProducts);

          // set state
          setVendorProducts(matches);
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
              key={`${vendorProduct.vendorCode}-${getProductId(vendorProduct)}`}
              title={vendor!.data.title}
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
                    color: getDiscountColor(product.discountRatio)
                  }
                },
                {
                  text: formatPrice(vendorProduct.price - vendorProduct.discount),
                  tooltip: `Original price: ${formatPrice(vendorProduct.price)}`
                }
              ]}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser
                    title="Open Product Page"
                    url={`https://express.snapp.market/supermarket/a/${vendor?.data.code}/market-party`}
                  />
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