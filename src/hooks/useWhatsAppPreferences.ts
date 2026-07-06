// src/hooks/useWhatsAppPreferences.ts
import { useState, useEffect } from 'react';

interface WhatsAppPreferences {
  phoneNumber: string;
  selectedFields: string[];
}

const DEFAULT_PREFERENCES: WhatsAppPreferences = {
  phoneNumber: '',
  selectedFields: ['name', 'unique_product_id', 'description', 'location_1']
};

export function useWhatsAppPreferences() {
  const [preferences, setPreferences] = useState<WhatsAppPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    try {
      const saved = localStorage.getItem('whatsapp_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences({
          phoneNumber: parsed.phoneNumber || '',
          selectedFields: parsed.selectedFields || DEFAULT_PREFERENCES.selectedFields
        });
      }
    } catch (e) {
      console.error('Error loading WhatsApp preferences:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const savePreferences = (newPrefs: Partial<WhatsAppPreferences>) => {
    try {
      const updated = { 
        ...preferences, 
        ...newPrefs 
      };
      setPreferences(updated);
      localStorage.setItem('whatsapp_preferences', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving WhatsApp preferences:', e);
    }
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem('whatsapp_preferences');
  };

  return { 
    preferences, 
    savePreferences, 
    resetPreferences,
    isLoaded 
  };
}