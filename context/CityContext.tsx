"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { CITIES, MockCity } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

export const DEFAULT_CITY: MockCity =
  CITIES.find((c) => c.slug.toLowerCase() === "vellore" || c.name.toLowerCase() === "vellore") || {
    id: "city-9",
    name: "Vellore",
    state: "Tamil Nadu",
    slug: "vellore",
  };

interface CityContextType {
  selectedCity: MockCity;
  setCity: (city: MockCity | string) => void;
  setSelectedCity: (city: MockCity) => void;
  cities: MockCity[];
  isLoadingCities: boolean;
}

const CityContext = createContext<CityContextType>({
  selectedCity: DEFAULT_CITY,
  setCity: () => {},
  setSelectedCity: () => {},
  cities: CITIES,
  isLoadingCities: false,
});

export function CityProvider({ children }: { children: ReactNode }) {
  const [selectedCity, setSelectedCityState] = useState<MockCity>(DEFAULT_CITY);
  const [citiesList, setCitiesList] = useState<MockCity[]>(CITIES);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Fetch live cities from Supabase on mount
  useEffect(() => {
    async function loadDbCities() {
      setIsLoadingCities(true);
      try {
        const { data, error } = await supabase
          .from("cities")
          .select("id, name, state, slug")
          .order("name", { ascending: true });

        if (!error && data && data.length > 0) {
          setCitiesList(data);
        }
      } catch (err) {
        console.warn("Using fallback cities list:", err);
      } finally {
        setIsLoadingCities(false);
      }
    }

    loadDbCities();
  }, []);

  // Initialize from URL search param or localStorage (defaulting to Vellore)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const params = new URLSearchParams(window.location.search);
      const urlCity = params.get("city") || params.get("citySlug");
      const storedCity = localStorage.getItem("selected_city") || localStorage.getItem("mtbs_city");
      const targetSlug = (urlCity || storedCity || "vellore").toLowerCase();

      const found = citiesList.find(
        (c) => c.slug.toLowerCase() === targetSlug || c.name.toLowerCase() === targetSlug
      ) || DEFAULT_CITY;

      setSelectedCityState(found);
      localStorage.setItem("selected_city", found.slug);
      localStorage.setItem("mtbs_city", found.slug);
    } catch (e) {
      console.warn("CityContext init error:", e);
    }
  }, [citiesList]);

  const setCity = useCallback((city: MockCity | string) => {
    let target: MockCity | undefined;
    if (typeof city === "string") {
      const lower = city.toLowerCase();
      target = citiesList.find((c) => c.slug.toLowerCase() === lower || c.name.toLowerCase() === lower);
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
  }, [citiesList]);

  const setSelectedCity = useCallback((city: MockCity) => {
    setCity(city);
  }, [setCity]);

  return (
    <CityContext.Provider
      value={{
        selectedCity,
        setCity,
        setSelectedCity,
        cities: citiesList,
        isLoadingCities,
      }}
    >
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
