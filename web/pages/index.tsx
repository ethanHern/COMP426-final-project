import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import DealsFeed from "@/components/dealsFeed";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import {
  getFeed,
  getOldestFeed,
  getPopularFeed,
  getExpirationFeed,
  searchListings,
} from "@/utils/supabase/queries/listing";
import Navbar from "@/components/navBar";
import { GetServerSidePropsContext } from "next";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { getProfile } from "@/utils/supabase/queries/profile";
import { Profile } from "@/utils/supabase/models/listing";
import { z } from "zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useDebounce } from "use-debounce";
import Head from "next/head";
import { useListingUpdates } from "@/utils/supabase/realtime/postgres-changes";
import TrackExpirations from "@/components/trackExpirations";

type HomePageProps = {
  user: User;
  profile: z.infer<typeof Profile>;
};

type SortOption = "newest" | "oldest" | "popular" | "expiring";

export default function HomePage({ user, profile }: HomePageProps) {
  const queryClient = useQueryClient();
  const supabase = createSupabaseComponentClient();
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [search, setSearch] = useState("");
  const [debouncedSearchTerm] = useDebounce(search, 500);

  // Enable real-time updates for listing expiration dates
  useListingUpdates(supabase, user);

  // Choose fetch function based on search input and sort option
  const fetchDataFn = debouncedSearchTerm
    ? (supabase: SupabaseClient, pageParam: number) =>
        searchListings(supabase, debouncedSearchTerm, pageParam)
    : sortOption === "newest"
    ? getFeed
    : sortOption === "oldest"
    ? getOldestFeed
    : sortOption === "popular"
    ? getPopularFeed
    : getExpirationFeed;

  const { data, fetchNextPage } = useInfiniteQuery({
    queryKey: ["feed", sortOption, debouncedSearchTerm],
    queryFn: ({ pageParam }) => fetchDataFn(supabase, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < 18 ? undefined : allPages.length * 18,
  });

  function getSortTitle(sortOption: SortOption): string {
    if (debouncedSearchTerm)
      return `Search results for "${debouncedSearchTerm}"`;
    switch (sortOption) {
      case "newest":
        return "Latest Deals";
      case "oldest":
        return "Earliest Deals";
      case "popular":
        return "Most Popular Deals";
      case "expiring":
        return "Ending Soon";
      default:
        return "Latest Deals";
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <Head>
        <title>DealSteal - Find the Best Deals</title>
        <meta
          name="description"
          content="Discover the latest and greatest deals from your favorite stores."
        />
      </Head>

      {/* Top Navigation Bar */}
      <Navbar user={user} supabase={supabase} queryClient={queryClient} />

      {/* Main Content Scroll Area */}
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full">
          {/* Content Wrapper */}
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-6">
            {/* Welcome Section */}
            <div>
              <h1 className="text-3xl font-bold mb-1">
                {profile ? `Welcome, ${profile.name}!` : "Welcome!"}
              </h1>
              <p className="text-gray-800 dark:text-gray-300 text-sm">
                Discover the best deals from your favorite stores.
              </p>
            </div>

            {/* Search and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <form className="relative flex-grow w-full">
                <Search className="absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search deals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full"
                />
                {debouncedSearchTerm && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setSearch("")}
                  >
                    Clear
                  </Button>
                )}
              </form>

              {/* Sort Dropdown */}
              <div className="flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      <span>Sort</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={sortOption}
                      onValueChange={(value) =>
                        setSortOption(value as SortOption)
                      }
                    >
                      <DropdownMenuRadioItem value="newest">
                        Newest first
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="oldest">
                        Oldest first
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="popular">
                        Most Popular
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="expiring">
                        Soon to Expire
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Deals Feed Section */}
            <DealsFeed
              supabase={supabase}
              user={user}
              deals={data}
              fetchNext={fetchNextPage}
              title={getSortTitle(sortOption)}
            />
          </div>
        </ScrollArea>
      </main>
      {user && <TrackExpirations user={user} />}
    </div>
  );
}

// Server-side props loader to get user and profile data before rendering
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

  const profile = user ? await getProfile(supabase, user) : null;

  return {
    props: {
      user,
      profile,
    },
  };
}
