/**
 * /queries/listing contains all of the Supabase queries for
 * creating, reading, updating, and deleting data in our
 * database relating to listings.
 *
 */

import { SupabaseClient, User } from "@supabase/supabase-js";
import { Listing } from "../models/listing";
import { z } from "zod";

/**
 * Loads data for a specific listing given its ID.
 *
 * The data returned should match the format of the
 * `Listing` Zod model. Make sure to select the correct
 * columns and perform any joins that are necessary.
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param listingId: Listing data to retrieve.
 * @returns: Listing object.
 */
export const getListing = async (
  supabase: SupabaseClient,
  listingId: string
): Promise<z.infer<typeof Listing>> => {
  const { data, error } = await supabase
    .from("listing")
    .select(
      `
      id,
      name, 
      description,
      category,
      created_on,
      expires_on,
      image_url,
      user:user_id (
        id,
        name,
        handle,
        avatar_url
      ),
      store:store_id (
        id,
        name,
        description,
        location,
        logo_url
      ),
      likes:like!listing_id (
        user_id
      ),
      bookmarks:bookmark!listing_id (
        user_id
      )
    `
    )
    .eq("id", listingId);

  if (error || !data) {
    throw error || new Error("No listing data was retrieved.");
  }

  return Listing.parse(data[0]);
};

/**
 * Loads data for the user's listing feed.
 *
 * This function should retrieve the most recent listings in the
 * `listing` database in reverse chronological order
 * (so that the *most recent listings* appear first).
 *
 * This method is *paginated* - meaning that it
 * should only load a range of data at a time, but not
 * all of the data at once. The method passes in a
 * `cursor` parameter which should determine the starting
 * index for the listing to load. Each page should be a length
 * of 18 listings long.
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param cursor: Starting index of the page.
 * @returns: Array of Listing objects.
 */
export const getFeed = async (
  supabase: SupabaseClient,
  cursor: number
): Promise<z.infer<typeof Listing>[]> => {
  const { data, error } = await supabase
    .from("listing")
    .select(
      `
      id,
      name, 
      description,
      category,
      created_on,
      expires_on,
      image_url,
      user:user_id (
        id,
        name,
        handle,
        avatar_url
      ),
      store:store_id (
        id,
        name,
        description,
        location,
        logo_url
      ),
      likes:like!listing_id (
        user_id
      ),
      bookmarks:bookmark!listing_id (
        user_id
      )
    `
    )
    // Order by created_on in descending order, because more recent
    // listings are considered as greater than older listings
    .order("created_on", { ascending: false })
    // 18 listings per page, so range is from cursor to cursor+17
    // Range is 0-index and inclusive on both ends
    .range(cursor, cursor + 17);

  if (error || !data) {
    throw error || new Error("No listing data was retrieved.");
  }
  // Log the data for debugging purposes
  return Listing.array().parse(data);
};

/**
 * Loads data for the user's listing feed in oldest first order.
 *
 * This function should retrieve the listings in the
 * `listing` database in chronological order
 * (so that the *oldest listings* appear first).
 *
 * This method is *paginated* - meaning that it
 * should only load a range of data at a time, but not
 * all of the data at once. The method passes in a
 * `cursor` parameter which should determine the starting
 * index for the listing to load. Each page should be a length
 * of 18 listings long.
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param cursor: Starting index of the page.
 * @returns: Array of Listing objects.
 */
export const getOldestFeed = async (
  supabase: SupabaseClient,
  cursor: number
): Promise<z.infer<typeof Listing>[]> => {
  const { data, error } = await supabase
    .from("listing")
    .select(
      `
      id,
      name, 
      description,
      category,
      created_on,
      expires_on,
      image_url,
      user:user_id (
        id,
        name,
        handle,
        avatar_url
      ),
      store:store_id (
        id,
        name,
        description,
        location,
        logo_url
      ),
      likes:like!listing_id (
        user_id
      ),
      bookmarks:bookmark!listing_id (
        user_id
      )
    `
    )
    // Order by created_on in ascending order for oldest first
    .order("created_on", { ascending: true })
    // 18 listings per page
    .range(cursor, cursor + 17);

  if (error || !data) {
    throw error || new Error("No listing data was retrieved.");
  }

  return Listing.array().parse(data);
};

/**
 * Loads data for the user's 'bookmarks' listing feed.
 *
 * This function should retrieve the most recent listings in the
 * `listing` database in reverse chronological order
 * (so that the *most recent listings* appear first) that
 * the user has bookmarked.
 *
 * This method is *paginated* - meaning that it
 * should only load a range of data at a time, but not
 * all of the data at once. The method passes in a
 * `cursor` parameter which should determine the starting
 * index for the listing to load. Each page should be a length
 * of 18 listings long.
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param cursor: Starting index of the page.
 * @returns: Array of Listing objects.
 */
export const getBookmarksFeed = async (
  supabase: SupabaseClient,
  user: User,
  cursor: number
): Promise<z.infer<typeof Listing>[]> => {
  // Select the listing_id of the listings that the user bookmarked
  const { data: bookmarkData, error: bookmarkError } = await supabase
    .from("bookmark")
    .select("listing_id")
    .eq("user_id", user.id);

  if (bookmarkError || !bookmarkData) {
    throw (
      bookmarkError || new Error("No bookmark data for the user was retrieved.")
    );
  }

  // Map the bookmarkData to create an array of the listing_ids that the user bookmarked
  const bookmarkedListingIds = bookmarkData.map(
    (bookmark) => bookmark.listing_id
  );

  const { data: listingData, error: listingError } = await supabase
    .from("listing")
    .select(
      `
      id,
      name, 
      description,
      category,
      created_on,
      expires_on,
      image_url,
      user:user_id (
        id,
        name,
        handle,
        avatar_url
      ),
      store:store_id (
        id,
        name,
        description,
        location,
        logo_url
      ),
      likes:like!listing_id (
        user_id
      ),
      bookmarks:bookmark!listing_id (
        user_id
      )
    `
    )
    // Only select listings that the user has bookmarked
    .in("id", bookmarkedListingIds)
    // Order by created_on in descending order, because more recent
    // listings are considered as greater than older listings
    .order("created_on", { ascending: false })
    // 18 listings per page, so range is from cursor to cursor+17
    // Range is 0-index and inclusive on both ends
    .range(cursor, cursor + 17);

  if (listingError || !listingData) {
    throw listingError || new Error("No listing data was retrieved.");
  }

  return Listing.array().parse(listingData);
};

/**
 * Loads data for the user's listing feed, ordered by the
 * amount of likes a listing has received.
 *
 * This function retrieves listings ordered by their like count using
 * the listing_with_like_counts view, which pre-computes and sorts the listings
 * by popularity.
 *
 * This method is paginated - it only loads a range of data at a time.
 * Each page is 18 listings long.
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param cursor: Starting index of the page.
 * @returns: Array of Listing objects.
 */
export const getPopularFeed = async (
  supabase: SupabaseClient,
  cursor: number
): Promise<z.infer<typeof Listing>[]> => {
  // Get the IDs of the most popular listings from the view
  const { data: popularListings, error: viewError } = await supabase
    .from("listing_with_like_counts")
    .select("id")
    .order("like_count", { ascending: false })
    .range(cursor, cursor + 17);

  if (viewError) {
    console.error(
      "Error fetching from listing_with_like_counts view:",
      viewError
    );
    return [];
  }

  if (!popularListings || popularListings.length === 0) {
    return [];
  }

  // Extract just the IDs from the popular listings for the next query
  const listingIds = popularListings.map((item) => item.id);

  // Now fetch the complete listing data for these IDs
  const { data, error } = await supabase
    .from("listing")
    .select(
      `
      id,
      name, 
      description,
      category,
      created_on,
      expires_on,
      image_url,
      user:user_id (
        id,
        name,
        handle,
        avatar_url
      ),
      store:store_id (
        id,
        name,
        description,
        location,
        logo_url
      ),
      likes:like!listing_id (
        user_id
      ),
      bookmarks:bookmark!listing_id (
        user_id
      )
    `
    )
    .in("id", listingIds);

  if (error || !data) {
    throw error || new Error("No listing data was retrieved.");
  }

  // Sort the results to match the order from the view (by popularity)
  const sortedData = data.sort((a, b) => {
    return listingIds.indexOf(a.id) - listingIds.indexOf(b.id);
  });

  return Listing.array().parse(sortedData);
};

/**
 * Loads data for listings from a specific store.
 *
 * This function retrieves the most recent listings from a specific store
 * in reverse chronological order (most recent listings first).
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param storeId: ID of the store to get listings for.
 * @param cursor: Starting index of the page.
 * @returns: Array of Listing objects.
 */
export const getStoreFeed = async (
  supabase: SupabaseClient,
  storeId: string,
  cursor: number
): Promise<z.infer<typeof Listing>[]> => {
  const { data, error } = await supabase
    .from("listing")
    .select(
      `
      id,
      name, 
      description,
      category,
      created_on,
      expires_on,
      image_url,
      user:user_id (
        id,
        name,
        handle,
        avatar_url
      ),
      store:store_id (
        id,
        name,
        description,
        location,
        logo_url
      ),
      likes:like!listing_id (
        user_id
      ),
      bookmarks:bookmark!listing_id (
        user_id
      )
    `
    )
    // Filter by store_id
    .eq("store_id", storeId)
    // Order by created_on in descending order
    .order("created_on", { ascending: false })
    // 18 listings per page
    .range(cursor, cursor + 17);

  if (error || !data) {
    throw error || new Error("No listing data was retrieved for this store.");
  }

  return Listing.array().parse(data);
};

/**
 * Loads data for listings created by a specific user.
 *
 * This function retrieves listings created by a specific user
 * in reverse chronological order (most recent listings first).
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param userId: ID of the user whose listings are being retrieved.
 * @param cursor: Starting index of the page.
 * @returns: Array of Listing objects.
 */
export const getUserFeed = async (
  supabase: SupabaseClient,
  user: User,
  userId: string,
  cursor: number
): Promise<z.infer<typeof Listing>[]> => {
  const { data, error } = await supabase
    .from("listing")
    .select(
      `
      id,
      name,
      description,
      category,
      created_on,
      expires_on,
      image_url,
      user:user_id (
        id,
        name,
        handle,
        avatar_url
      ),
      store:store_id (
        id,
        name,
        description,
        location,
        logo_url
      ),
      likes:like!listing_id (
        user_id
      ),
      bookmarks:bookmark!listing_id (
        user_id
      )
    `
    )
    // Filter by user_id
    .eq("user_id", userId)
    // Order by created_on in descending order
    .order("created_on", { ascending: false })
    // 18 listings per page
    .range(cursor, cursor + 17);

  if (error || !data) {
    throw error || new Error("No listing data was retrieved for this user.");
  }

  return Listing.array().parse(data);
};

/**
 * Loads listings ordered by expiration date, with soon-to-expire listings first.
 * Only includes listings that have not yet expired. Listings with null expiration
 * dates are shown, but are ordered last.
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param cursor: Starting index of the page.
 * @returns: Array of Listing objects.
 */
export const getExpirationFeed = async (
  supabase: SupabaseClient,
  cursor: number
): Promise<z.infer<typeof Listing>[]> => {
  // Get current date to filter out expired listings
  // Using only the date part (without time) when comparing with date field
  const today = new Date();
  const todayDateOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .split("T")[0];

  const { data, error } = await supabase
    .from("listing")
    .select(
      `
      id,
      name, 
      description,
      category,
      created_on,
      expires_on,
      image_url,
      user:user_id (
        id,
        name,
        handle,
        avatar_url
      ),
      store:store_id (
        id,
        name,
        description,
        location,
        logo_url
      ),
      likes:like!listing_id (
        user_id
      ),
      bookmarks:bookmark!listing_id (
        user_id
      )
    `
    )
    // Only get listings that haven't expired yet or have no expiration date
    // Using date comparison with the date string format for the date field
    .or(`expires_on.gte.${todayDateOnly}, expires_on.is.null`)
    // Order by expires_on in ascending order, soon-to-expire listings first
    // Listings with null expiration dates are shown last
    .order("expires_on", { ascending: true, nullsFirst: false })
    // 18 listings per page
    .range(cursor, cursor + 17);

  if (error || !data) {
    throw error || new Error("No listing data was retrieved.");
  }

  return Listing.array().parse(data);
};

/**
 * Toggles whether or not a user has liked a
 * listing with a given ID.
 *
 * If the user has already liked the listing, remove the like
 * by deleting an entry from the `like` table.
 *
 * If the user has not already liked the listing, add a like
 * by creating an entry on the `like` table.
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param listingId: ID of the listing to work with.
 */
export const toggleLike = async (
  supabase: SupabaseClient,
  user: User,
  listingId: string
): Promise<void> => {
  // Check if the user has already liked the listing
  const { data: likeData, error: likeError } = await supabase
    .from("like")
    .select("listing_id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId);

  if (likeError) {
    throw likeError;
  }

  // If likeData is not empty, the user has already liked the listing
  if (likeData && likeData.length > 0) {
    // User has already liked the listing, so delete the like
    const { error: deleteLikeError } = await supabase
      .from("like")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);

    if (deleteLikeError) {
      throw deleteLikeError;
    }
  } else {
    // User has not liked the listing, so add the like
    const { error: insertLikeError } = await supabase
      .from("like")
      .insert({ user_id: user.id, listing_id: listingId });

    if (insertLikeError) {
      throw insertLikeError;
    }
  }

  // Explicitly refresh listing_with_like_counts view by making a small query
  // This helps ensure the view is updated before the next query
  try {
    await supabase.from("listing_with_like_counts").select("id").limit(1);
  } catch (error) {
    console.error("Error refreshing like counts view:", error);
  }
};

/**
 * Toggles whether or not a user has bookmarked a
 * listing with a given ID.
 *
 * If the user has already bookmarked the listing, remove the bookmark
 * by deleting an entry from the `bookmark` table.
 *
 * If the user has not already bookmarked the listing, add a bookmark
 * by creating an entry on the `bookmark` table.
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param listingId: ID of the listing to work with.
 */
export const toggleBookmark = async (
  supabase: SupabaseClient,
  user: User,
  listingId: string
): Promise<void> => {
  // Check if the user has already bookmarked the listing
  const { data: bookmarkData, error: bookmarkError } = await supabase
    .from("bookmark")
    .select("listing_id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId);

  if (bookmarkError) {
    throw bookmarkError;
  }

  // If bookmarkData is not empty, the user has already bookmarked the listing
  if (bookmarkData && bookmarkData.length > 0) {
    // User has already bookmarked the listing, so delete the bookmark
    const { error: deleteBookmarkError } = await supabase
      .from("bookmark")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);

    if (deleteBookmarkError) {
      throw deleteBookmarkError;
    }
  } else {
    // User has not bookmarked the listing, so add the bookmark
    const { error: insertBookmarkError } = await supabase
      .from("bookmark")
      .insert({ user_id: user.id, listing_id: listingId });

    if (insertBookmarkError) {
      throw insertBookmarkError;
    }
  }
};

/**
 * Creates a listing in the database.
 *
 * This function creates a new listing in the database and handles optional image upload:
 *
 * 1. Create a new listing in the database and retrieve the listing
 *    that was created to access its ID.
 *
 * 2. If an image has been provided, add the image to the `images` bucket
 *    in Supabase storage using the ID of the listing as the file name, without
 *    the file extension.
 *
 * 3. Update the listing's `image_url` to the path of the uploaded image if
 *    an image was provided. Skip this step if no image was provided.
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param listing: Object containing the listing data (name, description, etc.).
 * @param image: The image attachment for the listing, if any.
 */
export const createListing = async (
  supabase: SupabaseClient,
  user: User,
  listing: {
    name: string;
    description: string;
    category: string;
    store_id: string;
    expires_on?: Date | null;
  },
  image: File | null
): Promise<void> => {
  // Create a new listing in the database
  if (!user || !user.id) {
    throw new Error("User must be logged in to create a listing.");
  }
  if (
    !listing.name ||
    !listing.description ||
    !listing.category ||
    !listing.store_id
  ) {
    throw new Error("Missing required listing fields.");
  }
  const { data: listingData, error: listingError } = await supabase
    .from("listing")
    .insert({
      name: listing.name,
      description: listing.description,
      category: listing.category,
      created_on: new Date(),
      expires_on: listing.expires_on || null,
      user_id: user.id,
      store_id: listing.store_id,
    })
    .select();

  if (listingError || !listingData) {
    throw listingError || new Error("No listing data was retrieved.");
  }

  // Proceed to upload the image if provided
  if (image) {
    // Upload image to the images bucket
    const { data: imageData, error: imageError } = await supabase.storage
      .from("images")
      // Use ID of the listing as the name of the file
      .upload(`${listingData[0].id}`, image);

    if (imageError || !imageData) {
      throw imageError || new Error("No image data was able to be uploaded.");
    }

    // Update the listing with the image_url
    const { data: updateData, error: updateError } = await supabase
      .from("listing")
      .update({ image_url: imageData.path })
      .eq("id", listingData[0].id)
      .select();

    if (updateError || !updateData) {
      throw updateError || new Error("No listing data was updated.");
    }
  }
};

/**
 * Updates the listing in the database.
 *
 * This function allows a user to update the listing in the database and handles optional image upload:
 *
 * 1. Verify the user has permission to update this listing (they must be the original poster).
 *
 * 2. Update the listing in the database with the new data.
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param listingId: ID of the listing to update.
 * @param expires_on: New expiration date for the listing.
 */
export const updateListing = async (
  supabase: SupabaseClient,
  user: User,
  listingId: string,
  listing: {
    name: string;
    description: string;
    category: string;
    store_id: string;
    expires_on?: Date | null;
  }
): Promise<void> => {
  // Verify the user owns this listing
  const { data: existingListing, error: fetchError } = await supabase
    .from("listing")
    .select("user_id")
    .eq("id", listingId)
    .select();

  if (fetchError || !existingListing) {
    throw fetchError || new Error("Listing not found.");
  }

  // Check if the user is the owner of the listing
  if (existingListing[0].user_id !== user.id) {
    throw new Error("You don't have permission to update this listing.");
  }

  // Update the listing in the database
  const { error: updateError } = await supabase
    .from("listing")
    .update({
      name: listing.name,
      description: listing.description,
      category: listing.category,
      store_id: listing.store_id,
      expires_on: listing.expires_on,
    })
    .eq("id", listingId)
    .select();

  if (updateError) {
    throw updateError || new Error("Failed to update listing.");
  }
};

/**
 * Updates the expiration date of an existing listing in the database to null.
 *
 * This function allows updating only the expires_on field of an existing listing:
 *
 * 1. Update only the expires_on field of the listing.
 *
 * @param supabase: Supabase client to use.
 * @param listingId: ID of the listing to update.
 * @param expires_on: New expiration date for the listing.
 */
export const expireListing = async (
  supabase: SupabaseClient,
  listingId: string,
): Promise<void> => {
  const { data: existingListing, error: fetchError } = await supabase
    .from("listing")
    .select("user_id")
    .eq("id", listingId)
    .select();

  if (fetchError || !existingListing) {
    throw fetchError || new Error("Listing not found.");
  }

  // Update only the expires_on field of the listing
  const { error: updateError } = await supabase
    .from("listing")
    .update({expires_on: null})
    .eq("id", listingId);

  if (updateError) {
    throw updateError || new Error("Failed to expire listing.");
  }
};

/**
 * Deletes a listing from the database if the user is the owner.
 *
 * This function deletees a listing from the database and handles optional image deletion:
 *
 * 1. Verifies the user has permission to delete the listing (they must be the original poster).
 *
 * 2. Deletes the listing from the database.
 *
 * 3. If the listing has an associated image, removes it from bucket storage.
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param listingId: ID of the listing to delete.
 */
export const deleteListing = async (
  supabase: SupabaseClient,
  user: User,
  listingId: string
): Promise<void> => {
  // Verify the user owns this listing and get image_url if exists
  const { data: existingListing, error: fetchError } = await supabase
    .from("listing")
    .select("user_id, image_url")
    .eq("id", listingId)
    .select();

  if (fetchError || !existingListing) {
    throw fetchError || new Error("Listing not found.");
  }

  // Check if the user is the owner of the listing
  if (existingListing[0].user_id !== user.id) {
    throw new Error("You don't have permission to delete this listing.");
  }

  // Delete the listing from the database
  const { error: deleteError } = await supabase
    .from("listing")
    .delete()
    .eq("id", listingId);

  if (deleteError) {
    throw deleteError || new Error("Failed to delete listing.");
  }

  // If the listing had an image, delete it from storage
  if (existingListing[0].image_url) {
    // Extract the path from the image_url
    // If using the file path directly as in createListing
    const imagePath = `${listingId}`;

    // Delete the image from the images bucket
    const { error: bucketError } = await supabase.storage
      .from("images")
      .remove([imagePath]);

    // We don't want to throw an error if image deletion fails
    // as the listing itself was successfully deleted
    if (bucketError) {
      console.error("Failed to delete listing image:", bucketError);
    }
  }
};

/**
 * Performs a case-insensitive full text search on listings using Supabase's textSearch.
 *
 * @param supabase: Supabase client to use.
 * @param query: The search query string.
 * @param cursor: Starting index of the page.
 * @returns: Array of Listing objects matching the search.
 */
export const searchListings = async (
  supabase: SupabaseClient,
  query: string,
  cursor: number
): Promise<z.infer<typeof Listing>[]> => {
  const lowercaseQuery = query.toLowerCase();

  const { data, error } = await supabase
    .from("listing")
    .select(
      `
      id,
      name,
      description,
      category,
      created_on,
      expires_on,
      image_url,
      user:user_id (
        id,
        name,
        handle,
        avatar_url
      ),
      store:store_id (
        id,
        name,
        description,
        location,
        logo_url
      ),
      likes:like!listing_id (
        user_id
      ),
      bookmarks:bookmark!listing_id (
        user_id
      )
    `
    )
    .or(
      `name.ilike.%${lowercaseQuery}%, description.ilike.%${lowercaseQuery}%, category.ilike.%${lowercaseQuery}%`
    )
    .order("created_on", { ascending: false })
    .range(cursor, cursor + 17);

  if (error || !data) {
    throw error || new Error("No listing data was retrieved.");
  }

  return Listing.array().parse(data);
};
