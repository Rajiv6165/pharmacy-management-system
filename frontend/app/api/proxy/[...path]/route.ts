import { NextRequest, NextResponse } from 'next/server';

async function handleProxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathString = path.join('/');

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const url = new URL(req.url);
    const targetUrl = `${backendUrl}/${pathString}${url.search}`;

    const token = req.cookies.get('token')?.value;

    const headers = new Headers();
    // Copy essential headers
    const contentType = req.headers.get('content-type');
    if (contentType) {
      headers.set('content-type', contentType);
    }
    const accept = req.headers.get('accept');
    if (accept) {
      headers.set('accept', accept);
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let body: any = undefined;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const cType = req.headers.get('content-type') || '';
      if (cType.includes('multipart/form-data')) {
        // Forward dynamic multipart form data for prescription file uploads
        body = await req.formData();
        // Delete content-type header so fetch calculates boundary automatically
        headers.delete('content-type');
      } else {
        body = await req.text();
      }
    }

    const backendResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const resHeaders = new Headers();
    const resContentType = backendResponse.headers.get('content-type');
    if (resContentType) {
      resHeaders.set('content-type', resContentType);
    }

    let responseBody: any;
    if (resContentType && resContentType.includes('application/json')) {
      responseBody = JSON.stringify(await backendResponse.json());
    } else {
      responseBody = await backendResponse.text();
    }

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: resHeaders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || 'Proxy Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, context: any) {
  return handleProxy(req, context);
}

export async function POST(req: NextRequest, context: any) {
  return handleProxy(req, context);
}

export async function PUT(req: NextRequest, context: any) {
  return handleProxy(req, context);
}

export async function DELETE(req: NextRequest, context: any) {
  return handleProxy(req, context);
}
