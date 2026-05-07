import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import StoreFeed from "@/components/storeFeed";
import { getAllStores } from "@/utils/supabase/queries/store"; // We'll write this next
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/navBar";
import { GetServerSidePropsContext } from "next";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import Head from "next/head";
import TrackExpirations from "@/components/trackExpirations";

type StorePageProps = {
  user: User;
};

export default function StorePage({ user }: StorePageProps) {
  const queryClient = useQueryClient();
  const supabase = createSupabaseComponentClient();

  const { data: stores } = useQuery({
    queryKey: ["stores"],
    queryFn: () => getAllStores(supabase),
  });

  return (
    <div>
      <Head>
        <title>DealSteal - Stores</title>
        <meta
          name="description"
          content="Discover the latest and greatest deals from your favorite stores."
        />
      </Head>
      <Navbar user={user} supabase={supabase} queryClient={queryClient} />
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="max-w-7xl mx-auto px-6 mb-2">
          <h1 className="text-3xl font-bold mb-1">Stores</h1>
          <p className="text-gray-600 text-sm">
            Click on a store to see ongoing deals
          </p>
        </div>

        <StoreFeed supabase={supabase} stores={stores} />
      </main>
      {user && <TrackExpirations user={user} />}
    </div>
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


  return {
    props: {
      user,
    },
  };
}
