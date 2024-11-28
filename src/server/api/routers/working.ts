import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { env } from "~/env";

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

      // Example: Decode Base64 back to a Buffer if needed
      const base64Data = file.replace(/^data:image\/\w+;base64,/, "");
      if (!validateBase64(base64Data)) {
        throw new Error("Invalid Base64 string");
      }
      // Example: Call the external API
      const apiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.OPEN_AI_KEY} `,
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
                    text: "What’s in this image? Is it suitable for children over 13, suitable for children over 16 but under 18, and should this content be on social media? Please respond in the specified JSON format.",
                  },
                  {
                    type: "image_url",
                    image_url: { url: `data:image/png;base64,${base64Data}` }, // Send the Base64 string
                  },
                ],
              },
            ],
          }),
        },
      );

      type ApiResponse = {
        contents: string;
        "13+": boolean;
        "16-18": boolean;
        social_media: boolean;
      };

      const result: ApiResponse = (await apiResponse.json()) as ApiResponse;

      return result; // Ensure the result matches your ApiResponse type
    }),
});
