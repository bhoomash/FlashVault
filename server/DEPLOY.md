# FlashVault Server

Express.js backend for encrypted file and text sharing.

## Local Development

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## Deploy to Railway (Recommended)

Railway provides persistent Node.js hosting which is ideal for this server.

1. Go to [railway.app](https://railway.app)
2. Create a new project from GitHub
3. Select the repository and set **Root Directory** to `server`
4. Add environment variables:
   - `PORT` = `3001` (Railway may auto-assign)
   - `FRONTEND_URL` = Your Vercel client URL (e.g., `https://your-app.vercel.app`)
5. Deploy!

## Deploy to Render

1. Go to [render.com](https://render.com)
2. Create a new **Web Service**
3. Connect your GitHub repository
4. Set **Root Directory** to `server`
5. Set **Build Command** to `npm install`
6. Set **Start Command** to `npm start`
7. Add environment variables:
   - `FRONTEND_URL` = Your Vercel client URL
8. Deploy!

## Deploy to Vercel (Serverless - Limited)

⚠️ **Warning**: Vercel runs serverless functions, not persistent servers. This means:
- In-memory storage resets on cold starts
- Temp files are not persistent
- Best for low-traffic testing only

If you still want to use Vercel:

```bash
cd server
vercel
```

Set environment variable `FRONTEND_URL` to your client URL.

## Important Notes

This server uses **in-memory storage** for metadata and **temp files** for encrypted data. 
This is intentional for privacy (data is automatically lost on restart).

For production with persistence, consider adding:
- **Upstash Redis** for metadata
- **Cloudflare R2** or **AWS S3** for encrypted files
