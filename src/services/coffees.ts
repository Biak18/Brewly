// src/services/coffees.ts
import type { Tables } from "@/types/database";
import { supabase } from "./supabase";

export type Category = Tables<"categories">;
export type Coffee = Tables<"coffees">;

export type MenuSort = "popular" | "price_asc" | "price_desc" | "name";
export type CoffeeOption = {
  id: string;
  type: "size" | "temperature" | "milk" | "extra";
  label: string;
  price_delta: number;
};

// export type CoffeeWithStoreName = Coffee & { stores: { name: string } | null };
export type CoffeeWithStoreName = Awaited<ReturnType<typeof fetchCoffeeById>>;

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function fetchCategoriesForStore(
  storeId: string,
): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("store_id", storeId)
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function fetchFeaturedCoffees(): Promise<CoffeeWithStoreName[]> {
  const { data, error } = await supabase
    .from("coffees")
    .select("*, stores(name)")
    .eq("is_featured", true)
    .eq("is_active", true)
    .limit(10);
  if (error) throw error;
  return data;
}

export async function fetchPopularCoffees(): Promise<CoffeeWithStoreName[]> {
  const { data, error } = await supabase
    .from("coffees")
    .select("*, stores(name)")
    .eq("is_active", true)
    .order("rating", { ascending: false })
    .limit(10);
  if (error) throw error;
  return data;
}

export async function fetchRecommendedCoffees(): Promise<
  CoffeeWithStoreName[]
> {
  const { data, error } = await supabase
    .from("coffees")
    .select("*, stores(name)")
    .eq("is_featured", false)
    .eq("is_active", true)
    .limit(10);
  if (error) throw error;
  return data;
}

export async function fetchMenuCoffees(params: {
  storeId: string;
  categoryId?: string | null;
  search?: string;
  sort?: MenuSort;
  page?: number;
  pageSize?: number;
}): Promise<Coffee[]> {
  const page = params.page ?? 0;
  const pageSize = params.pageSize ?? 20;
  let query = supabase
    .from("coffees")
    .select("*")
    .eq("is_active", true)
    .eq("store_id", params.storeId);
  if (params.categoryId) query = query.eq("category_id", params.categoryId);
  if (params.search?.trim()) {
    const term = params.search.trim();
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }
  switch (params.sort) {
    case "price_asc":
      query = query.order("base_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("base_price", { ascending: false });
      break;
    case "name":
      query = query.order("name", { ascending: true });
      break;
    default:
      query = query.order("rating", { ascending: false });
  }
  query = query.range(page * pageSize, page * pageSize + pageSize - 1);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchCoffeeById(id: string) {
  const { data, error } = await supabase
    .from("coffees")
    .select("*, stores(name)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchCoffeeOptionsForCategory(
  categoryId: string,
): Promise<CoffeeOption[]> {
  const { data, error } = await supabase.rpc("get_coffee_options", {
    p_category_id: categoryId,
  });
  if (error) throw error;
  return data;
}

export async function fetchFavoriteCoffees(
  userId: string,
): Promise<CoffeeWithStoreName[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("coffee_id, coffees(*, stores(name))")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row: any) => row.coffees).filter(Boolean);
}
