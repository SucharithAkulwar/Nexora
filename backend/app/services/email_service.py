import smtplib
import asyncio
import logging
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Dict, Any

from app.core.config import settings
from app.core.database import get_db

logger = logging.getLogger("nexora.email")


def _build_welcome_email(to_email: str, full_name: str, role: str) -> tuple[str, str, str]:
    subject = f"Welcome to Nexora — Your Healthcare Account is Ready"
    
    plain_text = f"""
Welcome to Nexora, {full_name}!

Your account has been successfully created. You are now connected to Kolhapur's premier healthcare network with fast-track hospital triage and AI-synthesized pre-consultation briefings.

Account Details:
- Registered Email: {to_email}
- Account Role: {role.capitalize()}
- Platform: Nexora Healthcare Platform (Kolhapur Network)
- Status: Active • ABDM & Patient-Isolated Security Enabled

What you can do next:
1. Explore Verified Hospitals: Atomic slot booking at CPR Hospital, Aster Aadhar, and Apple Saraswati.
2. Clinical Baseline Dossier: Log symptoms and 24h nutritional history to prepare your attending physician before your appointment.
3. Access Consultations: Zero waiting room double-booking delays.

Log in anytime at: http://localhost:5173

Best regards,
The Nexora Healthcare Team
Kolhapur, Maharashtra
"""

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Nexora</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #0F172A;">
  <div style="max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 18px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
    
    <!-- Header -->
    <div style="background: #0A0F1D; padding: 28px 32px; border-bottom: 2px solid #2563EB;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td>
            <div style="display: inline-block; background: #2563EB; color: #FFFFFF; font-weight: 800; font-size: 16px; padding: 6px 12px; border-radius: 8px; margin-bottom: 6px;">NEXORA</div>
            <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 800; letter-spacing: -0.03em;">Welcome to Nexora</h1>
            <p style="margin: 4px 0 0 0; color: #94A3B8; font-size: 13px;">AI-Powered Healthcare Platform • Kolhapur Network</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0F172A; margin-top: 0; margin-bottom: 12px;">
        Hello {full_name}, 👋
      </h2>
      <p style="font-size: 14.5px; line-height: 1.65; color: #475569; margin-bottom: 24px;">
        Thank you for signing up with Nexora! Your account has been successfully verified. You now have access to Kolhapur's verified hospitals, fast-track OPD scheduling, and intelligent clinical briefings.
      </p>

      <!-- Account Summary Card -->
      <div style="background: #F8FAFC; border-radius: 14px; padding: 20px; margin-bottom: 24px; border: 1px solid #E2E8F0;">
        <table style="width: 100%; font-size: 13.5px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Registered Email:</td>
            <td style="padding: 6px 0; color: #0F172A; font-weight: 700; text-align: right;">{to_email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Account Role:</td>
            <td style="padding: 6px 0; color: #2563EB; font-weight: 700; text-align: right; text-transform: capitalize;">{role}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Facility Network:</td>
            <td style="padding: 6px 0; color: #0F172A; font-weight: 600; text-align: right;">CPR, Aster Aadhar, Apple Saraswati</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Security Status:</td>
            <td style="padding: 6px 0; color: #16A34A; font-weight: 700; text-align: right;">● Patient-Isolated Encryption Active</td>
          </tr>
        </table>
      </div>

      <!-- Feature Highlights -->
      <h3 style="font-size: 15px; font-weight: 700; color: #0F172A; margin-bottom: 12px;">
        Your Platform Privileges:
      </h3>
      <ul style="font-size: 13.5px; color: #475569; padding-left: 20px; line-height: 1.7; margin-bottom: 28px;">
        <li><strong>Atomic Slot Scheduling:</strong> 100% anti-double-booking guarantee across all participating outpatient clinics.</li>
        <li><strong>Section 7 AI Briefings:</strong> 48h symptom timeline and nutrition logs compiled for attending doctors before consultation.</li>
        <li><strong>Preventive Care Rewards:</strong> Earn care vouchers for completing verified health baseline records.</li>
      </ul>

      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="http://localhost:5173" style="display: inline-block; background: #0A0F1D; color: #FFFFFF; font-size: 14px; font-weight: 600; padding: 13px 30px; border-radius: 9999px; text-decoration: none; box-shadow: 0 4px 12px rgba(10,15,29,0.15);">
          Open Nexora Dashboard →
        </a>
      </div>

      <p style="font-size: 12.5px; color: #64748B; line-height: 1.5; margin: 0;">
        If you did not create this account, please ignore this email or contact support.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #F1F5F9; padding: 20px 32px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #94A3B8;">
      &copy; {datetime.now().year} Nexora Healthcare Technologies. Kolhapur, Maharashtra.<br>
      Automated account registration notification.
    </div>

  </div>
</body>
</html>"""

    return subject, plain_text, html_content


def _send_smtp_sync(to_email: str, subject: str, plain_text: str, html_content: str) -> Dict[str, Any]:
    from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER or "noreply@nexora.health"
    from_name = settings.SMTP_FROM_NAME or "Nexora Healthcare"
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = to_email

    msg.attach(MIMEText(plain_text, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.info(
            f"[EMAIL NOTICE] SMTP_USER/SMTP_PASSWORD not configured. Simulated live delivery to {to_email} logged successfully."
        )
        return {
            "delivered": False,
            "mode": "simulated",
            "message": "SMTP credentials not provided in .env. Notification recorded in user activity."
        }

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            logger.info(f"[EMAIL SUCCESS] Welcome email dispatched via {settings.SMTP_HOST} to {to_email}")
            return {
                "delivered": True,
                "mode": "smtp",
                "message": f"Successfully delivered welcome email to {to_email} via Gmail SMTP."
            }
    except Exception as exc:
        logger.error(f"[EMAIL ERROR] Failed to send email via SMTP to {to_email}: {exc}")
        return {
            "delivered": False,
            "mode": "error",
            "message": f"SMTP delivery error: {str(exc)}"
        }


async def send_welcome_email(to_email: str, full_name: str, role: str = "patient") -> Dict[str, Any]:
    """
    Dispatches a registration welcome email to the user's Gmail/email address.
    Runs asynchronously and logs record in the notifications database.
    """
    subject, plain_text, html_content = _build_welcome_email(to_email, full_name, role)
    
    # Run SMTP in a non-blocking thread pool
    result = await asyncio.to_thread(_send_smtp_sync, to_email, subject, plain_text, html_content)
    
    # Store record in database
    try:
        db = get_db()
        await db["sent_notifications"].insert_one({
            "recipient_email": to_email,
            "recipient_name": full_name,
            "subject": subject,
            "type": "welcome_registration",
            "role": role,
            "delivered": result["delivered"],
            "delivery_mode": result["mode"],
            "status_message": result["message"],
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "preview_snippet": plain_text[:200]
        })
    except Exception as db_err:
        logger.warning(f"Failed to record notification in db: {db_err}")

    return {
        "status": "success",
        "recipient": to_email,
        "subject": subject,
        "delivery": result
    }
