# WeatherGPT - True Background Push

## What was added
- Service Worker for background Web Push
- VAPID configuration
- Push subscription storage in SQLite
- Test Push button
- Background alert checker
- Notification preferences (Rain / Extreme / Strong Wind)
- Automatic cleanup of expired push subscriptions

## Run
1. Install dependencies:
   pip install -r requirements.txt
2. Start:
   python app.py
3. Open http://127.0.0.1:5000
4. Load/detect a location.
5. Open Smart Notifications.
6. Click Enable Alerts and allow browser notifications.
7. Click Test Push to verify background delivery.

The background worker checks subscribed locations every 15 minutes by default.
Change PUSH_INTERVAL_SECONDS in .env for testing (minimum effective interval is 60 seconds).

For production deployment, use HTTPS and generate/rotate your own VAPID keys.
