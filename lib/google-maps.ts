/**
 * Generate the direct Google review URL from a Place ID.
 * Admin provides their Place ID (ChIJ format) from Google Business Profile.
 */
export function getReviewUrl(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}
