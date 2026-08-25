// src/hooks/useUserLocation.ts
// Best-effort location: never blocks the UI. Returns null coordinates until
// permission is granted and a fix arrives; failures degrade silently.
import * as Location from "expo-location";
import { useEffect, useState } from "react";

export type UserLocation = {
  lat: number;
  lng: number;
};

type LocationResult = {
  location: UserLocation | null;
  /** "undetermined" while asking, "denied" after refusal, "granted" on success */
  status: "undetermined" | "denied" | "granted";
};

export function useUserLocation(): LocationResult {
  const [state, setState] = useState<LocationResult>({
    location: null,
    status: "undetermined",
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        if (!cancelled) setState({ location: null, status: "denied" });
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setState({
            location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            status: "granted",
          });
        }
      } catch {
        if (!cancelled) setState({ location: null, status: "denied" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
