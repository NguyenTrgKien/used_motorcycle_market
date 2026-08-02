import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "../hooks/useUser";
import type { UserAddressType } from "../types/address.type";

export interface SelectedLocation {
  province: string;
  district: string;
}

interface LocationContextValue {
  location: SelectedLocation | null;
  setLocation: (location: SelectedLocation) => void;
}

const storageKey = "selected-location";
const LocationContext = createContext<LocationContextValue | null>(null);

const getStoredLocation = (): SelectedLocation | null => {
  try {
    const value = localStorage.getItem(storageKey);
    if (!value) return null;
    const location = JSON.parse(value) as SelectedLocation;
    return location.province ? location : null;
  } catch {
    return null;
  }
};

export function LocationProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();
  const [location, setLocationState] = useState<SelectedLocation | null>(
    getStoredLocation,
  );

  useEffect(() => {
    if (location || isLoading || !user) return;
    const defaultAddress =
      user.addresses?.find((address: UserAddressType) => address.isDefault) ||
      user.addresses?.[0];
    if (!defaultAddress?.province) return;
    setLocationState({
      province: defaultAddress.province,
      district: defaultAddress.district || "",
    });
  }, [isLoading, location, user]);

  const setLocation = (nextLocation: SelectedLocation) => {
    setLocationState(nextLocation);
    localStorage.setItem(storageKey, JSON.stringify(nextLocation));
  };

  const value = useMemo(() => ({ location, setLocation }), [location]);

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocationSelection = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocationSelection must be used inside LocationProvider");
  }
  return context;
};
