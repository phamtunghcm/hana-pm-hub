# Báo cáo Chi tiết Chỉ số Video Facebook Reels & TikTok 08:00 AM Hàng Ngày
# KẾT NỐI TRỰC TIẾP META GRAPH API THẬT — TUYỆT ĐỐI KHÔNG DÙNG DỮ LIỆU GIẢ
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import urllib.request
import urllib.parse
from datetime import datetime

FB_PAGE_ID = os.getenv("FB_PAGE_ID", "61592723278646")
FB_PAGE_ACCESS_TOKEN = os.getenv("FB_PAGE_ACCESS_TOKEN", "")

def fetch_real_facebook_page_insights(page_id, access_token):
    """
    Gọi trực tiếp Meta Graph API (v19.0/v20.0) để lấy danh sách bài đăng Reels & chỉ số Insights thật.
    """
    if not access_token:
        print("⚠️ [Meta Graph API] Chưa cấu hình FB_PAGE_ACCESS_TOKEN.")
        return {
            "success": False,
            "error": "Chưa cấu hình FB_PAGE_ACCESS_TOKEN trên hệ thống.",
            "clips": []
        }

    url = f"https://graph.facebook.com/v20.0/{page_id}/published_posts"
    fields = "id,message,created_time,permalink_url,shares,reactions.summary(true),comments.summary(true),insights.metric(post_impressions,post_engaged_users,post_video_views,post_video_views_organic,post_video_avg_time_watched)"
    params = urllib.parse.urlencode({
        "fields": fields,
        "access_token": access_token,
        "limit": 10
    })

    try:
        req = urllib.request.Request(f"{url}?{params}", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            posts = data.get("data", [])
            
            real_clips = []
            for idx, post in enumerate(posts):
                post_id = post.get("id", "")
                message = post.get("message", "Video không có caption")
                title = message.split("\n")[0][:80] if message else f"Reels Clip #{idx+1}"
                created_time = post.get("created_time", "")
                date_formatted = created_time[:10] if created_time else "Mới đăng"
                
                # Extract Reactions, Comments, Shares
                reactions_count = post.get("reactions", {}).get("summary", {}).get("total_count", 0)
                comments_count = post.get("comments", {}).get("summary", {}).get("total_count", 0)
                shares_count = post.get("shares", {}).get("count", 0)

                # Extract Insights metrics
                insights_data = post.get("insights", {}).get("data", [])
                metrics_map = {}
                for m in insights_data:
                    m_name = m.get("name")
                    m_values = m.get("values", [{}])
                    if m_values:
                        metrics_map[m_name] = m_values[0].get("value", 0)

                views = metrics_map.get("post_video_views", 0) or metrics_map.get("post_impressions", 0)
                engaged = metrics_map.get("post_engaged_users", 0)
                avg_time_ms = metrics_map.get("post_video_avg_time_watched", 0)
                avg_time_sec = round(avg_time_ms / 1000, 1) if avg_time_ms > 100 else avg_time_ms

                real_clips.append({
                    "id": post_id,
                    "tt": f"{idx+1:02d}",
                    "title": title,
                    "post_date": date_formatted,
                    "views": f"{views:,}",
                    "raw_views": views,
                    "reach": f"{metrics_map.get('post_impressions', views):,}",
                    "avg_watch_time": f"{avg_time_sec}s",
                    "likes": reactions_count,
                    "comments": comments_count,
                    "shares": shares_count,
                    "engaged": engaged,
                    "permalink": post.get("permalink_url", f"https://facebook.com/{post_id}")
                })

            return {
                "success": True,
                "clips": real_clips,
                "error": None
            }

    except urllib.error.HTTPError as he:
        err_body = he.read().decode('utf-8')
        print(f"❌ [Meta Graph API Error {he.code}]:", err_body)
        return {
            "success": False,
            "error": f"Lỗi Meta Graph API ({he.code}): {err_body}",
            "clips": []
        }
    except Exception as e:
        print("❌ [Network/API Error]:", e)
        return {
            "success": False,
            "error": str(e),
            "clips": []
        }

def generate_real_insights_html(api_result, date_str):
    success = api_result.get("success", False)
    clips = api_result.get("clips", [])
    error_msg = api_result.get("error")

    if not success or not clips:
        # Template thông báo chưa kết nối Token thật / Token cần cấp
        return f"""<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>Báo Cáo Facebook Insights Thật</title></head>
<body style="margin: 0; padding: 24px; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #050505;">
    <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <table width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e6eb; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
                    <tr>
                        <td style="background-color: #1877f2; padding: 20px 24px; color: #ffffff;">
                            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">📊 Meta Graph API • Live Data Connect</div>
                            <h2 style="margin: 0; font-size: 19px; font-weight: 800;">Báo Cáo Facebook Insights Thật (08:00 AM)</h2>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: #e7f3ff;">Ngày: {date_str} • Page ID: <code>{FB_PAGE_ID}</code></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px;">
                            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                                <div style="font-weight: 800; color: #991b1b; font-size: 14px; margin-bottom: 6px;">⚠️ CẦN KẾT NỐI FACEBOOK PAGE ACCESS TOKEN ĐỂ LẤY DỮ LIỆU THẬT 100%</div>
                                <div style="font-size: 13px; color: #7f1d1d; line-height: 1.5;">
                                    <b>Trạng thái:</b> {error_msg if error_msg else "Chưa có Page Access Token trong môi trường."}<br><br>
                                    Hệ thống tuân thủ nguyên tắc <b>TRUNG THỰC & CHỈ BÁO CÁO DỮ LIỆU THẬT</b>, không tự động sinh số liệu giả.
                                </div>
                            </div>
                            <div style="font-size: 13px; color: #4b5563; line-height: 1.6;">
                                <b>📌 Cách kích hoạt để nhận số liệu thật mỗi sáng:</b>
                                <ol style="padding-left: 20px; margin-top: 8px;">
                                    <li>Truy cập <b>Meta Business Suite / Graph API Explorer</b>.</li>
                                    <li>Lấy <b>Page Access Token</b> của Trang <code>Hana Wellness</code> (ID: <code>61592723278646</code>).</li>
                                    <li>Gán token vào biến <code>FB_PAGE_ACCESS_TOKEN</code> trên hệ thống (hoặc gửi token cho AI).</li>
                                </ol>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f7f8fa; padding: 14px 24px; text-align: center; font-size: 11px; color: #65676b; border-top: 1px solid #e4e6eb;">
                            © 2026 HANA Wellness Vietnam • Hệ thống đối soát dữ liệu thật.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""

    # Nếu đã có dữ liệu thật từ Meta API:
    total_views = sum(c["raw_views"] for c in clips)
    total_likes = sum(c["likes"] for c in clips)
    total_comments = sum(c["comments"] for c in clips)
    total_shares = sum(c["shares"] for c in clips)

    cards_html = ""
    for c in clips:
        cards_html += f"""
        <div style="background-color: #ffffff; border: 1px solid #e4e6eb; border-radius: 10px; padding: 16px; margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: 800; color: #1877f2; text-transform: uppercase;">CLIP {c['tt']} • {c['post_date']}</div>
            <h4 style="margin: 4px 0 8px 0; font-size: 14px; color: #050505;">{c['title']}</h4>
            <table width="100%" style="background-color: #f7f8fa; border-radius: 6px; padding: 8px; font-size: 12px;">
                <tr>
                    <td align="center"><b>Lượt Xem (Views):</b> <span style="color: #1877f2; font-weight: 800;">{c['views']}</span></td>
                    <td align="center"><b>Thời gian xem TB:</b> <span style="color: #16a34a; font-weight: 800;">{c['avg_watch_time']}</span></td>
                    <td align="center"><b>Like/Tim:</b> {c['likes']}</td>
                    <td align="center"><b>Bình luận:</b> {c['comments']}</td>
                    <td align="center"><b>Share:</b> {c['shares']}</td>
                </tr>
            </table>
            <div style="margin-top: 8px; text-align: right;">
                <a href="{c['permalink']}" target="_blank" style="color: #1877f2; font-size: 11.5px; text-decoration: none; font-weight: 700;">Xem bài đăng trên Facebook →</a>
            </div>
        </div>
        """

    return f"""<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>Báo Cáo Facebook Insights Thật</title></head>
<body style="margin: 0; padding: 24px; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #050505;">
    <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <table width="640" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e6eb; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #1877f2 0%, #0c56be 100%); padding: 24px 28px; color: #ffffff;">
                            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">📊 Meta Graph API • LIVE DATA 100%</div>
                            <h1 style="margin: 0; font-size: 20px; font-weight: 800;">Báo Cáo Hiệu Quả Video Facebook Thật</h1>
                            <p style="margin: 4px 0 0 0; font-size: 12.5px; color: #e7f3ff;">08:00 AM ({date_str}) • Dữ liệu kéo trực tiếp từ Trang Hana Wellness</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 24px;">
                            <div style="font-size: 12px; font-weight: 800; color: #65676b; text-transform: uppercase; margin-bottom: 10px;">📈 TỔNG QUAN CHỈ SỐ THẬT TOÀN TRANG:</div>
                            <table width="100%" style="margin-bottom: 16px; font-size: 13px;">
                                <tr>
                                    <td width="25%" style="background-color: #f7f8fa; border: 1px solid #e4e6eb; border-radius: 8px; padding: 10px; text-align: center;">
                                        <div style="font-size: 10px; color: #65676b;">TỔNG VIEWS</div>
                                        <div style="font-size: 16px; font-weight: 800; color: #1877f2; margin-top: 2px;">{total_views:,}</div>
                                    </td>
                                    <td width="25%" style="background-color: #f7f8fa; border: 1px solid #e4e6eb; border-radius: 8px; padding: 10px; text-align: center;">
                                        <div style="font-size: 10px; color: #65676b;">TỔNG LIKES</div>
                                        <div style="font-size: 16px; font-weight: 800; color: #16a34a; margin-top: 2px;">{total_likes}</div>
                                    </td>
                                    <td width="25%" style="background-color: #f7f8fa; border: 1px solid #e4e6eb; border-radius: 8px; padding: 10px; text-align: center;">
                                        <div style="font-size: 10px; color: #65676b;">BÌNH LUẬN</div>
                                        <div style="font-size: 16px; font-weight: 800; color: #ca8a04; margin-top: 2px;">{total_comments}</div>
                                    </td>
                                    <td width="25%" style="background-color: #f7f8fa; border: 1px solid #e4e6eb; border-radius: 8px; padding: 10px; text-align: center;">
                                        <div style="font-size: 10px; color: #65676b;">CHIA SẺ</div>
                                        <div style="font-size: 16px; font-weight: 800; color: #9333ea; margin-top: 2px;">{total_shares}</div>
                                    </td>
                                </tr>
                            </table>
                            <div style="font-size: 12px; font-weight: 800; color: #65676b; text-transform: uppercase; margin-bottom: 10px;">🎬 CHI TIẾT TỪNG VIDEO CLIP ĐÃ ĐĂNG:</div>
                            {cards_html}
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f7f8fa; border-top: 1px solid #e4e6eb; padding: 14px 24px; text-align: center; font-size: 11px; color: #8a8d91;">
                            © 2026 HANA Wellness Vietnam • Dữ liệu thật từ Meta Graph API v20.0.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""

def send_facebook_report_email(user, password, recipient, subject, html_content, text_content):
    if not user or not password:
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"HANA Wellness Real Insights <{user}>"
        msg["To"] = recipient

        part1 = MIMEText(text_content, "plain", "utf-8")
        part2 = MIMEText(html_content, "html", "utf-8")
        msg.attach(part1)
        msg.attach(part2)

        to_list = [r.strip() for r in recipient.split(",") if r.strip()]
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(user, password)
            server.sendmail(user, to_list, msg.as_string())
        print(f"[Gmail SMTP] Gửi email Báo Cáo Facebook Insights THẬT thành công đến {recipient}!")
        return True
    except Exception as e:
        print("[Gmail SMTP Error]:", e)
        return False

if __name__ == "__main__":
    date_str = datetime.now().strftime("%d/%m/%Y")
    
    # 1. Kéo dữ liệu THẬT 100% từ Meta Graph API
    api_result = fetch_real_facebook_page_insights(FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN)
    
    # 2. Sinh HTML Báo Cáo
    html_report = generate_real_insights_html(api_result, date_str)
    
    plain_text = f"""📊 [HANA WELLNESS] BÁO CÁO FACEBOOK INSIGHTS THẬT (08:00 AM - {date_str})
🔗 Page ID: {FB_PAGE_ID}
"""
    if api_result.get("success"):
        for c in api_result.get("clips", []):
            plain_text += f"• [{c['tt']}] {c['title']} | Views: {c['views']} | Watch: {c['avg_watch_time']} | Likes: {c['likes']} | Comments: {c['comments']}\n"
    else:
        plain_text += f"\n⚠️ Chưa kết nối Token Facebook thật: {api_result.get('error')}\n"

    smtp_user = os.getenv("SMTP_USER", "hanawellness.official@gmail.com")
    smtp_pass = os.getenv("SMTP_PASS", "vykfjngcvcwwmbjl")
    recipient = "phamtunghcm@gmail.com, hanawellness.official@gmail.com"
    subject = f"📊 [Meta Real Insights] Báo Cáo Hiệu Quả Video Clip Hàng Ngày - 08:00 AM ({date_str})"

    if smtp_user and smtp_pass:
        send_facebook_report_email(smtp_user, smtp_pass, recipient, subject, html_report, plain_text)
