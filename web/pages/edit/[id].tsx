import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { getListing, updateListing } from "@/utils/supabase/queries/listing";
import { getAllStores } from "@/utils/supabase/queries/store";
import Image from "next/image";
import { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { GetServerSidePropsContext } from "next";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/navBar";
import { ScrollArea } from "@/components/ui/scroll-area";
import Head from "next/head";
import TrackExpirations from "@/components/trackExpirations";

type editPageProps = {
    user: User,
    listingId: string,
}


export default function EditPage({user, listingId}: editPageProps) {
    const queryClient = useQueryClient();
    const supabase = createSupabaseComponentClient();
    const router = useRouter();
    const { data: listing } = useQuery({
      queryKey: [listingId],
      queryFn: ()=>(getListing(supabase, listingId))
    })

      const [title, setTitle] = useState("");
      const [desc, setDesc] = useState("");
      const [date, setDate] = useState<Date | undefined>(undefined);
      const [category, setCategory] = useState("");
      const [storeId, setStoreId] = useState<string>("");
      const [stores, setStores] = useState<{ id: string; name: string, logo_url: string | null }[]>([]);
    
      const [isSaving, setIsSaving] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const [isCalendarOpen, setIsCalendarOpen] = useState(false);
      const updateChannel = supabase.channel("tracking");

      useEffect(()=> {
        if (listing) {
          setTitle(listing.name);
          setDesc(listing.description);
          setDate(listing.expires_on!);
          setCategory(listing.category);
          setStoreId(listing.store.id);
        }
      }, [listing, supabase]);
    
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
    
        fetchStores();
      }, [supabase]);

      useEffect(()=> {
        if (date) {
          const d = date;
          d.setHours(19, 59, 59);
          setDate(d);
        }
      }, [isCalendarOpen, date]);
    
      const handleSave = async () => {
        try {
          setIsSaving(true);
          setError(null);
          await updateListing(
            supabase,
            user,
            listing!.id,
            {
              name: title,
              description: desc,
              category,
              store_id: storeId,
              expires_on: date || null,
            },
            
          );
    
        } catch (err) {
          console.error(err);
          setError("Failed to create deal.");
        } finally {
          setIsSaving(false);
        }
        updateChannel.subscribe((status)=>{
          if (status === "SUBSCRIBED") {
            updateChannel.send({
              type: "broadcast",
              event: "listingUpdated",
              payload: {message: `${title} on ${desc}`}
            });
          }
        });
        setTimeout(() => router.back(), 1000); // close after 1 second
      };
    return (
        <div className="flex flex-col h-screen py-2">
          <Head>
            <title>DealSteal - Edit Deal</title> #for Accessibility
            <meta name="description" content="Discover the latest and greatest deals from your favorite stores." /> #for SEO
          </Head>
            <Navbar user={user} supabase={supabase} queryClient={queryClient} />
            <main className="flex-1 overflow-hidden">
              <ScrollArea className="h-full w-full">
                <div className="flex items-center justify-center h-fill w-fill">
                  <Card className="w-full max-w-sm shadow-lg self-center">
                      <CardHeader>
                          <CardTitle>Edit Deal</CardTitle>
                          <CardDescription>Edit the details of your deal here</CardDescription>
                      </CardHeader>
                      <CardContent>
                          {/* Title */}
                          <div className="space-y-1">
                              <label className="text-sm font-medium">Title</label>
                              <div className="flex gap-2">
                                  <Input
                                  placeholder="Name of your Deal (e.g. 15% off, 3/$10)"
                                  value={title}
                                  onChange={(e) => setTitle(e.target.value)}
                                  />
                              </div>
                          </div>

                          {/* Description */}
                          <div className="space-y-1">
                          <label className="text-sm font-medium">Description</label>
                          <div className="flex gap-2">
                              <Textarea
                              placeholder="Short Description of Your Deal (what's on sale?)"
                              value={desc}
                              onChange={(e) => setDesc(e.target.value)}
                              />
                          </div>
                          </div>

                          {/* Expiration Date */}
                          <div className="space-y-1">
                          <label className="text-sm font-medium">Expiration Date</label>
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
                              >
                                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                  mode="single"
                                  selected={date ? date : undefined}
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
                          <label className="text-sm font-medium">Category</label>
                          <Select value={category} onValueChange={(val) => setCategory(val)}>
                              <SelectTrigger className="w-full">
                              <SelectValue  placeholder="Select…" />
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
                          <label className="text-sm font-medium">Store</label>
                          <Select value={storeId} onValueChange={(val) => setStoreId(val)}>
                              <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a store" />
                              </SelectTrigger>
                              <SelectContent>
                              {stores.map((store) => (
                                  <SelectItem key={store.id} value={store.id}>
                                  <Image src={supabase.storage
                                              .from("logos").getPublicUrl(`${store.logo_url}`).data.publicUrl}
                                              alt={"Image associated with store"}
                                          width={24}
                                          height={24}
                                          className="w-6 h-6 object-contain"
                                          />
                                  {store.name}
                                  </SelectItem>
                              ))}
                              </SelectContent>
                          </Select>
                          </div>
                      </CardContent>
                      <CardFooter className="flex place-content-between">
                      {/* Final Save */}
                        <Button variant={"outline"} onClick={()=>router.back()}>Cancel</Button>
                        <Button
                            onClick={handleSave}
                            className="bg-black text-white hover:bg-zinc-800"
                            disabled={isSaving}
                            >
                              {isSaving ? "Saving..." : "Save"}
                        </Button>                   
                        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                      </CardFooter>
                  </Card>
                </div>
              </ScrollArea>
            </main>
            {user && <TrackExpirations user={user} />}
        </div>
    )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const supabase = createSupabaseServerClient(context);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData) {
        return {
            redirect: {
                destination: "/login",
                permanent: false,
            }
        }
    };

    const user = userData.user;
    const listingId = context.params!.id as string;

    return {
        props: {
            user,
            listingId,
        }
    }
}