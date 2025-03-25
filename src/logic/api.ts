import { getPreferenceValues, LocalStorage } from "@raycast/api";

const API_URL = "https://api.snapp.express";
const LATITUDE = getPreferenceValues().latitude;
const LONGITUDE = getPreferenceValues().longitude;
const INCLUDE_DAILY_DISCOUNTS = getPreferenceValues().dailyDiscounts;

const CACHE_KEY_MARKET_PARTY_PRODUCTS = "cached_market_party_products";
const CACHE_KEY_DAILY_DISCOUNT_PRODUCTS = "cached_daily_discount_products";
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
      item => item.type === "VENDOR"
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

// Fetch daily discounts for a specific vendor
export async function fetchVendorDailyDiscounts(vendorId: string, vendorTitle: string): Promise<GeneralProduct[]> {
  const pageSize = 10;
  let allProducts: GeneralProduct[] = [];
  let currentPage = 0;
  let totalCount = 0;
  let hasMorePages = true;
  let consecutiveNonDiscounted = 0;

  if (!INCLUDE_DAILY_DISCOUNTS) return [];

  try {
    while (hasMorePages) {
      const response = await fetch(
        `${API_URL}/express-search/product-list/863/vendor/${vendorId}?page=${currentPage}&page_size=${pageSize}&variable=863&secondVariable=${vendorId}&filters=[]&lat=${LATITUDE}&long=${LONGITUDE}`
      );

      const data = await response.json() as DailyDiscountResponse;

      if (!data.data) {
        break;
      }

      const products = data.data.finalResult || [];

      // Extract the product data from the finalResult array
      let productItems = products
        .filter(item => item.type === "PRODUCT")
        .map(item => item.data);

      // Check for consecutive non-discounted products
      for (const product of productItems) {
        product.vendorCode = vendorId;
        product.vendorTitle = vendorTitle;
        if (product.discountRatio > 0) {
          consecutiveNonDiscounted = 0;
        } else {
          consecutiveNonDiscounted++;
        }
      }

      allProducts.push(...productItems.filter(product => product.discountRatio > 0));

      // Get total count on first page
      if (currentPage === 0 && data.data.count) {
        totalCount = data.data.count;
      }

      // Stop fetching if we have 5 consecutive non-discounted products
      if (consecutiveNonDiscounted >= 5) {
        hasMorePages = false;
        break;
      }

      // Check if we need to fetch more pages
      hasMorePages = products.length === pageSize && allProducts.length < totalCount;
      currentPage++;
    }

    return allProducts;
  } catch (error) {
    console.error(`Error fetching daily discounts for vendor ${vendorId}:`, error);
    return [];
  }
}

export async function fetchProductsCached(
  requestIfNotFound = true,
  checkIfValid = true,
  forceRefresh = false,
  toastCallback?: (message: string) => void
): Promise<DataCache | null> {
  const cachedLastFetch = await LocalStorage.getItem<string>(CACHE_KEY_LAST_FETCH);
  const cachedMarketPartyProducts = await LocalStorage.getItem<string>(CACHE_KEY_MARKET_PARTY_PRODUCTS);
  const cachedDailyDiscountProducts = await LocalStorage.getItem<string>(CACHE_KEY_DAILY_DISCOUNT_PRODUCTS);
  const cachedVendors = await LocalStorage.getItem<string>(CACHE_KEY_VENDORS);
  const cachedExpiration = await LocalStorage.getItem<string>(CACHE_KEY_EXPIRATION);

  // Check if we have cached data and it's not expired
  if (!forceRefresh) {
    if (cachedLastFetch && cachedMarketPartyProducts && cachedDailyDiscountProducts && cachedVendors
      && cachedExpiration) {
      const now = new Date();
      const lastFetchTimestamp = new Date(cachedLastFetch);
      const expirationTimestamp = new Date(cachedExpiration);
      if (!checkIfValid || now < expirationTimestamp) {
        const marketPartyProducts = JSON.parse(cachedMarketPartyProducts);
        const dailyDiscountProducts = JSON.parse(cachedDailyDiscountProducts);
        const vendors = JSON.parse(cachedVendors);
        return { marketPartyProducts, dailyDiscountProducts, vendors, lastFetchTimestamp, isFromCache: true };
      }
    }
  }

  if (!requestIfNotFound) return null;

  // Fetch fresh data
  if (toastCallback) toastCallback(`Fetching vendors around you...`);
  const vendors = await fetchVendors();

  // Fetch products for each vendor
  let marketPartyProducts = [];
  let dailyDiscountProducts = [];
  let firstActivePeriodEndRFC = null;
  for (const vendor of vendors) {
    if (toastCallback) toastCallback(`Fetching products from ${vendor.data.title}...`);

    // fetching market party products
    const productResponse = await fetchMarketPartyProducts(vendor.data.code);
    if (productResponse) {
      const products = productResponse.data.products.List;
      marketPartyProducts.push(...products);

      if (!firstActivePeriodEndRFC
        || new Date(productResponse.data.firstActivePeriodEndRFC) < new Date(firstActivePeriodEndRFC)) {
        firstActivePeriodEndRFC = productResponse.data.firstActivePeriodEndRFC;
      }
    }

    // fetching daily discounts
    const dailyDiscounts = await fetchVendorDailyDiscounts(vendor.data.code, vendor.data.title);
    dailyDiscountProducts.push(...dailyDiscounts);
  }

  // remove finished products
  marketPartyProducts = marketPartyProducts.filter((product) => !product.is_out_of_stock);
  dailyDiscountProducts = dailyDiscountProducts.filter((product) => !product.no_stock);

  // Store in cache
  const now = new Date();
  await LocalStorage.setItem(CACHE_KEY_MARKET_PARTY_PRODUCTS, JSON.stringify(marketPartyProducts));
  await LocalStorage.setItem(CACHE_KEY_DAILY_DISCOUNT_PRODUCTS, JSON.stringify(dailyDiscountProducts));
  await LocalStorage.setItem(CACHE_KEY_VENDORS, JSON.stringify(vendors));
  await LocalStorage.setItem(CACHE_KEY_LAST_FETCH, now.toString());
  await LocalStorage.setItem(CACHE_KEY_EXPIRATION, firstActivePeriodEndRFC?.toString() ?? now.toString());

  return { marketPartyProducts, dailyDiscountProducts, vendors, lastFetchTimestamp: now, isFromCache: false };
}