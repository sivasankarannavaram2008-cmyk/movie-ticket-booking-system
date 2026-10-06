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
  // --- Classic & Blockbuster Catalog (12 Titles) ---
  {
    id: "m-baahubali1",
    title: "Baahubali: The Beginning",
    poster_url: "https://image.tmdb.org/t/p/w780/pU1ULUq8D3iRxl1fdX2lZIzdHuI.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/5a7lMDn3nAj2ByO0X1fg6BhUphR.jpg",
    genre: ["Action", "Drama", "Fantasy"],
    duration_min: 159,
    release_date: "2015-07-10",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Hindi", "Malayalam"],
    formats: ["IMAX", "2D", "Dolby Atmos"],
    rating: 9.2,
    votes: "950K",
    synopsis: "Starring Prabhas, Rana Daggubati & Anushka Shetty. Directed by S.S. Rajamouli. An ancient kingdom torn by royal intrigue, heroic destinies, and an extraordinary warrior raised by tribal commoners.",
    isComingSoon: false,
  },
  {
    id: "m-baahubali2",
    title: "Baahubali 2: The Conclusion",
    poster_url: "https://image.tmdb.org/t/p/w780/ltyARDw2EFXZ2H2ERnlEctXPioP.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/a9jZrU7LJk6mAUjmkbEmTiC52l0.jpg",
    genre: ["Action", "Drama", "Fantasy"],
    duration_min: 167,
    release_date: "2017-04-28",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Hindi", "Malayalam"],
    formats: ["IMAX", "4DX", "2D"],
    rating: 9.4,
    votes: "1.2M",
    synopsis: "The crowning chapter answering why Kattappa killed Baahubali. Shiva discovers his royal legacy and rallies Mahishmati to avenge his legendary father.",
    isComingSoon: false,
  },
  {
    id: "m-kalki",
    title: "Kalki 2898 AD",
    poster_url: "https://image.tmdb.org/t/p/w780/3HzGtM0JpfH2pWFGugJK22LRP6b.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/eZ239CUp1d6OryZEBPnO2n87gMG.jpg",
    genre: ["Sci-Fi", "Action", "Fantasy"],
    duration_min: 181,
    release_date: "2024-06-27",
    censor_rating: "U/A",
    languages: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
    formats: ["IMAX 3D", "3D", "2D"],
    rating: 9.3,
    votes: "880K",
    synopsis: "Starring Prabhas, Amitabh Bachchan, Kamal Haasan & Deepika Padukone. A mythological sci-fi spectacle set in dystopian Kashi, 6000 years after the Mahabharata.",
    isComingSoon: false,
  },
  {
    id: "m-rrr",
    title: "RRR",
    poster_url: "https://image.tmdb.org/t/p/w780/tjpiEnZBUAA8pdNPRKa5vP2Zpqw.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/i0Y0wP8H6SRgjr6QmuwbtQbS24D.jpg",
    genre: ["Action", "Drama", "History"],
    duration_min: 182,
    release_date: "2022-03-25",
    censor_rating: "U/A",
    languages: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
    formats: ["IMAX", "3D", "Dolby Atmos"],
    rating: 9.5,
    votes: "1.5M",
    synopsis: "Starring Jr NTR & Ram Charan. Directed by S.S. Rajamouli. Two legendary Indian revolutionaries embark on an epic collision of brotherhood and patriotic fire.",
    isComingSoon: false,
  },
  {
    id: "m-salaar",
    title: "Salaar: Part 1 - Ceasefire",
    poster_url: "https://image.tmdb.org/t/p/w780/gC5HfzG2xUbqSPaXPdqTiE94c79.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/l57Hoy9prfwpewKm7PEYxOiJeMr.jpg",
    genre: ["Action", "Crime", "Drama"],
    duration_min: 175,
    release_date: "2023-12-22",
    censor_rating: "A",
    languages: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
    formats: ["IMAX", "2D", "Dolby Atmos"],
    rating: 9.1,
    votes: "790K",
    synopsis: "Starring Prabhas & Prithviraj Sukumaran. Directed by Prashanth Neel. In the lawless city-state of Khansaar, childhood friends become titans of brutal warfare.",
    isComingSoon: false,
  },
  {
    id: "m-pushpa1",
    title: "Pushpa: The Rise",
    poster_url: "http://www.impawards.com/intl/india/2021/posters/pushpa_the_rise__part_one_xlg.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/5a7lMDn3nAj2ByO0X1fg6BhUphR.jpg",
    genre: ["Action", "Crime", "Drama"],
    duration_min: 179,
    release_date: "2021-12-17",
    censor_rating: "U/A",
    languages: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
    formats: ["2D", "Dolby Atmos"],
    rating: 9.0,
    votes: "910K",
    synopsis: "Starring Icon Star Allu Arjun. Directed by Sukumar. A fiery laborer ascends through the ranks of the red sandalwood smuggling syndicate in Seshachalam forest.",
    isComingSoon: false,
  },
  {
    id: "m-pushpa2",
    title: "Pushpa 2: The Rule",
    poster_url: "http://www.impawards.com/intl/india/2024/posters/pushpa_the_rule__part_two_xlg.jpg",
    backdrop_url: "https://upload.wikimedia.org/wikipedia/en/1/11/Pushpa_2-_The_Rule.jpg",
    genre: ["Action", "Crime", "Drama"],
    duration_min: 200,
    release_date: "2024-12-05",
    censor_rating: "U/A",
    languages: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
    formats: ["IMAX", "4DX", "2D"],
    rating: 9.4,
    votes: "1.1M",
    synopsis: "Pushpa Raj establishes undisputed supremacy over his international empire while waging an unrelenting psychological war against SP Bhanwar Singh Shekhawat.",
    isComingSoon: false,
  },
  {
    id: "m-devara",
    title: "Devara: Part 1",
    poster_url: "https://image.tmdb.org/t/p/w780/uByCHJa3eaCL0SgFGDYYLlsVggC.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/uByCHJa3eaCL0SgFGDYYLlsVggC.jpg",
    genre: ["Action", "Drama", "Thriller"],
    duration_min: 178,
    release_date: "2024-09-27",
    censor_rating: "U/A",
    languages: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
    formats: ["IMAX", "4DX", "2D"],
    rating: 8.9,
    votes: "620K",
    synopsis: "Starring Man of Masses Jr NTR, Saif Ali Khan & Janhvi Kapoor. Directed by Koratala Siva. A heroic coastal chieftain fights to protect the sea realm and eradicate smuggling.",
    isComingSoon: false,
  },
  {
    id: "m-hanuman",
    title: "Hanu-Man",
    poster_url: "https://image.tmdb.org/t/p/w780/iZTfOhaSTjBcwgRBm0zfD5gqemJ.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/f3ONMmF8IH85M9ewOSXXPqHECPX.jpg",
    genre: ["Action", "Adventure", "Fantasy"],
    duration_min: 158,
    release_date: "2024-01-12",
    censor_rating: "U/A",
    languages: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
    formats: ["3D", "2D", "Dolby Atmos"],
    rating: 9.1,
    votes: "740K",
    synopsis: "Starring Teja Sajja. Directed by Prasanth Varma. A humble villager in Anjanadri acquires divine powers through the celestial gem of Lord Hanuman to fight tyrannical greed.",
    isComingSoon: false,
  },
  {
    id: "m-alavaikunthapurramuloo",
    title: "Ala Vaikunthapurramuloo",
    poster_url: "https://image.tmdb.org/t/p/w780/hxay11Z1TrGU2R39JEUZdAPKdHG.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/3rWjPTE2hXXhMDUgL0T73wiMBHU.jpg",
    genre: ["Action", "Comedy", "Drama"],
    duration_min: 165,
    release_date: "2020-01-12",
    censor_rating: "U/A",
    languages: ["Telugu", "Malayalam"],
    formats: ["2D", "Dolby Atmos"],
    rating: 8.8,
    votes: "680K",
    synopsis: "Starring Allu Arjun & Pooja Hegde. Directed by Trivikram Srinivas. A young man raised by a spiteful clerk discovers his true lineage as the rightful heir to an affluent business tycoon.",
    isComingSoon: false,
  },
  {
    id: "m-rangasthalam",
    title: "Rangasthalam",
    poster_url: "https://image.tmdb.org/t/p/w780/f4FF18ia7yTvHf2izNrHqBmgH8U.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/isnJGDrfR9dIrHMsPTvHtJaGEpc.jpg",
    genre: ["Action", "Drama", "Period"],
    duration_min: 174,
    release_date: "2018-03-30",
    censor_rating: "U/A",
    languages: ["Telugu"],
    formats: ["2D", "Dolby Atmos"],
    rating: 9.3,
    votes: "820K",
    synopsis: "Starring Ram Charan & Samantha. Directed by Sukumar. In a 1980s Godavari village, a partially hearing-impaired sound engineer rises against a ruthless feudal president to avenge his brother.",
    isComingSoon: false,
  },
  {
    id: "m-saripodhaa",
    title: "Saripodhaa Sanivaaram",
    poster_url: "https://image.tmdb.org/t/p/w780/gmJ29b6r3zNWA9HEW3V95H2DF7u.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/gmJ29b6r3zNWA9HEW3V95H2DF7u.jpg",
    genre: ["Action", "Thriller", "Drama"],
    duration_min: 175,
    release_date: "2024-08-29",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Hindi", "Malayalam", "Kannada"],
    formats: ["2D", "Dolby Atmos"],
    rating: 8.9,
    votes: "560K",
    synopsis: "Starring Natural Star Nani & S.J. Suryah. Directed by Vivek Athreya. A vigilante with anger control rules channels his weekly fury against an abusive police inspector.",
    isComingSoon: false,
  },

  // --- 2025–2026 Catalog (10 Titles) ---
  {
    id: "m-paradise",
    title: "The Paradise",
    poster_url: "https://upload.wikimedia.org/wikipedia/en/b/bb/The_Paradise_%282026_Indian_film%29_poster.jpg",
    backdrop_url: "https://upload.wikimedia.org/wikipedia/en/b/bb/The_Paradise_%282026_Indian_film%29_poster.jpg",
    genre: ["Action", "Drama", "Thriller"],
    duration_min: 162,
    release_date: "2026-09-24",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Hindi", "Malayalam", "Kannada"],
    formats: ["IMAX", "2D", "Dolby Atmos"],
    rating: 9.3,
    votes: "450K",
    synopsis: "Starring Natural Star Nani as Jadal. Directed by Srikanth Odela. An intense period drama set in 1980s Secunderabad following marginalized citizens fighting feudal oppression.",
    isComingSoon: true,
  },
  {
    id: "m-rajasaab",
    title: "The RajaSaab",
    poster_url: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgdPirJn7Ly_QcvIi388z2Lwt0xAE5qu6YtmJVct7BfQIyIm_rWPGVe8LLdNWNGiLMpR9hDmQE4n5PC7zUiRLvQ7IThuRPOYG-U7D8pzGfZV3Hnxgxl35riURBj_uXFsfZl7e8AQAbzy_0uy7RlDCbRhZN-OIHAzQ0gD2eZEOdq_GLwkQ2R7Qx4K-gS0svb/s1468/TheRajaSaab001.png",
    backdrop_url: "https://wallpaperaccess.com/full/26453064.jpg",
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
    poster_url: "https://image.tmdb.org/t/p/w780/yJF3pPAg4ipOv9SY2XrcBQFpTSH.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/yJF3pPAg4ipOv9SY2XrcBQFpTSH.jpg",
    genre: ["Fantasy", "Action"],
    duration_min: 175,
    release_date: "2026-01-10",
    censor_rating: "U/A",
    languages: ["Telugu", "Hindi", "Tamil", "Kannada", "Malayalam"],
    formats: ["IMAX 3D", "3D", "2D"],
    rating: 9.4,
    votes: "920K",
    synopsis: "Starring Megastar Chiranjeevi. Directed by Vassishta. A monumental socio-fantasy epic traversing mystical celestial realms and defending the mortal world from cosmic annihilation.",
    isComingSoon: true,
  },
  {
    id: "m-ustaad",
    title: "Ustaad Bhagat Singh",
    poster_url: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjd7Aq0R8SU4Trrx32NNeXPv8y-cAscqtWvwVTbczxJGQ7PwfARRIqLMvcBrM0eTVMEirL6KlJq-EGWj8zEe2diPHYBU_YMAmz64FurArHGicQrUgIMNKrZZ1tK9XMHU_r_rS8m-cprQiAxBO2XX-NJr0NYvPPTGIZmzlgKkPDQWXtoABM9bEnJqusANmH2/s1500/UBS001.jpg",
    backdrop_url: "https://gallery.123telugu.com/content/slideshows/2026/3/Ustaad-Bhagat-Singh1/images/Ustaad%20Bhagat%20Singh-001.jpg",
    genre: ["Action", "Drama"],
    duration_min: 165,
    release_date: "2026-05-01",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Hindi"],
    formats: ["IMAX", "2D", "Dolby Atmos"],
    rating: 9.0,
    votes: "690K",
    synopsis: "Starring Power Star Pawan Kalyan. Directed by Harish Shankar. An explosive mass cop drama celebrating fearless justice and uncompromising valor.",
    isComingSoon: true,
  },
  {
    id: "m-g2",
    title: "Goodachari 2 (G2)",
    poster_url: "https://upload.wikimedia.org/wikipedia/en/5/5a/G2_%28film%29_poster.jpeg",
    backdrop_url: "https://upload.wikimedia.org/wikipedia/en/5/5a/G2_%28film%29_poster.jpeg",
    genre: ["Action", "Thriller", "Espionage"],
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
    id: "m-og",
    title: "They Call Him OG",
    poster_url: "https://image.tmdb.org/t/p/w780/7YTTveWQ3WIQiiPGWsUx05qA5Uq.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/7YTTveWQ3WIQiiPGWsUx05qA5Uq.jpg",
    genre: ["Action", "Crime"],
    duration_min: 170,
    release_date: "2025-09-27",
    censor_rating: "A",
    languages: ["Telugu", "Tamil", "Hindi", "Kannada", "Malayalam"],
    formats: ["IMAX", "4DX", "2D"],
    rating: 9.5,
    votes: "980K",
    synopsis: "Starring Pawan Kalyan & Emraan Hashmi. Directed by Sujeeth. Feared mob boss Ojas Gambheera returns to Mumbai after a decade of exile to settle old blood scores.",
    isComingSoon: false,
  },
  {
    id: "m-mirai",
    title: "Mirai - Super Yodha",
    poster_url: "https://upload.wikimedia.org/wikipedia/en/9/9f/Mirai_%282025_film%29_poster.jpg",
    backdrop_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    genre: ["Action", "Fantasy", "Adventure"],
    duration_min: 152,
    release_date: "2025-09-12",
    censor_rating: "U/A",
    languages: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
    formats: ["IMAX 3D", "3D", "2D"],
    rating: 8.9,
    votes: "520K",
    synopsis: "Starring Teja Sajja. Directed by Karthik Gattamneni. A chosen warrior protects King Ashoka's sacred divine scriptures from the apocalyptic Black Sword syndicate.",
    isComingSoon: false,
  },
  {
    id: "m-hhvm",
    title: "Hari Hara Veera Mallu",
    poster_url: "https://image.tmdb.org/t/p/w780/1gFSXInMYebLp89V2r0woRFIgZM.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/vg0n59EwKomMNJwlbt1CqlgFDI2.jpg",
    genre: ["Period", "Action", "Drama"],
    duration_min: 178,
    release_date: "2025-10-31",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Hindi", "Malayalam", "Kannada"],
    formats: ["IMAX", "2D", "Dolby Atmos"],
    rating: 9.0,
    votes: "670K",
    synopsis: "Starring Pawan Kalyan & Bobby Deol. A sprawling 17th-century period epic chronicling the legendary rebel defending the downtrodden against Mughal tyranny.",
    isComingSoon: false,
  },
  {
    id: "m-gamechanger",
    title: "Game Changer",
    poster_url: "https://image.tmdb.org/t/p/w780/d8Ryb8AunYAuycVKDp5HpdWPKgC.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/zOpe0eHsq0A2NvNyBbtT6sj53qV.jpg",
    genre: ["Action", "Political", "Drama"],
    duration_min: 165,
    release_date: "2025-01-10",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Hindi"],
    formats: ["IMAX", "2D", "Dolby Atmos"],
    rating: 8.8,
    votes: "610K",
    synopsis: "Starring Mega Power Star Ram Charan & Kiara Advani. Directed by Shankar. An honest IAS officer takes on systemic electoral corruption to reform governance.",
    isComingSoon: false,
  },
  {
    id: "m-daaku",
    title: "Daaku Maharaaj",
    poster_url: "https://image.tmdb.org/t/p/w780/qfalw4Ipiesm1ZF5wTvoKTZlfxW.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/qfalw4Ipiesm1ZF5wTvoKTZlfxW.jpg",
    genre: ["Action", "Drama"],
    duration_min: 160,
    release_date: "2025-01-12",
    censor_rating: "U/A",
    languages: ["Telugu", "Tamil", "Hindi"],
    formats: ["2D", "Dolby Atmos"],
    rating: 8.7,
    votes: "430K",
    synopsis: "Starring Nandamuri Balakrishna & Bobby Deol. Directed by Bobby Kolli. A legendary rural kingpin returns to settle royal debts and command absolute reverence.",
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
