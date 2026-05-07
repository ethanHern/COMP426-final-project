import { useEffect, useCallback } from "react";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { updateListingInCacheFn } from "../cache/listing-cache";

/**
 * Hook that implements real-time updates to listings
 *
 * @param supabase The Supabase client
 * @param user The current user
 */
export function useListingUpdates(
  supabase: SupabaseClient,
  user: User,
  storeId?: string
) {
  const queryClient = useQueryClient();

  // Wrap the cache update function with useCallback to prevent unnecessary re-creations
  const updateListingInCache = useCallback(
    (listingId: string, newExpiresOn: Date | null) => {
      if (storeId) {
        updateListingInCacheFn(queryClient, storeId)(listingId, newExpiresOn);
      } else {
        updateListingInCacheFn(queryClient)(listingId, newExpiresOn);
      }
    },
    [queryClient, storeId]
  );

  useEffect(() => {
    // Subscribe to Postgres changes on the listing table
    const dbChangesChannel = supabase
      .channel("listing-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "listing",
        },
        (payload) => {
          // Parse the new expiration date
          const updatedExpiresOn = payload.new.expires_on
            ? new Date(payload.new.expires_on)
            : null;

          // Update the listing in the cache
          updateListingInCache(payload.new.id, updatedExpiresOn);
        }
      )
      .subscribe();

    // Clean up the subscription when the component unmounts
    return () => {
      dbChangesChannel.unsubscribe();
    };
  }, [supabase, updateListingInCache, user.id]);
}
