import { Action, ActionPanel, Detail } from "@raycast/api";
import { formatPrice, getDiscountColor } from "./utils";

export default function ProductDetails({ product }: ProductProps) {
  return (
    <Detail
      markdown={`![Product Image](${product.main_image || "https://via.placeholder.com/300x300?text=No+Image"})`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Product ID" text={product.productVariationId.toString()} />
          <Detail.Metadata.Label title="Product Title" text={product.title} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label
            title="Price"
            text={formatPrice(product.price)}
          />
          <Detail.Metadata.Label
            title="Discounted Price"
            text={formatPrice(product.price - product.discount)}
          />
          <Detail.Metadata.TagList title="Max Discount">
            <Detail.Metadata.TagList.Item
              text={`${product.discountRatio}%`}
              color={getDiscountColor(product.discountRatio)}
            />
          </Detail.Metadata.TagList>
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Title" content={product.title} />
          {product.main_image && (
            <Action.CopyToClipboard title="Copy Image URL" content={product.main_image} />
          )}
        </ActionPanel>
      }
    />
  );
}