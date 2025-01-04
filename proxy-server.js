import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

app.use(cors());

const apiProxy = createProxyMiddleware({
  target: 'https://api.anthropic.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api': ''
  },
  onProxyReq: (proxyReq, req) => {
    // API key is loaded from environment variable
    proxyReq.setHeader('x-api-key', process.env.PROXY_ANTHROPIC_API_KEY);
    proxyReq.setHeader('anthropic-version', '2023-06-01');
    proxyReq.setHeader('content-type', 'application/json');

    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes) => {
    proxyRes.headers['access-control-allow-origin'] = '*';
    proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, anthropic-version';
  }
});

// Parse JSON bodies
app.use(express.json());

// Handle preflight requests
app.options('*', cors());

// Proxy all requests to /api/* to Anthropic
app.use('/api', apiProxy);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
