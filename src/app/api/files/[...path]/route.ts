import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'https://osszhang-backend.fly.dev/api';

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

  const target = `${BACKEND_API}/${segment}${search}`;

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

  const headers = new Headers();
  const disposition = upstream.headers.get('content-disposition');
  const length = upstream.headers.get('content-length');
  if (disposition) headers.set('Content-Disposition', disposition);
  if (contentType) headers.set('Content-Type', contentType);
  if (length) headers.set('Content-Length', length);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
