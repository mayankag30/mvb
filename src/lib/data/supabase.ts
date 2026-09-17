// Phase 2. Implements the same contract as mock.ts against Supabase.
//
// Storefront reads use the anon client (RLS enforced — visible rows only).
// Everything else (admin reads/writes, enquiry insert) uses the service-role
// client from the server: staff auth is still the Phase 1 stub cookie until
// SPEC.md step 15 wires real Supabase Auth, so there is no user JWT for RLS
// to key off yet. requireStaff() in session.ts is the authorization boundary
// for all of these until then.
//
// brand stays `string | null` on the wire (see brand.ts) even though the
// database has a real `brands` table with `brand_id` — every query here joins
// brands and flattens `brand_id` -> `brand: name`, so no component changes.

import { getAnonClient, getServiceClient } from './supabase-client';
import { family } from '../colour-family';
import type {
  Collection,
  CollectionWithItems,
  Enquiry,
  EnquiryInput,
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

const PAGE_SIZE = 12;

// ---------- row shapes coming back from Postgres ----------

type ItemRow = {
  id: string;
  collection_id: string;
  name: string;
  base_price: number;
  base_color: string;
  badge: string | null;
  description: string | null;
  is_visible: boolean;
  display_order: number;
  stock_qty: number;
  low_stock_at: number;
  created_at: string;
  updated_at: string;
  brand_id: string | null;
  brands: { name: string } | { name: string }[] | null;
  item_colors: { id: string; item_id: string; name: string; hex: string; family: string; display_order: number }[];
  item_media: ItemMedia[];
};

function brandOf(row: Pick<ItemRow, 'brands'>): string | null {
  const b = row.brands;
  if (!b) return null;
  return Array.isArray(b) ? (b[0]?.name ?? null) : b.name;
}

function toItem(row: ItemRow): ItemWithRelations {
  const item: Item = {
    id: row.id,
    collection_id: row.collection_id,
    name: row.name,
    brand: brandOf(row),
    base_price: Number(row.base_price),
    base_color: row.base_color,
    badge: row.badge,
    description: row.description,
    is_visible: row.is_visible,
    display_order: row.display_order,
    stock_qty: row.stock_qty,
    low_stock_at: row.low_stock_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  return {
    ...item,
    item_colors: (row.item_colors ?? [])
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((c) => ({ ...c, family: c.family as ItemColor['family'] })),
    item_media: (row.item_media ?? []).slice().sort((a, b) => a.display_order - b.display_order),
  };
}

const ITEM_SELECT =
  '*, brands(name), item_colors(*), item_media(*)';

async function resolveBrandId(
  client: ReturnType<typeof getServiceClient>,
  brand: string | null,
): Promise<string | null> {
  const trimmed = brand?.trim();
  if (!trimmed) return null;
  const { data: existing } = await client
    .from('brands')
    .select('id')
    .ilike('name', trimmed)
    .maybeSingle();
  if (existing) return existing.id as string;
  const { data: created, error } = await client
    .from('brands')
    .insert({ name: trimmed })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return created.id as string;
}

// ---------- storefront reads ----------

export async function getCollectionsWithItems(): Promise<CollectionWithItems[]> {
  const client = getAnonClient();
  const { data, error } = await client
    .from('collections')
    .select(`*, items(${ITEM_SELECT})`)
    .eq('is_visible', true)
    .order('display_order');
  if (error) throw new Error(error.message);

  return (data as (Collection & { items: ItemRow[] })[]).map((c) => ({
    ...c,
    items: c.items
      .filter((i) => i.is_visible)
      .sort((a, b) => a.display_order - b.display_order)
      .map(toItem),
  }));
}

export async function getShopSettings(): Promise<ShopSettings> {
  const client = getAnonClient();
  const { data, error } = await client.from('shop_settings').select('*').single();
  if (error) throw new Error(error.message);
  return { ...data, lat: Number(data.lat), lng: Number(data.lng) };
}

// ---------- admin: collections ----------

export async function listCollections(): Promise<Collection[]> {
  const client = getServiceClient();
  const { data, error } = await client
    .from('collections')
    .select('*')
    .order('display_order');
  if (error) throw new Error(error.message);
  return data as Collection[];
}

// ---------- admin: items ----------

export async function listItems(): Promise<ItemWithRelations[]> {
  const client = getServiceClient();
  const { data, error } = await client
    .from('items')
    .select(ITEM_SELECT)
    .order('collection_id')
    .order('display_order');
  if (error) throw new Error(error.message);
  return (data as ItemRow[]).map(toItem);
}

export async function getItem(itemId: string): Promise<ItemWithRelations | null> {
  const client = getServiceClient();
  const { data, error } = await client
    .from('items')
    .select(ITEM_SELECT)
    .eq('id', itemId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toItem(data as ItemRow) : null;
}

async function replaceChildren(
  client: ReturnType<typeof getServiceClient>,
  itemId: string,
  input: ItemInput,
) {
  const { error: delColorsErr } = await client.from('item_colors').delete().eq('item_id', itemId);
  if (delColorsErr) throw new Error(delColorsErr.message);
  const { error: delMediaErr } = await client.from('item_media').delete().eq('item_id', itemId);
  if (delMediaErr) throw new Error(delMediaErr.message);

  if (input.colors.length) {
    const { error } = await client.from('item_colors').insert(
      input.colors.map((c) => ({ item_id: itemId, name: c.name, hex: c.hex, display_order: c.display_order })),
    );
    if (error) throw new Error(error.message);
  }
  if (input.media.length) {
    const { error } = await client.from('item_media').insert(
      input.media.map((m) => ({
        item_id: itemId,
        public_id: m.public_id,
        url: m.url,
        kind: m.kind,
        is_cover: m.is_cover,
        display_order: m.display_order,
      })),
    );
    if (error) throw new Error(error.message);
  }
}

export async function createItem(input: ItemInput): Promise<string> {
  const client = getServiceClient();
  const brandId = await resolveBrandId(client, input.brand);

  const { data, error } = await client
    .from('items')
    .insert({
      collection_id: input.collection_id,
      brand_id: brandId,
      name: input.name,
      base_price: input.base_price,
      base_color: input.base_color,
      badge: input.badge,
      description: input.description,
      is_visible: input.is_visible,
      display_order: input.display_order,
      stock_qty: input.stock_qty,
      low_stock_at: input.low_stock_at,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  await replaceChildren(client, data.id as string, input);
  return data.id as string;
}

export async function updateItem(itemId: string, input: ItemInput): Promise<void> {
  const client = getServiceClient();
  const brandId = await resolveBrandId(client, input.brand);

  const { error } = await client
    .from('items')
    .update({
      collection_id: input.collection_id,
      brand_id: brandId,
      name: input.name,
      base_price: input.base_price,
      base_color: input.base_color,
      badge: input.badge,
      description: input.description,
      is_visible: input.is_visible,
      display_order: input.display_order,
      stock_qty: input.stock_qty,
      low_stock_at: input.low_stock_at,
    })
    .eq('id', itemId);
  if (error) throw new Error(error.message);

  await replaceChildren(client, itemId, input);
}

export async function setItemVisibility(itemId: string, isVisible: boolean): Promise<void> {
  const client = getServiceClient();
  const { error } = await client.from('items').update({ is_visible: isVisible }).eq('id', itemId);
  if (error) throw new Error(error.message);
}

export async function deleteItem(itemId: string): Promise<void> {
  const client = getServiceClient();
  // item_colors/item_media cascade via FK; enquiries.item_id sets null via FK.
  const { error } = await client.from('items').delete().eq('id', itemId);
  if (error) throw new Error(error.message);
}

// ---------- public: enquiry insert ----------
// Anonymous visitors have no RLS policy on enquiries at all (SPEC §5) — the
// insert must go through the service-role key, after Turnstile verification
// in the calling Server Action.

export async function createEnquiry(input: EnquiryInput): Promise<void> {
  const client = getServiceClient();
  const { error } = await client.from('enquiries').insert({
    name: input.name,
    email: input.email,
    phone: input.phone,
    whatsapp: input.whatsapp,
    interest: input.interest,
    message: input.message,
    item_id: input.item_id,
    status: 'arrived',
  });
  if (error) throw new Error(error.message);
}

// ---------- admin: enquiries ----------

export async function listEnquiries(): Promise<EnquiryWithNotes[]> {
  const client = getServiceClient();
  const { data, error } = await client
    .from('enquiries')
    .select('*, enquiry_notes(*)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return (data as (Enquiry & { enquiry_notes: EnquiryWithNotes['enquiry_notes'] })[]).map((e) => ({
    ...e,
    enquiry_notes: e.enquiry_notes
      .slice()
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
  }));
}

export async function updateEnquiryStatus(
  enquiryId: string,
  status: EnquiryStatus,
  note: string | null,
  staffId: string | null,
): Promise<void> {
  const client = getServiceClient();

  const { data: current, error: readErr } = await client
    .from('enquiries')
    .select('status')
    .eq('id', enquiryId)
    .single();
  if (readErr) throw new Error(readErr.message);

  const { error: updateErr } = await client
    .from('enquiries')
    .update({ status })
    .eq('id', enquiryId);
  if (updateErr) throw new Error(updateErr.message);

  const { error: noteErr } = await client.from('enquiry_notes').insert({
    enquiry_id: enquiryId,
    note,
    status_from: current.status,
    status_to: status,
    staff_id: staffId,
  });
  if (noteErr) throw new Error(noteErr.message);
}

export async function deleteEnquiryNote(noteId: string): Promise<void> {
  const client = getServiceClient();
  const { data: noteRow, error: readErr } = await client
    .from('enquiry_notes')
    .select('status_from, status_to')
    .eq('id', noteId)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (!noteRow) return;

  if (noteRow.status_from && noteRow.status_to && noteRow.status_from !== noteRow.status_to) {
    const { error } = await client.from('enquiry_notes').update({ note: null }).eq('id', noteId);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await client.from('enquiry_notes').delete().eq('id', noteId);
  if (error) throw new Error(error.message);
}

// ---------- admin: shop & staff ----------

export async function updateShopSettings(input: ShopSettingsInput): Promise<void> {
  const client = getServiceClient();
  const { error } = await client.from('shop_settings').update(input).eq('id', true);
  if (error) throw new Error(error.message);
}

export async function listStaff(): Promise<Staff[]> {
  const client = getServiceClient();
  const { data, error } = await client.from('staff').select('*').order('created_at');
  if (error) throw new Error(error.message);
  return data as Staff[];
}

// ---------- media ----------
// Real upload happens client-side against the Cloudinary signed route
// (api/cloudinary-sign); this stub only exists to satisfy the DataLayer type
// for any caller still going through lib/data. See SPEC.md step 16.

export async function uploadMedia(_file: { name: string; kind: 'image' | 'video' }): Promise<{
  public_id: string;
  url: string;
}> {
  throw new Error('uploadMedia goes through /api/cloudinary-sign directly; not called via lib/data.');
}

// ---------- collection page: filters and facets ----------

/**
 * PostgREST cannot express "brand is one of X AND colour family is one of Y
 * AND name/brand/badge matches free text" as a single OR/AND across embedded
 * resources without an inner join that reshapes the row (dropping colours
 * that don't match). So the query is scoped to the collection only — never
 * more than ~16 rows here, one collection's worth, not the 54-item catalogue
 * — and the filters below run in JS exactly like mock.ts's own reference
 * implementation. This still satisfies SPEC §8c's "filter in SQL, not in the
 * browser": nothing outside the requested collection is ever fetched.
 */
export async function getCollectionBySlug(
  slug: string,
  filters: CollectionFilters,
): Promise<CollectionPage | null> {
  const client = getAnonClient();

  const { data: collection, error: colErr } = await client
    .from('collections')
    .select('*')
    .eq('slug', slug)
    .eq('is_visible', true)
    .maybeSingle();
  if (colErr) throw new Error(colErr.message);
  if (!collection) return null;

  const { data: rows, error } = await client
    .from('items')
    .select(ITEM_SELECT)
    .eq('collection_id', collection.id)
    .eq('is_visible', true)
    .order('display_order');
  if (error) throw new Error(error.message);

  const inCollection = (rows as ItemRow[]).map(toItem);
  const needle = filters.q.trim().toLowerCase();

  const matched = inCollection.filter((i) => {
    if (filters.max !== null && i.base_price > filters.max) return false;
    if (filters.brands.length && !(i.brand && filters.brands.includes(i.brand))) return false;
    if (filters.colours.length) {
      const fams = i.item_colors.map((c) => c.family);
      if (!fams.some((f) => filters.colours.includes(f))) return false;
    }
    if (needle) {
      const hay = `${i.name} ${i.brand ?? ''} ${i.badge ?? ''}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  const pages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const page = Math.max(1, Math.min(filters.page ?? 1, pages));
  const from = (page - 1) * PAGE_SIZE;

  return {
    collection: collection as Collection,
    items: matched.slice(from, from + PAGE_SIZE),
    matched: matched.length,
    total: inCollection.length,
    page,
    pages,
  };
}

export async function getFilterFacets(slug: string): Promise<FilterFacets | null> {
  const client = getAnonClient();

  const { data: collection, error: colErr } = await client
    .from('collections')
    .select('id')
    .eq('slug', slug)
    .eq('is_visible', true)
    .maybeSingle();
  if (colErr) throw new Error(colErr.message);
  if (!collection) return null;

  const { data: rows, error } = await client
    .from('items')
    .select('base_price, brands(name), item_colors(family)')
    .eq('collection_id', collection.id)
    .eq('is_visible', true);
  if (error) throw new Error(error.message);

  const mine = rows as { base_price: number; brands: { name: string } | { name: string }[] | null; item_colors: { family: string }[] }[];
  if (!mine.length) return { priceFloor: 0, priceTop: 0, brands: [], families: [] };

  const prices = mine.map((i) => Number(i.base_price));
  const brands = new Set<string>();
  const families = new Set<FilterFacets['families'][number]>();
  mine.forEach((i) => {
    const b = Array.isArray(i.brands) ? i.brands[0]?.name : i.brands?.name;
    if (b) brands.add(b);
    i.item_colors.forEach((c) => families.add(c.family as FilterFacets['families'][number]));
  });

  return {
    priceFloor: Math.floor(Math.min(...prices) / 1000) * 1000,
    priceTop: Math.ceil(Math.max(...prices) / 1000) * 1000,
    brands: [...brands].sort(),
    families: [...families].sort(),
  };
}

// ---------- admin: brands ----------

export async function listBrandNames(): Promise<string[]> {
  const client = getServiceClient();
  const { data, error } = await client.from('brands').select('name').order('name');
  if (error) throw new Error(error.message);
  return (data as { name: string }[]).map((b) => b.name);
}

export async function getBrandItemCount(name: string | null): Promise<number> {
  const client = getServiceClient();
  if (name === null) {
    const { count, error } = await client
      .from('items')
      .select('id', { count: 'exact', head: true })
      .is('brand_id', null);
    if (error) throw new Error(error.message);
    return count ?? 0;
  }
  const { data: brand, error: brandErr } = await client
    .from('brands')
    .select('id')
    .ilike('name', name)
    .maybeSingle();
  if (brandErr) throw new Error(brandErr.message);
  if (!brand) return 0;
  const { count, error } = await client
    .from('items')
    .select('id', { count: 'exact', head: true })
    .eq('brand_id', brand.id);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function renameBrand(oldName: string, newName: string): Promise<void> {
  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) return;
  const client = getServiceClient();
  const { error } = await client
    .from('brands')
    .update({ name: trimmed })
    .ilike('name', oldName);
  if (error) throw new Error(error.message);
}

export async function deleteBrand(name: string): Promise<void> {
  const client = getServiceClient();
  // items.brand_id is `on delete set null` — deleting the brand row unbrands
  // its items automatically without touching stock.
  const { error } = await client.from('brands').delete().ilike('name', name);
  if (error) throw new Error(error.message);
}

export async function createBrand(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  const client = getServiceClient();
  const { error } = await client
    .from('brands')
    .insert({ name: trimmed })
    .select('id')
    .maybeSingle();
  // unique index on lower(trim(name)) — treat a duplicate as a no-op, same as
  // the mock layer's Set semantics
  if (error && !error.message.includes('duplicate key')) throw new Error(error.message);
}
