import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASEROW = 'https://baserow-production-1daf.up.railway.app/api/database/rows';
const TOKEN = 'Token ygblMAbPhFxJA2cixOi25nlGmj5DBLYQ';

export async function GET(req: NextRequest) {
  const rowId = req.nextUrl.searchParams.get('row_id');
  if (!rowId) {
    return NextResponse.json({ error: 'Missing row_id' }, { status: 400 });
  }

  const headers = { Authorization: TOKEN, Accept: 'application/json' };

  // Query table 814 for the QA result linked to this row_id
  const res = await fetch(
    `${BASEROW}/table/814/?user_field_names=true&filter__field_8388__link_row_has=${rowId}`,
    { headers, next: { revalidate: 0 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'Baserow error', status: res.status }, { status: 502 });
  }

  const data = await res.json();
  const rows = data.results || [];

  // Sort by id descending so we always get the latest report
  rows.sort((a: any, b: any) => b.id - a.id);
  const row = rows[0] ?? null;

  if (!row) {
    return NextResponse.json({ found: false });
  }

  let editUrl: string | null = null;

  try {
    const r2 = await fetch(`${BASEROW}/table/640/${rowId}/?user_field_names=true`, { headers });
    if (r2.ok) {
      const d2 = await r2.json();
      const fetchedUrl = d2['URL FillOut Instalación'];

      const subRaw = d2['Empresa instaladora'];
      let sub = '';
      if (Array.isArray(subRaw) && subRaw.length > 0) {
        sub = subRaw[0].value || '';
      } else if (typeof subRaw === 'string') {
        sub = subRaw;
      }

      const orderId = d2['ID del Pedido'] || '';
      const customerName = d2['Nombre'] || '';
      const address = d2['Dirección'] || '';

      let starlinkId = d2['ID de Starlink'] || '';
      if (typeof starlinkId === 'string' && starlinkId.toUpperCase().startsWith('ACC')) {
        starlinkId = starlinkId.replace(/\s+/g, '');
      } else {
        starlinkId = '';
      }

      const params = new URLSearchParams();
      params.append('edit_form', 'True');
      params.append('row_id', rowId);
      if (sub) params.append('subcontrated', sub);
      if (orderId) params.append('order_id', orderId);
      if (customerName) params.append('customer_name', customerName);
      if (address) params.append('address', address);
      if (starlinkId) params.append('starlink_id', starlinkId);

      if (fetchedUrl && fetchedUrl.includes('_t=')) {
        editUrl = fetchedUrl + (fetchedUrl.includes('?') ? '&' : '?') + 'edit_form=True';
      } else {
        editUrl = `https://forms.starlink.eltex.es/t/8RpNqwgyxwus?${params.toString()}`;
      }
    } else {
      editUrl = `https://forms.starlink.eltex.es/t/8RpNqwgyxwus?row_id=${rowId}&edit_form=True`;
    }
  } catch {
    editUrl = `https://forms.starlink.eltex.es/t/8RpNqwgyxwus?row_id=${rowId}&edit_form=True`;
  }

  return NextResponse.json({ found: true, row, editUrl });
}
