// src/utils/mapLink.ts
// Sellers pin their shop either by pasting a Google Maps link (Share → Copy
// link) or by standing at the shop and using their device's fix. Only the
// resulting {lat, lng} is persisted, the raw link is not stored.
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { Alert } from "react-native";

export type PinCoords = { lat: number; lng: number };

function valid(lat: number, lng: number): boolean {
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat !== 0 || lng !== 0);
}

/**
 * Extracts coordinates from common Google Maps URL shapes:
 *   /maps/place/…/@16.8409,96.1735,17z   (desktop-style share links)
 *   !3d16.840909!4d96.173455             (marker pairs inside data=)
 *   ?q=16.8409,96.1735                   (plain query links)
 * plus bare "16.8409, 96.1735" pastes. Returns null when nothing plausible
 * is found.
 */
export function parseMapLinkCoordinates(input: string): PinCoords | null {
  const s = decodeURIComponent(input.trim());
  const patterns = [
    /@(-?\d{1,3}\.\d{3,})[,\s]+(-?\d{1,3}\.\d{3,})/,
    /3d(-?\d{1,3}\.\d{3,})!4d(-?\d{1,3}\.\d{3,})/,
    /[?&](?:q|query|destination|ll|center|sll)=(-?\d{1,3}\.\d{3,})[,\s]+(-?\d{1,3}\.\d{3,})/,
    /^(-?\d{1,3}\.\d{3,})[,\s]+(-?\d{1,3}\.\d{3,})$/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (!m) continue;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (valid(lat, lng)) return { lat, lng };
  }
  return null;
}

const SHORT_HOSTS = ["maps.app.goo.gl", "goo.gl", "g.co"];

function isShortLink(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return SHORT_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/**
 * Resolves whatever the seller pasted into coordinates. Direct formats are
 * parsed offline; short links (the usual result of Share → Copy link in the
 * mobile Maps app) redirect, so one fetch pulls the real page and scans it.
 * Never throws, null simply means "could not read a pin".
 */
export async function resolveMapLink(input: string): Promise<PinCoords | null> {
  const t = input.trim();
  const direct = parseMapLinkCoordinates(t);
  if (direct) return direct;
  if (!/^https?:\/\//i.test(t) || !isShortLink(t)) return null;

  // Short link: the redirect target embeds @lat,lng in the page source.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(t, { signal: controller.signal });
    const body = await res.text();
    return parseMapLinkCoordinates(body.slice(0, 300_000));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Opens the maps app with directions. Prefers precise coordinates (lat/lng)
 * from the customer's MapLink pin; falls back to free-text address.
 */
export async function openDirectionsTo(
  address: string,
  lat?: number | null,
  lng?: number | null,
): Promise<boolean> {
  const hasCoords = typeof lat === "number" && typeof lng === "number" && valid(lat, lng);
  const url = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}`;
  if (!hasCoords && !address.trim()) return false;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Helper to open directions when coords are known separately. */
export async function openDirectionsToCoords(lat: number, lng: number): Promise<boolean> {
  return openDirectionsTo(`${lat},${lng}`, lat, lng);
}

/** Device fix for "use my current location", permission handled, never throws. */
export async function getCurrentCoordinates(): Promise<PinCoords | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      Alert.alert(
        "Location needed",
        "Allow Brewly to access your location to pin your shop here.",
      );
      return null;
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}
