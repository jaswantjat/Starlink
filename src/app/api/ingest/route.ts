import { NextRequest, NextResponse } from 'next/server';

const BASEROW = 'https://baserow-production-1daf.up.railway.app/api/database/rows';
const TOKEN = 'Token ygblMAbPhFxJA2cixOi25nlGmj5DBLYQ';

/*
  POST /api/ingest
  Body (JSON) — sent by n8n:
  {
    "row_id": "123",
    "estado": "APROBADO" | "RECHAZADO",
    "total_score": 47,
    "safety_passed": true,
    "missing_evidence": "...",
    "score_execution": 14,
    "score_site": 9,
    "score_docs": 14,
    "score_education": 10,
    "ai_summary": "..."
  }
*/
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const rowId = body.row_id;
  if (!rowId) {
    return NextResponse.json({ error: 'Missing row_id' }, { status: 400 });
  }

  // Map incoming fields → Baserow field IDs (table 814)
  const baserowPayload: Record<string, unknown> = {
    field_8388: [{ id: Number(rowId) }], // link to table 640 row
    field_8376: body.estado ?? '',
    field_8378: body.total_score ?? 0,
    field_8379: body.safety_passed ?? false,
    field_8382: body.missing_evidence ?? '',
    field_8383: body.score_execution ?? 0,
    field_8384: body.score_site ?? 0,
    field_8385: body.score_docs ?? 0,
    field_8386: body.score_education ?? 0,
    field_8387: body.ai_summary ?? '',
  };

  const res = await fetch(`${BASEROW}/table/814/`, {
    method: 'POST',
    headers: {
      Authorization: TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(baserowPayload),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: 'Baserow error', detail: text }, { status: 502 });
  }

  const created = await res.json();
  return NextResponse.json({ ok: true, baserow_id: created.id });
}
