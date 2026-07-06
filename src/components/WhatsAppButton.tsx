// src/components/WhatsAppButton.tsx (Updated with simplified phone input)
"use client";

import { useState, useEffect } from "react";
import { Share2, X, Check, Send } from "lucide-react";
import toast from "react-hot-toast";
import type { Product, Category } from "@/src/types";
import { useWhatsAppPreferences } from "@/src/hooks/useWhatsAppPreferences";
import { validatePhoneNumber, getPhoneNumberError, formatPhoneNumber } from "@/src/utils/phoneValidation";

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

  // Load preferences on mount
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
    // Validate phone number
    const error = getPhoneNumberError(phoneNumber);
    if (error) {
      setPhoneError(error);
      toast.error(error);
      return;
    }

    setPhoneError(null);
    setIsSending(true);
    try {
      // Format phone number automatically
      const formattedNumber = formatPhoneNumber(phoneNumber);

      // Save preferences
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
      console.error('WhatsApp error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
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
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
        aria-label="Share on WhatsApp"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white rounded-t-2xl">
              <h2 className="text-lg font-semibold text-gray-900">
                Share via WhatsApp
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Phone Number Input - Simplified */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="9876543210"
                    maxLength={12}
                    className={`w-full pl-12 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors ${
                      phoneError ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {phoneError && (
                  <p className="mt-1 text-xs text-red-500">{phoneError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Enter 10-digit mobile number (no country code needed)
                </p>
              </div>

              {/* Field Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select fields to share
                  </label>
                  <button
                    onClick={() => {
                      const allSelected = fieldOptions.every(f => f.selected);
                      setFieldOptions(prev =>
                        prev.map(field => ({ ...field, selected: !allSelected }))
                      );
                    }}
                    className="text-xs text-green-600 hover:text-green-700 font-medium"
                  >
                    {fieldOptions.every(f => f.selected) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {fieldOptions.map((field) => (
                    <label
                      key={field.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={field.selected}
                        onChange={() => toggleField(field.id)}
                        className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700">{field.label}</span>
                      {field.selected && (
                        <Check className="h-3.5 w-3.5 text-green-600 ml-auto" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Preview Message */}
              {hasSelectedFields && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preview
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans">
                      {generateWhatsAppMessage()}
                    </pre>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  disabled={!phoneNumber || !hasSelectedFields || isSending || !!phoneError}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSending ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}