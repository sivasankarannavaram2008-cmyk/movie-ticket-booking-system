"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { CITIES, MockCity } from "@/lib/mock-data";

export const DEFAULT_CITY: MockCity =
  CITIES.find((c) => c.slug.toLowerCase() === "hyderabad" || c.name.toLowerCase() === "hyderabad") || CITIES[3] || CITIES[0];

interface CityContextType {
  selectedCity: MockCity;
  setCity: (city: MockCity | string) => void;
  setSelectedCity: (city: MockCity) => void;
  cities: MockCity[];
}

const CityContext = createContext<CityContextType>({
  selectedCity: DEFAULT_CITY,
  setCity: () => {},
  setSelectedCity: () => {},
  cities: CITIES,
});

export function CityProvider({ children }: { children: ReactNode }) {
  const [selectedCity, setSelectedCityState] = useState<MockCity>(DEFAULT_CITY);

  // Initialize from URL search param or localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const params = new URLSearchParams(window.location.search);
      const urlCity = params.get("city") || params.get("citySlug");
      const storedCity = localStorage.getItem("selected_city") || localStorage.getItem("mtbs_city");
      const targetSlug = (urlCity || storedCity || "hyderabad").toLowerCase();

      const found = CITIES.find(
        (c) => c.slug.toLowerCase() === targetSlug || c.name.toLowerCase() === targetSlug
      ) || DEFAULT_CITY;

      setSelectedCityState(found);
      localStorage.setItem("selected_city", found.slug);
      localStorage.setItem("mtbs_city", found.slug);
    } catch (e) {
      console.warn("CityContext init error:", e);
    }
  }, []);

  const setCity = useCallback((city: MockCity | string) => {
    let target: MockCity | undefined;
    if (typeof city === "string") {
      const lower = city.toLowerCase();
      target = CITIES.find((c) => c.slug.toLowerCase() === lower || c.name.toLowerCase() === lower);
    } else {
      target = city;
    }

    const nextCity = target || DEFAULT_CITY;
    setSelectedCityState(nextCity);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("selected_city", nextCity.slug);
        localStorage.setItem("mtbs_city", nextCity.slug);
      } catch (e) {
        console.warn("Error saving city to localStorage:", e);
      }
    }
  }, []);

  const setSelectedCity = useCallback((city: MockCity) => {
    setCity(city);
  }, [setCity]);

  return (
    <CityContext.Provider value={{ selectedCity, setCity, setSelectedCity, cities: CITIES }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const context = useContext(CityContext);
  if (!context) {
    return {
      selectedCity: DEFAULT_CITY,
      setCity: () => {},
      setSelectedCity: () => {},
      cities: CITIES,
    };
  }
  return context;
}
