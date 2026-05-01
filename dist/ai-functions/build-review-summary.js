export function buildReviewSummary(stats) {
    return `
- Most reviews mention: ${stats.topKeywords.join(", ") || "No common themes"}
- Common complaints: ${stats.commonComplaints.join(", ") || "None"}
- Delivery feedback: ${stats.deliveryFeedback}
`.trim();
}
