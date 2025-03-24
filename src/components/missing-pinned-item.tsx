import { Action, ActionPanel, Icon, List } from "@raycast/api";

export function MissingPinnedProduct({ info, onUnpin }: MissingPinnedProductProps) {
  return (
    <List.Item
      key={`missing-${info.productVariationId}`}
      title={info.title}
      accessories={[
        {
          text: "Product not found",
          icon: Icon.Warning
        }
      ]}
      actions={
        <ActionPanel>
          <Action
            title="Unpin Product"
            icon={Icon.PinDisabled}
            shortcut={{ modifiers: ["opt"], key: "p" }}
            onAction={async () => {
              await onUnpin(info.productVariationId);
            }}
          />
          <Action.CopyToClipboard
            title="Copy Product Title"
            content={info.title}
          />
        </ActionPanel>
      }
    />
  );
}