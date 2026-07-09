"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, Loader2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/src/context/AuthContext";
import { loginSchema, type LoginFormData } from "@/src/lib/validations";
import { motion } from "framer-motion";
import { FadeIn, ScaleIn } from "@/src/components/Motion";
import { cn } from "@/src/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { loginUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await loginUser(data.email, data.password);
      if (result.success) {
        toast.success("Welcome back!");
        router.push("/products");
      } else {
        toast.error(result.error || "Invalid credentials");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="relative w-full max-w-md">
        <FadeIn direction="down" className="mb-10 text-center">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-2xl shadow-primary/30"
          >
            <Package className="h-10 w-10 text-primary-foreground" />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Catalog<span className="text-primary">.</span>
          </h1>
          <p className="mt-3 font-medium text-muted-foreground">
            Secure access to your inventory management
          </p>
        </FadeIn>

        <ScaleIn>
          <div className="overflow-hidden rounded-3xl border bg-card p-8 shadow-2xl shadow-primary/5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">
                  Email Address
                </label>
                <div className="group relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  </div>
                  <input
                    type="email"
                    {...register("email")}
                    className={cn(
                      "block w-full rounded-2xl border bg-background px-11 py-3.5 text-sm font-medium transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10",
                      errors.email ? "border-destructive ring-destructive/10" : "border-border"
                    )}
                    placeholder="name@company.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-bold text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground">
                    Password
                  </label>
                  <button type="button" className="text-xs font-bold text-primary hover:underline">
                    Forgot?
                  </button>
                </div>
                <div className="group relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className={cn(
                      "block w-full rounded-2xl border bg-background px-11 py-3.5 text-sm font-medium transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10",
                      errors.password ? "border-destructive ring-destructive/10" : "border-border"
                    )}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs font-bold text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-muted-foreground/30 bg-background text-primary focus:ring-primary/20"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 text-sm font-bold text-muted-foreground"
                >
                  Keep me signed in
                </label>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-4 py-4 text-sm font-black text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Sign In to Catalog"
                )}
              </motion.button>
            </form>
          </div>
        </ScaleIn>

        <FadeIn delay={0.2} className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Demo Access: admin@inventory.com / admin123
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
