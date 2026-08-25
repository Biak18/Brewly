// src/features/account/hooks/useAvatarUpload.ts
import { uploadAvatar } from "@/services/profile";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";

export function useAvatarUpload(userId: string | undefined) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUpload = useCallback(async (): Promise<string | null> => {
    if (!userId) return null;
    setError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library access is needed to set an avatar.");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return null;

    setIsUploading(true);
    try {
      const image = ImageManipulator.ImageManipulator.manipulate(
        result.assets[0].uri,
      );
      image.resize({ width: 512 });

      const rendered = await image.renderAsync();
      const saved = await rendered.saveAsync({
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      return await uploadAvatar(userId, saved.uri);
    } catch {
      setError("Upload failed. Please try again.");
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [userId]);

  return { pickAndUpload, isUploading, error };
}
