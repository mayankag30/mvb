// Phase 1 in-memory store. Every function is async so Phase 2's supabase.ts
// is a drop-in replacement. Data resets on restart — expected.

import type {
  Collection,
  CollectionWithItems,
  Enquiry,
  EnquiryInput,
  EnquiryNote,
  EnquiryStatus,
  EnquiryWithNotes,
  Item,
  ItemColor,
  ItemInput,
  ItemMedia,
  ItemWithRelations,
  ShopSettings,
  ShopSettingsInput,
  Staff,
  CollectionFilters,
  CollectionPage,
  FilterFacets,
} from './types';
import { family } from '../colour-family';
import { brandName } from './brand';

const now = () => new Date().toISOString();
let seq = 0;
const id = (prefix: string) => `${prefix}-${String(++seq).padStart(4, '0')}`;


// Collections and items seeded verbatim from the ITEMS object and
// COLLECTION_META in design-reference/index.html.
// Five collections, 54 items. Extras is a real collection: the front-page
// six-card strip is signposting, its items live on /collections/extras.
const SEED_COLLECTIONS: {
  slug: string; name: string; tagline: string; heading: string; blurb: string;
}[] = [
  { slug: "lehengas", name: "Lehengas", tagline: "THE MANDAP", heading: "Lehengas that hold the whole evening", blurb: "Bridal reds, sangeet pastels and reception blacks. Hand-worked zardozi, gota patti and real zari, cut to sit well whether you are the bride, her mother or her best friend." },
  { slug: "sarees", name: "Sarees", tagline: "AFTER DARK, ANY CITY", heading: "Sarees that travel further than you do", blurb: "Kanjeevaram, Banarasi, organza and hand-painted chiffon. Draped for a Delhi wedding or a dinner in Lisbon — the six yards are the same, the room changes." },
  { slug: "suits", name: "Suits", tagline: "HILL AIR, SEA AIR", heading: "Suits you can actually live a day in", blurb: "Chanderi, cotton silk, Lucknowi chikankari and easy Anarkalis. Light enough for a Goa afternoon, warm enough for a Manali morning — and cut for real movement." },
  { slug: "gowns", name: "Gowns", tagline: "CENTRE STAGE", heading: "Gowns with nowhere to hide", blurb: "Structured Indo-western silhouettes, trailing capes, corseted bodices and one very loud slit. Made for the cocktail night, the anniversary and the entrance you have been planning." },
  { slug: "extras", name: "Extras", tagline: "FINISHING TOUCHES", heading: "The bits that change the whole look", blurb: "" },
];

type Seed = {
  slug: string; name: string; brand: string | null; price: number;
  base: string; tag: string | null; stock: number; colors: string[];
};

const SEED_ITEMS: Seed[] = [
  // lehengas (10)
  { slug: "lehengas", name: "Rani Bridal Lehenga", brand: "MVB Atelier", price: 84500, base: "#9E1039", tag: "Bridal", stock: 3, colors: ["#9E1039", "#C21E56", "#7A0F2B", "#E0A73C"] },
  { slug: "lehengas", name: "Champa Sangeet Set", brand: "Neeru Couture", price: 42000, base: "#E39BB4", tag: "Sangeet", stock: 8, colors: ["#E39BB4", "#F2D98B", "#9FD0C4"] },
  { slug: "lehengas", name: "Zardozi Ivory Lehenga", brand: null, price: 66000, base: "#EFE3CB", tag: "Reception", stock: 2, colors: ["#EFE3CB", "#DCC79A", "#C9A96E"] },
  { slug: "lehengas", name: "Midnight Velvet Lehenga", brand: "MVB Atelier", price: 71200, base: "#1E2A63", tag: "New", stock: 5, colors: ["#1E2A63", "#0F3B3A", "#5B1B4A"] },
  { slug: "lehengas", name: "Gota Patti Haldi Lehenga", brand: "Neeru Couture", price: 28400, base: "#E8A317", tag: null, stock: 11, colors: ["#E8A317", "#EE8B2A", "#F2D98B"] },
  { slug: "lehengas", name: "Mirror Work Garba Chaniya", brand: null, price: 16900, base: "#1C7A6B", tag: "Navratri", stock: 14, colors: ["#1C7A6B", "#C21E56", "#E8A317"] },
  { slug: "lehengas", name: "Pastel Organza Lehenga", brand: "Studio Meher", price: 37500, base: "#C8D6E8", tag: null, stock: 6, colors: ["#C8D6E8", "#E8CFD8", "#DCE8D4"] },
  { slug: "lehengas", name: "Banarasi Silk Bridal Set", brand: "Kumaran Silks", price: 92000, base: "#7A0F2B", tag: "Bridal", stock: 1, colors: ["#7A0F2B", "#5A2A7A", "#0F4A3C"] },
  { slug: "lehengas", name: "Sequin Reception Lehenga", brand: "MVB Atelier", price: 58000, base: "#3A3A44", tag: null, stock: 4, colors: ["#3A3A44", "#8E2540"] },
  { slug: "lehengas", name: "Raw Silk Mehendi Lehenga", brand: null, price: 23800, base: "#6E8C3A", tag: null, stock: 0, colors: ["#6E8C3A", "#E8A317", "#D98E5C"] },
  // sarees (10)
  { slug: "sarees", name: "Kanjeevaram Temple Border", brand: "Kumaran Silks", price: 38900, base: "#8C1C2E", tag: null, stock: 6, colors: ["#8C1C2E", "#0F6B62", "#D9A93C", "#2B2E7A"] },
  { slug: "sarees", name: "Banarasi Kadhwa Silk", brand: null, price: 29400, base: "#5A2A7A", tag: "Best seller", stock: 9, colors: ["#5A2A7A", "#B0345A", "#1E5E52"] },
  { slug: "sarees", name: "Hand-painted Organza", brand: "Studio Meher", price: 14800, base: "#9CC7D8", tag: null, stock: 12, colors: ["#9CC7D8", "#F0C6D4", "#EADFC6"] },
  { slug: "sarees", name: "Charcoal Sequin Chiffon", brand: null, price: 18200, base: "#3A3A44", tag: "Party", stock: 3, colors: ["#3A3A44", "#6E1F3C", "#0E3B44"] },
  { slug: "sarees", name: "Chikankari Georgette Saree", brand: "Rasa", price: 11200, base: "#EFE8DA", tag: null, stock: 15, colors: ["#EFE8DA", "#D6E4E0", "#EADCC8"] },
  { slug: "sarees", name: "Patola Double Ikat", brand: "Kumaran Silks", price: 64000, base: "#B0345A", tag: "Heirloom", stock: 2, colors: ["#B0345A", "#1C7A6B", "#E8A317"] },
  { slug: "sarees", name: "Tissue Linen Daily Saree", brand: null, price: 6400, base: "#A6B7DA", tag: null, stock: 22, colors: ["#A6B7DA", "#DCC79A", "#C4D8C0"] },
  { slug: "sarees", name: "Bandhani Gharchola", brand: "Neeru Couture", price: 21500, base: "#C21E56", tag: null, stock: 7, colors: ["#C21E56", "#E8A317", "#7A0F2B"] },
  { slug: "sarees", name: "Black Velvet Border Saree", brand: "MVB Atelier", price: 33600, base: "#141216", tag: "Evening", stock: 1, colors: ["#141216", "#8C1C2E", "#C38E2E"] },
  { slug: "sarees", name: "Kota Doria Summer Saree", brand: null, price: 4900, base: "#DCE8D4", tag: null, stock: 18, colors: ["#DCE8D4", "#F0C6D4", "#E8DFC8"] },
  // suits (10)
  { slug: "suits", name: "Lucknowi Chikankari Kurta Set", brand: null, price: 9600, base: "#F2EFE2", tag: "Daily", stock: 16, colors: ["#F2EFE2", "#CFE0DA", "#E6D2C0"] },
  { slug: "suits", name: "Chanderi Anarkali", brand: "Rasa", price: 12400, base: "#7FB6A5", tag: null, stock: 9, colors: ["#7FB6A5", "#E7A76A", "#A6B7DA"] },
  { slug: "suits", name: "Cotton Silk Sharara Set", brand: null, price: 11100, base: "#D98E5C", tag: null, stock: 5, colors: ["#D98E5C", "#4F8C7E", "#C6577A"] },
  { slug: "suits", name: "Block-print Palazzo Suit", brand: "Neelkamal", price: 6900, base: "#2E6E8E", tag: "Travel", stock: 20, colors: ["#2E6E8E", "#8C3D57", "#B7883F"] },
  { slug: "suits", name: "Silk Blend Straight Suit", brand: "Rasa", price: 8400, base: "#8E2540", tag: null, stock: 11, colors: ["#8E2540", "#2A4A6E", "#5C6E3A"] },
  { slug: "suits", name: "Kalamkari Cotton Set", brand: null, price: 5600, base: "#C4A46A", tag: null, stock: 24, colors: ["#C4A46A", "#7A3A2E", "#3A5A4A"] },
  { slug: "suits", name: "Festive Velvet Suit", brand: "Neelkamal", price: 17800, base: "#4A1E5C", tag: "Festive", stock: 3, colors: ["#4A1E5C", "#0F4A3C", "#8C1C2E"] },
  { slug: "suits", name: "Linen Co-ord Kurta Set", brand: "MVB Atelier", price: 7200, base: "#E8DFC8", tag: null, stock: 13, colors: ["#E8DFC8", "#C4D8C0", "#D8C4B0"] },
  { slug: "suits", name: "Afghani Salwar Set", brand: null, price: 4800, base: "#3A6E6A", tag: null, stock: 0, colors: ["#3A6E6A", "#B0654A"] },
  { slug: "suits", name: "Bandhani Cotton Suit", brand: "Rasa", price: 6200, base: "#D4456A", tag: null, stock: 17, colors: ["#D4456A", "#E8A317", "#2E6E8E"] },
  // gowns (8)
  { slug: "gowns", name: "Obsidian Cape Gown", brand: "MVB Atelier", price: 46000, base: "#141216", tag: "Cocktail", stock: 2, colors: ["#141216", "#4A0E2C", "#123B3A"] },
  { slug: "gowns", name: "Molten Gold Corset Gown", brand: null, price: 52500, base: "#C38E2E", tag: "Statement", stock: 1, colors: ["#C38E2E", "#8E2540", "#2A2A5E"] },
  { slug: "gowns", name: "Blush Trail Indo-western", brand: "Studio Meher", price: 33800, base: "#E0AFB4", tag: null, stock: 4, colors: ["#E0AFB4", "#B6C7D8", "#EDD9B7"] },
  { slug: "gowns", name: "Emerald Slit Gown", brand: null, price: 39900, base: "#0E5B48", tag: "New", stock: 3, colors: ["#0E5B48", "#5B1330", "#1B2B5E"] },
  { slug: "gowns", name: "Draped Saree Gown", brand: "MVB Atelier", price: 27400, base: "#5A2A7A", tag: null, stock: 6, colors: ["#5A2A7A", "#8C1C2E", "#1E2A63"] },
  { slug: "gowns", name: "Ruffle Georgette Gown", brand: "Studio Meher", price: 19800, base: "#C8D6E8", tag: null, stock: 8, colors: ["#C8D6E8", "#F0C6D4"] },
  { slug: "gowns", name: "Sculpted Peplum Gown", brand: null, price: 44200, base: "#8E2540", tag: "Reception", stock: 2, colors: ["#8E2540", "#141216", "#C38E2E"] },
  { slug: "gowns", name: "Ivory Pearl Engagement Gown", brand: "Neeru Couture", price: 61000, base: "#F0E8D8", tag: "Engagement", stock: 1, colors: ["#F0E8D8", "#DCC79A"] },
  // extras (16)
  { slug: "extras", name: "Banarasi Organza Dupatta", brand: "Kumaran Silks", price: 3400, base: "#C21E56", tag: "Dupatta", stock: 19, colors: ["#C21E56", "#E8A317", "#1C7A6B"] },
  { slug: "extras", name: "Gota Patti Net Dupatta", brand: null, price: 2200, base: "#E8A317", tag: "Dupatta", stock: 26, colors: ["#E8A317", "#F0C6D4", "#C8D6E8"] },
  { slug: "extras", name: "Zari Border Silk Dupatta", brand: "Kumaran Silks", price: 4800, base: "#5A2A7A", tag: "Dupatta", stock: 7, colors: ["#5A2A7A", "#8C1C2E"] },
  { slug: "extras", name: "Kundan Choker Set", brand: "Roopkala", price: 5600, base: "#D9A93C", tag: "Jewellery", stock: 4, colors: ["#D9A93C", "#F2D98B"] },
  { slug: "extras", name: "Polki Maang Tikka", brand: "Roopkala", price: 2900, base: "#E0A73C", tag: "Jewellery", stock: 11, colors: ["#E0A73C", "#C38E2E"] },
  { slug: "extras", name: "Oxidised Jhumka", brand: null, price: 850, base: "#7C8288", tag: "Jewellery", stock: 34, colors: ["#7C8288", "#3A6E6A", "#8E2540"] },
  { slug: "extras", name: "Temple Work Haar", brand: "Roopkala", price: 8900, base: "#C38E2E", tag: "Jewellery", stock: 2, colors: ["#C38E2E", "#9E1039"] },
  { slug: "extras", name: "Beaded Potli Bag", brand: null, price: 1400, base: "#B0345A", tag: "Potli", stock: 23, colors: ["#B0345A", "#1E5E52", "#D9A93C"] },
  { slug: "extras", name: "Velvet Embroidered Potli", brand: "Studio Meher", price: 2100, base: "#1E2A63", tag: "Potli", stock: 9, colors: ["#1E2A63", "#4A1E5C"] },
  { slug: "extras", name: "Kamarbandh Waist Belt", brand: "Roopkala", price: 3200, base: "#D9A93C", tag: "Belt", stock: 6, colors: ["#D9A93C", "#8C1C2E"] },
  { slug: "extras", name: "Saree Belt with Stones", brand: null, price: 1900, base: "#C6577A", tag: "Belt", stock: 14, colors: ["#C6577A", "#E8DFC8", "#2E6E8E"] },
  { slug: "extras", name: "Punjabi Embroidered Jutti", brand: "Neelkamal", price: 1650, base: "#8C3D57", tag: "Jutti", stock: 21, colors: ["#8C3D57", "#E8A317", "#0F6B62"] },
  { slug: "extras", name: "Mirror Work Mojari", brand: "Neelkamal", price: 1350, base: "#D98E5C", tag: "Jutti", stock: 0, colors: ["#D98E5C", "#4F8C7E"] },
  { slug: "extras", name: "Velvet Block Heel Jutti", brand: null, price: 2400, base: "#4A1E5C", tag: "Jutti", stock: 5, colors: ["#4A1E5C", "#141216"] },
  { slug: "extras", name: "Fresh Gajra Hair Pin", brand: null, price: 450, base: "#EFE8DA", tag: "Hair", stock: 40, colors: ["#EFE8DA", "#F0C6D4"] },
  { slug: "extras", name: "Pearl Hair Vine", brand: "Studio Meher", price: 1800, base: "#F0E8D8", tag: "Hair", stock: 8, colors: ["#F0E8D8", "#DCC79A"] },
];

// ---------- build the in-memory tables ----------

const collections: Collection[] = SEED_COLLECTIONS.map((c, i) => ({
  id: `col-${c.slug}`,
  slug: c.slug,
  name: c.name,
  tagline: c.tagline,
  heading: c.heading,
  blurb: c.blurb,
  display_order: i + 1,
  is_visible: true,
}));

const items: Item[] = [];
const itemColors: ItemColor[] = [];
const itemMedia: ItemMedia[] = [];

SEED_ITEMS.forEach((seed, i) => {
  const collection = collections.find((c) => c.slug === seed.slug)!;
  const itemId = id('item');
  const orderInCollection =
    items.filter((it) => it.collection_id === collection.id).length + 1;

  items.push({
    id: itemId,
    collection_id: collection.id,
    name: seed.name,
    brand: seed.brand,
    base_price: seed.price,
    base_color: seed.base,
    badge: seed.tag,
    description: null,
    is_visible: true,
    display_order: orderInCollection,
    stock_qty: seed.stock,
    low_stock_at: 3,
    created_at: new Date(
      Date.now() - (SEED_ITEMS.length - i) * 86_400_000,
    ).toISOString(),
    updated_at: now(),
  });

  seed.colors.forEach((hex, ci) => {
    itemColors.push({
      id: id('color'),
      item_id: itemId,
      name: hex,
      hex,
      family: family(hex),
      display_order: ci + 1,
    });
  });
});

// ---------- enquiries ----------

const enquiries: Enquiry[] = [
  {
    id: 'enq-0001',
    name: 'Ritika Sharma',
    email: 'ritika.sharma@example.com',
    phone: null,
    whatsapp: '+919812345670',
    interest: 'Lehengas',
    message: 'Looking for a bridal lehenga for a December wedding. Budget around 40k.',
    item_id: items[0]?.id ?? null,
    status: 'arrived',
    created_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    id: 'enq-0002',
    name: 'Fatima Khan',
    email: null,
    phone: '01123456789',
    whatsapp: '+919812345671',
    interest: 'Sarees',
    message: 'Do you have the Banarasi in royal blue? Need three pieces for family.',
    item_id: items[4]?.id ?? null,
    status: 'contacted',
    created_at: new Date(Date.now() - 26 * 3600_000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 3600_000).toISOString(),
  },
  {
    id: 'enq-0003',
    name: 'Meenakshi Iyer',
    email: 'm.iyer@example.com',
    phone: null,
    whatsapp: '+919812345672',
    interest: 'Gowns',
    message: 'Reception gown, floor length, prefer gold. Can visit this Saturday.',
    item_id: items[13]?.id ?? null,
    status: 'in_discussion',
    created_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86_400_000).toISOString(),
  },
  {
    id: 'enq-0004',
    name: 'Simran Kaur',
    email: 'simran.k@example.com',
    phone: null,
    whatsapp: '+919812345673',
    interest: 'Suits',
    message: 'Six mulmul suits for a family function. Bulk pricing possible?',
    item_id: null,
    status: 'order_placed',
    created_at: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
  {
    id: 'enq-0005',
    name: 'Anjali Verma',
    email: null,
    phone: null,
    whatsapp: '+919812345674',
    interest: 'Extras',
    message: 'Need a gold dupatta to match a red kurta.',
    item_id: null,
    status: 'resolved',
    created_at: new Date(Date.now() - 12 * 86_400_000).toISOString(),
    updated_at: new Date(Date.now() - 9 * 86_400_000).toISOString(),
  },
];

const enquiryNotes: EnquiryNote[] = [
  {
    id: 'note-0001',
    enquiry_id: 'enq-0002',
    note: 'Called, sent photos on WhatsApp.',
    status_from: 'arrived',
    status_to: 'contacted',
    staff_id: 'dev-staff-1',
    created_at: new Date(Date.now() - 20 * 3600_000).toISOString(),
  },
  {
    id: 'note-0002',
    enquiry_id: 'enq-0003',
    note: 'Shortlisted two gowns, visiting Saturday 4pm.',
    status_from: 'contacted',
    status_to: 'in_discussion',
    staff_id: 'dev-staff-1',
    created_at: new Date(Date.now() - 1 * 86_400_000).toISOString(),
  },
];

// ---------- staff & shop ----------

const staff: Staff[] = [
  {
    id: 'dev-staff-1',
    username: 'priya',
    display_name: 'Priya',
    is_active: true,
    created_at: new Date(Date.now() - 90 * 86_400_000).toISOString(),
  },
  {
    id: 'dev-staff-2',
    username: 'mahesh',
    display_name: 'Mahesh',
    is_active: true,
    created_at: new Date(Date.now() - 90 * 86_400_000).toISOString(),
  },
];

// Verbatim from design-reference/index.html. Phone and email are still
// placeholders there and are left as-is until the real ones are supplied.
let shopSettings: ShopSettings = {
  id: true,
  name: 'Mahesh Vastra Bhandar',
  address: 'Chandra Shekhar Azad Road, Manik Chowk,\nJhansi, Uttar Pradesh 284002',
  whatsapp: '+91 98765 43210',
  phone: '+91 11 2345 6789',
  email: 'hello@mvbstore.in',
  hours: 'Monday to Saturday, 11am – 8pm\nSunday closed',
  lat: 25.461039,
  lng: 78.579234,
  updated_at: now(),
};

// ---------- helpers ----------

function withRelations(item: Item): ItemWithRelations {
  return {
    ...item,
    item_colors: itemColors
      .filter((c) => c.item_id === item.id)
      .sort((a, b) => a.display_order - b.display_order),
    item_media: itemMedia
      .filter((m) => m.item_id === item.id)
      .sort((a, b) => a.display_order - b.display_order),
  };
}

// ---------- storefront reads ----------

export async function getCollectionsWithItems(): Promise<CollectionWithItems[]> {
  return collections
    .filter((c) => c.is_visible)
    .sort((a, b) => a.display_order - b.display_order)
    .map((c) => ({
      ...c,
      items: items
        .filter((i) => i.collection_id === c.id && i.is_visible)
        .sort((a, b) => a.display_order - b.display_order)
        .map(withRelations),
    }));
}

export async function getShopSettings(): Promise<ShopSettings> {
  return { ...shopSettings };
}

// ---------- admin: collections ----------

export async function listCollections(): Promise<Collection[]> {
  return [...collections].sort((a, b) => a.display_order - b.display_order);
}

// ---------- admin: items ----------

export async function listItems(): Promise<ItemWithRelations[]> {
  return items
    .slice()
    .sort(
      (a, b) =>
        a.collection_id.localeCompare(b.collection_id) ||
        a.display_order - b.display_order,
    )
    .map(withRelations);
}

export async function getItem(itemId: string): Promise<ItemWithRelations | null> {
  const item = items.find((i) => i.id === itemId);
  return item ? withRelations(item) : null;
}

export async function createItem(input: ItemInput): Promise<string> {
  const itemId = id('item');
  items.push({
    id: itemId,
    collection_id: input.collection_id,
    name: input.name,
    brand: input.brand,
    base_price: input.base_price,
    base_color: input.base_color,
    badge: input.badge,
    description: input.description,
    is_visible: input.is_visible,
    display_order: input.display_order,
    stock_qty: input.stock_qty,
    low_stock_at: input.low_stock_at,
    created_at: now(),
    updated_at: now(),
  });
  replaceChildren(itemId, input);
  return itemId;
}

export async function updateItem(itemId: string, input: ItemInput): Promise<void> {
  const item = items.find((i) => i.id === itemId);
  if (!item) throw new Error('Item not found');
  Object.assign(item, {
    collection_id: input.collection_id,
    name: input.name,
    brand: input.brand,
    base_price: input.base_price,
    base_color: input.base_color,
    badge: input.badge,
    description: input.description,
    is_visible: input.is_visible,
    display_order: input.display_order,
    stock_qty: input.stock_qty,
    low_stock_at: input.low_stock_at,
    updated_at: now(),
  });
  replaceChildren(itemId, input);
}

function replaceChildren(itemId: string, input: ItemInput) {
  drop(itemColors, (c) => c.item_id === itemId);
  drop(itemMedia, (m) => m.item_id === itemId);
  input.colors.forEach((c) =>
    // family mirrors the generated column in Postgres
    itemColors.push({ id: id('color'), item_id: itemId, ...c, family: family(c.hex) }),
  );
  input.media.forEach((m) =>
    itemMedia.push({ id: id('media'), item_id: itemId, ...m }),
  );
}

function drop<T>(arr: T[], match: (x: T) => boolean) {
  for (let i = arr.length - 1; i >= 0; i--) if (match(arr[i])) arr.splice(i, 1);
}

export async function setItemVisibility(
  itemId: string,
  isVisible: boolean,
): Promise<void> {
  const item = items.find((i) => i.id === itemId);
  if (!item) throw new Error('Item not found');
  item.is_visible = isVisible;
  item.updated_at = now();
}

export async function deleteItem(itemId: string): Promise<void> {
  drop(itemColors, (c) => c.item_id === itemId);
  drop(itemMedia, (m) => m.item_id === itemId);
  drop(items, (i) => i.id === itemId);
}

// ---------- public: enquiry insert ----------

export async function createEnquiry(input: EnquiryInput): Promise<void> {
  const recent = enquiries.filter(
    (e) =>
      e.whatsapp === input.whatsapp &&
      Date.parse(e.created_at) > Date.now() - 10 * 60_000,
  ).length;
  if (recent >= 3) {
    throw new Error('Too many enquiries from this number. Please wait a few minutes.');
  }
  enquiries.push({
    id: id('enq'),
    ...input,
    status: 'arrived',
    created_at: now(),
    updated_at: now(),
  });
}

// ---------- admin: enquiries ----------

export async function listEnquiries(): Promise<EnquiryWithNotes[]> {
  return enquiries
    .slice()
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .map((e) => ({
      ...e,
      enquiry_notes: enquiryNotes
        .filter((n) => n.enquiry_id === e.id)
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
    }));
}

export async function updateEnquiryStatus(
  enquiryId: string,
  status: EnquiryStatus,
  note: string | null,
  staffId: string | null,
): Promise<void> {
  const enquiry = enquiries.find((e) => e.id === enquiryId);
  if (!enquiry) throw new Error('Enquiry not found');
  const from = enquiry.status;
  enquiry.status = status;
  enquiry.updated_at = now();
  enquiryNotes.push({
    id: id('note'),
    enquiry_id: enquiryId,
    note,
    status_from: from,
    status_to: status,
    staff_id: staffId,
    created_at: now(),
  });
}

// ---------- admin: shop & staff ----------

export async function updateShopSettings(input: ShopSettingsInput): Promise<void> {
  shopSettings = { ...shopSettings, ...input, updated_at: now() };
}

export async function listStaff(): Promise<Staff[]> {
  return staff.map((s) => ({ ...s }));
}

// ---------- media (Phase 1 stub) ----------

export async function uploadMedia(file: {
  name: string;
  kind: 'image' | 'video';
}): Promise<{ public_id: string; url: string }> {
  const publicId = `mvb/items/mock-${id('m')}`;
  return {
    public_id: publicId,
    url: `https://placehold.co/800x1093/221944/D9A93C/png?text=${encodeURIComponent(file.name)}`,
  };
}

// ---------- collection page: filters and facets ----------

/**
 * Filtering happens here, in the data layer — the equivalent of the SQL in
 * supabase.ts. The page never receives unmatched rows, so there is nothing to
 * .filter() in the browser.
 */
/** Brands created via the admin panel before any item is assigned to them. */
const standalonebrands: Set<string> = new Set();

const PAGE_SIZE = 12;

export async function getCollectionBySlug(
  slug: string,
  filters: CollectionFilters,
): Promise<CollectionPage | null> {
  const collection = collections.find((c) => c.slug === slug && c.is_visible);
  if (!collection) return null;

  const inCollection = items.filter(
    (i) => i.collection_id === collection.id && i.is_visible,
  );

  const needle = filters.q.trim().toLowerCase();
  const matched = inCollection.filter((i) => {
    if (filters.max !== null && i.base_price > filters.max) return false;
    const b = brandName(i);
    if (filters.brands.length && !(b && filters.brands.includes(b)))
      return false;
    if (filters.colours.length) {
      const fams = itemColors
        .filter((c) => c.item_id === i.id)
        .map((c) => c.family);
      if (!fams.some((f) => filters.colours.includes(f))) return false;
    }
    if (needle) {
      const hay = `${i.name} ${b ?? ''} ${i.badge ?? ''}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  const sorted = matched
    .sort((a, b) => a.display_order - b.display_order)
    .map(withRelations);

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.max(1, Math.min(filters.page ?? 1, pages));
  const from = (page - 1) * PAGE_SIZE;

  return {
    collection,
    items: sorted.slice(from, from + PAGE_SIZE),
    matched: matched.length,
    total: inCollection.length,
    page,
    pages,
  };
}

/**
 * Bounds from min/max(base_price) rounded out to the nearest 1000, and only
 * the brands and families that actually occur — a chip returning zero rows is
 * a bug.
 */
export async function getFilterFacets(slug: string): Promise<FilterFacets | null> {
  const collection = collections.find((c) => c.slug === slug && c.is_visible);
  if (!collection) return null;

  const mine = items.filter(
    (i) => i.collection_id === collection.id && i.is_visible,
  );
  if (!mine.length) {
    return { priceFloor: 0, priceTop: 0, brands: [], families: [] };
  }

  const prices = mine.map((i) => i.base_price);
  const ids = new Set(mine.map((i) => i.id));

  return {
    priceFloor: Math.floor(Math.min(...prices) / 1000) * 1000,
    priceTop: Math.ceil(Math.max(...prices) / 1000) * 1000,
    brands: [...new Set(mine.map(brandName).filter((b): b is string => !!b))].sort(),
    families: [
      ...new Set(
        itemColors.filter((c) => ids.has(c.item_id)).map((c) => c.family),
      ),
    ].sort(),
  };
}

/**
 * Phase 1: brands are free text on items. listBrandNames returns distinct values.
 * Migration 0005 replaces this with a real brands table; the API surface stays.
 */
export async function listBrandNames(): Promise<string[]> {
  const fromItems = items.map((i) => i.brand).filter((b): b is string => !!b);
  return [...new Set([...fromItems, ...standalonebrands])].sort();
}

/** How many items have this brand (or no brand if name is null). */
export async function getBrandItemCount(name: string | null): Promise<number> {
  if (name === null) return items.filter((i) => !i.brand).length;
  return items.filter((i) => i.brand === name).length;
}

/** Rename: updates every item using oldName and the standalone set. */
export async function renameBrand(oldName: string, newName: string): Promise<void> {
  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) return;
  items.forEach((i) => {
    if (i.brand === oldName) i.brand = trimmed;
  });
  if (standalonebrands.has(oldName)) {
    standalonebrands.delete(oldName);
    standalonebrands.add(trimmed);
  }
}

/** Delete: clears brand on all items using this name, never removes stock. */
export async function deleteBrand(name: string): Promise<void> {
  items.forEach((i) => {
    if (i.brand === name) i.brand = null;
  });
  standalonebrands.delete(name);
}

/** Add: stores in the standalone set until assigned to an item. */
export async function createBrand(name: string): Promise<void> {
  const trimmed = name.trim();
  if (trimmed) standalonebrands.add(trimmed);
}

/**
 * Deleting a note removes the comment but keeps the status transition it
 * recorded — the audit trail of who moved what must not become editable.
 * A note whose row exists only for its comment is removed outright.
 */
export async function deleteEnquiryNote(noteId: string): Promise<void> {
  const note = enquiryNotes.find((n) => n.id === noteId);
  if (!note) return;
  if (note.status_from && note.status_to && note.status_from !== note.status_to) {
    note.note = null; // keep the transition, drop the comment
    return;
  }
  drop(enquiryNotes, (n) => n.id === noteId);
}
