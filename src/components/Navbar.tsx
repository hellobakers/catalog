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
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import toast from "react-hot-toast";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logoutUser } = useAuth();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  const handleLogout = async () => {
    await logoutUser();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/products" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">
            Catalog Manager
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/products"
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              isActive("/products")
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Products
          </Link>
          <Link
            href="/categories"
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              isActive("/categories")
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FolderTree className="h-4 w-4" />
            Categories
          </Link>
          <Link
            href="/add-product"
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              isActive("/add-product")
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
                <User className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user?.full_name || "User"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
