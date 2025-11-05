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
        },
        brand: {
            type: Type.STRING,
            description: "The brand or manufacturer of the product. If not explicitly found, this can be omitted."
        },
        price: {
            type: Type.STRING,
            description: "The product's price, including currency symbol (e.g., '$99.99', 'R$ 1.200,00')."
        },
        category: {
            type: Type.STRING,
            description: "The product category, often found in breadcrumbs (e.g., 'Electronics > Laptops')."
        },
        specifications: {
            type: Type.ARRAY,
            description: "An array of objects, where each object represents a technical specification with a 'key' and a 'value'.",
            items: {
                type: Type.OBJECT,
                properties: {
                    key: {
                        type: Type.STRING,
                        description: "The name of the specification (e.g., 'Dimensions', 'Weight')."
                    },
                    value: {
                        type: Type.STRING,
                        description: "The value of the specification (e.g., '10x5x2 cm', '200g')."
                    }
                },
                required: ["key", "value"]
            }
        },
        condition: {
            type: Type.STRING,
            description: "The condition of the product (e.g., 'New', 'Used', 'Refurbished')."
        },
        sku: {
            type: Type.STRING,
            description: "The product's SKU, Model Number, or other unique identifier, if available."
        },
        availability: {
            type: Type.STRING,
            description: "The stock status of the product (e.g., 'In stock', 'Out of stock', 'Pre-order')."
        }
    },
    required: ["title", "description", "tags", "imageUrls"]
};


export const extractAdContentFromUrl = async (url: string): Promise<AdContent> => {
    const prompt = `
        You are a universal e-commerce data extraction engine. Your mission is to analyze any product page from any popular marketplace (like Mercado Livre, Amazon, Magazine Luiza, eBay, AliExpress, etc.) and extract ALL key information with extreme accuracy.

        Analyze the HTML structure and content of the product page at the following URL: ${url}
        
        Your task is to extract every piece of relevant information and return it as a single JSON object that conforms to the provided schema. Be adaptive, meticulous, and thorough.

        1.  **Product Title**: The main, official title of the product.
        2.  **Brand**: The brand or manufacturer name. Find it near the title or in the product details.
        3.  **Price**: The main, most prominent display price. It's crucial to include the currency symbol and all numbers (e.g., "R$ 4.999,00", "$1,299.99").
        4.  **Category**: The product's category path, usually in breadcrumb navigation. Combine it into a single string (e.g., "Eletrônicos > Celulares e Smartphones > Smartphones").
        5.  **Condition**: Find the product's condition (New, Used, Refurbished). This is often displayed near the price or title.
        6.  **Availability / Stock**: Determine the stock status (e.g., 'In Stock', 'Out of Stock', 'Last units').
        7.  **SKU / Model Number**: Locate the unique identifier, often labeled as SKU, Model, Part Number, or similar. Check the specifications or details section.
        8.  **Product Description**: The full, detailed marketing description. Combine information from all relevant sections to create a complete overview.
        9.  **Specifications**: Scour the page for technical specifications in tables, lists, or a "details" section. Extract every single specification you can find and format it as an array of key-value pairs (e.g., [{"key": "Weight", "value": "250g"}, {"key": "Color", "value": "Black"}]). Do not miss any.
        10. **Tags/Keywords**: A list of relevant search tags. If the page provides keywords, use those. Otherwise, generate 8-12 highly relevant tags based on all the information you've gathered.
        11. **Image URLs**: **This is a critical task.**
            *   **Focus exclusively on the main product image gallery.**
            *   **Prioritize the highest-resolution images available.**
            *   **ABSOLUTELY IGNORE:** Thumbnails, logos, icons, site branding, "related products" images, customer review images, and banner ads.
            *   The goal is to get *only* the official, high-quality product photos.
        
        Your extraction must be exhaustive and universally compatible with any e-commerce site structure. Ensure your output is ONLY a valid JSON object, with no additional text, comments, or markdown formatting.
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
        Brand: ${currentContent.brand || 'N/A'}
        Price: ${currentContent.price || 'N/A'}
        Category: ${currentContent.category || 'N/A'}
        Condition: ${currentContent.condition || 'N/A'}
        SKU: ${currentContent.sku || 'N/A'}
        Availability: ${currentContent.availability || 'N/A'}
        Description: ${currentContent.description}
        Specifications: ${currentContent.specifications?.map(s => `${s.key}: ${s.value}`).join(', ') || 'N/A'}
        Tags: ${currentContent.tags.join(', ')}

        Optimization goals:
        1.  **Title**: Rewrite the title to be more catchy, descriptive, and keyword-rich. Incorporate the brand name and primary keywords at the beginning. Keep it within a reasonable length for marketplace listings (around 60-80 characters).
        2.  **Description**: Rewrite the description to be more persuasive and structured. Use bullet points for key features and benefits. Start with a strong opening sentence. Use the category and specifications to enrich the text.
        3.  **Tags**: Generate a new, comprehensive list of 10-15 highly relevant and popular tags. Include the brand, model, category, and key specifications as tags.
        
        **CRITICAL**: You must preserve the original values for the following fields as they are factual data: 'imageUrls', 'price', 'brand', 'category', 'condition', 'sku', 'availability', and the 'specifications' array structure. Only correct minor typos if absolutely necessary.

        Return the optimized content as a JSON object that conforms to the provided schema.
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

        // Ensure factual data from the original content is preserved.
        parsedJson.imageUrls = currentContent.imageUrls;
        parsedJson.price = currentContent.price;
        parsedJson.brand = currentContent.brand;
        parsedJson.category = currentContent.category;
        parsedJson.condition = currentContent.condition;
        parsedJson.sku = currentContent.sku;
        parsedJson.availability = currentContent.availability;
        parsedJson.specifications = currentContent.specifications;

        if (!parsedJson.title || !parsedJson.description || !Array.isArray(parsedJson.tags)) {
            throw new Error("Invalid JSON structure received from API during optimization.");
        }

        return parsedJson as AdContent;

    } catch (error) {
        console.error("Error optimizing ad content:", error);
        throw new Error("Failed to optimize the content with Gemini API.");
    }
};