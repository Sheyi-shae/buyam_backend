import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


export async function analyzeProductImage(
  imageUrl: string,
  question?: string
): Promise<string> {
  try {
    const prompt = question || "Analyze this product image. Describe what you see, the condition, quality, and any notable features or concerns.";

    const completion = await groq.chat.completions.create({
      model: "llama-3.2-11b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Image Analysis Error:", error);
    throw new Error("Unable to analyze product image at this time");
  }
}