import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import DealsFeed from "@/components/dealsFeed";
import { User } from "@supabase/supabase-js";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { getBookmarksFeed } from "@/utils/supabase/queries/listing";
import Navbar from "@/components/navBar";
import { GetServerSidePropsContext } from "next";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { getProfile } from "@/utils/supabase/queries/profile";
import { Profile } from "@/utils/supabase/models/listing";
import { z } from "zod";
import { useListingUpdates } from "@/utils/supabase/realtime/postgres-changes";
import TrackExpirations from "@/components/trackExpirations";

type BookmarksPageProps = {
  user: User;
  isLoggedIn: boolean;
  profile: z.infer<typeof Profile>;
};

export default function BookmarksPage({ user }: BookmarksPageProps) {
  const queryClient = useQueryClient();
  const supabase = createSupabaseComponentClient();
  
  // Enable real-time updates for listing expiration dates
  // via postgres changes
  useListingUpdates(supabase, user);

  const { data, fetchNextPage } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn:({ pageParam }) => {
      const result = getBookmarksFeed(supabase, user, pageParam);
      return result;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer than 18 items, there are no more pages to fetch
      if (lastPage.length < 18) {
        return undefined;
      }
      
      // Calculate next cursor based on number of pages fetched so far
      return allPages.length * 18;
    },
  });

  return (
    <>
      <Navbar user={user} supabase={supabase} queryClient={queryClient} />
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="max-w-7xl mx-auto px-6 mb-2">
          <h1 className="text-3xl font-bold mb-1">Your Bookmarks</h1>
          <p className="text-gray-600 text-sm">You saved these for later.</p>
        </div>

        {data && (
          <DealsFeed
            supabase={supabase}
            user={user}
            deals={data}
            fetchNext={fetchNextPage}
          />
        )}
      </main>
      {user && <TrackExpirations user={user} />}
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createSupabaseServerClient(context);

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const profile = await getProfile(supabase, user);

  return {
    props: {
      user,
      profile,
    },
  };
}
