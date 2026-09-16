// Single seam between the app and its data source.
// Components must import from here, never from mock.ts or supabase.ts directly.

import type {
  Collection,
  CollectionWithItems,
  EnquiryInput,
  EnquiryStatus,
  EnquiryWithNotes,
  ItemInput,
  ItemWithRelations,
  ShopSettings,
  ShopSettingsInput,
  Staff,
  CollectionFilters,
  CollectionPage,
  FilterFacets,
} from './types';

export type DataLayer = {
  getCollectionsWithItems(): Promise<CollectionWithItems[]>;
  getCollectionBySlug(
    slug: string,
    filters: CollectionFilters,
  ): Promise<CollectionPage | null>;
  getFilterFacets(slug: string): Promise<FilterFacets | null>;
  listBrandNames(): Promise<string[]>;
  getBrandItemCount(name: string | null): Promise<number>;
  renameBrand(oldName: string, newName: string): Promise<void>;
  deleteBrand(name: string): Promise<void>;
  createBrand(name: string): Promise<void>;
  deleteEnquiryNote(noteId: string): Promise<void>;
  getShopSettings(): Promise<ShopSettings>;
  listCollections(): Promise<Collection[]>;
  listItems(): Promise<ItemWithRelations[]>;
  getItem(itemId: string): Promise<ItemWithRelations | null>;
  createItem(input: ItemInput): Promise<string>;
  updateItem(itemId: string, input: ItemInput): Promise<void>;
  setItemVisibility(itemId: string, isVisible: boolean): Promise<void>;
  deleteItem(itemId: string): Promise<void>;
  createEnquiry(input: EnquiryInput): Promise<void>;
  listEnquiries(): Promise<EnquiryWithNotes[]>;
  updateEnquiryStatus(
    enquiryId: string,
    status: EnquiryStatus,
    note: string | null,
    staffId: string | null,
  ): Promise<void>;
  updateShopSettings(input: ShopSettingsInput): Promise<void>;
  listStaff(): Promise<Staff[]>;
  uploadMedia(file: {
    name: string;
    kind: 'image' | 'video';
  }): Promise<{ public_id: string; url: string }>;
};

async function load(): Promise<DataLayer> {
  return process.env.DATA_SOURCE === 'supabase'
    ? ((await import('./supabase')) as unknown as DataLayer)
    : ((await import('./mock')) as unknown as DataLayer);
}

export const getCollectionsWithItems: DataLayer['getCollectionsWithItems'] = async () =>
  (await load()).getCollectionsWithItems();
export const getShopSettings: DataLayer['getShopSettings'] = async () =>
  (await load()).getShopSettings();
export const listCollections: DataLayer['listCollections'] = async () =>
  (await load()).listCollections();
export const listItems: DataLayer['listItems'] = async () => (await load()).listItems();
export const getItem: DataLayer['getItem'] = async (itemId) =>
  (await load()).getItem(itemId);
export const createItem: DataLayer['createItem'] = async (input) =>
  (await load()).createItem(input);
export const updateItem: DataLayer['updateItem'] = async (itemId, input) =>
  (await load()).updateItem(itemId, input);
export const setItemVisibility: DataLayer['setItemVisibility'] = async (id, visible) =>
  (await load()).setItemVisibility(id, visible);
export const deleteItem: DataLayer['deleteItem'] = async (itemId) =>
  (await load()).deleteItem(itemId);
export const createEnquiry: DataLayer['createEnquiry'] = async (input) =>
  (await load()).createEnquiry(input);
export const listEnquiries: DataLayer['listEnquiries'] = async () =>
  (await load()).listEnquiries();
export const updateEnquiryStatus: DataLayer['updateEnquiryStatus'] = async (
  enquiryId,
  status,
  note,
  staffId,
) => (await load()).updateEnquiryStatus(enquiryId, status, note, staffId);
export const updateShopSettings: DataLayer['updateShopSettings'] = async (input) =>
  (await load()).updateShopSettings(input);
export const listStaff: DataLayer['listStaff'] = async () => (await load()).listStaff();
export const uploadMedia: DataLayer['uploadMedia'] = async (file) =>
  (await load()).uploadMedia(file);

export const getCollectionBySlug: DataLayer['getCollectionBySlug'] = async (
  slug,
  filters,
) => (await load()).getCollectionBySlug(slug, filters);
export const getFilterFacets: DataLayer['getFilterFacets'] = async (slug) =>
  (await load()).getFilterFacets(slug);

export const listBrandNames: DataLayer['listBrandNames'] = async () =>
  (await load()).listBrandNames();
export const getBrandItemCount: DataLayer['getBrandItemCount'] = async (name) =>
  (await load()).getBrandItemCount(name);
export const renameBrand: DataLayer['renameBrand'] = async (oldName, newName) =>
  (await load()).renameBrand(oldName, newName);
export const deleteBrand: DataLayer['deleteBrand'] = async (name) =>
  (await load()).deleteBrand(name);
export const createBrand: DataLayer['createBrand'] = async (name) =>
  (await load()).createBrand(name);

export const deleteEnquiryNote: DataLayer['deleteEnquiryNote'] = async (noteId) =>
  (await load()).deleteEnquiryNote(noteId);

export * from './types';
