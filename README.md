# LAKAJUAR Webpage Project

## Overview
LAKAJUAR is a web project designed to showcase the company's offerings and provide an engaging user experience. This project includes a structured layout with a header, main content area, and interactive features.

## Project Structure
```
lakajuar-webpage
├── src
│   ├── assets
│   │   ├── css
│   │   │   └── styles.css
│   │   └── js
│   │       └── main.js
│   ├── index.html
│   └── components
│       └── header.html
├── package.json
├── .gitignore
└── README.md
```

## Installation
To get started with the LAKAJUAR webpage project, follow these steps:

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd lakajuar-webpage
   ```

3. Install the necessary dependencies:
   ```
   npm install
   ```

## Usage
To run the project locally, open the `index.html` file in your web browser. You can also set up a local server for a better development experience.

## Security Setup

### Cloudflare Pages environment variables
Create these environment variables in Cloudflare Pages for both Preview and Production:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`
- `STORE_WHATSAPP_NUMBER`

The site now loads its public runtime configuration from `/api/public-config` via Cloudflare Pages Functions, so the Firebase web config is no longer stored in the repository.

### Deploy Firebase rules
Install the Firebase CLI and deploy the hardened rules from this repository:

```bash
npm install -g firebase-tools
firebase login
firebase use lakajuar-7d632
firebase deploy --only firestore:rules,storage
```

### Rotate and restrict the Firebase Web API key
The web API key is public by design in browser apps, but it must still be rotated and restricted:

1. Create a new API key in Google Cloud Console.
2. Restrict it by HTTP referrers.
3. Allow only these origins:
    - `https://lakajuar-webpage.pages.dev/*`
    - `http://localhost/*`
4. Replace the old key by updating `FIREBASE_API_KEY` in Cloudflare Pages.
5. Redeploy the Pages project.

### Admin role bootstrap
Admin access is no longer determined by a public frontend email list. The authenticated user's Firestore document must contain:

```json
{
   "role": "admin"
}
```

Set that role directly in Firestore Console for the intended admin user if needed.

### Admin-only access
Client self-registration is disabled. The admin modal now requires:

1. Admin email/password in Firebase Authentication
2. A matching `users/{uid}` Firestore document with `role: "admin"`
3. A server-side access code validated by the Cloudflare Pages Function `functions/api/verify-admin-access.js`

Add these Cloudflare Pages environment variables before deploying:

- `ADMIN_EMAIL`: admin email allowed to log in
- `ADMIN_ACCESS_CODE`: secret code required in the admin modal

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.