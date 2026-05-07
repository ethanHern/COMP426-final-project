import { Card, CardContent } from "./ui/card";
import { z } from "zod";
import { Listing } from "@/utils/supabase/models/listing";
import Image from "next/image";
import { Bookmark, Heart } from "lucide-react";
import DealDialog from "./dealDialog";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { toggleBookmark, toggleLike } from "@/utils/supabase/queries/listing";
import { format } from "date-fns";
import Link from "next/link";

type DealCardProps = {
  supabase: SupabaseClient;
  user: User;
  listing: z.infer<typeof Listing>;
};

//Listing information will be mapped to these cards and displayed
export default function DealCard({ supabase, user, listing }: DealCardProps) {
  // same as components/post.tsx - @dinara
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  
  // Track likes count locally to prevent inconsistencies
  const [likeCount, setLikeCount] = useState<number>(listing.likes.length);

  useEffect(() => {
    // Check if the user has liked the listing already
    if (user) {
      if (
        listing.likes &&
        listing.likes.some((like) => like.user_id === user.id)
      ) {
        setIsLiked(true);
      } else {
        setIsLiked(false);
      }
  
      // Update like count whenever listing.likes changes
      setLikeCount(listing.likes.length);
  
      // Check if the user has bookmarked the listing already
      if (
        listing.bookmarks &&
        listing.bookmarks.some((bookmark) => bookmark.user_id === user.id)
      ) {
        setIsSaved(true);
      } else {
        setIsSaved(false);
      }
    }
  }, [listing.id, listing.bookmarks, listing.likes, user]);

  const handleLikeToggle = async () => {
    // Optimistically update the local state
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    
    // Update local count optimistically
    setLikeCount(prevCount => newIsLiked ? prevCount + 1 : prevCount - 1);
    
    // Call the API to update the database
    await toggleLike(supabase, user, listing.id);
  };

  return (
    <Card className="w-full shadow-sm">
      <div className="w-full h-48 relative overflow-hidden inline-block">
        <DealDialog supabase={supabase} user={user} listing={listing} />
      </div>
      <CardContent className="p-3">
        <div className="flex flex-row justify-between items-center">
          <p className="font-bold text-base">{listing.name}</p>
          {user ? ( // This will display if the user is logged in (buttons are functional)
            <div className="flex flex-row ml-auto">
              <Button
                variant="ghost"
                className="p-1 h-8"
                onClick={handleLikeToggle}
                aria-label={isLiked ? "Unlike deal" : "Like deal"}
                aria-pressed={isLiked}
              >
                <p
                  className={`self-center text-xs mr-1 ${
                    isLiked ? "text-pink-600" : "text-muted-foreground"
                  }`}
                >
                  {likeCount}
                </p>
                {isLiked ? (
                  <Heart
                    size={16}
                    fill="currentColor"
                    className="text-pink-600"
                  />
                ) : (
                  <Heart size={16} />
                )}
              </Button>
              <Button
                variant="ghost"
                className="p-1 h-8"
                onClick={() => {
                  setIsSaved(!isSaved);
                  toggleBookmark(supabase, user, listing.id);
                }}
                aria-label={isSaved ? "Remove bookmark" : "Bookmark deal"}
                aria-pressed={isSaved}
              >
                {isSaved ? (
                  <Bookmark
                    size={16}
                    fill="currentColor"
                    className="text-yellow-400"
                  />
                ) : (
                  <Bookmark size={16} />
                )}
              </Button>
            </div> // This will display if the user is not logged in (buttons do nothing, but still display like count)
          ) : (
            <div className="flex flex-row ml-auto">
              <Button 
                variant="ghost" 
                className="p-1 h-8"
                aria-label="Like count"
                disabled
              >
                <p className="self-center text-xs mr-1 text-muted-foreground">
                  {likeCount}
                </p>
                <Heart size={16} />
              </Button>
              <Button 
                variant="ghost" 
                className="p-1 h-8"
                aria-label="Bookmark deal"
                disabled
              >
                <Bookmark size={16} />
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-row gap-2 mt-1">
          <Link href={`/stores/${listing.store.id}`} legacyBehavior>
            <a className="flex items-center gap-2">
              <Image
                src={
                  supabase.storage
                    .from("logos")
                    .getPublicUrl(`${listing.store.logo_url}`).data.publicUrl
                }
                alt={"Image associated with store"}
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
              />
              <p className="self-center font-semibold text-sm">
                {listing.store.name}
              </p>
            </a>
          </Link>
        </div>
        <p className="text-gray-800 dark:text-gray-300 text-xs mt-1 line-clamp-2">
          {listing.description}
        </p>
        {listing.expires_on ? (
          (() => {
            const expiryDate = new Date(listing.expires_on);
            const currentDate = new Date();
            
            // Reset time components to midnight for date-only comparison
            const expiryDay = new Date(expiryDate);
            expiryDay.setHours(0, 0, 0, 0);
            
            const today = new Date(currentDate);
            today.setHours(0, 0, 0, 0);
            
            if (expiryDay < today) {
              return <p className="text-red-700 text-xs mt-1">Expired</p>;
            } else if (expiryDay.getTime() === today.getTime()) {
              return <p className="text-yellow-600 text-xs mt-1">
                Expires today: {format(expiryDate, "PPP")}
              </p>;
            } else {
              return <p className="text-green-700 text-xs mt-1">
                Expires on: {format(expiryDate, "PPP")}
              </p>;
            }
          })()
        ) : (
          <p className="text-red-700 text-xs mt-1">Expired</p>
        )}
      </CardContent>
    </Card>
  );
}