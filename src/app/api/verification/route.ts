import { NextRequest, NextResponse } from 'next/server';

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
    `${BASEROW}/table/814/?user_field_names=true&filter__field_8388__link_row_has=${rowId}&order_by=-id&size=1`,
    { headers, next: { revalidate: 0 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'Baserow error', status: res.status }, { status: 502 });
  }

  const data = await res.json();
  const row = (data.results || [])[0] ?? null;

  if (!row) {
    return NextResponse.json({ found: false });
  }

  // Optionally fetch edit URL from table 640
  let editUrl: string | null = null;
  try {
    const r2 = await fetch(`${BASEROW}/table/640/${rowId}/?user_field_names=true`, { headers });
    if (r2.ok) {
      const d2 = await r2.json();
      editUrl = d2['URL FillOut Instalación'] ?? null;
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ found: true, row, editUrl });
}
