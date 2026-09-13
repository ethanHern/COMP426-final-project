import { Fragment } from "react";
import { InView } from "react-intersection-observer";
import { z } from "zod";
import { Listing } from "@/utils/supabase/models/listing";
import DealCard from "./dealCard";
import { InfiniteData } from "@tanstack/react-query";
import { SupabaseClient, User } from "@supabase/supabase-js";

type DealsFeedProps = {
  supabase: SupabaseClient;
  user: User;
  deals: InfiniteData<z.infer<typeof Listing>[]> | undefined;
  fetchNext: () => void;
  title?: string;
};

export default function DealsFeed({
  supabase,
  user,
  deals,
  fetchNext,
  title,
}: DealsFeedProps) {
  return (
    <>
      {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {deals?.pages.map((page, pageIndex) =>
          page.map((listing, index) => (
            <Fragment key={`deal_${listing.id}`}>
              <DealCard supabase={supabase} user={user} listing={listing} />

              {/* Trigger fetchNext when the last card comes into view. */}
              {index === page.length - 1 &&
                pageIndex === deals.pages.length - 1 && (
                  <InView
                    onChange={(inView) => {
                      if (inView) {
                        fetchNext();
                      }
                    }}
                    className="col-span-full h-4"
                  />
                )}
            </Fragment>
          ))
        )}
      </div>
    </>
  );
}
