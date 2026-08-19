// src/services/coffees.ts
import { supabase } from "./supabase";

export type Category = { id: string; name: string; sort_order: number };
export type MenuSort = "popular" | "price_asc" | "price_desc" | "name";
export type CoffeeOption = {
  id: string;
  type: "size" | "temperature" | "milk" | "extra";
  label: string;
  price_delta: number;
};

export type Coffee = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  rating: number | null;
  is_featured: boolean;
};

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function fetchFeaturedCoffees(): Promise<Coffee[]> {
  const { data, error } = await supabase
    .from("coffees")
    .select("*")
    .eq("is_featured", true)
    .eq("is_active", true)
    .limit(10);
  if (error) throw error;
  return data;
}

export async function fetchPopularCoffees(): Promise<Coffee[]> {
  const { data, error } = await supabase
    .from("coffees")
    .select("*")
    .eq("is_active", true)
    .order("rating", { ascending: false })
    .limit(10);
  if (error) throw error;
  return data;
}

export async function fetchRecommendedCoffees(): Promise<Coffee[]> {
  const { data, error } = await supabase
    .from("coffees")
    .select("*")
    .eq("is_featured", false)
    .eq("is_active", true)
    .limit(10);
  if (error) throw error;
  return data;
}

export async function fetchMenuCoffees(params: {
  categoryId?: string | null;
  search?: string;
  sort?: MenuSort;
  page?: number;
  pageSize?: number;
}): Promise<Coffee[]> {
  const page = params.page ?? 0;
  const pageSize = params.pageSize ?? 20;
  let query = supabase.from("coffees").select("*").eq("is_active", true);
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

export async function fetchCoffeeById(id: string): Promise<Coffee> {
  const { data, error } = await supabase
    .from("coffees")
    .select("*")
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

export async function fetchFavoriteCoffees(userId: string): Promise<Coffee[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("coffee_id, coffees(*)")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row: any) => row.coffees).filter(Boolean);
}
