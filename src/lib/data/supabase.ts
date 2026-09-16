// Phase 2. Implements the same contract as mock.ts against Supabase.
// Not wired until DATA_SOURCE=supabase; see SPEC.md step 14.
/* eslint-disable @typescript-eslint/no-unused-vars -- signatures are the contract */

const NOT_READY = 'Supabase data layer not implemented yet (Phase 2, SPEC.md step 14).';

function todo(): never {
  throw new Error(NOT_READY);
}

export async function getCollectionsWithItems() { todo(); }
export async function getShopSettings() { todo(); }
export async function listCollections() { todo(); }
export async function listItems() { todo(); }
export async function getItem(_itemId: string) { todo(); }
export async function createItem(_input: unknown) { todo(); }
export async function updateItem(_itemId: string, _input: unknown) { todo(); }
export async function setItemVisibility(_itemId: string, _isVisible: boolean) { todo(); }
export async function deleteItem(_itemId: string) { todo(); }
export async function createEnquiry(_input: unknown) { todo(); }
export async function listEnquiries() { todo(); }
export async function updateEnquiryStatus(
  _enquiryId: string,
  _status: unknown,
  _note: string | null,
  _staffId: string | null,
) { todo(); }
export async function updateShopSettings(_input: unknown) { todo(); }
export async function listStaff() { todo(); }
export async function uploadMedia(_file: unknown) { todo(); }

// ---------- collection page: filters and facets ----------
//
// Filtering happens in the database (SPEC §8c). Do not fetch the collection
// and filter in the browser: the response must contain matched rows only.
//
//   let q = supabase.from('items')
//     .select('*, item_colors(*), item_media(*)')
//     .eq('collection_id', collection.id)
//     .order('display_order');
//
//   if (max)            q = q.lte('base_price', max);
//   if (brands.length)  q = q.in('brand', brands);
//   if (colours.length) q = q.in('item_colors.family', colours);
//
// Bounds come from min/max(base_price) in that collection rounded out to the
// nearest 1000, and the facets from the distinct brands and item_colors.family
// actually present — never hardcoded.
export async function getCollectionBySlug(_slug: string, _filters: unknown) { todo(); }
export async function getFilterFacets(_slug: string) { todo(); }
export async function listBrandNames() { todo(); }
export async function getBrandItemCount(_name: string | null) { todo(); }
export async function renameBrand(_oldName: string, _newName: string) { todo(); }
export async function deleteBrand(_name: string) { todo(); }
export async function createBrand(_name: string) { todo(); }
export async function deleteEnquiryNote(_noteId: string) { todo(); }
