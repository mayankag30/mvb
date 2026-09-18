// Mirrors supabase/migrations/0001_init.sql exactly.
// snake_case as in Postgres; nullable where the column is nullable.

export const ENQUIRY_STATUSES = [
  'arrived',
  'contacted',
  'in_discussion',
  'order_placed',
  'resolved',
  'closed',
] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const STATUS_LABELS: Record<EnquiryStatus, string> = {
  arrived: 'Arrived',
  contacted: 'Contacted',
  in_discussion: 'In discussion',
  order_placed: 'Order placed',
  resolved: 'Resolved',
  closed: 'Closed',
};

export type MediaKind = 'image' | 'video';

export type StaffRole = 'super' | 'editor' | 'viewer';

export type Staff = {
  id: string;
  username: string;
  display_name: string;
  role: StaffRole;
  is_active: boolean;
  created_at: string;
};

export type Collection = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  heading: string | null;
  blurb: string | null;
  display_order: number;
  is_visible: boolean;
};

export type Item = {
  id: string;
  collection_id: string;
  name: string;
  brand: string | null;
  base_price: number;
  base_color: string;
  badge: string | null;
  description: string | null;
  is_visible: boolean;
  display_order: number;
  /** maintained from the admin panel; nothing decrements it */
  stock_qty: number;
  low_stock_at: number;
  created_at: string;
  updated_at: string;
};

export type ColourFamily =
  | 'Red'
  | 'Pink'
  | 'Rust'
  | 'Gold'
  | 'Olive'
  | 'Green'
  | 'Teal'
  | 'Blue'
  | 'Purple'
  | 'Black'
  | 'Grey'
  | 'Ivory';

export type ItemColor = {
  id: string;
  item_id: string;
  name: string;
  hex: string;
  /** generated column — public.colour_family(hex) */
  family: ColourFamily;
  display_order: number;
};

export type ItemMedia = {
  id: string;
  item_id: string;
  public_id: string;
  url: string;
  kind: MediaKind;
  is_cover: boolean;
  display_order: number;
};

export type Enquiry = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string;
  interest: string | null;
  message: string | null;
  item_id: string | null;
  status: EnquiryStatus;
  created_at: string;
  updated_at: string;
};

export type EnquiryNote = {
  id: string;
  enquiry_id: string;
  note: string | null;
  status_from: EnquiryStatus | null;
  status_to: EnquiryStatus | null;
  staff_id: string | null;
  created_at: string;
};

export type ShopSettings = {
  id: boolean;
  name: string;
  address: string;
  whatsapp: string;
  phone: string | null;
  email: string | null;
  hours: string | null;
  lat: number;
  lng: number;
  updated_at: string;
};

// ---------- nested read shapes (match the storefront/admin queries) ----------

export type ItemWithRelations = Item & {
  item_colors: ItemColor[];
  item_media: ItemMedia[];
};

export type CollectionWithItems = Collection & {
  items: ItemWithRelations[];
};

export type EnquiryWithNotes = Enquiry & {
  enquiry_notes: EnquiryNote[];
};

// ---------- write shapes ----------

export type ItemInput = {
  collection_id: string;
  name: string;
  brand: string | null;
  base_price: number;
  base_color: string;
  badge: string | null;
  description: string | null;
  is_visible: boolean;
  display_order: number;
  stock_qty: number;
  low_stock_at: number;
  colors: { name: string; hex: string; display_order: number }[];
  media: {
    public_id: string;
    url: string;
    kind: MediaKind;
    is_cover: boolean;
    display_order: number;
  }[];
};

export type EnquiryInput = {
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string;
  interest: string | null;
  message: string | null;
  item_id: string | null;
};

export type ShopSettingsInput = Omit<ShopSettings, 'id' | 'updated_at'>;

// ---------- collection page filters ----------

/** Parsed from URL search params; applied in the query, never in the browser. */
export type CollectionFilters = {
  max: number | null;
  brands: string[];
  colours: ColourFamily[];
  /** free-text search against name, brand and badge */
  q: string;
  /** 1-based page index */
  page: number;
};

/** Slider bounds and chips, derived from the collection's own rows. */
export type FilterFacets = {
  priceFloor: number;
  priceTop: number;
  brands: string[];
  families: ColourFamily[];
};

export type CollectionPage = {
  collection: Collection;
  items: ItemWithRelations[];
  /** rows matching the filters */
  matched: number;
  /** rows in the collection regardless of filters */
  total: number;
  /** current page (1-based) */
  page: number;
  /** total pages at PAGE_SIZE */
  pages: number;
};
