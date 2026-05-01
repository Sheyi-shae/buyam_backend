// services/aiProductAdvisor.ts
import Groq from "groq-sdk";
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});
export async function askProductAdvisor({ product, vendor, reviewSummary, userMessage, images }) {
    const systemPrompt = `You are an AI product advisor for an online marketplace.

Product Details:
- Name: ${product.name}
- Category: ${product.category.name} > ${product.subCategory.name}
- Price: ${product.price} naira
- Description: ${product.description}

Vendor Information:
- Verified seller: ${vendor.verifiedSeller ? 'Yes' : 'No'}
- Account age: ${vendor.accountAgeDays} days
- Average rating: ${vendor.averageRating}/5
- Total reviews: ${vendor.totalReviews}
- Five-star ratio: ${vendor.fiveStarRatio}%
- Seller online status:${vendor.onlineStatus}
- Seller last seen:${vendor.lastSeen}

Reviews Summary: ${reviewSummary || "Not available"}

Answer questions based only on this information, convert seller's last seen to a readable format and the product images provided. Be concise and helpful.`;
    try {
        console.log(images);
        // Check if product has images and if the question might be about the images
        const hasImages = images && images.length > 0;
        const isImageRelatedQuestion = hasImages && (
        // userMessage.toLowerCase().includes('image') ||
        // userMessage.toLowerCase().includes('picture') ||
        // userMessage.toLowerCase().includes('photo') ||
        // userMessage.toLowerCase().includes('look') ||
        // userMessage.toLowerCase().includes('see') ||
        // userMessage.toLowerCase().includes('show') ||
        // userMessage.toLowerCase().includes('condition') ||
        // userMessage.toLowerCase().includes('quality') ||
        // userMessage.toLowerCase().includes('authentic') ||
        // userMessage.toLowerCase().includes('real') ||
        // userMessage.toLowerCase().includes('color') ||
        userMessage.toLowerCase().includes('colour'));
        // Use vision model if images are available and question seems image-related
        if (hasImages && isImageRelatedQuestion) {
            const content = [
                {
                    type: "text",
                    text: userMessage
                }
            ];
            // Add all product images (limit to first 4 for performance)
            const imagesToAnalyze = images.slice(0, 4);
            imagesToAnalyze.forEach(imageUrl => {
                content.push({
                    type: "image_url",
                    image_url: {
                        url: imageUrl
                    }
                });
            });
            const completion = await groq.chat.completions.create({
                model: "llama-3.2-11b-vision-preview", // Vision model
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: content
                    }
                ],
                max_tokens: 500,
                temperature: 0.3
            });
            return completion.choices[0]?.message?.content || "";
        }
        else {
            // Text-only conversation for non-image questions
            const completion = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                max_tokens: 250,
                temperature: 0.3
            });
            return completion.choices[0]?.message?.content || "";
        }
    }
    catch (error) {
        console.error("AI Product Advisor Error:", error);
        throw new Error("Unable to generate product advice at this time");
    }
}
