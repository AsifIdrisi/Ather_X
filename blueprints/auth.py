"""User accounts: registration, login/logout, profile updates, and the
email-OTP password reset flow.
"""

import hashlib
import logging
import secrets
import smtplib
import sqlite3
import os
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from core.config import DB_PATH

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


def _current_user_id():
    return session.get("user_id")


def _hash_reset_code(code):
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _send_reset_email(recipient, code):
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME", "")
    password = os.getenv("SMTP_APP_PASSWORD", "")
    sender = os.getenv("SMTP_FROM", username)
    if not username or not password or not sender:
        return False, "Email delivery is not configured. Add SMTP_USERNAME and SMTP_APP_PASSWORD to .env."
    msg = EmailMessage()
    msg["Subject"] = "WeatherGPT Password Reset Code"
    msg["From"] = sender
    msg["To"] = recipient
    msg.set_content(f"Your WeatherGPT password reset code is: {code}\n\nThis code expires in 10 minutes. If you did not request this, you can ignore this email.")
    with smtplib.SMTP(host, port, timeout=20) as server:
        server.starttls()
        server.login(username, password)
        server.send_message(msg)
    return True, "OTP sent"


@auth_bp.route("/status")
def auth_status():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"authenticated": False})
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute("SELECT id, name, email FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        session.clear()
        return jsonify({"authenticated": False})
    return jsonify({"authenticated": True, "user": {"id": row[0], "name": row[1], "email": row[2]}})


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    if len(name) < 2 or "@" not in email or len(password) < 6:
        return jsonify({"error": "Enter a valid name, email and password of at least 6 characters."}), 400
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cur = conn.execute("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", (name, email, generate_password_hash(password)))
            user_id = cur.lastrowid
            conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "An account with this email already exists."}), 409
    session["user_id"] = user_id
    return jsonify({"message": "Account created", "user": {"id": user_id, "name": name, "email": email}})


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute("SELECT id, name, email, password_hash FROM users WHERE email = ?", (email,)).fetchone()
    if not row or not check_password_hash(row[3], password):
        return jsonify({"error": "Invalid email or password."}), 401
    session["user_id"] = row[0]
    return jsonify({"message": "Logged in", "user": {"id": row[0], "name": row[1], "email": row[2]}})


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


@auth_bp.route("/profile", methods=["PUT"])
def update_profile():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Please sign in first."}), 401
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    new_password = str(data.get("password", ""))
    if len(name) < 2 or "@" not in email:
        return jsonify({"error": "Enter a valid name and email."}), 400
    try:
        with sqlite3.connect(DB_PATH) as conn:
            if new_password:
                if len(new_password) < 6:
                    return jsonify({"error": "Password must be at least 6 characters."}), 400
                conn.execute("UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?", (name, email, generate_password_hash(new_password), user_id))
            else:
                conn.execute("UPDATE users SET name = ?, email = ? WHERE id = ?", (name, email, user_id))
            conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "That email is already used by another account."}), 409
    return jsonify({"message": "Profile updated", "user": {"id": user_id, "name": name, "email": email}})


@auth_bp.route("/forgot-password/request", methods=["POST"])
def request_password_reset():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    if "@" not in email:
        return jsonify({"error": "Enter your account email."}), 400
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if not row:
            return jsonify({"error": "No account was found with this email."}), 404
        user_id = row[0]
        conn.execute("UPDATE password_reset_codes SET used = 1 WHERE user_id = ? AND used = 0", (user_id,))
        code = f"{secrets.randbelow(1000000):06d}"
        expires = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
        conn.execute("INSERT INTO password_reset_codes (user_id, code_hash, expires_at) VALUES (?, ?, ?)", (user_id, _hash_reset_code(code), expires))
        conn.commit()
    try:
        sent, message = _send_reset_email(email, code)
    except Exception as exc:
        logger.error("reset email error: %s", exc)
        sent, message = False, "Unable to send OTP right now. Check SMTP settings."
    if not sent:
        return jsonify({"error": message}), 503
    return jsonify({"message": "OTP sent to your account email."})


@auth_bp.route("/forgot-password/verify", methods=["POST"])
def verify_password_reset():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    code = str(data.get("code", "")).strip()
    if not email or len(code) != 6 or not code.isdigit():
        return jsonify({"error": "Enter the 6-digit OTP."}), 400
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute("""SELECT r.id, r.user_id, r.code_hash, r.expires_at, r.attempts, r.used
                             FROM password_reset_codes r JOIN users u ON u.id = r.user_id
                             WHERE u.email = ? AND r.used = 0 ORDER BY r.id DESC LIMIT 1""", (email,)).fetchone()
        if not row:
            return jsonify({"error": "OTP not found. Please request a new one."}), 400
        reset_id, user_id, code_hash, expires_at, attempts, used = row
        if attempts >= 5:
            return jsonify({"error": "Too many incorrect attempts. Request a new OTP."}), 429
        try:
            expired = datetime.now(timezone.utc) >= datetime.fromisoformat(expires_at)
        except ValueError:
            expired = True
        if expired:
            conn.execute("UPDATE password_reset_codes SET used = 1 WHERE id = ?", (reset_id,))
            conn.commit()
            return jsonify({"error": "OTP expired. Request a new one."}), 400
        if not secrets.compare_digest(code_hash, _hash_reset_code(code)):
            conn.execute("UPDATE password_reset_codes SET attempts = attempts + 1 WHERE id = ?", (reset_id,))
            conn.commit()
            return jsonify({"error": "Incorrect OTP."}), 400
        token = secrets.token_urlsafe(32)
        session["password_reset_token"] = token
        session["password_reset_user_id"] = user_id
        session["password_reset_code_id"] = reset_id
        conn.execute("UPDATE password_reset_codes SET used = 1 WHERE id = ?", (reset_id,))
        conn.commit()
    return jsonify({"message": "OTP verified", "reset_token": token})


@auth_bp.route("/forgot-password/reset", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}
    token = str(data.get("reset_token", ""))
    password = str(data.get("password", ""))
    if not token or token != session.get("password_reset_token"):
        return jsonify({"error": "Verify the OTP first."}), 403
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400
    user_id = session.get("password_reset_user_id")
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (generate_password_hash(password), user_id))
        conn.commit()
    session.pop("password_reset_token", None)
    session.pop("password_reset_user_id", None)
    session.pop("password_reset_code_id", None)
    return jsonify({"message": "Password updated successfully. Please sign in."})
