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

interface VendorsResponse {
  status: boolean;
  data: {
    finalResult: Array<Vendor | { data: string; type: string }>;
  };
}

interface Product {
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

interface ProductsResponse {
  status: boolean;
  data: {
    products: {
      List: Product[];
    };
  };
}

interface DataCache {
  products: Product[];
  vendors: Vendor[];
  lastFetchTimestamp: number;
  isFromCache: boolean;
}

interface ProductDetailViewProps {
  product: Product;
}