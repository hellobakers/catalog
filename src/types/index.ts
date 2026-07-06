export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface Product {
  id: string;
  unique_product_id: string;
  name: string;
  description: string | null;
  location_1: string | null;
  location_2: string | null;
  website_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  product_images: ProductImage[];
  categories?: Category[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  created_by: string | null;
  is_active: boolean;
  sort_order: number;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  // Derived / joined fields (not columns)
  product_count?: number;
  children?: Category[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

export interface ProductFormData {
  name: string;
  unique_product_id?: string;
  description?: string;
  location_1?: string;
  location_2?: string;
  website_url?: string;
  images: File[];
}
