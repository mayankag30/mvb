import Link from 'next/link';
import { listEnquiries, listItems } from '@/lib/data';
import { STATUS_LABELS, type EnquiryStatus } from '@/lib/data/types';

/** .pill class per design-reference/admin.html. */
const PILL: Record<EnquiryStatus, string> = {
  arrived: 'p-arr',
  contacted: 'p-con',
  in_discussion: 'p-dis',
  order_placed: 'p-ord',
  resolved: 'p-res',
  closed: 'p-clo',
};

async function currentTime() {
  return Date.now();
}

export default async function Dashboard() {
  const [items, enquiries, nowMs] = await Promise.all([
    listItems(),
    listEnquiries(),
    currentTime(),
  ]);

  const week = enquiries.filter(
    (e) => Date.parse(e.created_at) > nowMs - 7 * 86_400_000,
  );
  const newEnq = enquiries.filter((e) => e.status === 'arrived');
  const hidden = items.filter((i) => !i.is_visible);
  const soldOut = items.filter((i) => i.stock_qty === 0);
  const low = items.filter((i) => i.stock_qty <= i.low_stock_at);

  // most asked: the commonest interest this week
  const tally = new Map<string, number>();
  week.forEach((e) => {
    if (e.interest) tally.set(e.interest, (tally.get(e.interest) ?? 0) + 1);
  });
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];

  const today = new Date(nowMs).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className="page">
      <div className="ptop">
        <div>
          <h1 className="ph">Dashboard</h1>
          <p className="psub">{today}</p>
        </div>
      </div>

      <div className="cards">
        <div className="card">
          <p className="k">NEW ENQUIRIES</p>
          <p className="v">{newEnq.length}</p>
          <p className="d">not yet contacted</p>
        </div>
        <div className="card">
          <p className="k">ITEMS LIVE</p>
          <p className="v">{items.length - hidden.length}</p>
          <p className="d">{hidden.length} hidden from site</p>
        </div>
        <div className="card">
          <p className="k">THIS WEEK</p>
          <p className="v">{week.length}</p>
          <p className="d">enquiries received</p>
        </div>
        <div className="card">
          <p className="k">MOST ASKED</p>
          <p className="v">{top ? top[0] : '—'}</p>
          <p className="d">
            {top ? `${top[1]} of ${week.length} enquiries` : 'no enquiries yet'}
          </p>
        </div>
        <div className="card">
          <p className="k">RUNNING LOW</p>
          <p className="v">{low.length}</p>
          <p className="d">
            {items[0]?.low_stock_at ?? 3} or fewer left · {soldOut.length} sold out
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="ptitle">
          <span>LATEST ENQUIRIES</span>
          <Link className="lk" href="/admin/enquiries">
            See all
          </Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>NAME</th>
              <th>WHATSAPP</th>
              <th>LOOKING FOR</th>
              <th>RECEIVED</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.slice(0, 6).map((e) => (
              <tr key={e.id}>
                <td>
                  <span className="iname">{e.name}</span>
                </td>
                <td>{e.whatsapp}</td>
                <td>{e.interest ?? '—'}</td>
                <td>{when(e.created_at, nowMs)}</td>
                <td>
                  <span className={`pill ${PILL[e.status]}`}>
                    {STATUS_LABELS[e.status]}
                  </span>
                </td>
              </tr>
            ))}
            {!enquiries.length && (
              <tr>
                <td colSpan={5} className="empty">
                  No enquiries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function when(iso: string, nowMs: number) {
  const mins = Math.round((nowMs - Date.parse(iso)) / 60_000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} d ago`;
}
