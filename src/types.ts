export interface Room {
  id: string;
  name: string;
  dimensions: string;
  x: number; // percentage coordinate for interactive SVG floorplan
  y: number;
  width: number;
  height: number;
  description: string;
}

export interface FloorLevel {
  name: string; // e.g., "Ground Floor", "Upper Floor"
  rooms: Room[];
}

export interface ArchitecturalPlan {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  sqft: number | string;
  beds: number;
  baths: number;
  stories: number;
  garageBays: number;
  width: string; // e.g., "48'-0\""
  depth: string; // e.g., "56'-0\""
  style: string; // e.g., "Modern Minimalist", "Contemporary Farmhouse", "Luxury Estate"
  category: string; // 'Residential' | 'Hospitality' | 'Commercial' | 'Industrial' | 'Educational' | 'Healthcare' | 'Government'
  image: string; // URL of the exterior render
  images?: string[]; // Multiple images for the project slider
  videos?: string[]; // Project videos (URLs or base64 data URLs)
  features: string[]; // key selling points
  ceilingHeights?: string; // e.g. "10' Main, 9' Upper"
  roofPitch?: string; // e.g. "4:12" or "Flat"
  framingType?: string; // e.g. "2x6 Wood Framing"
  floors: FloorLevel[];
  isTrending?: boolean;
  isMostViewed?: boolean;
  projectNo?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface Testimonial {
  id: string;
  clientName: string;
  location: string;
  project: string;
  quote: string;
  rating: number;
  image: string; // image of the finished built house
}

export interface ModificationRequest {
  planId: string;
  planName: string;
  clientName: string;
  email: string;
  phone: string;
  modificationType: string[];
  customInstructions: string;
}

export interface CartItem {
  plan: ArchitecturalPlan;
  licenseType: 'Standard PDF' | 'CAD Unlimited' | 'Full MEP Pack';
  price: number;
}
