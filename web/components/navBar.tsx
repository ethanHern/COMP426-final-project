import Link from "next/link";
import CreateDealDialog from "@/components/createDealDialog";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { useRouter } from "next/router";
import { QueryClient } from "@tanstack/react-query";
import { ModeToggle } from "./mode-toggle";
import { useState, useEffect } from "react";

type NavbarProps = {
  supabase: SupabaseClient;
  user: User;
  queryClient: QueryClient;
};

export default function Navbar({ supabase, user, queryClient }: NavbarProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [router.pathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };


  return (
    <header className="w-full border-b border-gray-200" id="navbar">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="font-bold text-lg">
          DealSteal
        </Link>

        {/* Mobile Menu Button - only visible on small screens */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Desktop Navigation - hidden on mobile */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex gap-6 text-sm font-medium text-black dark:text-white">
            <Link href="/">Home</Link>
            <Link href="/stores">Stores</Link>
            {user && <Link href="/my-deals">My Deals</Link>}
            {user && <Link href="/bookmarks">Bookmarks</Link>}
            {!user && <Link href="/login">Log In</Link>}
            {!user && <Link href="/signup">Sign Up</Link>}
          </nav>
          {user && (
            <CreateDealDialog
              user={user}
              queryClient={queryClient}
              supabase={supabase}
            />
          )}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={()=>{supabase.auth.signOut();
                router.push(`/`);}}
              aria-label="Log out"
            >
              <LogOut className="text-red-500" />
            </Button>
          )}
          <ModeToggle />
        </div>
      </div>

      {/* Mobile Menu - expanded when isMenuOpen is true */}
      {isMenuOpen && (
        <div className="md:hidden px-6 py-4 absolute w-full bg-white dark:bg-gray-900 border-b border-gray-200 z-50">
          <nav className="flex flex-col gap-4 text-sm font-medium text-black dark:text-white">
            <Link href="/">Home</Link>
            <Link href="/stores">Stores</Link>
            {user && <Link href="/my-deals">My Deals</Link>}
            {user && <Link href="/bookmarks">Bookmarks</Link>}
            <Link href="/search">Search</Link>
            {!user && <Link href="/login">Log In</Link>}
            {!user && <Link href="/signup">Sign Up</Link>}
          </nav>
          <div className="flex items-center gap-4 mt-4">
            {user && (
              <CreateDealDialog
                user={user}
                queryClient={queryClient}
                supabase={supabase}
              />
            )}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={()=>{
                  supabase.auth.signOut();
                  router.push(`/`);
                }}
                aria-label="Log out"
              >
                <LogOut className="text-red-500" />
              </Button>
            )}
            <ModeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
