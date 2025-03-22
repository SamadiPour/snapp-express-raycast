import { getPreferenceValues } from "@raycast/api";

const API_URL = "https://api.snapp.express";
const LATITUDE = getPreferenceValues().latitude;
const LONGITUDE = getPreferenceValues().longitude;

// Fetch vendors from API
export async function fetchVendors(): Promise<Vendor[]> {
  try {
    const response = await fetch(
      `${API_URL}/express-vendor/general/vendors-list?page=0&page_size=100&pro_client=snapp&superType[]=4&lat=${LATITUDE}&long=${LONGITUDE}`
    );

    // @ts-ignore
    const data: VendorsResponse = await response.json();

    return data.data.finalResult.filter(
      (item): item is Vendor => item.type === "VENDOR"
    );
  } catch (error) {
    console.error("Error fetching vendors:", error);
    throw error;
  }
}

// Fetch products for a specific vendor
export async function fetchProducts(vendorCode: string): Promise<Product[]> {
  try {
    const response = await fetch(
      `${API_URL}/market-party/${vendorCode}?variable=${vendorCode}&page_size=200&lat=${LATITUDE}&long=${LONGITUDE}`
    );

    // @ts-ignore
    const data: ProductsResponse = await response.json();

    if (!data.status || !data.data?.products?.List) {
      return [];
    }

    return data.data.products.List;
  } catch (error) {
    console.error(`Error fetching products for ${vendorCode}:`, error);
    return [];
  }
}