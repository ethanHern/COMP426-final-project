import { Store } from "@/utils/supabase/models/listing";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Card, CardContent } from "./ui/card";
import Image from "next/image";
import Link from "next/link";

type StoreCardProps = {
  supabase: SupabaseClient;
  store: z.infer<typeof Store>;
};

export default function StoreCard({ supabase, store }: StoreCardProps) {
  return (
    <Link href={`/stores/${store.id}`} className="block w-full">
      <Card className="w-full max-w-sm shadow-md overflow-hidden">
        <div className="w-full h-40 relative flex item-center justify-center">
          <Image
            src={
              supabase.storage.from("logos").getPublicUrl(`${store.logo_url}`)
                .data.publicUrl
            }
            alt={"Image associated with store"}
            width={200}
            height={200}
            className="object-contain max-h-32 max-w-full p-4"
          />
        </div>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-2">
            <p className="font-bold text-lg">{store.name}</p>
            <p className="text-gray-700 text-sm line-clamp-2">
              {store.description || "No description available."}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
