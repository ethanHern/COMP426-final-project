import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
    // Create the hooks needed
    const router = useRouter();
    const supabase = createSupabaseComponentClient();
    const queryClient = useQueryClient();

    // States to store the form's fields
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const logIn = async () => {
        setLoading(true);
        const {error} = await supabase.auth.signInWithPassword({email, password});
        if (error) {
            window.alert(error.message);
        }
        queryClient.resetQueries({queryKey: ["user_profile"]});
        router.push('/');
        setLoading(false);
    };


  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold text-center">Log in to DealSteal</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
          Enter your credentials to access your account.
          </CardDescription>

          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary font-medium underline underline-offset-4 hover:text-primary/80 transition-colors"
              >
              Sign up here!
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button className="w-full mt-4" onClick={logIn} disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}