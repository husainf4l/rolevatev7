"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";

interface Country {
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
  format?: string;
}

const countries: Country[] = [
  { code: "JO", name: "Jordan", flag: "🇯🇴", phoneCode: "+962", format: "7XXXXXXXX" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", phoneCode: "+966" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", phoneCode: "+971" },
  { code: "QA", name: "Qatar", flag: "🇶🇦", phoneCode: "+974" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼", phoneCode: "+965" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭", phoneCode: "+973" },
  { code: "OM", name: "Oman", flag: "🇴🇲", phoneCode: "+968" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", phoneCode: "+20" },
  { code: "LB", name: "Lebanon", flag: "🇱🇧", phoneCode: "+961" },
  { code: "SY", name: "Syria", flag: "🇸🇾", phoneCode: "+963" },
  { code: "IQ", name: "Iraq", flag: "🇮🇶", phoneCode: "+964" },
];

interface PhoneInputProps {
  id?: string;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  onCountryChange?: (country: Country) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export function PhoneInput({
  id = "phone",
  name = "phone",
  value = "",
  onChange,
  onCountryChange,
  placeholder = "796026659",
  className = "",
  error,
  label = "Phone Number",
  required = false,
  disabled = false,
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Default to Jordan
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Parse existing value if provided
  React.useEffect(() => {
    if (value && value.startsWith("+")) {
      const country = countries.find(c => value.startsWith(c.phoneCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.slice(country.phoneCode.length));
      }
    }
  }, [value]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    
    // Update the full phone number
    const fullNumber = `${country.phoneCode}${phoneNumber}`;
    onChange?.(fullNumber);
    onCountryChange?.(country);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove any non-numeric characters
    const numericValue = inputValue.replace(/[^\d]/g, "");
    
    setPhoneNumber(numericValue);
    
    // Update the full phone number
    const fullNumber = `${selectedCountry.phoneCode}${numericValue}`;
    onChange?.(fullNumber);
  };

  const validatePhoneNumber = (country: Country, number: string): string | null => {
    if (!number) return null;
    
    switch (country.code) {
      case "JO": // Jordan
        // Jordan mobile numbers: 7XXXXXXXX (9 digits starting with 7)
        if (!/^7\d{8}$/.test(number)) {
          return "Jordan mobile numbers should be 9 digits starting with 7 (e.g., 796026659)";
        }
        break;
      case "SA": // Saudi Arabia
        // Saudi mobile numbers: 5XXXXXXXX (9 digits starting with 5)
        if (!/^5\d{8}$/.test(number)) {
          return "Saudi mobile numbers should be 9 digits starting with 5";
        }
        break;
      case "AE": // UAE
        // UAE mobile numbers: 5XXXXXXXX (9 digits starting with 5)
        if (!/^5\d{8}$/.test(number)) {
          return "UAE mobile numbers should be 9 digits starting with 5";
        }
        break;
      case "QA": // Qatar
        // Qatar mobile numbers: 3XXXXXXX, 5XXXXXXX, 6XXXXXXX, 7XXXXXXX (8 digits)
        if (!/^[3567]\d{7}$/.test(number)) {
          return "Qatar mobile numbers should be 8 digits starting with 3, 5, 6, or 7";
        }
        break;
      case "KW": // Kuwait
        // Kuwait mobile numbers: 5XXXXXXX, 6XXXXXXX, 9XXXXXXX (8 digits)
        if (!/^[569]\d{7}$/.test(number)) {
          return "Kuwait mobile numbers should be 8 digits starting with 5, 6, or 9";
        }
        break;
      case "BH": // Bahrain
        // Bahrain mobile numbers: 3XXXXXXX (8 digits starting with 3)
        if (!/^3\d{7}$/.test(number)) {
          return "Bahrain mobile numbers should be 8 digits starting with 3";
        }
        break;
      case "OM": // Oman
        // Oman mobile numbers: 9XXXXXXX (8 digits starting with 9)
        if (!/^9\d{7}$/.test(number)) {
          return "Oman mobile numbers should be 8 digits starting with 9";
        }
        break;
      case "EG": // Egypt
        // Egypt mobile numbers: 1XXXXXXXXX (11 digits starting with 1)
        if (!/^1\d{9}$/.test(number)) {
          return "Egypt mobile numbers should be 10 digits starting with 1";
        }
        break;
      case "LB": // Lebanon
        // Lebanon mobile numbers: 3XXXXXXX, 70XXXXXX, 71XXXXXX, 76XXXXXX, 78XXXXXX, 79XXXXXX (8 digits)
        if (!/^(3\d{7}|7[01678]\d{6})$/.test(number)) {
          return "Lebanon mobile numbers should be 8 digits (3XXXXXXX or 7XXXXXXX)";
        }
        break;
      case "SY": // Syria
        // Syria mobile numbers: 9XXXXXXXX (9 digits starting with 9)
        if (!/^9\d{8}$/.test(number)) {
          return "Syria mobile numbers should be 9 digits starting with 9";
        }
        break;
      case "IQ": // Iraq
        // Iraq mobile numbers: 7XXXXXXXXX (10 digits starting with 7)
        if (!/^7\d{9}$/.test(number)) {
          return "Iraq mobile numbers should be 10 digits starting with 7";
        }
        break;
      default:
        // Generic validation for other countries
        if (number.length < 7 || number.length > 15) {
          return "Phone number should be between 7 and 15 digits";
        }
    }
    
    return null;
  };

  const validationError = validatePhoneNumber(selectedCountry, phoneNumber);
  const displayError = error || validationError;

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="flex">
        {/* Country Selector */}
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            className={`flex items-center gap-2 rounded-r-none border-r-0 px-3 h-10 ${
              displayError ? "border-red-500" : ""
            }`}
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium">{selectedCountry.phoneCode}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
          
          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 w-72 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {countries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
                >
                  <span className="text-lg">{country.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{country.name}</div>
                    <div className="text-xs text-gray-500">{country.phoneCode}</div>
                  </div>
                  {selectedCountry.code === country.code && (
                    <Check className="h-4 w-4 text-primary-600" />
                  )}
                </button>
              ))}
            </div>
          )}
          
          {/* Backdrop */}
          {isDropdownOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
          )}
        </div>
        
        {/* Phone Number Input */}
        <div className="flex-1">
          <Input
            id={id}
            name={name}
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            placeholder={selectedCountry.format || placeholder}
            disabled={disabled}
            className={`rounded-l-none h-10 ${displayError ? "border-red-500" : ""} ${className}`}
          />
        </div>
      </div>
      
      {/* Help Text */}
      {selectedCountry.format && !displayError && (
        <p className="text-xs text-gray-500">
          Format: {selectedCountry.phoneCode}{selectedCountry.format}
        </p>
      )}
      
      {/* Error Message */}
      {displayError && (
        <p className="text-red-500 text-sm">{displayError}</p>
      )}
      
      {/* Preview */}
      {phoneNumber && !displayError && (
        <p className="text-xs text-green-600">
          ✓ Complete number: {selectedCountry.phoneCode}{phoneNumber}
        </p>
      )}
    </div>
  );
}

export { type Country };