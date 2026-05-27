# Cloudinary (pet photo uploads)

Add to `apps/api/.env.local` (or `.env`):

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Get these from the [Cloudinary Console](https://console.cloudinary.com/) → Dashboard.

**API:** `POST /user/uploads/pet-photo` (JWT required), multipart field `file`, max 5MB, images only. Returns `{ "url": "https://..." }`.

**User app:** On add-pet submit, the local photo is uploaded first; `photoUrl` is sent with `POST /user/pets`.
