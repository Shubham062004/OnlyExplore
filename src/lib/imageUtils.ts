/**
 * Shared image utility functions that are safe to use in both 
 * Client and Server components (no Node.js/AI dependencies).
 */

export function getImageUrl(query: string) {
  // Using the requested format with the legacy source URL which works well for random keyword queries
  return `https://source.unsplash.com/1600x900/?${encodeURIComponent(query)}`;
}
