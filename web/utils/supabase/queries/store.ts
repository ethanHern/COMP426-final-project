/**
 * /queries/store contains the Supabase query for
 * reading all stores from the database.
 *
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { Store } from "../models/listing";
import { z } from "zod";

/**
 * Retrieves all stores from the database.
 *
 * This function gets all stores from the database and returns them
 * in alphabetical order by name (quality of life use). The data returned
 * matches the format of the `Store` Zod model.
 *
 * @param supabase: Supabase client to use.
 * @returns: Array of Store objects.
 */
export const getAllStores = async (
  supabase: SupabaseClient
): Promise<z.infer<typeof Store>[]> => {
  const { data, error } = await supabase
    .from("store")
    .select("id, name, description, location, logo_url")
    .order("name");

  if (error || !data) {
    throw error || new Error("Failed to fetch stores");
  }

  return Store.array().parse(data);
};

/**
 * Fetches a specific store by its ID
 *
 * @param supabase Supabase client to use
 * @param storeId ID of the store to fetch
 * @returns Store details or null if not found
 */
export const getStoreById = async (
  supabase: SupabaseClient,
  storeId: string
): Promise<z.infer<typeof Store> | null> => {
  const { data, error } = await supabase
    .from("store")
    .select("*")
    .eq("id", storeId)
    .single();

  if (error || !data) {
    throw error || new Error("Failed to fetch store");
  }

  return Store.parse(data);
};
