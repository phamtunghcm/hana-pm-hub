interface Env {
  RESEND_API_KEY?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { request, env } = context;
    const body = await request.json() as {
      apiKey?: string;
      recipient?: string;
      subject?: string;
      html?: string;
      text?: string;
    };

    const apiKey = (body.apiKey || env.RESEND_API_KEY || '').trim();
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'Chưa nhập Resend API Key. Vui lòng nhập mã re_... vào ô cấu hình.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const recipient = body.recipient || 'phamtunghcm@gmail.com';
    const toList = recipient.split(',').map(e => e.trim()).filter(Boolean);

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'HANA PM Hub <onboarding@resend.dev>',
        to: toList,
        subject: body.subject || '📌 [HANA PM Hub] Báo cáo Điều hành Dự án',
        html: body.html,
        text: body.text
      })
    });

    const resendData = await resendResp.json() as any;

    if (!resendResp.ok || resendData.error) {
      const msg = resendData.message || resendData.error?.message || resendData.name || `HTTP ${resendResp.status}`;
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Lỗi từ Resend.com (${resendResp.status}): ${msg}` 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: `Lỗi máy chủ: ${error.message}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
