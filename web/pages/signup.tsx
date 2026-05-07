import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useState } from "react";
import Link from "next/link";
import { AtSign} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");

  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, handle } },
    });
    if (error) {
      console.error("Signup failed:", error.message);
      alert("Signup failed: " + error.message);
      return;
    }
    if (!data.session) {
      alert("Check your email to verify your account before logging in.");
      return;
    }
  
    await queryClient.resetQueries({ queryKey: ["user_profile"] });
    router.push("/");
  };
  
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold text-center">Welcome to DealSteal</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Enter your information to sign up.
          </CardDescription>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link
                href="/login"
                className="text-primary font-medium underline underline-offset-4 hover:text-primary/80 transition-colors"
                >
                Log in here!
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m@example.com"
                  required
                />
          </div>
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sample Name"
                  required
                />
          </div>
          <div className="space-y-1">
            <Label htmlFor="handle">Handle</Label>
            <div className="relative">
                <AtSign className="absolute left-2 top-2.5 h-4 w-4" />
                <Input
                    className="pl-8"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="ramses"
                    required
                  />
            </div>
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
          <Button className="w-full mt-4" onClick={signUp}>
            Sign Up
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
