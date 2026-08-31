// src/app/seller/promotions/form.tsx
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FormScrollView } from "@/components/ui/FormScrollView";
import { IconButton } from "@/components/ui/IconButton";
import { useMyCategories } from "@/features/seller/hooks/useMyCategories";
import { useMyPromotions } from "@/features/seller/hooks/useMyPromotions";
import { useMyStoreCoffees } from "@/features/seller/hooks/useMyStoreCoffees";
import {
  createPromotion,
  deletePromotion,
  PromotionInput,
  updatePromotion,
} from "@/services/sellerPromotions";
import { fetchMyStore } from "@/services/stores";
import { useAuthStore } from "@/stores/authStore";
import { useConfirmDialogStore } from "@/stores/confirmDialogStore";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FieldInput } from "@/components/ui/FieldInput";
import { Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;


function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function PromotionFormScreen() {
  const { t } = useTranslation();
  const schema = z
    .object({
      title: z.string().min(1, t("seller.enterTitle")),
      description: z.string().min(1, t("seller.enterDescription")),
      discountPercent: z
        .string()
        .refine(
          (v) => !isNaN(Number(v)) && Number(v) > 0 && Number(v) <= 100,
          t("seller.enterPercent"),
        ),
      scope: z.enum(["all", "category", "coffee"]),
      categoryId: z.string().optional(),
      coffeeId: z.string().optional(),
      code: z.string().optional(),
      startsAt: z.string().regex(DATE_REGEX, t("seller.useYYYYMMDD")),
      endsAt: z.string().regex(DATE_REGEX, t("seller.useYYYYMMDD")),
      isActive: z.boolean(),
    })
    .refine((d) => d.scope !== "category" || !!d.categoryId, {
      message: "Choose a category",
      path: ["categoryId"],
    })
    .refine((d) => d.scope !== "coffee" || !!d.coffeeId, {
      message: "Choose a coffee",
      path: ["coffeeId"],
    })
    .refine((d) => d.endsAt >= d.startsAt, {
      message: "End date must be after start date",
      path: ["endsAt"],
    });
  type FormValues = z.infer<typeof schema>;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const userId = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();
  const showConfirm = useConfirmDialogStore((s) => s.show);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: myStore } = useQuery({
    queryKey: ["my-store", userId],
    queryFn: () => fetchMyStore(userId!),
    enabled: !!userId,
  });
  const { data: categories = [] } = useMyCategories(myStore?.id);
  const { data: coffees = [] } = useMyStoreCoffees(myStore?.id);
  const { data: promotions = [] } = useMyPromotions(myStore?.id);
  const existing = promotions.find((p) => String(p.id) === id);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      discountPercent: "20",
      scope: "all",
      categoryId: "",
      coffeeId: "",
      code: "",
      startsAt: todayPlus(0),
      endsAt: todayPlus(7),
      isActive: true,
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        description: existing.description,
        discountPercent: String(existing.discount_percent),
        scope: existing.scope,
        categoryId: existing.category_id ?? "",
        coffeeId: existing.coffee_id ?? "",
        code: existing.code ?? "",
        startsAt: existing.starts_at,
        endsAt: existing.ends_at,
        isActive: existing.is_active,
      });
    }
  }, [existing, reset]);

  const scope = useWatch({ control, name: "scope" });
  const applyDuration = useCallback(
    (days: number) => {
      setValue("startsAt", todayPlus(0));
      setValue("endsAt", todayPlus(days));
    },
    [setValue],
  );

  const onSubmit = useCallback(
    async (values: FormValues) => {
      if (!myStore) return;
      setServerError(null);
      const payload: PromotionInput = {
        title: values.title,
        description: values.description,
        discount_percent: Number(values.discountPercent),
        scope: values.scope,
        category_id: values.scope === "category" ? values.categoryId! : null,
        coffee_id: values.scope === "coffee" ? values.coffeeId! : null,
        starts_at: values.startsAt,
        ends_at: values.endsAt,
        is_active: values.isActive,
        code: values.code ? values.code.trim().toUpperCase() : null,
      };
      try {
        if (isEditing && existing) await updatePromotion(existing.id, payload);
        else await createPromotion(myStore.id, payload);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({
          queryKey: ["seller-promotions", myStore.id],
        });
        queryClient.invalidateQueries({ queryKey: ["promotions"] });
        router.back();
      } catch (err: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setServerError(
          err?.code === "23P01"
            ? t("seller.overlapError")
            : err?.code === "23505"
              ? t("seller.voucherInUse")
              : t("seller.couldNotSavePromo"),
        );
      }
    },
    [myStore, isEditing, existing, queryClient, router],
  );

  const handleDelete = useCallback(() => {
    if (!existing) return;
    showConfirm({
      title: t("seller.deletePromotionTitle"),
      message: t("seller.deletePromotionMessage", { title: existing.title }),
      confirmLabel: t("common.delete"),
      destructive: true,
      onConfirm: async () => {
        await deletePromotion(existing.id);
        queryClient.invalidateQueries({
          queryKey: ["seller-promotions", myStore?.id],
        });
        queryClient.invalidateQueries({ queryKey: ["promotions"] });
        router.back();
      },
    });
  }, [existing, myStore?.id, queryClient, router, showConfirm]);

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
          {isEditing ? t("seller.editPromotion") : t("seller.addPromotion")}
        </Text>
      </View>

      <FormScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Controller
          control={control}
          name="title"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("seller.titlePlaceholder")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("seller.titlePlaceholder")}
              error={errors.title?.message}
              containerStyle={{ marginBottom: spacing.sm }}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("seller.descriptionPlaceholder2")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("seller.descriptionPlaceholder2")}
              error={errors.description?.message}
              multiline
              numberOfLines={2}
              inputStyle={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }}
              containerStyle={{ marginTop: spacing.sm, marginBottom: spacing.sm }}
            />
          )}
        />

        <Controller
          control={control}
          name="discountPercent"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("seller.discountPercentPlaceholder")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("seller.discountPercentPlaceholder")}
              error={errors.discountPercent?.message}
              keyboardType="decimal-pad"
              containerStyle={{ marginTop: spacing.sm, marginBottom: spacing.sm }}
            />
          )}
        />

        <Controller
          control={control}
          name="code"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldInput
              label={t("seller.voucherCodePlaceholder")}
              value={value ?? ""}
              onChangeText={(v) => onChange(v.toUpperCase())}
              onBlur={onBlur}
              placeholder={t("seller.voucherCodePlaceholder")}
              autoCapitalize="characters"
              autoCorrect={false}
              hint={t("seller.customersEnterCode")}
              containerStyle={{ marginTop: spacing.sm, marginBottom: spacing.sm }}
            />
          )}
        />

        <Text
          style={{
            color: colors.ink,
            fontWeight: "800",
            fontSize: typography.bodySmall,
            marginTop: spacing.md,
            marginBottom: spacing.sm,
          }}
        >{t("seller.appliesTo")}</Text>
        <Controller
          control={control}
          name="scope"
          render={({ field: { value, onChange } }) => (
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Chip
                label={t("seller.wholeShop")}
                active={value === "all"}
                onPress={() => onChange("all")}
              />
              <Chip
                label={t("seller.oneCategory")}
                active={value === "category"}
                onPress={() => onChange("category")}
              />
              <Chip
                label={t("seller.oneCoffee")}
                active={value === "coffee"}
                onPress={() => onChange("coffee")}
              />
            </View>
          )}
        />

        {scope === "category" && (
          <View style={{ marginTop: spacing.md }}>
            <Controller
              control={control}
              name="categoryId"
              render={({ field: { value, onChange } }) => (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: spacing.sm,
                  }}
                >
                  {categories.map((c) => (
                    <Chip
                      key={c.id}
                      label={c.name}
                      active={value === c.id}
                      onPress={() => onChange(c.id)}
                    />
                  ))}
                </View>
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
          </View>
        )}

        {scope === "coffee" && (
          <View style={{ marginTop: spacing.md }}>
            <Controller
              control={control}
              name="coffeeId"
              render={({ field: { value, onChange } }) => (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: spacing.sm,
                  }}
                >
                  {coffees.map((c) => (
                    <Chip
                      key={c.id}
                      label={c.name}
                      active={value === c.id}
                      onPress={() => onChange(c.id)}
                    />
                  ))}
                </View>
              )}
            />
            {errors.coffeeId && (
              <Text
                style={{
                  color: colors.danger,
                  fontSize: 11,
                  marginTop: spacing.sm,
                }}
              >
                {errors.coffeeId.message}
              </Text>
            )}
          </View>
        )}

        <Text
          style={{
            color: colors.ink,
            fontWeight: "800",
            fontSize: typography.bodySmall,
            marginTop: spacing.xl,
            marginBottom: spacing.sm,
          }}
        >{t("seller.duration")}</Text>
        <View
          style={{
            flexDirection: "row",
            gap: spacing.sm,
            marginBottom: spacing.md,
          }}
        >
          <Chip
            label={t("seller.week1")}
            active={false}
            onPress={() => applyDuration(7)}
          />
          <Chip
            label={t("seller.weeks2")}
            active={false}
            onPress={() => applyDuration(14)}
          />
          <Chip
            label={t("seller.month1")}
            active={false}
            onPress={() => applyDuration(30)}
          />
        </View>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="startsAt"
              render={({ field: { value, onChange, onBlur } }) => (
                <FieldInput
                  label={t("seller.startPlaceholder")}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={t("seller.startPlaceholder")}
                  error={errors.startsAt?.message}
                />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="endsAt"
              render={({ field: { value, onChange, onBlur } }) => (
                <FieldInput
                  label={t("seller.endPlaceholder")}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={t("seller.endPlaceholder")}
                  error={errors.endsAt?.message}
                />
              )}
            />
          </View>
        </View>

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
          >{t("seller.active")}</Text>
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

        {serverError && (
          <Text
            style={{
              color: colors.danger,
              fontSize: 12,
              marginTop: spacing.lg,
            }}
          >
            {serverError}
          </Text>
        )}
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
          label={isEditing ? t("common.saveChanges") : t("seller.addPromotion")}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          variant="primary"
        />
        {isEditing && (
          <View style={{ marginTop: spacing.sm }}>
            <Button
              label={t("seller.deletePromotion")}
              onPress={handleDelete}
              variant="danger"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
