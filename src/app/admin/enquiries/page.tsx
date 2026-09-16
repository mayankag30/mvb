import { listEnquiries, listItems } from '@/lib/data';
import StatusSelect from '@/components/admin/StatusSelect';
import NoteList from '@/components/admin/NoteList';

async function currentTime() {
  return Date.now();
}

export default async function EnquiriesPage() {
  const [enquiries, items, nowMs] = await Promise.all([
    listEnquiries(),
    listItems(),
    currentTime(),
  ]);
  const itemName = new Map(items.map((i) => [i.id, i.name]));

  const week = enquiries.filter(
    (e) => Date.parse(e.created_at) > nowMs - 7 * 86_400_000,
  ).length;

  return (
    <section className="page">
      <div className="ptop">
        <div>
          <h1 className="ph">Enquiries</h1>
          <p className="psub">
            Every enquiry starts at Arrived. Move it along as you speak to the
            customer.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="ptitle">
          <span>{week} THIS WEEK</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>CUSTOMER</th>
              <th>CONTACT</th>
              <th>LOOKING FOR</th>
              <th>MESSAGE</th>
              <th>RECEIVED</th>
              <th>STATUS</th>
              <th>NOTE</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((e) => (
              <tr key={e.id}>
                <td>
                  <span className="iname" style={{ fontSize: 15 }}>
                    {e.name}
                  </span>
                  <br />
                  <span className="ibrand">{e.email ?? '—'}</span>
                </td>
                <td>
                  <a
                    href={`https://wa.me/${e.whatsapp.replace(/[^\d]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {e.whatsapp}
                  </a>
                  {e.phone && (
                    <>
                      <br />
                      <span className="ibrand">{e.phone}</span>
                    </>
                  )}
                </td>
                <td>
                  {e.interest ?? '—'}
                  {e.item_id && (
                    <>
                      <br />
                      <span className="ibrand">
                        {itemName.get(e.item_id) ?? 'Item removed'}
                      </span>
                    </>
                  )}
                </td>
                <td style={{ maxWidth: 260, fontSize: 13.5, color: '#5C5175' }}>
                  {e.message ?? '—'}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {new Date(e.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </td>
                <td>
                  <StatusSelect enquiryId={e.id} status={e.status} />
                </td>
                <td>
                  <NoteList notes={e.enquiry_notes} />
                </td>
              </tr>
            ))}
            {!enquiries.length && (
              <tr>
                <td colSpan={7} className="empty">
                  No enquiries yet. They arrive here from the storefront form.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
