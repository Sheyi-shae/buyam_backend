// utils/productSnapshot.js
export function buildProductSnapshot(product) {
    return {
        id: product.id,
        name: product.name,
        category: product.category.name,
        subCategory: product.subCategory.name,
        price: product.price,
        description: product.description
    };
}
