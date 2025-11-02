/**
 * Formats a URL to ensure it has proper protocol and structure
 * @param url - The input URL string
 * @returns Properly formatted URL string
 */
export function formatUrl(url: string): string {
  if (!url || url.trim() === '') {
    return '';
  }

  let formattedUrl = url.trim();

  // Remove any existing protocol temporarily to normalize
  formattedUrl = formattedUrl.replace(/^https?:\/\//, '');

  // Remove leading slashes if any
  formattedUrl = formattedUrl.replace(/^\/+/, '');

  // If it's empty after cleaning, return empty
  if (!formattedUrl) {
    return '';
  }

  // Add https:// prefix
  formattedUrl = `https://${formattedUrl}`;

  return formattedUrl;
}

/**
 * Validates if a URL has a proper format
 * @param url - The URL string to validate
 * @returns boolean indicating if URL is valid
 */
export function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '') {
    return true; // Empty URL is valid (optional field)
  }

  try {
    const formattedUrl = formatUrl(url);
    const urlObject = new URL(formattedUrl);
    
    // Check if it has a valid hostname
    return urlObject.hostname.includes('.') && urlObject.hostname.length > 3;
  } catch {
    return false;
  }
}

/**
 * Formats URL on blur event (when user finishes editing)
 * @param url - The input URL string
 * @returns Formatted URL or original if invalid
 */
export function formatUrlOnBlur(url: string): string {
  if (!url || url.trim() === '') {
    return '';
  }

  const formatted = formatUrl(url);
  
  // Only return formatted version if it's valid
  if (isValidUrl(formatted)) {
    return formatted;
  }

  // Return original if formatting would make it invalid
  return url;
}