"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Package,
  Plus,
  LayoutDashboard,
  LogOut,
  User,
  FolderTree,
  LayoutGrid,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logoutUser } = useAuth();

  const isActive = (path: string) =>
    pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)) || (path === "/" && pathname === "/");

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const navLinks = [
    { href: "/browse", label: "Browse", icon: LayoutGrid },
    { href: "/products", label: "Products", icon: LayoutDashboard },
    { href: "/categories", label: "Categories", icon: FolderTree },
    { href: "/add-product", label: "Add Product", icon: Plus },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/browse" className="group flex items-center gap-2.5">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 transition-all group-hover:shadow-primary/30"
          >
            <Package className="h-5.5 w-5.5 text-primary-foreground" />
          </motion.div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Catalog<span className="text-primary">.</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden items-center gap-1 md:flex mr-4">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    active 
                      ? "text-primary bg-primary/5" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <link.icon className={cn("h-4 w-4", active ? "text-primary" : "")} />
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pl-4 border-l">
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary ring-2 ring-background">
                <User className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold leading-none text-foreground">
                  {user?.full_name || "User"}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  Admin
                </span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-accent/50 px-3 py-2 text-sm font-medium text-foreground transition-all hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
}
