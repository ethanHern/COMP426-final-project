import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { ListingExpiration } from "@/utils/supabase/models/listing";
import { expireListing } from "@/utils/supabase/queries/listing";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, isBefore, isSameDay } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

type TrackProps = {
  user: User;
};
export default function TrackExpirations({ user }: TrackProps) {
  const queryClient = useQueryClient();
  const supabase = createSupabaseComponentClient();

  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [expiredListing, setExpiredListing] = useState<z.infer<
    typeof ListingExpiration
  > | null>(null);
  
  // Track which deals we've already notified about to prevent duplicate notifications
  const [notifiedDeals, setNotifiedDeals] = useState<Set<string>>(new Set());

  // Initialize notified deals from localStorage on component mount
  useEffect(() => {
    // Create a unique key for this user's session
    const sessionKey = `expiring-deals-notified-${user.id}`;
    
    try {
      const storedDeals = localStorage.getItem(sessionKey);
      if (storedDeals) {
        // Parse the stored JSON array and convert to Set
        const dealsArray = JSON.parse(storedDeals);
        setNotifiedDeals(new Set(dealsArray));
      }
    } catch (error) {
      console.error("Error loading notified deals from localStorage:", error);
    }
  }, [user.id]);

  // Helper function to update localStorage when notified deals change
  const updateNotifiedDealsStorage = useCallback((deals: Set<string>) => {
    const sessionKey = `expiring-deals-notified-${user.id}`;
    try {
      localStorage.setItem(sessionKey, JSON.stringify([...deals]));
    } catch (error) {
      console.error("Error saving notified deals to localStorage:", error);
    }
  }, [user.id]);

  const getAllBookmarks = async (
    supabase: SupabaseClient,
    user: User
  ): Promise<z.infer<typeof ListingExpiration>[]> => {
    const { data: bookmarkData, error: bookmarkError } = await supabase
      .from("bookmark")
      .select("listing_id")
      .eq("user_id", user.id);

    if (bookmarkError || !bookmarkData) {
      throw (
        bookmarkError ||
        new Error("No bookmark data for the user was retrieved.")
      );
    }

    const bookmarkedIds = bookmarkData.map((bookmark) => bookmark.listing_id);
    const { data: listingData, error: listingError } = await supabase
      .from("listing")
      .select(
        `
                id,
                name,
                description,
                expires_on`
      )
      // Only select listings that the user has bookmarked
      .in("id", bookmarkedIds)
      // Only grab listings that do not have a null value in the expires_on (these deals are not expired yet)
      .not("expires_on", "is", null);
    // Order by expires_on in descending order, because more recent
    // listings are considered as greater than older listings

    if (listingError || !listingData) {
      throw listingError || new Error("No listing data was retrieved.");
    }
    return ListingExpiration.array().parse(listingData);
  };

  const { data: trackedBookmarks, error: trackingError } = useQuery({
    // Queries all listings the user has bookmarked and the expiration date has not yet passed
    queryKey: ["tracking"],
    queryFn: () => getAllBookmarks(supabase, user),
  });

  if (trackingError) {
    throw trackingError;
  }

  const [bookmarkeddeals, setBookmarkeddeals] =
    useState<z.infer<typeof ListingExpiration>[]>();

  useEffect(() => {
    if (trackedBookmarks) {
      setBookmarkeddeals(trackedBookmarks);
    }
  }, [trackedBookmarks]);

  // Run once when bookmarkeddeals are loaded or updated to check for expiring deals
  useEffect(() => {
    if (!bookmarkeddeals || !bookmarkeddeals.length) return;
    
    // Check which deals are expiring today or tomorrow
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = addDays(today, 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const newNotifiedDeals = new Set(notifiedDeals);
    let hasNewNotifications = false;
    
    // Check all bookmarked deals once and notify about those expiring today or tomorrow
    bookmarkeddeals.forEach(deal => {
      if (!deal.expires_on) return;
      
      const expiryDate = new Date(deal.expires_on);
      expiryDate.setHours(0, 0, 0, 0);
      
      // Only notify if we haven't already notified about this deal
      if (!notifiedDeals.has(deal.id)) {
        if (isSameDay(expiryDate, today)) {
          toast.warning(`Deal expires today!`, {
            description: `${deal.name}: ${deal.description}`,
            duration: 5000,
          });
          newNotifiedDeals.add(deal.id);
          hasNewNotifications = true;
        } else if (isSameDay(expiryDate, tomorrow)) {
          toast.info(`Deal expires tomorrow!`, {
            description: `${deal.name}: ${deal.description}`,
            duration: 5000,
          });
          newNotifiedDeals.add(deal.id);
          hasNewNotifications = true;
        }
      }
    });
    
    // Only update state and localStorage if we actually added new notifications
    if (hasNewNotifications) {
      setNotifiedDeals(newNotifiedDeals);
      updateNotifiedDealsStorage(newNotifiedDeals);
    }
  }, [bookmarkeddeals, notifiedDeals, updateNotifiedDealsStorage]);

  useEffect(() => {
    // Define checkTracking inside the useEffect to avoid dependency issues
    const checkTracking = () => {
      if (bookmarkeddeals) {
        for (const bookMarkedDeal of bookmarkeddeals) {
          if (isBefore(bookMarkedDeal.expires_on!, new Date())) {
            // The expiration date of the bookmarked deal has passed
            setIsExpired(true); // Notify the broadcast to send a message that the deal has expired.
            setExpiredListing(bookMarkedDeal); // Load the expired listing
            break;
          }
        }
      }
    };

    // This will start the timer to check if the bookmarked deals are expired
    const intervalId = setInterval(() => {
      checkTracking();
    }, 1000 * 10); // Check every 10 seconds
    return () => {
      clearInterval(intervalId);
    };
  }, [bookmarkeddeals]);

  useEffect(() => {
    const expireChannel = supabase
      .channel("tracking", {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        "broadcast",
        { event: "listingExpires" }, // What happens when an expiration event is received
        (payload) => {
          const expiredListingId = payload.payload.message;
          expireListing(supabase, expiredListingId); // Sets the listing's date to null
          const eListing = bookmarkeddeals!.find(
            (deal) => deal.id === expiredListingId
          ); // Grabs the listing from the list of potential expirees
          toast("Deal has expired!", {
            description: `${eListing?.name} on ${eListing?.description} has expired.`,
          }); // Sends a toast to tell a user that a deal has expired
          queryClient.refetchQueries({ queryKey: ["tracking"] }); // Force a refetch of bookmarked listings
        }
      )
      .on(
        "broadcast",
        { event: "listingUpdated" }, // What happens when an update event is received
        (payload) => {
          const updatedListing = payload.payload.message; // The message will be the name and description fields combined into a string
          toast(`${updatedListing} has been updated/activated!`, {
            description: "Check it out!",
          }); // Sends a toast to tell the user that the listing has been updated
          queryClient.invalidateQueries({ queryKey: ["tracking"] }); // Force a refetch of bookmarked listings
        }
      )
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") {
          return null;
        }
        if (isExpired) {
          if (expiredListing) {
            await expireChannel.send({
              // If the user's machine notices the expiration
              type: "broadcast",
              event: "listingExpires",
              payload: { message: expiredListing.id }, // Sends the id to other users
            });
            setExpiredListing(null);
            setIsExpired(false);
          }
        }
      });

    return () => {
      expireChannel.unsubscribe();
    };
  }, [isExpired, expiredListing, bookmarkeddeals, queryClient, supabase]);

  return <></>;
}
