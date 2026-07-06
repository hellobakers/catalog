import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  unique_product_id: z.string().optional(),
  description: z.string().optional(),
  location_1: z.string().optional(),
  location_2: z.string().optional(),
  website_url: z
    .string()
    .url("Invalid URL format")
    .optional()
    .or(z.literal("")),
  images: z.array(z.instanceof(File)).default([]),
  category_ids: z.array(z.string()).default([]),
});

export type ProductFormData = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name must not exceed 50 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug must not exceed 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    )
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional()
    .or(z.literal("")),
  parent_id: z.string().nullable().optional(),
  sort_order: z
    .number()
    .int()
    .min(0, "Sort order must be a positive number")
    .optional(),
  icon: z.string().max(50, "Icon must not exceed 50 characters").optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color format")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
