# FlashVault Client

React frontend for encrypted file and text sharing.

## Local Development

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3001/api
```

## Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Set the **Root Directory** to `client`
4. Add environment variable:
   - `VITE_API_URL` = Your deployed server URL (e.g., `https://your-server.railway.app/api`)
5. Deploy!

### Or use Vercel CLI

```bash
cd client
vercel
```

When prompted, set the environment variable `VITE_API_URL` to your server URL.
