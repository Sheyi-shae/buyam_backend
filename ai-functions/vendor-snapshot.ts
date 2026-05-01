// utils/vendorSnapshot.js
export function buildVendorSnapshot(vendor:any,reviews:any[]) {
  const accountAgeDays = Math.floor(
    (Date.now() - new Date(vendor.createdAt).getTime()) / 86400000
  );

  const averageRating = reviews.reduce((acc, review) => acc + review.ratings, 0) / reviews.length;
  const totalReviews = reviews.length;
  const fiveStarRatio = Math.round(
    (reviews.filter((review) => review.ratings === 5).length / Math.max(totalReviews, 1)) * 100
  );
  const onlineStatus = vendor.online
  const lastSeen= vendor.lastSeen
  return {
    verifiedSeller: vendor.verifiedSeller,
    accountAgeDays,
    averageRating,
    totalReviews,
    fiveStarRatio,
    onlineStatus,
    lastSeen
  };
}
