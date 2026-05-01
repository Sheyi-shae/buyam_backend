// Function to compare multiple product images
import Groq from "groq-sdk";
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});
export async function compareProductImages(imageUrls, comparisonQuestion) {
    try {
        const prompt = comparisonQuestion || "Compare these product images. Identify any differences in quality, condition, or features.";
        const content = [
            {
                type: "text",
                text: prompt
            }
        ];
        // Add all images to the content
        imageUrls.forEach(url => {
            content.push({
                type: "image_url",
                image_url: { url }
            });
        });
        const completion = await groq.chat.completions.create({
            model: "llama-3.2-11b-vision-preview",
            messages: [
                {
                    role: "user",
                    content: content
                }
            ],
            max_tokens: 700,
            temperature: 0.3
        });
        return completion.choices[0]?.message?.content || "";
    }
    catch (error) {
        console.error("Image Comparison Error:", error);
        throw new Error("Unable to compare product images at this time");
    }
}
