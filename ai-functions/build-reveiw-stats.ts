type PositiveKeyword =
  | "fast delivery"
  | "original product"
  | "good seller";

type ComplaintKeyword =
  | "late delivery"
  | "no response";

type DeliveryFeedback = "positive" | "mixed" | "mostly negative" | "no reviews";

export function buildReviewStats(reviews: any[]) {
  const positives: PositiveKeyword[] = [];
  const complaints: ComplaintKeyword[] = [];
  let deliveryIssues = 0;

  if (reviews.length === 0) {
    return {
      topKeywords: [],
      commonComplaints: [],
      deliveryFeedback: "no reviews" as DeliveryFeedback
    };
  }

  for (const review of reviews) {
    const text = review.comment.toLowerCase();

    if (text.includes("delivery")) {
      if (text.includes("late") || text.includes("long")) {
        deliveryIssues++;
        complaints.push("late delivery");
      } else {
        positives.push("fast delivery");
      }
    }

    if (text.includes("original")) positives.push("original product");
    if (text.includes("good seller")) positives.push("good seller");
    if (text.includes("no response")) complaints.push("no response");
  }

  return {
    topKeywords: [...new Set(positives)].slice(0, 3),
    commonComplaints: [...new Set(complaints)],
    deliveryFeedback:
      deliveryIssues === 0
        ? "positive"
        : deliveryIssues < reviews.length / 2
        ? "mixed"
        : "mostly negative"
  };
}