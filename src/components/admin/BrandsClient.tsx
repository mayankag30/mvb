'use client';

import { useActionState, useState } from 'react';
import {
  createBrandAction,
  deleteBrandAction,
  renameBrandAction,
  type BrandFormState,
} from '@/app/admin/actions/brands';

type Brand = { name: string; count: number };

export default function BrandsClient({
  brands,
  unbranded,
}: {
  brands: Brand[];
  unbranded: number;
}) {
  return (
    <div className="grid2">
      <div className="panel">
        <div className="ptitle">
          <span>{brands.length} BRANDS</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>BRAND</th>
              <th>ITEMS</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <BrandRow key={b.name} brand={b} />
            ))}
            <tr>
              <td>
                <span className="ibrand" style={{ fontSize: 14 }}>
                  No brand
                </span>
              </td>
              <td>{unbranded}</td>
              <td>
                <span className="ibrand" style={{ fontSize: 12 }}>
                  Not a brand — items with none set
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <AddBrandForm />
    </div>
  );
}

function BrandRow({ brand }: { brand: Brand }) {
  const [renaming, setRenaming] = useState(false);
  const [renameState, renameAction, renamePending] = useActionState<
    BrandFormState,
    FormData
  >(async (_prev, fd) => {
    const result = await renameBrandAction(fd);
    if (!result) setRenaming(false);
    return result;
  }, null);

  if (renaming) {
    return (
      <tr>
        <td colSpan={2}>
          <form action={renameAction} style={{ display: 'flex', gap: 8 }}>
            <input type="hidden" name="old" value={brand.name} />
            <input
              name="name"
              defaultValue={brand.name}
              maxLength={80}
              required
              autoFocus
              style={{ flex: 1 }}
            />
            <button className="btn btn-p" type="submit" disabled={renamePending}>
              Save
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => setRenaming(false)}
            >
              Cancel
            </button>
          </form>
          {renameState?.error && (
            <span className="field-err">{renameState.error}</span>
          )}
        </td>
        <td />
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <span className="iname" style={{ fontSize: 15 }}>
          {brand.name}
        </span>
      </td>
      <td>{brand.count}</td>
      <td>
        <span className="rowacts">
          <button className="lk" type="button" onClick={() => setRenaming(true)}>
            Rename
          </button>
          <DeleteBrandButton brand={brand} />
        </span>
      </td>
    </tr>
  );
}

function DeleteBrandButton({ brand }: { brand: Brand }) {
  const [, deleteAction, pending] = useActionState<BrandFormState, FormData>(
    deleteBrandAction,
    null,
  );

  return (
    <form action={deleteAction} style={{ display: 'contents' }}>
      <input type="hidden" name="name" value={brand.name} />
      <button
        className="lk del"
        type="submit"
        disabled={pending}
        onClick={(e) => {
          if (brand.count > 0) {
            const msg =
              `Delete "${brand.name}"? This will unbrand ${brand.count} item${brand.count === 1 ? '' : 's'} — stock is unchanged.`;
            if (!confirm(msg)) e.preventDefault();
          }
        }}
      >
        Delete
      </button>
    </form>
  );
}

function AddBrandForm() {
  const [state, action, pending] = useActionState<BrandFormState, FormData>(
    createBrandAction,
    null,
  );

  return (
    <div className="fbox">
      <h3>Add a brand</h3>
      <form action={action}>
        <div className="f">
          <label htmlFor="new-brand-name">BRAND NAME</label>
          <input
            id="new-brand-name"
            name="name"
            placeholder="Kumaran Silks"
            maxLength={80}
            required
          />
          {state?.error && (
            <span className="field-err">{state.error}</span>
          )}
        </div>
        <div className="savebar">
          <button className="btn btn-p" type="submit" disabled={pending}>
            Add brand
          </button>
        </div>
        <p className="note">
          An item does not need a brand. Leave it as "No brand" for pieces
          stitched in-house or bought unbranded — those still appear everywhere
          on the website, just without a brand line.
        </p>
      </form>
    </div>
  );
}
