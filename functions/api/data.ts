interface Env {
  HANA_CONFIG?: KVNamespace;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const { env } = context;
    if (env.HANA_CONFIG) {
      const stored = await env.HANA_CONFIG.get('HANA_PROJECT_DATA', 'json');
      if (stored) {
        return new Response(JSON.stringify({ success: true, data: stored, source: 'kv' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    return new Response(JSON.stringify({ success: true, data: null, source: 'none' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { request, env } = context;
    const body = await request.json() as any;

    if (!env.HANA_CONFIG) {
      return new Response(JSON.stringify({ success: false, error: 'KV Namespace HANA_CONFIG chưa được binding' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Save full state to KV
    await env.HANA_CONFIG.put('HANA_PROJECT_DATA', JSON.stringify(body));

    return new Response(JSON.stringify({ success: true, message: 'Đã lưu thành công lên Cloudflare KV Database!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
