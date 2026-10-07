# Node.js + Express Backend

This is the backend server built with Node.js, Express, and TypeScript.

## Available Endpoints

- `GET /api/health` - Health check status, timestamp, uptime
- `GET /api/info` - Server metadata and registered endpoint details
- `GET /api/items` - Sample items endpoint for frontend testing

## Scripts

- `npm run dev` - Starts server with live reloading using `ts-node-dev` on port 5000
- `npm run build` - Compiles TypeScript to JavaScript in `dist/`
- `npm start` - Starts production build from `dist/index.js`
