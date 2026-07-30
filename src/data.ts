import { ArchitecturalPlan, FAQItem, Testimonial } from './types';

export const ARCHITECTURAL_PLANS: ArchitecturalPlan[] = [
  {
    "id": "plan-1785426859989",
    "name": "rttt",
    "projectNo": "P-003",
    "subtitle": "3 Bed, 2 Bath Modern Classic",
    "description": "",
    "price": 14556,
    "sqft": "3455",
    "beds": 3,
    "baths": 2,
    "stories": 1,
    "garageBays": 2,
    "width": "45'-0\"",
    "depth": "50'-0\"",
    "style": "Modern Minimalist",
    "category": "Residential",
    "image": "/uploads/images/make-up-products-with-brushes.jpg",
    "images": [
      "/uploads/images/make-up-products-with-brushes.jpg"
    ],
    "videos": [],
    "features": [
      "Smart home automation ready",
      "Passive solar insulation layouts"
    ],
    "ceilingHeights": "10' Main, 9' Upper",
    "roofPitch": "4:12",
    "framingType": "2x6 Wood Framing",
    "isTrending": false,
    "isMostViewed": false,
    "floors": [
      {
        "name": "Ground Floor",
        "rooms": [
          {
            "id": "1",
            "name": "Grand Foyer",
            "dimensions": "12' x 14'",
            "x": 10,
            "y": 15,
            "width": 25,
            "height": 20,
            "description": "Double height entrance"
          },
          {
            "id": "2",
            "name": "Master Suite",
            "dimensions": "16' x 20'",
            "x": 40,
            "y": 15,
            "width": 35,
            "height": 25,
            "description": "En suite bath and walk-in closet"
          },
          {
            "id": "3",
            "name": "Great Room",
            "dimensions": "24' x 18'",
            "x": 10,
            "y": 40,
            "width": 55,
            "height": 35,
            "description": "Central hearth and panoramic glazing"
          }
        ]
      }
    ]
  }
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    "id": "faq-included",
    "question": "What is included in a blueprint plan package?",
    "answer": "Every plan package consists of a complete, builder-ready construction set. This includes architectural dimensioned floor plans, 3D exterior renderings, framing/lumber layouts, structural section profiles, window/door schedules, detailed electrical layouts, foundation plans (slab or basement options), and interior elevations for main kitchen and bath cabinets."
  },
  {
    "id": "faq-stamped",
    "question": "Are these plans stamped for my local state or council?",
    "answer": "Because local structural building regulations, snow loads, wind speeds, and seismic codes vary extensively across different states, countries, and counties, our plans are sold as 'drafting sets' and are not pre-stamped. Most local building councils will require you to submit the plans to a local licensed structural engineer or surveyor to add a localized stamp of approval prior to obtaining permits."
  },
  {
    "id": "faq-mods",
    "question": "Can I request modifications to these pre-made blueprints?",
    "answer": "Absolutely! We specialize in custom modifications. Over 60% of our clients adapt our plans to fit their specific lots, local setback regulations, or family space requirements. Whether you want to flip the layout, extend a garage bay, add an extra bedroom, or adjust a roofline slope, you can use our dynamic 'Request Modification' drawer to outline your goals and receive a custom modification quote."
  },
  {
    "id": "faq-formats",
    "question": "In what digital file formats are the plans delivered?",
    "answer": "Our standard plans are instantly delivered as crisp, vector-grade high-resolution PDF sets. For professional adjustments and engineering stamps, we highly recommend selecting our 'CAD Unlimited' package which includes raw, editable DWG/DXF vector assets compatible with AutoCAD, Revit, and Chief Architect."
  },
  {
    "id": "faq-estimate",
    "question": "How do I estimate building costs for these blueprints?",
    "answer": "Included with every blueprint is a comprehensive 'Materials Take-off List'. You can take this document directly to local lumber yards and building material suppliers for hyper-accurate local pricing. Generally, our plans range from $200 to $450 per square foot to construct, depending on chosen finishing materials, lot geography, and active local contractor rates."
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    "id": "test-1",
    "clientName": "Marcus & Elēna Vance",
    "location": "Lake Tahoe, California",
    "project": "The Obsidian Plan (Customized)",
    "quote": "Building our dream home felt daunting, but the Obsidian blueprint was immaculate. Our structural engineer was highly impressed by the framing layouts. We modified the master deck to include a spa lounge, and our contractor finished the build three weeks ahead of schedule. Truly a five-star professional experience.",
    "rating": 5,
    "image": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600"
  },
  {
    "id": "test-2",
    "clientName": "Dr. Alistair Sterling",
    "location": "Austin, Texas",
    "project": "The Crestview Villa",
    "quote": "As a lover of mid-century minimalism, I fell in love with the Crestview plan. The open pavilion layout fits our courtyard pool layout beautifully. We received the digital CAD files instantly and handed them over to our timber-framing contractor with ease. The visual outcome matches the rendering precisely.",
    "rating": 5,
    "image": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=600"
  },
  {
    "id": "test-3",
    "clientName": "The Jenkins Family",
    "location": "Nashville, Tennessee",
    "project": "The Heritage Farmhouse",
    "quote": "We wanted a classic southern farmhouse with a modern interior layout. The Heritage gave us both. The cathedral ceilings in the great room are the absolute center of our family gatherings. We added a screened back porch off the dining room via the customization team, who completed the modified files in just four days!",
    "rating": 5,
    "image": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600"
  }
];
