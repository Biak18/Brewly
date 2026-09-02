// src/services/reviews.ts
import { supabase } from "./supabase";

export type CoffeeReview = {
  id: string;
  coffee_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
};

const REVIEW_FIELDS = `
  id, coffee_id, user_id, rating, comment, created_at,
  profiles(full_name)
`;

function mapReview(row: any): CoffeeReview {
  return {
    id: row.id,
    coffee_id: row.coffee_id,
    user_id: row.user_id,
    rating: row.rating,
    comment: row.comment ?? null,
    created_at: row.created_at,
    reviewer_name: row.profiles?.full_name || "Coffee lover",
  };
}

export async function fetchCoffeeReviews(
  coffeeId: string,
  limit = 20,
): Promise<CoffeeReview[]> {
  const { data, error } = await supabase
    .from("coffee_reviews")
    .select(REVIEW_FIELDS)
    .eq("coffee_id", coffeeId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapReview);
}

// Which coffees of this order the current user has already reviewed,
// powers the "rate your drinks" prompts without double submissions.
export async function fetchReviewedCoffeeIds(
  orderId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("coffee_reviews")
    .select("coffee_id")
    .eq("order_id", orderId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.coffee_id as string);
}

// Server-verified: the RPC re-checks that the order belongs to the caller,
// is completed, and actually contains this coffee before inserting.
export async function submitCoffeeReview(params: {
  coffeeId: string;
  orderId: string;
  rating: number;
  comment?: string;
}): Promise<void> {
  const { error } = await supabase.rpc("submit_coffee_review", {
    p_coffee_id: params.coffeeId,
    p_order_id: params.orderId,
    p_rating: params.rating,
    p_comment: params.comment?.trim() ? params.comment.trim() : null,
  });
  if (error) throw error;
}
