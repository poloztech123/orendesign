import { ArchitecturalPlan, FAQItem, Testimonial } from './types';

export const ARCHITECTURAL_PLANS: ArchitecturalPlan[] = [
  {
    id: "plan-obsidian-01",
    name: "The Obsidian Pavilion",
    projectNo: "OD-2026-01",
    subtitle: "4 Bed, 4.5 Bath Luxury Modern Residence",
    description: "An architectural masterpiece featuring cantilevered concrete volumes, floor-to-ceiling glass pavilions, and seamless indoor-outdoor courtyard living. Designed with passive climate control and acoustic insulation.",
    price: 1450,
    sqft: 3850,
    beds: 4,
    baths: 4.5,
    stories: 2,
    garageBays: 3,
    width: "65'-0\"",
    depth: "82'-0\"",
    style: "Modern Minimalist",
    category: "Residential",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"
    ],
    videos: [],
    features: [
      "Double-height great room with floating fireplace",
      "Private master wing with spa courtyard view",
      "Integrated solar panel roof framing structure",
      "Hidden chef prep pantry and wine cellar"
    ],
    ceilingHeights: "12' Main Level, 10' Upper Level",
    roofPitch: "Flat / Low Slope 2:12",
    framingType: "Steel Frame & Engineered Timber",
    isTrending: true,
    isMostViewed: true,
    floors: [
      {
        name: "Main Level",
        rooms: [
          { id: "1", name: "Grand Foyer", dimensions: "14' x 16'", x: 10, y: 15, width: 25, height: 20, description: "Atrium entrance with water feature" },
          { id: "2", name: "Great Room", dimensions: "28' x 22'", x: 38, y: 15, width: 50, height: 35, description: "Panoramic glass pavilion" },
          { id: "3", name: "Chef's Kitchen", dimensions: "18' x 20'", x: 10, y: 40, width: 30, height: 30, description: "12ft waterfall island" }
        ]
      }
    ]
  },
  {
    id: "plan-crestview-02",
    name: "Crestview Mid-Century Villa",
    projectNo: "OD-2026-02",
    subtitle: "3 Bed, 3 Bath Open Concept Courtyard Plan",
    description: "Inspired by iconic West Coast mid-century architecture. Features exposed Douglas fir beams, post-and-beam construction, and a central swimming pool courtyard framing expansive horizons.",
    price: 1200,
    sqft: 2750,
    beds: 3,
    baths: 3,
    stories: 1,
    garageBays: 2,
    width: "58'-0\"",
    depth: "70'-0\"",
    style: "Mid-Century Modern",
    category: "Residential",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
    ],
    videos: [],
    features: [
      "Central glass perimeter surrounding pool deck",
      "Cedar ceiling cladding with tongue-and-groove finish",
      "Dual primary suites with private exterior access",
      "E-Vehicle 240V high-speed charging garage bay"
    ],
    ceilingHeights: "10' Sloped Beam Ceilings Throughout",
    roofPitch: "3:12 Mid-Century Pitch",
    framingType: "2x6 Wood Post & Beam Framing",
    isTrending: false,
    isMostViewed: true,
    floors: [
      {
        name: "Ground Level",
        rooms: [
          { id: "1", name: "Living Pavilion", dimensions: "24' x 20'", x: 15, y: 15, width: 45, height: 35, description: "Open plan living with fireplace" },
          { id: "2", name: "Primary Suite", dimensions: "16' x 18'", x: 62, y: 15, width: 30, height: 30, description: "Direct courtyard access" }
        ]
      }
    ]
  },
  {
    id: "plan-nordic-03",
    name: "The Nordic Retreat Sanctuary",
    projectNo: "OD-2026-03",
    subtitle: "2 Bed, 2 Bath Eco-A-Frame Chalet",
    description: "A striking minimalist Scandinavian chalet optimized for extreme climate efficiency, thermal insulation, and dramatic mountain views through custom pitched double-glazed curtain walls.",
    price: 980,
    sqft: 1850,
    beds: 2,
    baths: 2,
    stories: 2,
    garageBays: 1,
    width: "42'-0\"",
    depth: "48'-0\"",
    style: "Scandinavian Minimalist",
    category: "Hospitality",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"
    ],
    videos: [],
    features: [
      "High-efficiency Nordic wood-burning stove hearth",
      "Integrated cedar sauna and wellness bath deck",
      "Steep roofline engineered for heavy snow shedding",
      "Lofted mezzanine sleeping lounge overlooking forest"
    ],
    ceilingHeights: "18' Vaulted Cathedral Ceiling",
    roofPitch: "12:12 Steep Chalet Pitch",
    framingType: "Heavy Timber & Glulam Beams",
    isTrending: true,
    isMostViewed: false,
    floors: [
      {
        name: "Main Chalet",
        rooms: [
          { id: "1", name: "Great Room & Hearth", dimensions: "20' x 22'", x: 15, y: 15, width: 50, height: 40, description: "Cathedral glass facade" }
        ]
      }
    ]
  },
  {
    id: "plan-heritage-04",
    name: "The Heritage Modern Farmhouse",
    projectNo: "OD-2026-04",
    subtitle: "4 Bed, 3.5 Bath Modern Craftsman Estate",
    description: "Combining classic American porch porchscapes with contemporary open layouts. Board and batten siding, dark metal accents, and expansive family dining areas.",
    price: 1350,
    sqft: 3400,
    beds: 4,
    baths: 3.5,
    stories: 2,
    garageBays: 2,
    width: "62'-0\"",
    depth: "68'-0\"",
    style: "Modern Farmhouse",
    category: "Residential",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
    ],
    videos: [],
    features: [
      "Wrap-around front verandah with timber columns",
      "Mudroom with custom cubbies and pet wash basin",
      "Bonus room over garage suitable for home theater",
      "Screened back porch with outdoor kitchen rough-in"
    ],
    ceilingHeights: "10' First Floor, 9' Second Floor",
    roofPitch: "8:12 Gable Pitch",
    framingType: "2x6 Wood Framing",
    isTrending: false,
    isMostViewed: true,
    floors: [
      {
        name: "First Level",
        rooms: [
          { id: "1", name: "Family Room", dimensions: "22' x 20'", x: 20, y: 20, width: 45, height: 35, description: "Coffered ceiling with fireplace" }
        ]
      }
    ]
  }
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: "faq-included",
    question: "What is included in a blueprint plan package?",
    answer: "Every plan package consists of a complete, builder-ready construction set. This includes architectural dimensioned floor plans, 3D exterior renderings, framing/lumber layouts, structural section profiles, window/door schedules, detailed electrical layouts, foundation plans (slab or basement options), and interior elevations for main kitchen and bath cabinets."
  },
  {
    id: "faq-stamped",
    question: "Are these plans stamped for my local state or council?",
    answer: "Because local structural building regulations, snow loads, wind speeds, and seismic codes vary extensively across different states, countries, and counties, our plans are sold as 'drafting sets' and are not pre-stamped. Most local building councils will require you to submit the plans to a local licensed structural engineer or surveyor to add a localized stamp of approval prior to obtaining permits."
  },
  {
    id: "faq-mods",
    question: "Can I request modifications to these pre-made blueprints?",
    answer: "Absolutely! We specialize in custom modifications. Over 60% of our clients adapt our plans to fit their specific lots, local setback regulations, or family space requirements. Whether you want to flip the layout, extend a garage bay, add an extra bedroom, or adjust a roofline slope, you can use our dynamic 'Request Modification' drawer to outline your goals and receive a custom modification quote."
  },
  {
    id: "faq-formats",
    question: "In what digital file formats are the plans delivered?",
    answer: "Our standard plans are instantly delivered as crisp, vector-grade high-resolution PDF sets. For professional adjustments and engineering stamps, we highly recommend selecting our 'CAD Unlimited' package which includes raw, editable DWG/DXF vector assets compatible with AutoCAD, Revit, and Chief Architect."
  },
  {
    id: "faq-estimate",
    question: "How do I estimate building costs for these blueprints?",
    answer: "Included with every blueprint is a comprehensive 'Materials Take-off List'. You can take this document directly to local lumber yards and building material suppliers for hyper-accurate local pricing. Generally, our plans range from $200 to $450 per square foot to construct, depending on chosen finishing materials, lot geography, and active local contractor rates."
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "test-1",
    clientName: "Marcus & Elēna Vance",
    location: "Lake Tahoe, California",
    project: "The Obsidian Plan (Customized)",
    quote: "Building our dream home felt daunting, but the Obsidian blueprint was immaculate. Our structural engineer was highly impressed by the framing layouts. We modified the master deck to include a spa lounge, and our contractor finished the build three weeks ahead of schedule. Truly a five-star professional experience.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "test-2",
    clientName: "Dr. Alistair Sterling",
    location: "Austin, Texas",
    project: "The Crestview Villa",
    quote: "As a lover of mid-century minimalism, I fell in love with the Crestview plan. The open pavilion layout fits our courtyard pool layout beautifully. We received the digital CAD files instantly and handed them over to our timber-framing contractor with ease. The visual outcome matches the rendering precisely.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "test-3",
    clientName: "The Jenkins Family",
    location: "Nashville, Tennessee",
    project: "The Heritage Farmhouse",
    quote: "We wanted a classic southern farmhouse with a modern interior layout. The Heritage gave us both. The cathedral ceilings in the great room are the absolute center of our family gatherings. We added a screened back porch off the dining room via the customization team, who completed the modified files in just four days!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600"
  }
];
