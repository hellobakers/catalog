// src/utils/phoneValidation.ts

export const validatePhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Indian phone numbers: 10 digits (mobile) or 11-12 digits (with STD code)
  // For simplicity, we'll accept 10-12 digits
  return cleaned.length >= 10 && cleaned.length <= 12 && /^\d+$/.test(cleaned);
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If number is 10 digits, it's a mobile number - add +91
  if (cleaned.length === 10) {
    cleaned = '+91' + cleaned;
  } 
  // If number is 11-12 digits, it might already have country code or STD
  else if (cleaned.length === 11) {
    // Could be 0 + 10 digits (STD + mobile)
    cleaned = '+91' + cleaned.substring(1);
  }
  else if (cleaned.length === 12) {
    // Could be 91 + 10 digits
    if (cleaned.startsWith('91')) {
      cleaned = '+' + cleaned;
    } else {
      // Could be 0 + STD + number
      cleaned = '+91' + cleaned.substring(1);
    }
  }
  // For any other length, just add +91
  else {
    cleaned = '+91' + cleaned;
  }
  
  return cleaned;
};

export const getPhoneNumberError = (phone: string): string | null => {
  if (!phone) {
    return null; // Optional field
  }
  
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10) {
    return 'Phone number must have at least 10 digits';
  }
  if (cleaned.length > 12) {
    return 'Phone number must not exceed 12 digits';
  }
  if (!/^\d+$/.test(cleaned)) {
    return 'Phone number must contain only digits';
  }
  
  return null;
};

// Helper to clean phone number for display
export const cleanPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  return phone.replace(/\D/g, '');
};