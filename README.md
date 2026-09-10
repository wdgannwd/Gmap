# Ganesh Chaturthi — Consent-Based Location Sharing

This project has two separate views:

- `/` — festive public page. The user must explicitly press **Share My Location** and approve the browser's location permission.
- `/admin.html?token=YOUR_ADMIN_TOKEN` — private dashboard showing locations voluntarily submitted.

## Deploy on Netlify

1. Create a new Git repository and upload these files, or drag the project into a Netlify deployment.
2. In Netlify, set the environment variable:
   `ADMIN_TOKEN` = a long random secret.
3. Deploy.
4. Keep the admin URL private. Example:
   `https://YOUR-SITE.netlify.app/admin.html?token=YOUR_ADMIN_TOKEN`

Netlify Blobs is used to store the consented submissions. HTTPS is required for browser geolocation (Netlify provides HTTPS).

For a real missing-person case, use this only as an explicit opt-in location-sharing mechanism. It cannot bypass phone permissions, carrier controls, or a device's location settings.
