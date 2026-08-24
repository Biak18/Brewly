// src/app/seller/menu/coffee-form.tsx
import { CoffeeImage } from "@/components/coffee/CoffeeImage";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { CategoryPicker } from "@/features/seller/components/CategoryPicker";
import { useImageUpload } from "@/features/seller/hooks/useImageUpload";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fetchCoffeeById } from "@/services/coffees";
import { createCoffee, updateCoffee } from "@/services/sellerMenu";
import { fetchMyStore } from "@/services/stores";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Camera, ChevronLeft, ImageOff } from "lucide-react-native";
import { useCallback, useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Enter a name"),
  description: z.string().min(1, "Enter a description"),
  basePrice: z
    .string()
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Enter a valid price"),
  imageUrl: z.string().url("Enter a valid URL").or(z.literal("")),
  categoryId: z.string().min(1, "Choose a category"),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export default function CoffeeFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, typography } = useTheme();
  const userId = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();

  const { data: myStore } = useQuery({
    queryKey: ["my-store", userId],
    queryFn: () => fetchMyStore(userId!),
    enabled: !!userId,
  });
  const { data: existingCoffee } = useQuery({
    queryKey: ["coffee", id],
    queryFn: () => fetchCoffeeById(id!),
    enabled: isEditing,
  });
  const {
    pickAndUpload,
    isUploading,
    error: uploadError,
  } = useImageUpload(myStore?.id, id);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      basePrice: "",
      imageUrl: "",
      categoryId: "",
      isFeatured: false,
      isActive: true,
    },
  });

  const imageUrlValue = useWatch({ control, name: "imageUrl" });
  const debouncedImageUrl = useDebouncedValue(imageUrlValue, 400);
  const previewUrl = debouncedImageUrl?.startsWith("http")
    ? debouncedImageUrl
    : null;

  useEffect(() => {
    if (existingCoffee) {
      reset({
        name: existingCoffee.name,
        description: existingCoffee.description ?? "",
        basePrice: String(existingCoffee.base_price),
        imageUrl: existingCoffee.image_url ?? "",
        categoryId: existingCoffee.category_id ?? "",
        isFeatured: existingCoffee.is_featured ?? false,
        isActive: existingCoffee.is_active ?? true,
      });
    }
  }, [existingCoffee, reset]);

  const onSubmit = useCallback(
    async (values: FormValues) => {
      if (!myStore) return;
      const payload = {
        name: values.name,
        description: values.description,
        base_price: Number(values.basePrice),
        image_url: values.imageUrl,
        category_id: values.categoryId,
        is_featured: values.isFeatured,
        is_active: values.isActive,
      };
      try {
        if (isEditing) await updateCoffee(id!, payload);
        else await createCoffee(myStore.id, payload);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({
          queryKey: ["seller-coffees", myStore.id],
        });
        queryClient.invalidateQueries({ queryKey: ["coffees"] }); // catches Home/Menu/Favorites' customer-facing caches too
        router.back();
      } catch {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [myStore, isEditing, id, queryClient, router],
  );

  const handlePickImage = useCallback(async () => {
    const url = await pickAndUpload();
    if (url) setValue("imageUrl", url, { shouldValidate: true });
  }, [pickAndUpload, setValue]);

  if (!myStore) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
        }}
      >
        <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
          <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
        </IconButton>
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.subheading,
            fontWeight: "800",
            marginLeft: spacing.md,
          }}
        >
          {isEditing ? "Edit coffee" : "Add coffee"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl }}>
        <View style={{ marginBottom: spacing.lg }}>
          <Pressable onPress={handlePickImage} disabled={isUploading}>
            <View style={{ marginBottom: spacing.sm }}>
              {previewUrl ? (
                <CoffeeImage uri={previewUrl} height={180} radius={radius.xl} />
              ) : (
                <View
                  style={{
                    height: 180,
                    borderRadius: radius.xl,
                    backgroundColor: colors.surface2,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.line,
                    borderStyle: "dashed",
                  }}
                >
                  <ImageOff size={28} color={colors.muted} strokeWidth={1.6} />
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: typography.caption,
                      marginTop: spacing.sm,
                      fontWeight: "600",
                    }}
                  >
                    No image yet
                  </Text>
                </View>
              )}
              <View
                style={{
                  position: "absolute",
                  bottom: 10,
                  right: 10,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.espresso,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isUploading ? (
                  <ActivityIndicator color={colors.surface} size="small" />
                ) : (
                  <Camera size={18} color={colors.surface} strokeWidth={1.8} />
                )}
              </View>
            </View>
          </Pressable>
          {uploadError && (
            <Text
              style={{
                color: colors.danger,
                fontSize: 11,
                marginBottom: spacing.sm,
              }}
            >
              {uploadError}
            </Text>
          )}
        </View>

        <Controller
          control={control}
          name="imageUrl"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="Image URL"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: colors.line,
                height: 48,
                paddingHorizontal: 14,
                fontSize: 14,
                color: colors.ink,
                borderRadius: radius.md,
                marginBottom: spacing.xs,
              }}
            />
          )}
        />
        {errors.imageUrl && (
          <Text
            style={{
              color: colors.danger,
              fontSize: 11,
              marginBottom: spacing.sm,
            }}
          >
            {errors.imageUrl.message}
          </Text>
        )}
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.caption,
            marginBottom: spacing.xl,
          }}
        >
          Paste a link for now — direct photo upload is next.
        </Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="Name"
              placeholderTextColor={colors.muted}
              style={{
                borderWidth: 1,
                borderColor: colors.line,
                height: 48,
                paddingHorizontal: 14,
                fontSize: 14,
                color: colors.ink,
                borderRadius: radius.md,
                marginBottom: spacing.xs,
              }}
            />
          )}
        />
        {errors.name && (
          <Text
            style={{
              color: colors.danger,
              fontSize: 11,
              marginBottom: spacing.sm,
            }}
          >
            {errors.name.message}
          </Text>
        )}

        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="Description"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1,
                borderColor: colors.line,
                minHeight: 80,
                padding: 14,
                fontSize: 14,
                color: colors.ink,
                borderRadius: radius.md,
                marginTop: spacing.sm,
                marginBottom: spacing.xs,
                textAlignVertical: "top",
              }}
            />
          )}
        />
        {errors.description && (
          <Text
            style={{
              color: colors.danger,
              fontSize: 11,
              marginBottom: spacing.sm,
            }}
          >
            {errors.description.message}
          </Text>
        )}

        <Controller
          control={control}
          name="basePrice"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="Price (e.g. 4.50)"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              style={{
                borderWidth: 1,
                borderColor: colors.line,
                height: 48,
                paddingHorizontal: 14,
                fontSize: 14,
                color: colors.ink,
                borderRadius: radius.md,
                marginTop: spacing.sm,
                marginBottom: spacing.xs,
              }}
            />
          )}
        />
        {errors.basePrice && (
          <Text
            style={{
              color: colors.danger,
              fontSize: 11,
              marginBottom: spacing.sm,
            }}
          >
            {errors.basePrice.message}
          </Text>
        )}

        <Text
          style={{
            color: colors.ink,
            fontWeight: "800",
            fontSize: typography.bodySmall,
            marginBottom: spacing.sm,
          }}
        >
          Category
        </Text>
        <Controller
          control={control}
          name="categoryId"
          render={({ field: { value, onChange } }) => (
            <CategoryPicker
              storeId={myStore.id}
              value={value}
              onChange={onChange}
            />
          )}
        />
        {errors.categoryId && (
          <Text
            style={{
              color: colors.danger,
              fontSize: 11,
              marginTop: spacing.sm,
            }}
          >
            {errors.categoryId.message}
          </Text>
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: spacing.xl,
          }}
        >
          <Text
            style={{
              color: colors.ink,
              fontSize: typography.bodySmall,
              fontWeight: "600",
            }}
          >
            Featured
          </Text>
          <Controller
            control={control}
            name="isFeatured"
            render={({ field: { value, onChange } }) => (
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ true: colors.green, false: colors.line }}
              />
            )}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: spacing.md,
          }}
        >
          <Text
            style={{
              color: colors.ink,
              fontSize: typography.bodySmall,
              fontWeight: "600",
            }}
          >
            Active (visible to customers)
          </Text>
          <Controller
            control={control}
            name="isActive"
            render={({ field: { value, onChange } }) => (
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ true: colors.green, false: colors.line }}
              />
            )}
          />
        </View>
      </ScrollView>

      <View
        style={{
          padding: spacing.xl,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          backgroundColor: colors.surface,
        }}
      >
        <Button
          label={isEditing ? "Save changes" : "Add coffee"}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
}
