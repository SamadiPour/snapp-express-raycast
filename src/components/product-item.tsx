import { Action, ActionPanel, Icon, List, openCommandPreferences } from "@raycast/api";
import { formatPrice, getDiscountColor } from "../utils";
import ProductVendorList from "../product-vendor-list";
import ProductDetails from "../product-details";
import { getProductId } from "../logic/product-utils";

export function ProductItem(
  {
    product,
    isPinned,
    onPinProduct,
    onUnpinProduct,
    onRefreshData
  }: ProductItemProps
) {
  return (
    <List.Item
      key={getProductId(product)}
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
          <Action.Push
            title="Product details"
            icon={Icon.List}
            shortcut={{ modifiers: ["opt"], key: "space" }}
            target={<ProductDetails product={product} />}
          />
          {isPinned ? (
            <Action
              title="Unpin Product"
              icon={Icon.PinDisabled}
              shortcut={{ modifiers: ["opt"], key: "p" }}
              onAction={() => onUnpinProduct(product)}
            />
          ) : (
            <Action
              title="Pin Product"
              icon={Icon.Pin}
              shortcut={{ modifiers: ["opt"], key: "p" }}
              onAction={() => onPinProduct(product)}
            />
          )}
          <Action.CopyToClipboard
            title="Copy Product Title"
            content={product.title}
          />
          <Action
            title="Refresh Data"
            icon={Icon.ArrowClockwise}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            onAction={onRefreshData}
          />
          <Action
            title="Extension Preferences"
            icon={Icon.Cog}
            shortcut={{ modifiers: ["cmd", "shift"], key: "," }}
            onAction={openCommandPreferences}
          />
        </ActionPanel>
      }
    />
  );
}