import { ArchitecturalPlan, FAQItem, Testimonial } from './types';

export const ARCHITECTURAL_PLANS: ArchitecturalPlan[] = [];

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
    "project": "Obsidian Blueprint Customization",
    "quote": "Building our dream home felt daunting, but the blueprint package was immaculate. Our structural engineer was highly impressed by the framing layouts. We completed permitting with zero friction.",
    "rating": 5,
    "image": ""
  },
  {
    "id": "test-2",
    "clientName": "Dr. Alistair Sterling",
    "location": "Austin, Texas",
    "project": "Crestview Pavilion Project",
    "quote": "As a lover of mid-century minimalism, the CAD files were clean, accurate, and immediately compatible with our engineer's workflow. The outcome matches the drafting layouts precisely.",
    "rating": 5,
    "image": ""
  },
  {
    "id": "test-3",
    "clientName": "The Jenkins Family",
    "location": "Nashville, Tennessee",
    "project": "Heritage Contemporary Build",
    "quote": "The structural documentation gave our general contractor everything needed for accurate materials estimating and rapid framing turnaround.",
    "rating": 5,
    "image": ""
  }
];
