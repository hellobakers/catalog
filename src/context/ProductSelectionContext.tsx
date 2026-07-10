"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { Product } from "@/src/types";

interface ProductSelectionContextType {
  selectedProducts: Product[];
  toggleProduct: (product: Product) => void;
  clearSelection: () => void;
  isSelected: (productId: string) => boolean;
}

const ProductSelectionContext = createContext<ProductSelectionContextType | undefined>(
  undefined
);

export function ProductSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const toggleProduct = useCallback((product: Product) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProducts([]);
  }, []);

  const isSelected = useCallback(
    (productId: string) => {
      return selectedProducts.some((p) => p.id === productId);
    },
    [selectedProducts]
  );

  return (
    <ProductSelectionContext.Provider
      value={{ selectedProducts, toggleProduct, clearSelection, isSelected }}
    >
      {children}
    </ProductSelectionContext.Provider>
  );
}

export function useProductSelection() {
  const context = useContext(ProductSelectionContext);
  if (context === undefined) {
    throw new Error(
      "useProductSelection must be used within a ProductSelectionProvider"
    );
  }
  return context;
}
