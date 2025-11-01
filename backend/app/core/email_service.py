import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

def send_email(to_email, subject, body):
    email_user = os.getenv("EMAIL_USER")
    email_password = os.getenv("EMAIL_PASSWORD")
    smtp_server = os.getenv("EMAIL_HOST")
    smtp_port = int(os.getenv("EMAIL_PORT"))

    msg = MIMEMultipart()
    msg['From'] = email_user
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(email_user, email_password)
            server.send_message(msg)
            print("✅ Email sent successfully to:", to_email)
    except Exception as e:
        print("❌ Email sending failed:", e)
