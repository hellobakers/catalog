"use client";

import { useState, useEffect } from "react";
import { Share2, X, Check, Send, Phone, ListChecks, Eye } from "lucide-react";
import toast from "react-hot-toast";
import type { Product, Category } from "@/src/types";
import { useWhatsAppPreferences } from "@/src/hooks/useWhatsAppPreferences";
import { validatePhoneNumber, getPhoneNumberError, formatPhoneNumber } from "@/src/utils/phoneValidation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";

interface WhatsAppButtonProps {
  product: Product;
  firstImage?: string | null;
}

interface FieldOption {
  id: string;
  label: string;
  selected: boolean;
}

export default function WhatsAppButton({ product, firstImage }: WhatsAppButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { preferences, savePreferences } = useWhatsAppPreferences();

  const [fieldOptions, setFieldOptions] = useState<FieldOption[]>([
    { id: 'name', label: 'Product Name', selected: true },
    { id: 'unique_product_id', label: 'Product ID', selected: true },
    { id: 'description', label: 'Description', selected: true },
    { id: 'location_1', label: 'Location 1', selected: true },
    { id: 'location_2', label: 'Location 2', selected: true },
    { id: 'website_url', label: 'Website URL', selected: true },
    { id: 'image', label: 'Image', selected: true },
    { id: 'categories', label: 'Categories', selected: true },
  ]);

  useEffect(() => {
    if (preferences.phoneNumber) {
      setPhoneNumber(preferences.phoneNumber);
    }
    if (preferences.selectedFields && preferences.selectedFields.length > 0) {
      setFieldOptions(prev =>
        prev.map(field => ({
          ...field,
          selected: preferences.selectedFields.includes(field.id)
        }))
      );
    }
  }, [preferences]);

  const toggleField = (fieldId: string) => {
    setFieldOptions(prev =>
      prev.map(field =>
        field.id === fieldId
          ? { ...field, selected: !field.selected }
          : field
      )
    );
  };

  const generateWhatsAppMessage = () => {
    const selectedFields = fieldOptions.filter(f => f.selected);
    const parts: string[] = [];

    selectedFields.forEach(field => {
      if (field.id === 'name' && product.name) {
        parts.push(`*Product:* ${product.name}`);
      } else if (field.id === 'unique_product_id' && product.unique_product_id) {
        parts.push(`*ID:* ${product.unique_product_id}`);
      } else if (field.id === 'description' && product.description) {
        parts.push(`*Description:* ${product.description}`);
      } else if (field.id === 'location_1' && product.location_1) {
        const loc2 = product.location_2 ? `, ${product.location_2}` : '';
        parts.push(`*Location:* ${product.location_1}${loc2}`);
      } else if (field.id === 'website_url' && product.website_url) {
        parts.push(`*Website:* ${product.website_url}`);
      } else if (field.id === 'image' && firstImage) {
        parts.push(`*Image:* ${firstImage}`);
      } else if (field.id === 'categories' && product.categories && product.categories.length > 0) {
        const categoryNames = product.categories.map((c: Category) => c.name).join(', ');
        parts.push(`*Categories:* ${categoryNames}`);
      }
    });

    parts.push('');
    parts.push('_Shared via Catalog Management System_');

    return parts.join('\n');
  };

  const handleSendWhatsApp = async () => {
    const error = getPhoneNumberError(phoneNumber);
    if (error) {
      setPhoneError(error);
      toast.error(error);
      return;
    }

    setPhoneError(null);
    setIsSending(true);
    try {
      const formattedNumber = formatPhoneNumber(phoneNumber);
      const selectedFieldIds = fieldOptions.filter(f => f.selected).map(f => f.id);
      savePreferences({
        phoneNumber: phoneNumber,
        selectedFields: selectedFieldIds
      });

      const message = generateWhatsAppMessage();
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');
      setIsModalOpen(false);
      toast.success('WhatsApp message prepared!');
    } catch (error) {
      toast.error('Failed to prepare WhatsApp message');
    } finally {
      setIsSending(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhoneNumber(value);
    if (value) {
      const error = getPhoneNumberError(value);
      setPhoneError(error);
    } else {
      setPhoneError(null);
    }
  };

  const hasSelectedFields = fieldOptions.some(f => f.selected);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:shadow-emerald-500/30"
      >
        <Share2 className="h-4 w-4" />
        Share
      </motion.button>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b bg-muted/30 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-foreground">
                    Share on WhatsApp
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    Recipient Number
                  </div>
                  <div className="group relative">
                    <span className="absolute inset-y-0 left-5 flex items-center text-sm font-black text-emerald-500">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="9876543210"
                      maxLength={12}
                      className={cn(
                        "w-full rounded-2xl border bg-background pl-14 pr-5 py-4 text-sm font-bold transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10",
                        phoneError ? 'border-destructive ring-destructive/10' : 'border-border'
                      )}
                    />
                  </div>
                  {phoneError && (
                    <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">{phoneError}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                      <ListChecks className="h-3.5 w-3.5" />
                      Content Selection
                    </div>
                    <button
                      onClick={() => {
                        const allSelected = fieldOptions.every(f => f.selected);
                        setFieldOptions(prev =>
                          prev.map(field => ({ ...field, selected: !allSelected }))
                        );
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:opacity-80"
                    >
                      {fieldOptions.every(f => f.selected) ? 'Clear All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {fieldOptions.map((field) => (
                      <button
                        key={field.id}
                        onClick={() => toggleField(field.id)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border p-3 text-left transition-all",
                          field.selected 
                            ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-600 ring-1 ring-emerald-500/20" 
                            : "border-border bg-background text-muted-foreground hover:border-emerald-500/30"
                        )}
                      >
                        <span className="text-xs font-bold">{field.label}</span>
                        {field.selected && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {hasSelectedFields && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                      Message Preview
                    </div>
                    <div className="rounded-2xl border bg-muted/30 p-5">
                      <pre className="whitespace-pre-wrap font-sans text-xs font-medium leading-relaxed text-foreground/80">
                        {generateWhatsAppMessage()}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 border-t bg-muted/30 p-8">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-2xl bg-secondary px-6 py-4 text-sm font-bold text-secondary-foreground transition-all hover:bg-secondary/80"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSendWhatsApp}
                  disabled={!phoneNumber || !hasSelectedFields || isSending || !!phoneError}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-black text-white shadow-xl shadow-emerald-500/20 transition-all hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isSending ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                      <Send className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Send to WhatsApp
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
