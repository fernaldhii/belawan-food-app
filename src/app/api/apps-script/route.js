export async function POST(request) {
  try {
    const body = await request.json();

    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbynSw5l4D68MyuTZOI32HOtaXa7fLVDVG2Q3TY9qcR3m-R-D69XeRastfnlRkGujWYgsg/exec';

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    // coba parse JSON, kalau error kirim plain text
    try {
      const data = JSON.parse(text);
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(text, {
        status: response.status,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
