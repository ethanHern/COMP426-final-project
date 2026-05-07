import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "./ui/dialog";
import { Listing } from "@/utils/supabase/models/listing";
import Image from "next/image";
import { z } from "zod";
import { Button } from "./ui/button";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { deleteListing, toggleBookmark } from "@/utils/supabase/queries/listing";
import { Pencil, Trash2, Loader2, Bookmark } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/router";

type DealDialogProps = {
  supabase: SupabaseClient;
  user: User;
  listing: z.infer<typeof Listing>;
};

//Once you click on the image, this dialog will open up
export default function DealDialog({
  supabase,
  user,
  listing,
}: DealDialogProps) {
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteListing(supabase, user, listing.id);
      toast.success("Deal deleted successfully");
      // Close the dialog after successful deletion
      setOpen(false); 

      // Reload the page to reflect the changes
      router.reload();
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("Failed to delete listing. Please try again.");
    } finally {
      // Reset the deleting state
      setIsDeleting(false);
    }
  };

  useEffect(()=> {
    if (user && listing.bookmarks) {
      setIsSaved(listing.bookmarks.some((bookmark)=>bookmark.user_id === user.id));
    }
  }, [listing.bookmarks, user])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger onClick={() => setOpen(true)}>
        <div className="w-fill h-fill">
          <Image
            src={
              supabase.storage
                .from("images")
                .getPublicUrl(
                  `${listing.image_url ? listing.image_url : listing.category}`
                ).data.publicUrl
            }
            alt={"Image associated with deal"}
            layout="fill"
            className="transition-transform duration-200 hover:blur-xs"
          />
        </div>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "flex flex-row p-6 gap-4 max-w-2xl", 
          "fixed !top-[50%] !left-[50%] !transform !-translate-x-1/2 !-translate-y-1/2",
        )}
      >
        <Image
          src={
            supabase.storage
              .from("images")
              .getPublicUrl(
                `${listing.image_url ? listing.image_url : listing.category}`
              ).data.publicUrl
          }
          alt={"Image associated with deal"}
          width={200}
          height={200}
          className="rounded-lg"
        />
        <div className="flex flex-col gap-y-2 w-full">
          <DialogHeader className="text-xl font-semibold">
            {listing.name}
          </DialogHeader>
          <div className="flex gap-2 items-center">
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
            <p className="font-medium text-sm">{listing.store.name}</p>
          </div>
          <p className="text-gray-600 text-sm">{listing.description}</p>
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
                return <p className="text-yellow-600 text-xs mt-1">Expires today: {format(expiryDate, "PPP")}</p>;
              } else {
                return <p className="text-green-700 text-xs mt-1">Expires on: {format(expiryDate, "PPP")}</p>;
              }
            })()
          ) : (
            <p className="text-red-700 text-xs mt-1">Expired</p>
          )}

        {user && (
            <Button
              className="w-full mt-2"
              variant={isSaved ? "secondary" : "default"}
              onClick={() => {
                setIsSaved(!isSaved);
                toggleBookmark(supabase, user, listing.id);
              }}
            >
              {isSaved ? (
                <Bookmark
                  size={16}
                  fill="currentColor"
                  className="text-yellow-400 mr-2"
                />
              ) : (
                <Bookmark size={16} className="mr-2" />
              )}
              {isSaved ? "Remove from bookmarks" : "Add to bookmarks"}
            </Button>
          )}

          {user && user.id == listing.user.id && (
            <div className="flex gap-2 mt-2">
              <Link href={`/edit/${listing.id}`}>
                <Button 
                  className="grow" 
                  variant={"outline"}
                  disabled={isDeleting}
                >
                  <Pencil/>
                  {listing.expires_on ? "Edit" : "Reactivate"}
                </Button>
              </Link>
              <Button
                className="grow"
                variant={"destructive"}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 />
                    Delete
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
