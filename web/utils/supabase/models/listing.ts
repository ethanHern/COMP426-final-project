// Zod validation models
import { z } from "zod";

// Defines the schema for a store
export const Store = z.object({
  id: z.string(),
  name: z.string().default(""),
  description: z.string().default(""),
  location: z.string().nullable().default(null),
  logo_url: z.string().nullable().default(null),
});

// Defines the schema for a profile and author data
export const Profile = z.object({
  id: z.string(),
  name: z.string().default(""),
  handle: z.string().default(""),
  avatar_url: z.string().nullable().default(null),
});

// Defines the schema for individual likes on a listing
export const ListingLikes = z.object({
  user_id: z.string(),
});

// We only need to grab the relevant post_ids because we can filter our queries using our own user_id
export const Bookmarks = z.object({
  user_id: z.string(),
});

// Defines the schema for a listing
export const Listing = z.object({
  id: z.string(), 
  user: Profile, 
  store: Store, 
  name: z.string(), 
  description: z.string(),
  category: z.string(),
  created_on: z.date({ coerce: true }),
  expires_on: z.date({ coerce: true }).nullable(),
  image_url: z.string().nullable(),
  likes: ListingLikes.array(),
  bookmarks: Bookmarks.array(),
});

// Defines the schema for the listings that will be checked for expiration in realtime
export const ListingExpiration = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  expires_on: z.date({coerce: true}).nullable(),
});