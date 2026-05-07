import { Fragment } from "react";
import { z } from "zod";
import { Store } from "@/utils/supabase/models/listing";
import { SupabaseClient } from "@supabase/supabase-js";
import StoreCard from "./storeCard";

type StoreFeedProps = {
  supabase: SupabaseClient;
  stores: z.infer<typeof Store>[] | undefined;
  title?: string;
};

export default function StoreFeed({
  supabase,
  stores,
  title,
}: StoreFeedProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores?.map((store) => (
          <Fragment key={`store_${store.id}`}>
            <StoreCard supabase={supabase} store={store} />
          </Fragment>
        ))}
      </div>
    </div>
  );
}
