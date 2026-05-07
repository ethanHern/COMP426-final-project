import { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import { Profile } from "../models/listing";

export const getProfile = async (
  supabase: SupabaseClient,
  user: User
): Promise<z.infer<typeof Profile>> => {
  const { data, error } = await supabase
    .from("profile")
    .select(`id, name, handle, avatar_url `)
    .eq("id", user.id);
    
  if (error || !data) {
    throw error || new Error("No listing data was retrieved.");
  }

  return Profile.parse(data[0]);
};
