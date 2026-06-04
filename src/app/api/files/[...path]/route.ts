import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/api-client/public-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await context.params;
  const segment = path.map((part) => encodeURIComponent(part)).join('/');
  const search = request.nextUrl.search;

  const auth =
    request.headers.get('authorization') ??
    (request.headers.get('x-auth-token')
      ? `Bearer ${request.headers.get('x-auth-token')}`
      : null);

  const target = `${API_URL.replace(/\/$/, '')}/${segment}${search}`;

  const upstream = await fetch(target, {
    method: 'GET',
    headers: {
      Accept: '*/*',
      ...(auth ? { Authorization: auth } : {}),
    },
    cache: 'no-store',
  });

  if (!upstream.ok) {
    return NextResponse.json({ message: 'Letöltés sikertelen.' }, { status: upstream.status });
  }

  const contentType = upstream.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return NextResponse.json({ message: 'Letöltés sikertelen.' }, { status: 502 });
  }

  const buffer = await upstream.arrayBuffer();
  if (buffer.byteLength === 0) {
    return NextResponse.json({ message: 'Letöltés sikertelen.' }, { status: 502 });
  }

  const headers = new Headers();
  const disposition = upstream.headers.get('content-disposition');
  if (disposition) headers.set('Content-Disposition', disposition);
  if (contentType) headers.set('Content-Type', contentType);
  headers.set('Content-Length', String(buffer.byteLength));

  return new NextResponse(buffer, {
    status: upstream.status,
    headers,
  });
}
