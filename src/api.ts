import { getPreferenceValues, LocalStorage } from "@raycast/api";

const API_URL = "https://api.snapp.express";
const LATITUDE = getPreferenceValues().latitude;
const LONGITUDE = getPreferenceValues().longitude;

const CACHE_KEY_PRODUCTS = "cached_products";
const CACHE_KEY_VENDORS = "cached_vendors";
const CACHE_KEY_LAST_FETCH = "last_fetch_timestamp";
const CACHE_EXPIRATION = 60 * 60 * 1000; // 1 hour in milliseconds

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


export async function fetchProductsCached(
  requestIfNotFound = true,
  checkIfValid = true,
  forceRefresh = false,
  vendorFetchedCallback?: (vendors: Vendor[]) => void
): Promise<DataCache> {
  const cachedLastFetch = await LocalStorage.getItem<string>(CACHE_KEY_LAST_FETCH);
  const cachedProducts = await LocalStorage.getItem<string>(CACHE_KEY_PRODUCTS);
  const cachedVendors = await LocalStorage.getItem<string>(CACHE_KEY_VENDORS);

  const isCacheValid = (lastFetchTimestamp: number) => {
    return Date.now() - lastFetchTimestamp < CACHE_EXPIRATION;
  };

  // Check if we have cached data and it's not expired
  if (!forceRefresh) {
    if (cachedLastFetch && cachedProducts && cachedVendors) {
      const lastFetchTimestamp = parseInt(cachedLastFetch, 10);
      if (checkIfValid || isCacheValid(lastFetchTimestamp)) {
        const products = JSON.parse(cachedProducts);
        const vendors = JSON.parse(cachedVendors);
        return { products, vendors, lastFetchTimestamp, isFromCache: true };
      }
    }
  }

  if (!requestIfNotFound) return { products: [], vendors: [], lastFetchTimestamp: 0, isFromCache: false };

  // Fetch fresh data
  const vendors = await fetchVendors();
  if (vendorFetchedCallback) vendorFetchedCallback(vendors);

  // Fetch products for each vendor
  const allProducts = [];
  for (const vendor of vendors) {
    const products = await fetchProducts(vendor.data.code);
    allProducts.push(...products);
  }

  // Update state and cache
  const currentTime = Date.now();

  // Store in cache
  await LocalStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(allProducts));
  await LocalStorage.setItem(CACHE_KEY_VENDORS, JSON.stringify(vendors));
  await LocalStorage.setItem(CACHE_KEY_LAST_FETCH, currentTime.toString());

  return { products: allProducts, vendors, lastFetchTimestamp: currentTime, isFromCache: false };
}