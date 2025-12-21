# LockBin Server

Express.js backend for encrypted secret storage.

## Quick Start

```bash
npm install
npm run dev
```

## API

- `POST /api/text` - Store encrypted text
- `GET /api/text/:id` - Retrieve & destroy text
- `POST /api/file` - Upload encrypted file  
- `GET /api/file/:id` - Retrieve & destroy file
- `GET /health` - Health check
