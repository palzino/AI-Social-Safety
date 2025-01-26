"use client";

import { useState } from "react";
import { Title, Center, Text, Button, FileInput } from "@mantine/core";
import { api } from "~/trpc/react";
import Image from "next/image";
import { ModeToggle } from "./_components/modeToggle/modeToggle";
type ApiResponse = {
  contents: string;
  "13+": boolean;
  "16-18": boolean;
  social_media: boolean;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null); // To store Base64 image

  const analyzeImageMutation = api.analyseImage.analyzeImage.useMutation();

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); // Ensures `data:image/<format>;base64,...`
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };
  const handleUpload = async () => {
    if (!file) {
      alert("Please upload a file first");
      return;
    }

    try {
      const base64File = await fileToBase64(file);
      console.log("Base64 File:", base64File);
      setBase64Image(base64File);

      analyzeImageMutation.mutate(
        { file: base64File }, // Send the file as a Base64 string
        {
          onSuccess: (data) => {
            setResponse(data);
          },
          onError: (error) => {
            console.error("Error analyzing image:", error);
            alert("Something went wrong. Please try again.");
          },
        },
      );
    } catch (error) {
      console.error("Error converting file to Base64:", error);
      alert("Something went wrong while processing the file.");
    }
  };

  return (
    <>
      <ModeToggle />
      <Center>
        <Title>Social Media Content Checker</Title>
      </Center>

      <Center>
        <Text>
          Please click the upload button below to upload a photo to analyze
        </Text>
      </Center>

      <Center mt="md">
        <FileInput
          placeholder="Upload your image"
          label=""
          accept="image/*"
          onChange={setFile}
        />
      </Center>

      <Center mt="md">
        <Button
          onClick={handleUpload}
          disabled={analyzeImageMutation.status === "pending"}
        >
          {analyzeImageMutation.status === "pending"
            ? "Analyzing..."
            : "Analyze Image"}
        </Button>
      </Center>

      <Center mt="md">
        {response && (
          <Text>
            <strong>Analysis Result:</strong> {response.contents}
            <br />
            <strong>Suitable for 13+:</strong> {response["13+"] ? "Yes" : "No"}
            <br />
            <strong>Suitable for 16-18:</strong>{" "}
            {response["16-18"] ? "Yes" : "No"}
            <br />
            <strong>Suitable for Social Media:</strong>{" "}
            {response.social_media ? "Yes" : "No"}
          </Text>
        )}
      </Center>

      <Center mt="md">
        {base64Image && (
          <Image
            src={base64Image}
            alt="Uploaded Image"
            height={350}
            width={350}
          />
        )}
      </Center>
    </>
  );
}
