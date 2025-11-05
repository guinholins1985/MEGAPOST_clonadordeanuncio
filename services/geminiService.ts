
import { GoogleGenAI, Type } from "@google/genai";
import { AdContent } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const adContentSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "The catchy and concise title of the product listing.",
        },
        description: {
            type: Type.STRING,
            description: "A detailed and persuasive description of the product.",
        },
        tags: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
                description: "A relevant keyword or tag for the product."
            },
            description: "An array of relevant keywords (tags) for the product to improve searchability.",
        },
        imageUrls: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
                description: "A direct URL to a product image."
            },
            description: "An array of direct, public URLs for the product images found on the page.",
        }
    },
    required: ["title", "description", "tags", "imageUrls"]
};


export const extractAdContentFromUrl = async (url: string): Promise<AdContent> => {
    const prompt = `
        You are an expert web scraper and e-commerce data analyst.
        Analyze the content of the product page at the following URL: ${url}
        
        Your task is to extract the following information and return it as a JSON object that conforms to the provided schema.
        1.  **Product Title**: The main title of the product.
        2.  **Product Description**: The full, detailed description.
        3.  **Tags/Keywords**: A list of relevant search tags or keywords. If none are explicitly listed, generate 5-10 highly relevant tags based on the title and description.
        4.  **Image URLs**: A list of all high-resolution product image URLs. These must be direct links to the image files (e.g., .jpg, .png, .webp).
        
        Ensure the output is a clean JSON object with no extra text or markdown.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: adContentSchema,
            }
        });

        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);

        // Basic validation
        if (!parsedJson.title || !parsedJson.description || !Array.isArray(parsedJson.tags)) {
            throw new Error("Invalid JSON structure received from API.");
        }
        
        return parsedJson as AdContent;

    } catch (error) {
        console.error("Error extracting ad content:", error);
        throw new Error("Failed to process the URL with Gemini API.");
    }
};

export const optimizeAdContent = async (currentContent: AdContent): Promise<AdContent> => {
    const prompt = `
        You are an expert in e-commerce SEO and marketing copywriting, specializing in marketplace platforms.
        Your task is to take the following product information and optimize it for maximum visibility, engagement, and conversion.
        
        Current Content:
        Title: ${currentContent.title}
        Description: ${currentContent.description}
        Tags: ${currentContent.tags.join(', ')}

        Optimization goals:
        1.  **Title**: Rewrite the title to be more catchy, descriptive, and keyword-rich. Include primary keywords at the beginning. Keep it within a reasonable length for marketplace listings (around 60-80 characters).
        2.  **Description**: Rewrite the description to be more persuasive. Use bullet points for key features and benefits. Start with a strong opening sentence. Structure it for easy readability. Incorporate relevant keywords naturally.
        3.  **Tags**: Generate a new, comprehensive list of 10-15 highly relevant and popular tags. Include a mix of broad and specific keywords.

        Return the optimized content as a JSON object that conforms to the provided schema. Keep the original imageUrls.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: adContentSchema,
            }
        });
        
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);

        // Make sure to return the original images, as we are not optimizing them.
        parsedJson.imageUrls = currentContent.imageUrls;

        if (!parsedJson.title || !parsedJson.description || !Array.isArray(parsedJson.tags)) {
            throw new Error("Invalid JSON structure received from API during optimization.");
        }

        return parsedJson as AdContent;

    } catch (error) {
        console.error("Error optimizing ad content:", error);
        throw new Error("Failed to optimize the content with Gemini API.");
    }
};
