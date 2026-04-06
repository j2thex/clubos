// CARTO basemaps — free, no API key, no usage limits, commercial OK
export const MAP_STYLE_DARK_MATTER = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
export const MAP_STYLE_VOYAGER = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
export const MAP_STYLE_POSITRON = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

// Light mode uses Voyager (colorful), dark mode uses Dark Matter
export const MAP_STYLE_LIGHT = MAP_STYLE_VOYAGER;
export const MAP_STYLE_DARK = MAP_STYLE_DARK_MATTER;

// OpenFreeMap fallbacks
export const MAP_STYLE_OFM_POSITRON = "https://tiles.openfreemap.org/styles/positron";
export const MAP_STYLE_OFM_DARK = "https://tiles.openfreemap.org/styles/dark";

// Default to Dark Matter for premium feel on the dark-themed discover page
export const DEFAULT_MAP_STYLE = MAP_STYLE_DARK_MATTER;
