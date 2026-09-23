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
    id: "m-1",
    title: "Baahubali: The Beginning",
    poster_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Fantasy", "Period Drama"],
    duration_min: 159,
    release_date: "2015-07-10",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Hindi", "Malayalam"],
    formats: ["IMAX", "2D"],
    rating: 9.0,
    votes: "820K",
    synopsis: "In ancient Mahishmati kingdom, an adventurous young man Shivudu learns of his royal heritage and the valiant legacy of his father, Amarendra Baahubali, embarking on an epic quest against tyranny.",
  },
  {
    id: "m-2",
    title: "Baahubali 2: The Conclusion",
    poster_url: "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Fantasy", "Period Drama"],
    duration_min: 167,
    release_date: "2017-04-28",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Hindi", "Malayalam"],
    formats: ["IMAX 3D", "4DX", "2D"],
    rating: 9.3,
    votes: "950K",
    synopsis: "The conclusion answers the defining riddle of Indian cinema—why Kattappa killed Baahubali—as Mahendra Baahubali gathers an army to defeat Bhallaladeva and avenge his parents.",
  },
  {
    id: "m-3",
    title: "K.G.F: Chapter 1",
    poster_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Period Drama", "Crime"],
    duration_min: 156,
    release_date: "2018-12-21",
    censor_rating: "U/A",
    languages: ["Kannada", "Hindi", "Telugu", "Tamil", "Malayalam"],
    formats: ["IMAX", "2D"],
    rating: 8.9,
    votes: "710K",
    synopsis: "Rocky, a fierce young mercenary from Bombay, rises through the underworld and infiltrates the notorious, slave-driven Kolar Gold Fields to liberate its laborers and seize power.",
  },
  {
    id: "m-4",
    title: "K.G.F: Chapter 2",
    poster_url: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Period Drama", "Crime"],
    duration_min: 168,
    release_date: "2022-04-14",
    censor_rating: "U/A",
    languages: ["Kannada", "Hindi", "Telugu", "Tamil", "Malayalam"],
    formats: ["IMAX", "4DX", "2D"],
    rating: 9.1,
    votes: "890K",
    synopsis: "Now the supreme king of Narachi, Rocky must defend his gold empire from the relentless Adheera, scheming rivals, and the wrath of the Prime Minister of India.",
  },
  {
    id: "m-5",
    title: "RRR",
    poster_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Drama", "Historical Fiction"],
    duration_min: 187,
    release_date: "2022-03-25",
    censor_rating: "U/A",
    languages: ["Telugu", "Hindi", "Tamil", "Kannada", "Malayalam"],
    formats: ["IMAX 3D", "4DX", "3D", "2D"],
    rating: 9.2,
    votes: "940K",
    synopsis: "Two legendary Indian revolutionaries, Alluri Sitarama Raju and Komaram Bheem, forge a profound brotherhood before going to war against British colonial oppression in 1920s Delhi.",
  },
  {
    id: "m-6",
    title: "Kantara",
    poster_url: "https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Mythology", "Thriller"],
    duration_min: 148,
    release_date: "2022-09-30",
    censor_rating: "U/A",
    languages: ["Kannada", "Hindi", "Telugu", "Tamil", "Malayalam"],
    formats: ["2D", "Dolby Atmos"],
    rating: 9.0,
    votes: "680K",
    synopsis: "Set in coastal Karnataka, a fierce Kambala champion clashes with forest officers and an exploitative landlord, invoking the divine wrath of the guardian deity Panjurli Daiva.",
  },
  {
    id: "m-7",
    title: "Pushpa: The Rise",
    poster_url: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Crime", "Drama"],
    duration_min: 179,
    release_date: "2021-12-17",
    censor_rating: "U/A",
    languages: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
    formats: ["2D", "4DX"],
    rating: 8.7,
    votes: "750K",
    synopsis: "Pushpa Raj, a fearless coolie in the Seshachalam forests, rises with sheer bravado and wit to command the lucrative red sandalwood smuggling syndicate against ruthless cops and mobsters.",
  },
  {
    id: "m-8",
    title: "Pushpa 2: The Rule",
    poster_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Crime", "Drama"],
    duration_min: 185,
    release_date: "2024-12-05",
    censor_rating: "U/A",
    languages: ["Telugu", "Hindi", "Tamil", "Kannada", "Malayalam"],
    formats: ["IMAX", "4DX", "2D"],
    rating: 9.4,
    votes: "880K",
    synopsis: "Pushpa Raj expands his red sandalwood empire worldwide while locked in an all-out blood war against vengeful IPS officer Bhanwar Singh Shekhawat.",
    isComingSoon: false,
  },
  {
    id: "m-9",
    title: "Jawan",
    poster_url: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Thriller"],
    duration_min: 169,
    release_date: "2023-09-07",
    censor_rating: "U/A",
    languages: ["Hindi", "Tamil", "Telugu"],
    formats: ["IMAX", "4DX", "2D"],
    rating: 8.8,
    votes: "810K",
    synopsis: "A high-octane action thriller detailing the emotional journey of a prison warden and ex-commando who, supported by an army of resilient women, stages daring heists to correct societal injustices.",
  },
  {
    id: "m-10",
    title: "Kalki 2898 AD",
    poster_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    genre: ["Sci-Fi", "Action", "Mythology"],
    duration_min: 180,
    release_date: "2024-06-27",
    censor_rating: "U/A",
    languages: ["Telugu", "Hindi", "Tamil", "Kannada", "English"],
    formats: ["IMAX 3D", "4DX", "3D", "2D"],
    rating: 8.9,
    votes: "720K",
    synopsis: "In dystopian Kasi in 2898 AD, Supreme Yaskin rules the last refuge on Earth. Bounty hunter Bhairava and the immortal Ashwatthama collide around SUM-80, the prophesied mother of Lord Kalki.",
  },
  {
    id: "m-11",
    title: "Salaar: Part 1 - Ceasefire",
    poster_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Thriller", "Crime"],
    duration_min: 175,
    release_date: "2023-12-22",
    censor_rating: "A",
    languages: ["Telugu", "Hindi", "Tamil", "Kannada", "Malayalam"],
    formats: ["IMAX", "2D"],
    rating: 8.6,
    votes: "620K",
    synopsis: "In the ruthless, walled city-state of Khansaar, childhood friend Deva re-enters the fray to help prince Varadha Rajamannar claim the throne amidst betrayal and warring tribes.",
  },
  {
    id: "m-12",
    title: "Leo",
    poster_url: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Thriller", "Crime"],
    duration_min: 164,
    release_date: "2023-10-19",
    censor_rating: "U/A",
    languages: ["Tamil", "Telugu", "Hindi", "Kannada"],
    formats: ["IMAX", "4DX", "2D"],
    rating: 8.5,
    votes: "590K",
    synopsis: "A calm cafe owner in Himachal Pradesh named Parthi is thrust into a violent frenzy when notorious cartel bosses Antony and Harold Das claim he is their estranged hitman son, Leo Das.",
  },
  {
    id: "m-13",
    title: "2.0",
    poster_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80",
    backdrop_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    genre: ["Sci-Fi", "Action", "Thriller"],
    duration_min: 147,
    release_date: "2018-11-29",
    censor_rating: "U/A",
    languages: ["Tamil", "Hindi", "Telugu"],
    formats: ["IMAX 3D", "3D", "2D"],
    rating: 8.2,
    votes: "430K",
    synopsis: "When mobile phones across Chennai start flying into the sky and merging into a lethal avian beast controlled by Pakshi Rajan, scientist Vaseegaran must revive his banned android creation, Chitti.",
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
