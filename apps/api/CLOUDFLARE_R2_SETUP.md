# Cloudflare R2 image storage

Pet and vendor photos are stored in **Cloudflare R2** (S3-compatible). The bucket can stay **private** — images are served through the API at `GET /public/files/{key}`.

Add to `apps/api/.env.local`:

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=petspond

# Optional: used when the API builds URLs in upload responses (defaults to localhost:PORT)
API_PUBLIC_URL=http://192.168.x.x:3000
```

For mobile dev, set `API_PUBLIC_URL` to your machine's LAN IP (same host as `EXPO_PUBLIC_API_URL` in the user app). You do **not** need `R2_PUBLIC_BASE_URL` or a public R2 bucket when using the API proxy.

## Cloudflare setup

1. In [Cloudflare Dashboard](https://dash.cloudflare.com/) → **R2** → create a bucket (e.g. `petspond`).
2. **Manage R2 API tokens** → create token with Object Read & Write on that bucket.

## API endpoints

| Endpoint | Auth | Folder in R2 |
|----------|------|----------------|
| `POST /user/uploads/pet-photo` | User JWT | `pets/{userId}/` |
| `POST /vendor-auth/upload-photo` | Vendor JWT | `vendors/{vendorId}/` |
| `POST /vet-auth/upload-photo` | Vet JWT | `vets/{vetId}/` |
| `GET /public/files/pets/{userId}/{filename}` | None | streams from R2 |

Multipart field name: `file`. Max 5MB, images only. Response: `{ "url": "http://.../public/files/pets/...", "key": "pets/..." }`.

## Clients

- **User app:** `src/services/uploads.ts` → `uploadPetPhoto()` builds the display URL from `key` using `EXPO_PUBLIC_API_URL`. Existing DB URLs pointing at `*.r2.cloudflarestorage.com` are rewritten on the client via `resolvePhotoUrl()`.
- **Vendor app:** `POST /vendor-auth/upload-photo` when profile photo upload is added.
