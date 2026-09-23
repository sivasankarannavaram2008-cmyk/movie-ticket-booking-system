import { MOCK_MOVIES, CITIES, getDefaultCinemaForCity } from "@/lib/mock-data";

export interface StoredShow {
  id: string;
  screenId: string;
  screenName: string;
  screenTier: "IMAX" | "4DX" | "Standard";
  cinemaId: string;
  cinemaName: string;
  cinemaAddress: string;
  citySlug: string;
  cityName: string;
  movieId: string;
  movieTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  formatBadge: string;
  classicPrice: number;
  primePrice: number;
  reclinerPrice: number;
  createdAt: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __globalShowsStore: StoredShow[] | undefined;
}

// Generate rich initial shows for the Pan-India movies
function getInitialShows(): StoredShow[] {
  const shows: StoredShow[] = [];
  const today = new Date();
  const dates = [0, 1, 2, 3].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return d.toISOString().split("T")[0];
  });

  const slots = [
    { start: "10:00 AM", end: "01:00 PM" },
    { start: "01:45 PM", end: "04:45 PM" },
    { start: "05:30 PM", end: "08:30 PM" },
    { start: "09:15 PM", end: "12:15 AM" },
  ];

  const cityMultiplexes = [
    {
      citySlug: "mumbai",
      cityName: "Mumbai",
      cinemaId: "c-1",
      cinemaName: "PVR INOX Palladium",
      cinemaAddress: "High Street Phoenix, Lower Parel",
      screens: [
        { id: "screen-mum-1", name: "Audi 1 - Laser IMAX", tier: "IMAX" as const, format: "IMAX 3D Laser", cPrice: 280, pPrice: 420, rPrice: 700 },
        { id: "screen-mum-2", name: "Audi 2 - 4DX Dynamic", tier: "4DX" as const, format: "4DX Immersive", cPrice: 260, pPrice: 380, rPrice: 650 },
        { id: "screen-mum-3", name: "Audi 3 - Dolby Atmos Premiere", tier: "Standard" as const, format: "Dolby Atmos 7.1", cPrice: 200, pPrice: 300, rPrice: 500 },
      ],
    },
    {
      citySlug: "delhi-ncr",
      cityName: "Delhi-NCR",
      cinemaId: "c-5",
      cinemaName: "PVR Director's Cut",
      cinemaAddress: "Ambience Mall, Vasant Kunj",
      screens: [
        { id: "screen-del-1", name: "DC 1 - Grand IMAX", tier: "IMAX" as const, format: "IMAX Laser", cPrice: 300, pPrice: 450, rPrice: 750 },
        { id: "screen-del-2", name: "DC 2 - 4DX Thrill Theater", tier: "4DX" as const, format: "4DX Motion", cPrice: 280, pPrice: 400, rPrice: 700 },
      ],
    },
    {
      citySlug: "bengaluru",
      cityName: "Bengaluru",
      cinemaId: "c-8",
      cinemaName: "PVR Superplex Vega City",
      cinemaAddress: "Bannerghatta Main Road, Dollars Colony",
      screens: [
        { id: "screen-blr-1", name: "Audi 1 - Laser IMAX", tier: "IMAX" as const, format: "IMAX 3D", cPrice: 260, pPrice: 390, rPrice: 650 },
        { id: "screen-blr-2", name: "Audi 2 - 4DX Dynamic Experience", tier: "4DX" as const, format: "4DX", cPrice: 250, pPrice: 360, rPrice: 600 },
      ],
    },
    {
      citySlug: "hyderabad",
      cityName: "Hyderabad",
      cinemaId: "c-11",
      cinemaName: "Prasads Multiplex",
      cinemaAddress: "Prasads IMAX Road, Necklace Road",
      screens: [
        { id: "screen-hyd-1", name: "Screen 6 - Giant Format IMAX", tier: "IMAX" as const, format: "Giant IMAX Laser", cPrice: 250, pPrice: 350, rPrice: 600 },
        { id: "screen-hyd-2", name: "Screen 1 - 4DX Thrill Arena", tier: "4DX" as const, format: "4DX Extreme", cPrice: 240, pPrice: 340, rPrice: 580 },
      ],
    },
    {
      citySlug: "hyderabad",
      cityName: "Hyderabad",
      cinemaId: "c-12",
      cinemaName: "AMB Cinemas",
      cinemaAddress: "Sarath City Capital Mall, Gachibowli",
      screens: [
        { id: "screen-hyd-3", name: "Screen 1 - Laser Superplex", tier: "IMAX" as const, format: "Laser IMAX", cPrice: 260, pPrice: 360, rPrice: 620 },
        { id: "screen-hyd-4", name: "Screen 2 - VIP Atmos", tier: "Standard" as const, format: "Dolby Atmos", cPrice: 240, pPrice: 330, rPrice: 550 },
      ],
    },
  ];

  let showIdCounter = 100;

  // Schedule showings for the top movies
  for (const date of dates) {
    for (const mux of cityMultiplexes) {
      for (const sc of mux.screens) {
        slots.forEach((slot, sIdx) => {
          const movie = MOCK_MOVIES[(sIdx + showIdCounter) % MOCK_MOVIES.length];
          showIdCounter++;
          shows.push({
            id: `show-${mux.cinemaId}-${sc.id}-${date}-${sIdx + 1}`,
            screenId: sc.id,
            screenName: sc.name,
            screenTier: sc.tier,
            cinemaId: mux.cinemaId,
            cinemaName: mux.cinemaName,
            cinemaAddress: mux.cinemaAddress,
            citySlug: mux.citySlug,
            cityName: mux.cityName,
            movieId: movie.id,
            movieTitle: movie.title,
            date,
            startTime: slot.start,
            endTime: slot.end,
            formatBadge: sc.format,
            classicPrice: sc.cPrice,
            primePrice: sc.pPrice,
            reclinerPrice: sc.rPrice,
            createdAt: new Date(Date.now() - 3600000 * (showIdCounter % 24)).toISOString(),
          });
        });
      }
    }
  }

  return shows;
}

export function getShowsStore(): StoredShow[] {
  if (!global.__globalShowsStore) {
    global.__globalShowsStore = getInitialShows();
  }
  return global.__globalShowsStore;
}

export function addShowToStore(show: StoredShow): StoredShow {
  const store = getShowsStore();
  store.unshift(show);
  return show;
}

export function getShowById(showId: string): StoredShow | undefined {
  const store = getShowsStore();
  const direct = store.find((s) => s.id === showId);
  if (direct) return direct;

  // Synthesize for dynamic mock cinema showtimes (e.g., c-11-s1-2026-09-14)
  if (showId && showId.includes("-s")) {
    const parts = showId.split("-");
    const cinemaId = `${parts[0]}-${parts[1]}`;
    const cinemaInfo = getDefaultCinemaForCity(undefined, showId);
    return {
      id: showId,
      screenId: `screen-${cinemaId}-1`,
      screenName: cinemaInfo.screenName,
      screenTier: cinemaInfo.screenTier.includes("IMAX") ? "IMAX" : "Standard",
      cinemaId: cinemaInfo.cinemaId,
      cinemaName: cinemaInfo.cinemaName,
      cinemaAddress: cinemaInfo.cinemaAddress,
      citySlug: cinemaInfo.citySlug,
      cityName: cinemaInfo.cityName,
      movieId: "m-1",
      movieTitle: "Feature Film",
      date: new Date().toISOString().split("T")[0],
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      formatBadge: cinemaInfo.screenTier,
      classicPrice: 240,
      primePrice: 350,
      reclinerPrice: 580,
      createdAt: new Date().toISOString(),
    };
  }

  return undefined;
}

export function getShowsByMovieAndCity(movieId?: string, citySlug?: string, date?: string): StoredShow[] {
  const store = getShowsStore();
  return store.filter((s) => {
    if (movieId && s.movieId !== movieId) return false;
    if (citySlug && s.citySlug !== citySlug) return false;
    if (date && s.date !== date) return false;
    return true;
  });
}

/**
 * Parses any time format ("HH:mm", "HH:mm:ss", "hh:mm AM/PM") into minutes from midnight.
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const trimmed = timeStr.trim();

  // Match 12-hour format e.g. "07:30 PM", "10:15 am"
  const twelveHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (twelveHourMatch) {
    let hours = parseInt(twelveHourMatch[1], 10);
    const mins = parseInt(twelveHourMatch[2], 10);
    const meridian = twelveHourMatch[3].toUpperCase();
    if (meridian === "PM" && hours < 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;
    return hours * 60 + mins;
  }

  // Match 24-hour format e.g. "18:30", "18:30:00"
  const twentyFourHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (twentyFourHourMatch) {
    const hours = parseInt(twentyFourHourMatch[1], 10);
    const mins = parseInt(twentyFourHourMatch[2], 10);
    return hours * 60 + mins;
  }

  return 0;
}

/**
 * Formats minutes from midnight into 12-hour string (e.g. 1110 -> "06:30 PM").
 */
export function formatMinutesTo12Hour(minutes: number): string {
  const normalizedMins = ((minutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hours24 = Math.floor(normalizedMins / 60);
  const mins = normalizedMins % 60;
  const meridian = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${meridian}`;
}

/**
 * Formats minutes from midnight into 24-hour string (e.g. 1110 -> "18:30").
 */
export function formatMinutesTo24Hour(minutes: number): string {
  const normalizedMins = ((minutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hours24 = Math.floor(normalizedMins / 60);
  const mins = normalizedMins % 60;
  return `${String(hours24).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Delete a show from in-memory store.
 */
export function deleteShowFromStore(showId: string): boolean {
  const store = getShowsStore();
  const index = store.findIndex((s) => s.id === showId);
  if (index !== -1) {
    store.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Conflict check: Returns existing colliding show if any on the given screen and date.
 * Overlap condition: (existingStart < newEnd) AND (existingEnd > newStart).
 */
export function findShowConflictInStore(
  screenId: string,
  date: string,
  startMinutes: number,
  endMinutes: number,
  excludeShowId?: string
): StoredShow | null {
  const store = getShowsStore();
  for (const show of store) {
    if (show.screenId !== screenId) continue;
    if (show.date !== date) continue;
    if (excludeShowId && show.id === excludeShowId) continue;

    const existingStart = parseTimeToMinutes(show.startTime);
    let existingEnd = parseTimeToMinutes(show.endTime);
    // Handle overnight shows
    if (existingEnd <= existingStart) {
      existingEnd += 24 * 60;
    }

    let checkEnd = endMinutes;
    if (checkEnd <= startMinutes) {
      checkEnd += 24 * 60;
    }

    if (existingStart < checkEnd && existingEnd > startMinutes) {
      return show;
    }
  }
  return null;
}
