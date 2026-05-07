import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createListing } from "@/utils/supabase/queries/listing";
import { useEffect, useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { getAllStores } from "@/utils/supabase/queries/store";
import Image from "next/image";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

export default function CreateDealDialog({
  user,
  queryClient,
  supabase,
}: {
  user: User;
  queryClient: QueryClient;
  supabase: SupabaseClient
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [category, setCategory] = useState("");
  const [storeId, setStoreId] = useState<string>("");
  const [stores, setStores] = useState<{ id: string; name: string, logo_url: string | null }[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);

    if (file) {
      const preview = URL.createObjectURL(file);
      setImagePreviewUrl(preview); // ✅ valid for preview
    } else {
      setImagePreviewUrl(null);
    }
  };

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const fullStores = await getAllStores(supabase); // z.infer<typeof Store>[]

        // Only keep id and name
        const minimalStores = fullStores.map((store) => ({
          id: store.id,
          name: store.name,
          logo_url: store.logo_url,
        }));

        setStores(minimalStores);
      } catch (err) {
        console.error("Error fetching stores:", err);
      }
    };

    if (open) {
      fetchStores();
    }
  }, [supabase, open]);

  useEffect(()=> {
    if (date) {
      const d = date;
      d.setHours(19, 59, 59);
      setDate(d);
    }
  }, [isCalendarOpen, date]);

  const resetForm = () => {
    setTitle("");
    setDesc("");
    setCategory("");
    setStoreId("");
    setDate(undefined);
    setImageFile(null);
    setImagePreviewUrl(null);
    setError(null);
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError("Please enter a title for your deal");
      return false;
    }
    if (!desc.trim()) {
      setError("Please enter a description for your deal");
      return false;
    }
    if (!category) {
      setError("Please select a category");
      return false;
    }
    if (!storeId) {
      setError("Please select a store");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    // Check if the form is valid/has all required fields
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await createListing(
        supabase,
        user,
        {
          name: title,
          description: desc,
          category,
          store_id: storeId,
          expires_on: date || null,
        },
        imageFile
      );

      // Success handling
      toast.success("Deal created successfully!");
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["myDealsFeed"] });
      // Clear the input fields
      resetForm();
      // Close the dialog
      setOpen(false);
      
    } catch (err) {
      console.error("Error creating deal:", err);
      setError("Error creating deal:" + err);
      toast.error("Failed to create deal. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        // Reset form data when opening or closing the dialog
        if (!newOpen) {
          resetForm();
        }
        setOpen(newOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          className="bg-black text-white hover:bg-zinc-800"
        >
          Create Deal
        </Button>
      </DialogTrigger>

      <DialogContent className={cn(
        "sm:max-w-[500px] mx-auto my-auto p-4 bg-white dark:bg-zinc-900 text-black dark:text-white rounded-lg shadow-lg",
        "fixed !top-[50%] !left-[50%] !transform !-translate-x-1/2 !-translate-y-1/2"
      )}>
      <DialogHeader>
          <DialogTitle className="text-2xl">Create Deal</DialogTitle>
          <DialogDescription>Enter the Details of Your Deal</DialogDescription>
        </DialogHeader>

        {/* Title */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-black dark:text-white">Title 
            <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <Input
              className="text-black dark:text-white"
              placeholder="Name of your Deal (e.g. 15% off, 3/$10)"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error && e.target.value.trim()) setError(null);
              }}
              disabled={isSaving}
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-black dark:text-white">Description 
            <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <Textarea
              className="text-black dark:text-white"
              placeholder="Short Description of Your Deal (what's on sale?)"
              value={desc}
              onChange={(e) => {
                setDesc(e.target.value);
                if (error && e.target.value.trim()) setError(null);
              }}
              disabled={isSaving}
              required
            />
          </div>
        </div>

        {/* Expiration Date */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-black dark:text-white">Expiration Date</label>
          <div className="flex gap-6">
          <Popover
            open={isCalendarOpen}
            onOpenChange={(open) => setIsCalendarOpen(open)}
            modal
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[60%] justify-start pl-3 text-left font-normal",
                  !date && "text-muted-foreground"
                )}
                disabled={isSaving}
              >
                {date ? format(date, "PPP") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(selectedDate) => {
                  setDate(()=> {
                    selectedDate?.setHours(23, 59, 59);
                    return selectedDate
                  })}}
                disabled={(d) => {
                  // Allow current day, but disable past days
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return d < today;
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          </div>
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-black dark:text-white">Category 
            <span className="text-red-500">*</span>
          </label>
          <Select 
            onValueChange={(val) => {
              setCategory(val);
              if (error) setError(null);
            }}
            disabled={isSaving}
            value={category}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Grocery">Grocery</SelectItem>
              <SelectItem value="Retail">Retail</SelectItem>
              <SelectItem value="Electronics">Electronics</SelectItem>
              <SelectItem value="Entertainment">Entertainment</SelectItem>
              <SelectItem value="Furniture">Furniture</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Store Selection */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-black dark:text-white">Store 
            <span className="text-red-500">*</span>
          </label>
          <Select 
            onValueChange={(val) => {
              setStoreId(val);
              if (error) setError(null);
            }}
            disabled={isSaving || stores.length === 0}
            value={storeId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={stores.length === 0 ? "Loading stores..." : "Select a store"} />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {store.logo_url && (
                      <Image 
                        src={supabase.storage
                          .from("logos").getPublicUrl(`${store.logo_url}`).data.publicUrl}
                        alt={`${store.name} logo`}
                        width={24}
                        height={24}
                        className="w-6 h-6 object-contain"
                      />
                    )}
                    <span>{store.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-black dark:text-white">Image</label>
          <Input 
            className="text-black dark:text-white" 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange} 
            disabled={isSaving}
          />
        </div>
        {imagePreviewUrl && (
          <div className="relative">
            <Image
              src={imagePreviewUrl}
              alt="Preview"
              className="w-32 h-32 object-cover rounded"
              width={128}
              height={128}
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 rounded-full p-0"
              onClick={() => {
                setImageFile(null);
                setImagePreviewUrl(null);
              }}
              disabled={isSaving}
            >
              ×
            </Button>
          </div>
        )}

        {/* Final Save */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            className="bg-black text-white hover:bg-zinc-800"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
        
        {/* Error message if any required field are missing */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Required fields note */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span className="text-red-500">*</span> Required fields
        </div>
      </DialogContent>
    </Dialog>
  );
}
