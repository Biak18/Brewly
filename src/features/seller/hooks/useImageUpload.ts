// src/features/seller/hooks/useImageUpload.ts
import { uploadCoffeeImage } from "@/services/storage";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";

export function useImageUpload(
  storeId: string | undefined,
  coffeeId: string | undefined,
) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUpload = useCallback(async (): Promise<string | null> => {
    if (!storeId) return null;
    setError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library access is needed to add an image.");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.canceled || !result.assets[0]) return null;

    setIsUploading(true);
    try {
      //   const manipulated = await ImageManipulator.manipulateAsync(
      //     result.assets[0].uri,
      //     [{ resize: { width: 1200 } }],
      //     { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
      //   );

      const image = ImageManipulator.ImageManipulator.manipulate(
        result.assets[0].uri,
      );

      image.resize({ width: 1200 });

      const renderedImage = await image.renderAsync();

      const manipulated = await renderedImage.saveAsync({
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const fileName = coffeeId ? `${coffeeId}.jpg` : `new-${Date.now()}.jpg`;
      return await uploadCoffeeImage(storeId, manipulated.uri, fileName);
    } catch {
      setError("Upload failed. Please try again.");
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [storeId, coffeeId]);

  return { pickAndUpload, isUploading, error };
}
