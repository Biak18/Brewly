// src/app/seller/menu/coffee-form.tsx
import { CoffeeImage } from "@/components/coffee/CoffeeImage";
import { Button } from "@/components/ui/Button";
import { FormScrollView } from "@/components/ui/FormScrollView";
import { IconButton } from "@/components/ui/IconButton";
import { CategoryPicker } from "@/features/seller/components/CategoryPicker";
import { useImageUpload } from "@/features/seller/hooks/useImageUpload";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fetchCoffeeById } from "@/services/coffees";
import { createCoffee, updateCoffee } from "@/services/sellerMenu";
import { fetchMyStore } from "@/services/stores";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Camera, ChevronLeft, ImageOff } from "lucide-react-native";
import { useCallback, useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FieldInput } from "@/components/ui/FieldInput";
import {
  ActivityIndicator,
  Pressable,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";



export default function CoffeeFormScreen() {
  const { t } = useTranslation();
  const schema = z.object({
    name: z.string().min(1, t("seller.enterName")),
    description: z.string().min(1, t("seller.enterDescription")),
    basePrice: z
      .string()
      .refine((v) => !isNaN(Number(v)) && Number(v) > 0, t("seller.enterValidPrice")),
    imageUrl: z.string().url(t("seller.enterValidUrl")).or(z.literal("")),
    categoryId: z.string().min(1, "Choose a category"),
    isActive: z.boolean(),
  });
  type FormValues = z.infer<typeof schema>;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const router = useRouter();
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
        is_featured: existingCoffee?.is_featured ?? false,
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
    [myStore, isEditing, id, queryClient, router, existingCoffee],
  );

  const handlePickImage = useCallback(async () => {
    const url = await pickAndUpload();
    if (url) setValue("imageUrl", url, { shouldValidate: true });
  }, [pickAndUpload, setValue]);

  if (!myStore) return null;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: spacing.sm,
        backgroundColor: colors.bg,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
        }}
      >
        <IconButton accessibilityLabel={t("common.back")} onPress={() => router.back()}>
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
          {isEditing ? t("seller.editCoffee") : t("seller.addCoffee")}
        </Text>
      </View>

      <FormScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl }}>
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
                  >{t("seller.noImageYet")}</Text>
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
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("seller.imageUrl")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("seller.imageUrl")}
              error={errors.imageUrl?.message}
              autoCapitalize="none"
              containerStyle={{ marginBottom: spacing.xs }}
            />
          )}
        />
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.caption,
            marginBottom: spacing.xl,
          }}
        >{t("seller.pasteLinkNote")}</Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("seller.namePlaceholder")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("seller.namePlaceholder")}
              error={errors.name?.message}
              containerStyle={{ marginBottom: spacing.sm }}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("seller.descriptionPlaceholder")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("seller.descriptionPlaceholder")}
              error={errors.description?.message}
              multiline
              numberOfLines={3}
              inputStyle={{ minHeight: 80, textAlignVertical: "top", paddingTop: 12 }}
              containerStyle={{ marginTop: spacing.sm, marginBottom: spacing.sm }}
            />
          )}
        />

        <Controller
          control={control}
          name="basePrice"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("seller.pricePlaceholder")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("seller.pricePlaceholder")}
              error={errors.basePrice?.message}
              keyboardType="decimal-pad"
              containerStyle={{ marginTop: spacing.sm, marginBottom: spacing.sm }}
            />
          )}
        />

        <Text
          style={{
            color: colors.ink,
            fontWeight: "800",
            fontSize: typography.bodySmall,
            marginBottom: spacing.sm,
          }}
        >{t("seller.category")}</Text>
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
            marginBottom: spacing.lg,
          }}
        >
          <Text
            style={{
              color: colors.ink,
              fontSize: typography.bodySmall,
              fontWeight: "600",
            }}
          >{t("seller.activeVisibleCustomers")}</Text>
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
      </FormScrollView>

      <View
        style={{
          padding: spacing.xl,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          backgroundColor: colors.surface,
        }}
      >
        <Button
          label={isEditing ? t("common.saveChanges") : t("seller.addCoffee")}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
}
