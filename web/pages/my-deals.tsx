import DealsFeed from "@/components/dealsFeed";
import Navbar from "@/components/navBar";
import TrackExpirations from "@/components/trackExpirations";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { getUserFeed } from "@/utils/supabase/queries/listing";
import { useListingUpdates } from "@/utils/supabase/realtime/postgres-changes";
import { User } from "@supabase/supabase-js";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { GetServerSidePropsContext } from "next";
import Head from "next/head";

type MyDealsPageProps = {
  user: User;
};

export default function MyDeals({user}: MyDealsPageProps) {
  const queryClient = useQueryClient();
  const supabase = createSupabaseComponentClient();

  // Enable real-time updates for listing expiration dates
  useListingUpdates(supabase, user);

  const { data: myData, fetchNextPage } = useInfiniteQuery({
    queryKey: ["myDealsFeed"],
    queryFn: ({ pageParam }) => getUserFeed(supabase, user, user.id, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 18) return undefined;
      return allPages.length * 18;
    },
  });

  return (
    <div>
      <Head>
        <title>DealSteal - Your Deals</title>
        <meta name="description" content="Manage and view all the deals you've created." />
      </Head>
      <Navbar user={user} supabase={supabase} queryClient={queryClient}/>
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="max-w-7xl mx-auto px-6 mb-2">
          <h1 className="text-3xl font-bold mb-1">Your Deals</h1>
          <p className="text-gray-600 text-sm">The deals you created, all in one spot!</p>
        </div>
        
        {myData && (
          <DealsFeed 
            supabase={supabase} 
            user={user} 
            deals={myData} 
            fetchNext={fetchNextPage}
          />
        )}
      </main>
      <TrackExpirations user={user} />
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // Create the supabase context that works specifically on the server and
  // pass in the context.
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
  // If the user is not logged in, redirect them to the login page.
  // Return the user as a prop.
  return {
    props: {
      user,
    },
  };
}