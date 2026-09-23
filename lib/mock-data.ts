import { Movie, ScreenTier } from "@/types/database";

export interface MockCity {
  id: string;
  name: string;
  state: string;
  slug: string;
}

export const CITIES: MockCity[] = [
  { id: "city-1", name: "Mumbai", state: "Maharashtra", slug: "mumbai" },
  { id: "city-2", name: "Delhi-NCR", state: "National Capital Region", slug: "delhi-ncr" },
  { id: "city-3", name: "Bengaluru", state: "Karnataka", slug: "bengaluru" },
  { id: "city-4", name: "Hyderabad", state: "Telangana", slug: "hyderabad" },
  { id: "city-5", name: "Chennai", state: "Tamil Nadu", slug: "chennai" },
  { id: "city-6", name: "Kolkata", state: "West Bengal", slug: "kolkata" },
  { id: "city-7", name: "Pune", state: "Maharashtra", slug: "pune" },
  { id: "city-8", name: "Ahmedabad", state: "Gujarat", slug: "ahmedabad" },
  { id: "city-9", name: "Vellore", state: "Tamil Nadu", slug: "vellore" },
];

export interface RichMovie {
  id: string;
  title: string;
  poster_url: string;
  backdrop_url: string;
  genre: string[];
  duration_min: number;
  release_date: string;
  censor_rating: string;
  languages: string[];
  formats: string[];
  rating: number;
  votes: string;
  synopsis: string;
  isComingSoon?: boolean;
}

export const MOCK_MOVIES: RichMovie[] = [
  {
    id: "m-paradise",
    title: "The Paradise",
    poster_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Drama", "Thriller"],
    duration_min: 162,
    release_date: "2026-03-27",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Hindi", "Malayalam", "Kannada"],
    formats: ["IMAX", "2D", "Dolby Atmos"],
    rating: 9.3,
    votes: "450K",
    synopsis: "Starring Natural Star Nani. An intense cinematic saga exploring power dynamics, raw emotion, and high-octane redemption in an unforgiving urban sprawl.",
    isComingSoon: true,
  },
  {
    id: "m-rajasaab",
    title: "The RajaSaab",
    poster_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1200&q=80",
    genre: ["Horror", "Comedy", "Romance"],
    duration_min: 168,
    release_date: "2026-04-10",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Hindi", "Malayalam", "Kannada"],
    formats: ["IMAX", "4DX", "2D"],
    rating: 9.1,
    votes: "780K",
    synopsis: "Starring Rebel Star Prabhas. A grand romantic horror-comedy directed by Maruthi, set against the mystical backdrop of an ancestral royal estate.",
    isComingSoon: true,
  },
  {
    id: "m-vishwambhara",
    title: "Vishwambhara",
    poster_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80",
    genre: ["Fantasy", "Action"],
    duration_min: 175,
    release_date: "2026-01-10",
    censor_rating: "U/A",
    languages: ["Telugu", "Hindi", "Tamil", "Kannada", "Malayalam"],
    formats: ["IMAX 3D", "3D", "2D"],
    rating: 9.4,
    votes: "920K",
    synopsis: "Starring Megastar Chiranjeevi. A monumental socio-fantasy epic traversing mystical celestial realms and defending the mortal world from cosmic annihilation.",
    isComingSoon: true,
  },
  {
    id: "m-ustaad",
    title: "Ustaad Bhagat Singh",
    poster_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Drama"],
    duration_min: 165,
    release_date: "2026-05-01",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Hindi"],
    formats: ["IMAX", "2D", "Dolby Atmos"],
    rating: 9.0,
    votes: "690K",
    synopsis: "Starring Power Star Pawan Kalyan. An explosive mass cop drama directed by Harish Shankar, celebrating fearless justice and uncompromising valor.",
    isComingSoon: true,
  },
  {
    id: "m-g2",
    title: "Goodachari 2 (G2)",
    poster_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Thriller"],
    duration_min: 158,
    release_date: "2026-07-17",
    censor_rating: "U/A",
    languages: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
    formats: ["IMAX", "4DX", "2D"],
    rating: 8.9,
    votes: "540K",
    synopsis: "Starring Adivi Sesh. Agent 116 returns in a globetrotting espionage thriller navigating secret syndicates, biometric betrayal, and national defense.",
    isComingSoon: true,
  },
  {
    id: "m-maainti",
    title: "Maa Inti Bangaaram",
    poster_url: "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Drama"],
    duration_min: 145,
    release_date: "2026-06-05",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Malayalam", "Kannada"],
    formats: ["2D", "Dolby Atmos"],
    rating: 8.8,
    votes: "410K",
    synopsis: "Starring Samantha Ruth Prabhu. A gripping, emotionally charged family action saga spotlighting maternal bravery and ferocious protective instincts.",
    isComingSoon: true,
  },
  {
    id: "m-peddi",
    title: "Peddi",
    poster_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Drama"],
    duration_min: 155,
    release_date: "2026-08-14",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Kannada"],
    formats: ["2D", "Dolby Atmos"],
    rating: 8.7,
    votes: "360K",
    synopsis: "A gritty, grounded rustic action chronicle set in the Godavari heartland, where one man stands as the unyielding fortress for his village against feudal oppressors.",
    isComingSoon: true,
  },
  {
    id: "m-chennailove",
    title: "Chennai Love Story",
    poster_url: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
    genre: ["Romance", "Drama"],
    duration_min: 140,
    release_date: "2026-02-14",
    censor_rating: "U",
    languages: ["Telugu", "Tamil"],
    formats: ["2D"],
    rating: 8.6,
    votes: "290K",
    synopsis: "A lyrical, heartfelt contemporary love story bridging Hyderabad and Chennai, celebrating serendipity, music, and the beauty of cross-cultural relationships.",
    isComingSoon: false,
  },
  {
    id: "m-og",
    title: "They Call Him OG",
    poster_url: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Crime"],
    duration_min: 170,
    release_date: "2025-09-27",
    censor_rating: "A",
    languages: ["Telugu", "Tamil", "Hindi", "Kannada", "Malayalam"],
    formats: ["IMAX", "4DX", "2D"],
    rating: 9.5,
    votes: "980K",
    synopsis: "Starring Pawan Kalyan & Emraan Hashmi. Directed by Sujeeth. The feared mob boss Ojas Gambheera returns to Mumbai after a decade of exile to settle old blood scores.",
    isComingSoon: false,
  },
  {
    id: "m-mirai",
    title: "Mirai",
    poster_url: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Fantasy"],
    duration_min: 152,
    release_date: "2025-08-01",
    censor_rating: "U/A",
    languages: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada", "Bengali"],
    formats: ["IMAX 3D", "3D", "2D"],
    rating: 8.9,
    votes: "520K",
    synopsis: "Starring Teja Sajja. A mythical martial arts adventure following a chosen warrior tasked with shielding King Ashoka's secret divine scrolls from malevolent forces.",
    isComingSoon: false,
  },
  {
    id: "m-hhvm",
    title: "Hari Hara Veera Mallu",
    poster_url: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    genre: ["Period", "Action"],
    duration_min: 178,
    release_date: "2025-10-31",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Hindi", "Malayalam", "Kannada"],
    formats: ["IMAX", "2D", "Dolby Atmos"],
    rating: 9.0,
    votes: "670K",
    synopsis: "Starring Pawan Kalyan & Bobby Deol. A sprawling 17th-century period epic chronicling the legendary Robin Hood-esque rebel defending the downtrodden against Mughal tyranny.",
    isComingSoon: false,
  },
  {
    id: "m-hit3",
    title: "HIT: The Third Case",
    poster_url: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    genre: ["Crime", "Mystery"],
    duration_min: 155,
    release_date: "2025-05-01",
    censor_rating: "A",
    languages: ["Telugu", "Tamil", "Hindi", "Malayalam", "Kannada"],
    formats: ["2D", "Dolby Atmos"],
    rating: 8.8,
    votes: "490K",
    synopsis: "Starring Natural Star Nani as ruthless SP Arjun Sarkar. A pulse-pounding forensic mystery hunting down an elusive serial syndicate across state borders.",
    isComingSoon: false,
  },
  {
    id: "m-madsquare",
    title: "Mad Square",
    poster_url: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    genre: ["Comedy", "Youth"],
    duration_min: 138,
    release_date: "2025-06-20",
    censor_rating: "U/A",
    languages: ["Telugu"],
    formats: ["2D"],
    rating: 8.5,
    votes: "380K",
    synopsis: "The irreverent, riotous college gang returns with double the chaos, unfiltered comedic brawls, and hilarious romance in the highly anticipated comedy sequel.",
    isComingSoon: false,
  },
  {
    id: "m-court",
    title: "Court: State vs A Nobody",
    poster_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
    genre: ["Legal", "Drama"],
    duration_min: 142,
    release_date: "2025-07-11",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Hindi"],
    formats: ["2D"],
    rating: 8.7,
    votes: "320K",
    synopsis: "A gripping procedural courtroom drama pitting an earnest young public defender against institutional corruption to exonerate an innocent, forgotten citizen.",
    isComingSoon: false,
  },
  {
    id: "m-kuberaa",
    title: "Kuberaa",
    poster_url: "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80",
    genre: ["Crime", "Thriller"],
    duration_min: 165,
    release_date: "2025-12-25",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Hindi", "Malayalam", "Kannada"],
    formats: ["IMAX", "2D", "Dolby Atmos"],
    rating: 9.2,
    votes: "710K",
    synopsis: "Starring Dhanush, Akkineni Nagarjuna, and Rashmika Mandanna. Directed by Sekhar Kammula. A high-stakes sociopolitical thriller navigating Mumbai's shadowy financial underworld.",
    isComingSoon: false,
  },
];

export interface CinemaShowGroup {
  cinemaId: string;
  cinemaName: string;
  address: string;
  distance?: string;
  shows: {
    showId: string;
    screenName: string;
    screenTier: ScreenTier;
    formatBadge: string;
    time: string;
    date: string;
    price: number;
    urgency: "available" | "filling_fast";
  }[];
}

export function getMockCinemaShowtimes(citySlug: string, date: string): CinemaShowGroup[] {
  const cityCinemas: Record<string, { id: string; name: string; address: string }[]> = {
    mumbai: [
      { id: "c-1", name: "PVR INOX Palladium", address: "High Street Phoenix, Lower Parel" },
      { id: "c-2", name: "Cinépolis Grand Mall", address: "Veera Desai Road, Andheri West" },
      { id: "c-3", name: "INOX Megaplex Inorbit", address: "Inorbit Mall, Malad West" },
      { id: "c-4", name: "PVR Maison BKC", address: "Jio World Drive, BKC" },
    ],
    "delhi-ncr": [
      { id: "c-5", name: "PVR Director's Cut", address: "Ambience Mall, Vasant Kunj" },
      { id: "c-6", name: "INOX Megamall", address: "Golf Course Road, Gurugram" },
      { id: "c-7", name: "PVR Superplex", address: "Mall of India, Sector 18, Noida" },
    ],
    bengaluru: [
      { id: "c-8", name: "PVR Superplex Vega City", address: "Bannerghatta Main Road" },
      { id: "c-9", name: "INOX Forum South", address: "Kanakapura Road, Konanakunte" },
      { id: "c-10", name: "Cinépolis Orion Mall", address: "Dr. Rajkumar Road, Rajajinagar" },
    ],
    hyderabad: [
      { id: "c-11", name: "Prasads Multiplex", address: "NTR Gardens, Necklace Road" },
      { id: "c-12", name: "AMB Cinemas", address: "Sarath City Capital Mall, Gachibowli" },
    ],
    chennai: [
      { id: "c-13", name: "Sathyam Cinemas SPI", address: "Thiru Vi Ka Road, Royapettah" },
      { id: "c-14", name: "PVR Grand Galada", address: "GST Road, Pallavaram" },
    ],
    kolkata: [
      { id: "c-15", name: "INOX Quest Mall", address: "Syed Amir Ali Avenue, Park Circus" },
      { id: "c-16", name: "Cinépolis Acropolis", address: "Rajdanga Main Road, Kasba" },
    ],
    pune: [
      { id: "c-17", name: "PVR Phoenix Marketcity", address: "Viman Nagar, Pune" },
      { id: "c-18", name: "Cinépolis Seasons Mall", address: "Magarpatta City, Hadapsar" },
    ],
    ahmedabad: [
      { id: "c-19", name: "PVR Acropolis", address: "SG Highway, Thaltej" },
      { id: "c-20", name: "Cinépolis Nexus One", address: "Vastrapur, Ahmedabad" },
    ],
    vellore: [
      { id: "c-21", name: "PVR Velocity Silk Mill", address: "Officer's Line, Toll Gate, Vellore" },
      { id: "c-22", name: "INOX Brookfield Katpadi", address: "Katpadi Main Road, Suthanthira Ponvizha Nagar, Vellore" },
    ],
  };

  const normSlug = (citySlug || "hyderabad").toLowerCase();
  const list = cityCinemas[normSlug] || cityCinemas["hyderabad"] || cityCinemas["mumbai"];

  return list.map((cinema, cIdx) => ({
    cinemaId: cinema.id,
    cinemaName: cinema.name,
    address: cinema.address,
    distance: `${(1.2 + cIdx * 1.8).toFixed(1)} km away`,
    shows: [
      {
        showId: `${cinema.id}-s1-${date}`,
        screenName: "Audi 1",
        screenTier: "IMAX" as ScreenTier,
        formatBadge: "IMAX 3D Laser",
        time: "10:00 AM",
        date,
        price: 450,
        urgency: "available",
      },
      {
        showId: `${cinema.id}-s2-${date}`,
        screenName: "Audi 2",
        screenTier: "4DX" as ScreenTier,
        formatBadge: "4DX Immersive",
        time: "01:30 PM",
        date,
        price: 380,
        urgency: "filling_fast",
      },
      {
        showId: `${cinema.id}-s3-${date}`,
        screenName: "Audi 3",
        screenTier: "Standard" as ScreenTier,
        formatBadge: "Dolby Atmos 7.1",
        time: "05:15 PM",
        date,
        price: 260,
        urgency: "filling_fast",
      },
      {
        showId: `${cinema.id}-s4-${date}`,
        screenName: "Audi 1",
        screenTier: "IMAX" as ScreenTier,
        formatBadge: "IMAX 3D Laser",
        time: "09:00 PM",
        date,
        price: 480,
        urgency: "available",
      },
      {
        showId: `${cinema.id}-s5-${date}`,
        screenName: "Audi 3",
        screenTier: "Standard" as ScreenTier,
        formatBadge: "Dolby Atmos",
        time: "11:30 PM",
        date,
        price: 220,
        urgency: "available",
      },
    ],
  }));
}

export function getDefaultCinemaForCity(citySlug?: string, showId?: string) {
  const normCity = (citySlug || "hyderabad").toLowerCase();

  if (showId) {
    const s = showId.toLowerCase();
    if (s.includes("c-11") || s.includes("hyd-1") || s.includes("hyd-2")) {
      return {
        cinemaId: "c-11",
        cinemaName: "Prasads Multiplex",
        cinemaAddress: "NTR Gardens, Necklace Road",
        screenName: "Screen 6 - Giant Format IMAX",
        screenTier: "IMAX 3D Laser",
        citySlug: "hyderabad",
        cityName: "Hyderabad",
      };
    }
    if (s.includes("c-12") || s.includes("hyd-3") || s.includes("hyd-4")) {
      return {
        cinemaId: "c-12",
        cinemaName: "AMB Cinemas",
        cinemaAddress: "Sarath City Capital Mall, Gachibowli",
        screenName: "Screen 1 - Laser",
        screenTier: "Dolby Atmos",
        citySlug: "hyderabad",
        cityName: "Hyderabad",
      };
    }
    if (s.includes("c-1") || s.includes("mum")) {
      return {
        cinemaId: "c-1",
        cinemaName: "PVR INOX Palladium",
        cinemaAddress: "High Street Phoenix, Lower Parel",
        screenName: "Audi 1",
        screenTier: "IMAX 3D Laser",
        citySlug: "mumbai",
        cityName: "Mumbai",
      };
    }
  }

  if (normCity === "hyderabad") {
    return {
      cinemaId: "c-11",
      cinemaName: "Prasads Multiplex",
      cinemaAddress: "NTR Gardens, Necklace Road",
      screenName: "Screen 6 - Giant Format IMAX",
      screenTier: "IMAX 3D Laser",
      citySlug: "hyderabad",
      cityName: "Hyderabad",
    };
  }

  if (normCity === "delhi-ncr") {
    return {
      cinemaId: "c-5",
      cinemaName: "PVR Director's Cut",
      cinemaAddress: "Ambience Mall, Vasant Kunj",
      screenName: "Audi 1",
      screenTier: "IMAX Laser",
      citySlug: "delhi-ncr",
      cityName: "Delhi-NCR",
    };
  }

  if (normCity === "bengaluru") {
    return {
      cinemaId: "c-8",
      cinemaName: "PVR Superplex Vega City",
      cinemaAddress: "Bannerghatta Main Road",
      screenName: "Audi 1",
      screenTier: "IMAX 3D",
      citySlug: "bengaluru",
      cityName: "Bengaluru",
    };
  }

  if (normCity === "chennai") {
    return {
      cinemaId: "c-13",
      cinemaName: "Sathyam Cinemas SPI",
      cinemaAddress: "Thiru Vi Ka Road, Royapettah",
      screenName: "Audi 1",
      screenTier: "Dolby Atmos",
      citySlug: "chennai",
      cityName: "Chennai",
    };
  }

  if (normCity === "mumbai") {
    return {
      cinemaId: "c-1",
      cinemaName: "PVR INOX Palladium",
      cinemaAddress: "High Street Phoenix, Lower Parel",
      screenName: "Audi 1",
      screenTier: "IMAX 3D Laser",
      citySlug: "mumbai",
      cityName: "Mumbai",
    };
  }

  if (normCity === "vellore") {
    return {
      cinemaId: "c-21",
      cinemaName: "PVR Velocity Silk Mill",
      cinemaAddress: "Officer's Line, Toll Gate, Vellore",
      screenName: "Audi 1 - Laser IMAX",
      screenTier: "IMAX 3D Laser",
      citySlug: "vellore",
      cityName: "Vellore",
    };
  }

  // Fallback default: Hyderabad
  return {
    cinemaId: "c-11",
    cinemaName: "Prasads Multiplex",
    cinemaAddress: "NTR Gardens, Necklace Road",
    screenName: "Screen 6 - Giant Format IMAX",
    screenTier: "IMAX 3D Laser",
    citySlug: "hyderabad",
    cityName: "Hyderabad",
  };
}
