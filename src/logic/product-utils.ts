const DEFAULT_IMAGE = 'https://placehold.co/300x300?text=No+Image';

export function getProductId(product: Product): number {
  if ('productVariationId' in product) {
    return product.productVariationId;
  } else if ('id' in product) {
    return product.id;
  } else {
    return -1;
  }
}

export function getProductImage(product: Product): string {
  if ('main_image' in product) {
    return product.main_image || DEFAULT_IMAGE;
  } else if ('images' in product && product.images.length > 0) {
    return product.images[0].main || DEFAULT_IMAGE;
  } else {
    return DEFAULT_IMAGE;
  }
}

export function compareProducts(a: Product, b: Product): number {
  const aPrice = a.price - a.discount;
  const bPrice = b.price - b.discount;

  if (aPrice === bPrice) {
    return b.discountRatio - a.discountRatio;
  }

  return aPrice - bPrice;
}

export function getUniqueProducts(allProducts: Product[]): Product[] {
  const productMap = new Map<number, Product>();

  allProducts.forEach((product) => {
    const id = getProductId(product);

    if (!productMap.has(id)) {
      productMap.set(id, product);
    } else {
      const existingProduct = productMap.get(id)!;

      if (compareProducts(existingProduct, product) > 0) {
        productMap.set(id, product);
      }
    }
  });

  return Array.from(productMap.values());
}