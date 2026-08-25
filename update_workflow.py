with open(".github/workflows/daily-report.yml", "r") as f:
    wf = f.read()

wf = wf.replace("""        env:
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          REPORT_RECIPIENT_EMAIL: ${{ secrets.REPORT_RECIPIENT_EMAIL }}
          ZALO_WEBHOOK_URL: ${{ secrets.ZALO_WEBHOOK_URL }}""",
"""        env:
          SMTP_USER: ${{ secrets.SMTP_USER }}
          SMTP_PASS: ${{ secrets.SMTP_PASS }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          REPORT_RECIPIENT_EMAIL: ${{ secrets.REPORT_RECIPIENT_EMAIL }}
          ZALO_WEBHOOK_URL: ${{ secrets.ZALO_WEBHOOK_URL }}""")

with open(".github/workflows/daily-report.yml", "w") as f:
    f.write(wf)

print("Updated daily-report.yml with SMTP secrets!")
