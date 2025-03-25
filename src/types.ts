interface Vendor {
  data: {
    id: number;
    code: string;
    title: string;
    logo: string;
    is_pro: boolean;
  };
  type: string;
}

interface DataCache {
  products: MarketPartyProduct[];
  vendors: Vendor[];
  lastFetchTimestamp: Date;
  isFromCache: boolean;
}

interface PinnedProductInfo {
  productVariationId: number;
  title: string;
}

interface MarketPartyProduct {
  productVariationId: number;
  price: number;
  discountRatio: number;
  title: string;
  discount: number;
  main_image: string;
  vendorCode: string;
  vendorTitle: string;
  is_out_of_stock: boolean;
}

interface GeneralProduct {
  id: number;
  discount: number;
  discount_ratio: number;
  images: {
    main: string;
    position: number;
    thumb: string;
    type: string;
  }[];
  is_market_party: boolean;
  menu_category_id: number;
  menu_category_title: string;
  no_stock: boolean;
  price: number;
  product_entity?: string;
  root_category_id: number;
  root_category_title: string;
  brand: string;
  brand_id: number;
  stock: number;
  title: string;
}

type Product = MarketPartyProduct & GeneralProduct;


// ======== responses ========
interface DailyDiscountResponse {
  status: boolean;
  data: {
    id: number;
    count: number;
    title: string;
    finalResult: {
      data: GeneralProduct;
      id: number;
      type: string;
    }[];
  };
}

interface ProductsResponse {
  status: boolean;
  data: {
    firstActivePeriodEndRFC: string;
    products: {
      List: MarketPartyProduct[];
    };
  };
}

interface VendorsResponse {
  status: boolean;
  data: {
    finalResult: Vendor[];
  };
}


// ======== page props ========
interface ProductProps {
  product: MarketPartyProduct;
}

interface ProductItemProps {
  product: MarketPartyProduct;
  isPinned: boolean;
  onPinProduct: (product: MarketPartyProduct) => Promise<void>;
  onUnpinProduct: (product: MarketPartyProduct) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

interface MissingPinnedProductProps {
  info: PinnedProductInfo;
  onUnpin: (productId: number) => Promise<void>;
}
