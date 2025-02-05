import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_BASE_URL = 'http://localhost:8001';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const targetUrl = `${PYTHON_API_BASE_URL}${url.pathname.replace('/api/python-proxy', '')}`;
  
  try {
    const response = await fetch(targetUrl);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to Python backend:', error);
    return NextResponse.json({ error: 'Failed to reach Python backend' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const targetUrl = `${PYTHON_API_BASE_URL}${url.pathname.replace('/api/python-proxy', '')}`;
  
  try {
    const formData = await request.formData();
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to Python backend:', error);
    return NextResponse.json({ error: 'Failed to reach Python backend' }, { status: 500 });
  }
} 