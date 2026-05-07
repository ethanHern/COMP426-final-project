import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { getStoreById } from "@/utils/supabase/queries/store";
import { getStoreFeed } from "@/utils/supabase/queries/listing";
import { GetServerSidePropsContext } from "next";
import { User } from "@supabase/supabase-js";
import { Store } from "@/utils/supabase/models/listing";
import { z } from "zod";
import Navbar from "@/components/navBar";
import DealsFeed from "@/components/dealsFeed";
import Head from "next/head";
import Image from "next/image";
import { useListingUpdates } from "@/utils/supabase/realtime/postgres-changes";
import TrackExpirations from "@/components/trackExpirations";

type StoreDetailPageProps = {
  user: User;
  store: z.infer<typeof Store>;
};

export default function StoreDetailPage({
  user,
  store,
}: StoreDetailPageProps) {
  const supabase = createSupabaseComponentClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const storeId = router.query.store as string;
  
  // Enable real-time updates for listing expiration dates
  useListingUpdates(supabase, user);

  const { data: storeData, fetchNextPage } = useInfiniteQuery({
    queryKey: ["storeFeed", storeId],
    queryFn: ({ pageParam = 0 }) =>
      getStoreFeed(supabase, storeId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 18) return undefined;
      return allPages.length * 18;
    },
  });

  return (
    <div>
      <Head>
        <title>{`DealSteal - ${store.name}` || "Store Details"}</title>
        <meta name="description" content={`Discover the latest deals from ${store.name}.`} />
      </Head>
      <Navbar user={user} supabase={supabase} queryClient={queryClient} />
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-32 h-32 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center p-2 shadow-md">
            <Image
              src={supabase.storage.from("logos").getPublicUrl(store.logo_url || "").data.publicUrl}
              alt={`${store.name} logo`}
              width={100}
              height={100}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
            {store.location && (
              <div className="text-sm text-gray-600 mb-2">
                📍 {store.location}
              </div>
            )}
            <p className="text-gray-700 mt-2">{store.description}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mb-2">
          <h2 className="text-2xl font-bold mb-1">Current Deals</h2>
          <p className="text-gray-600 text-sm">Deals available at {store.name}</p>
        </div>

        {storeData && (
          <DealsFeed 
            supabase={supabase} 
            deals={storeData} 
            fetchNext={fetchNextPage} 
            user={user} 
          />
        )}
      </main>
      {user && <TrackExpirations user={user} />}
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createSupabaseServerClient(context);
  const storeId = context.params?.store as string;

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

  try {
    const store = await getStoreById(supabase, storeId);

    return {
      props: {
        user,
        store,
      },
    };
  } catch (error) {
    console.error("Error fetching store data:", error);
    return {
      notFound: true,
    };
  }
}
