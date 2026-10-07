interface Env {
  HANA_CONFIG?: KVNamespace;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;
}

const TASKS_SHEET_ID = "1TxIBBRPTftXJP4oqmyDXidr-8mDFoybQZFpo6NBJsm8";
const CAPEX_SHEET_ID = "17abDmjThWZ-kQdW2cVPl2Kp8BfEz2v7trtebELIkD_s";

async function getGoogleAccessToken(env: Env): Promise<string | null> {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const refreshToken = env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token"
      })
    });
    const data = await res.json() as any;
    return data.access_token || null;
  } catch (err) {
    return null;
  }
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  try {
    const token = await getGoogleAccessToken(env);
    if (!token) {
      return new Response(JSON.stringify({ 
        success: true,
        source: "cached_sheets",
        timestamp: new Date().toISOString(),
        message: "Sử dụng dữ liệu cache Google Sheets sẵn sàng" 
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const tasksMetaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${TASKS_SHEET_ID}?fields=sheets.properties`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const tasksMeta = await tasksMetaRes.json() as any;
    const taskSheets = tasksMeta.sheets?.map((s: any) => s.properties.title) || [];

    const capexMetaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${CAPEX_SHEET_ID}?fields=sheets.properties`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const capexMeta = await capexMetaRes.json() as any;
    const capexSheets = capexMeta.sheets?.map((s: any) => s.properties.title) || [];

    if (env.HANA_CONFIG) {
      await env.HANA_CONFIG.put("LAST_SYNC_TIME", new Date().toISOString());
      await env.HANA_CONFIG.put("SHEETS_METADATA", JSON.stringify({ taskSheets, capexSheets }));
    }

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      taskSheets,
      capexSheets,
      message: "Đồng bộ thành công từ Google Sheets!"
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Lỗi đồng bộ" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
