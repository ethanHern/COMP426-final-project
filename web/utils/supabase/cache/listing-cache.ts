/**
 * This file contains utility functions for updating the listing data
 * cached by React Query.
 */

import { QueryClient } from "@tanstack/react-query";

/** Generates a function that updates a listing's expiration date in the cache. */
export const updateListingInCacheFn =
  (queryClient: QueryClient, storeId?: string | undefined) =>
  (listingId: string, newExpiresOn: Date | null) => {
    // All the specific query keys for the feed
    const feedQueryKeys = [
      ["feed"], 
      ["feed", "newest"],
      ["feed", "oldest"], 
      ["feed", "popular"],
      ["feed", "expiring"],
      ["myDealsFeed"]
    ];

    if (storeId) {
      // Add store-specific query keys if storeId is provided
      feedQueryKeys.push(
        ["storeFeed", storeId]
      )
    }

    // Update each feed query key
    feedQueryKeys.forEach(key => {
      try {
        queryClient.setQueryData(key, (oldData: unknown) => {
          // Clone the oldData object to avoid mutation
          const newData = JSON.parse(JSON.stringify(oldData));

          // If this is an InfiniteData structure with pages
          if (newData.pages && Array.isArray(newData.pages)) {            
            // Loop through each page to find and update the listing
            newData.pages = newData.pages.map((page: unknown) => {
              // Check if page is an array before mapping
              if (!Array.isArray(page)) {
                return page;
              }

              return page.map((listing) => {
                if (listing && listing.id === listingId) {
                  return { 
                    ...listing,
                    expires_on: newExpiresOn 
                  };
                }
                return listing;
              });
            });
          }

          return newData;
        });
      } catch (error) {
        console.error(error);
      }
    });

    // Force a refresh by invalidating the feed queries
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["myDealsFeed"] });
      if (storeId) {
        queryClient.invalidateQueries({ queryKey: ["storeFeed", storeId] });
      }
    }, 100);
  };
