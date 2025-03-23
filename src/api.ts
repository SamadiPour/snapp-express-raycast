import { getPreferenceValues, LocalStorage } from "@raycast/api";

const API_URL = "https://api.snapp.express";
const LATITUDE = getPreferenceValues().latitude;
const LONGITUDE = getPreferenceValues().longitude;

const CACHE_KEY_PRODUCTS = "cached_products";
const CACHE_KEY_VENDORS = "cached_vendors";
const CACHE_KEY_LAST_FETCH = "last_fetch_timestamp";
const CACHE_KEY_EXPIRATION = "cached_expiration";

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
export async function fetchMarketPartyProducts(vendorCode: string): Promise<ProductsResponse | null> {
  try {
    const response = await fetch(
      `${API_URL}/market-party/${vendorCode}?variable=${vendorCode}&page_size=200&lat=${LATITUDE}&long=${LONGITUDE}`
    );

    // @ts-ignore
    const data: ProductsResponse = await response.json();

    if (!data.status || !data.data?.products?.List) {
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching products for ${vendorCode}:`, error);
    return null;
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
  const cachedExpiration = await LocalStorage.getItem<string>(CACHE_KEY_EXPIRATION);

  // Check if we have cached data and it's not expired
  if (!forceRefresh) {
    if (cachedLastFetch && cachedProducts && cachedVendors && cachedExpiration) {
      const now = Date.now();
      const lastFetchTimestamp = parseInt(cachedLastFetch, 10);
      const expirationTimestamp = parseInt(cachedExpiration, 10);
      if (checkIfValid || now < expirationTimestamp) {
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
  let allProducts = [];
  let firstActivePeriodEndRFC = null;
  for (const vendor of vendors) {
    const productResponse = await fetchMarketPartyProducts(vendor.data.code);
    if (productResponse) {
      const products = productResponse.data.products.List;
      allProducts.push(...products);

      if (!firstActivePeriodEndRFC
        || new Date(productResponse.data.firstActivePeriodEndRFC) < new Date(firstActivePeriodEndRFC)) {
        firstActivePeriodEndRFC = productResponse.data.firstActivePeriodEndRFC;
      }
    }
  }

  // remove finished products
  allProducts = allProducts.filter((product) => !product.is_out_of_stock);

  // Store in cache
  const currentTime = Date.now();
  await LocalStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(allProducts));
  await LocalStorage.setItem(CACHE_KEY_VENDORS, JSON.stringify(vendors));
  await LocalStorage.setItem(CACHE_KEY_LAST_FETCH, currentTime.toString());
  await LocalStorage.setItem(CACHE_KEY_EXPIRATION, firstActivePeriodEndRFC?.toString() ?? currentTime.toString());

  return { products: allProducts, vendors, lastFetchTimestamp: currentTime, isFromCache: false };
}