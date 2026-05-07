import { useEffect, useState } from "react";
import { z } from "zod";
import { Listing } from "@/utils/supabase/models/listing";
import DealCard from "./dealCard";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { Funnel } from "lucide-react";
import { Input } from "./ui/input";

type SearchFeedProps = {
  supabase: SupabaseClient;
  user: User;
  deals: z.infer<typeof Listing>[];
};

export default function SearchFeed({
  supabase,
  user,
  deals,
}: SearchFeedProps) {

    const [search, setSearch] = useState<string>("");
    const [searchData, setSearchData] = useState<z.infer<typeof Listing>[]>(deals);

    useEffect(()=> {
        setSearchData(deals.filter((deal)=>deal.name.toLowerCase().includes(search.toLowerCase()) || deal.description.toLowerCase().includes(search.toLowerCase())))
        },
    [search, deals]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <h2 className="text-2xl font-bold mb-4">Filtered Search</h2>
        <div className="flex">
            <Funnel />
            <Input
            placeholder="Search for a deal"
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            />
        </div>
        <div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchData && 
          searchData.map((listing)=>(
            <DealCard key={listing.id} supabase={supabase} user={user} listing={listing} />
          ))}
        </div>
    </div>
  );
}
