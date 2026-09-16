// Semantic fingerprint of the rendered site: the facts a correct data-layer
// swap must preserve exactly. Ignores build ids, chunk names, RSC framing.
const BASE = process.argv[2] || 'http://localhost:3000';
const COOKIE = process.argv[3] || 'mvb_dev_session=1';

async function get(p, auth=false) {
  const r = await fetch(BASE+p, auth?{headers:{cookie:COOKIE}}:undefined);
  const raw = await r.text();
  return {status:r.status, html: raw.replaceAll('<!-- -->','')};
}

const out = {};
const opts = (html, id) => {
  const m = html.match(new RegExp('<select id="'+id+'"[\\s\\S]*?</select>'));
  return m ? [...m[0].matchAll(/<option[^>]*>([^<]*)/g)].map(x=>x[1]) : [];
};

// storefront pages: tiles with every displayed field
for (const slug of ['lehengas','sarees','suits','gowns','extras']) {
  const {status, html} = await get('/collections/'+slug);
  const names  = [...html.matchAll(/<h3 class="tile-name">([^<]*)/g)].map(m=>m[1]);
  const brands = [...html.matchAll(/<p class="tile-brand">([^<]*)/g)].map(m=>m[1].trim());
  const prices = [...html.matchAll(/<span class="tile-price">([^<]*)/g)].map(m=>m[1]);
  const stock  = [...html.matchAll(/class="tile-stock[^"]*">(?:<i[^>]*><\/i>)?([^<]*)/g)].map(m=>m[1].trim());
  const badges = [...html.matchAll(/<span class="tile-badge">([^<]*)/g)].map(m=>m[1]);
  const sold   = (html.match(/class="tile sold"/g)||[]).length;
  const count  = (html.match(/<span class="cv-count">([^<]*)/)||[])[1];
  out['collection:'+slug] = {status, count, n:names.length, names, brands, prices, stock, badges, sold};
}

// front page
{
  const {status, html} = await get('/');
  out['front'] = {
    status,
    sections: [...html.matchAll(/<section class="world" id="([a-z]+)"/g)].map(m=>m[1]),
    racks: (html.match(/class="rack/g)||[]).length,
    tiles: (html.match(/class="tile[ "]/g)||[]).length,
    seeAll: [...html.matchAll(/<span>See all (?:<!-- -->)?([^<]*)/g)].map(m=>m[1]),
    kicker: (html.match(/class="hero-kicker">([^<]*)/)||[])[1],
    vlines: [...html.matchAll(/<dt>([A-Z]+)<\/dt><dd[^>]*>([\s\S]*?)<\/dd>/g)]
      .map(m=>m[1]+'='+m[2].replace(/<[^>]+>/g,'').replace(/<!-- -->/g,'').trim()),
    extras: (html.match(/class="extra"/g)||[]).length,
  };
}

// admin pages
{
  const {status, html} = await get('/admin', true);
  out['admin:dash'] = {status,
    cards: [...html.matchAll(/<p class="k">([^<]*)<\/p><p class="v">([^<]*)/g)].map(m=>m[1]+'='+m[2]),
    rows: (html.match(/<tbody>[\s\S]*?<\/tbody>/)||[''])[0].split('<tr>').length-1,
  };
}
{
  const {status, html} = await get('/admin/inventory', true);
  out['admin:inventory'] = {status,
    // headers may wrap their label in a sort button, so strip tags rather
    // than requiring bare text
    th: [...html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)]
      .map(m=>m[1].replace(/<[^>]+>/g,'').replace(/[\u25b2\u25bc]/g,'').trim()||'(blank)'),
    rows: (html.match(/class="thumb"/g)||[]).length,
    itemsLabel: (html.match(/(\d+) ITEMS/)||[])[1],
    noBrand: (html.match(/No brand/g)||[]).length,
    low: (html.match(/RUNNING LOW/g)||[]).length,
    out: (html.match(/SOLD OUT/g)||[]).length,
  };
}
{
  const {status, html} = await get('/admin/enquiries', true);
  out['admin:enquiries'] = {status,
    names: [...html.matchAll(/class="iname" style="font-size:15px">([^<]*)/g)].map(m=>m[1]),
    pills: [...html.matchAll(/class="pill p-[a-z]+">([^<]*)/g)].map(m=>m[1]),
    week: (html.match(/(\d+) THIS WEEK/)||[])[1],
  };
}
{
  const {status, html} = await get('/admin/shop', true);
  out['admin:shop'] = {status,
    values: [...html.matchAll(/name="(name|address|whatsapp|phone|email|hours|lat|lng)"[^>]*value="([^"]*)"/g)].map(m=>m[1]+'='+m[2]),
    textareas: [...html.matchAll(/name="address"[^>]*>([^<]*)/g)].map(m=>m[1]),
  };
}
{
  const {status, html} = await get('/admin/inventory/new', true);
  out['admin:newitem'] = {status,
    brandOptions: opts(html, 'f-brand'),
    collOptions: opts(html, 'f-collection'),
  };
}
console.log(JSON.stringify(out, null, 1));
