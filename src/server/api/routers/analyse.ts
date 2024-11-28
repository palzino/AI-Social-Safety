import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { env } from "~/env";

type ApiResponse = {
  choices: { message: { content: string } }[];
};
const extractMimeType = (base64String: string): string | null => {
  const match = base64String.match(/^data:image\/(png|jpeg|jpg|webp);base64,/);
  return match ? (match[1] ?? null) : null;
};
// Helper function to validate Base64 strings
const validateBase64 = (base64String: string) => {
  const regex = /^(data:image\/\w+;base64,)?[A-Za-z0-9+/=]+$/;
  return regex.test(base64String);
};

export const analyzeImageRouter = createTRPCRouter({
  analyzeImage: publicProcedure
    .input(
      z.object({
        file: z.string(), // Expect a Base64-encoded string
      }),
    )
    .mutation(async ({ input }) => {
      const { file } = input;

      const mimeType = extractMimeType(file);
      if (!mimeType) {
        throw new Error("Could not determine MIME type from Base64 string");
      }

      // Strip metadata and validate Base64
      const base64Data = file.replace(/^data:image\/\w+;base64,/, "");
      if (!validateBase64(base64Data)) {
        throw new Error("Invalid Base64 string");
      }

      try {
        // Call the external API
        const apiResponse = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.OPEN_AI_KEY}`, // Replace with your actual API key
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content:
                    'Analyze the following images and return your response in the following JSON format: {"contents": "respond with what the image contains", "13+": "true or false", "16-18": "true or false", "social_media": "true or false"}',
                },
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "You are an AI Moderator to keep children safe online. What’s in this image? Is it suitable for children over 13, suitable for children over 16 but under 18, and should this content be on social media? Please respond in the specified JSON format.",
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:image/${mimeType};base64,${base64Data}`,
                      }, // Include Base64 with metadata
                    },
                  ],
                },
              ],
            }),
          },
        );

        if (!apiResponse.ok) {
          const errorData = (await apiResponse.json()) as { error: string };
          console.error("OpenAI API Error:", errorData);
        }

        // Extract the response
        const apiResult: ApiResponse =
          (await apiResponse.json()) as ApiResponse;
        console.log("Raw API Response:", apiResult);

        // Extract the assistant's response
        const messageContent = apiResult?.choices?.[0]?.message?.content;
        if (!messageContent) {
          throw new Error("Invalid response from OpenAI API");
        }

        // Parse the JSON-like content returned by the assistant
        const parsedContent = JSON.parse(
          messageContent.replace(/^```json|```$/g, "").trim(),
        ) as {
          contents: string;
          "13+": boolean;
          "16-18": boolean;
          social_media: boolean;
        };

        // Return only the `contents` field
        return parsedContent;
      } catch (error) {
        console.error("Error during OpenAI API call:", error);
        throw new Error("Failed to process the image analysis request");
      }
    }),
});
