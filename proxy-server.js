import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

// Logging utility
const logRequest = (req, body = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  if (body) {
    console.log('Request Body:', body);
  }
};

const logResponse = (status, body = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Response Status: ${status}`);
  if (body) {
    console.log('Response Body:', body);
  }
};

// Load environment variables
dotenv.config();

const app = express();

app.use(cors());

const apiProxy = createProxyMiddleware({
  target: 'https://api.anthropic.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/messages': '/v1/messages'
  },
  onProxyReq: (proxyReq, req) => {
    proxyReq.setHeader('x-api-key', process.env.PROXY_ANTHROPIC_API_KEY);
    proxyReq.setHeader('anthropic-version', '2023-01-01');
    proxyReq.setHeader('content-type', 'application/json');

    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
      logRequest(req, req.body);
    } else {
      logRequest(req);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['access-control-allow-origin'] = '*';
    proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, anthropic-version';

    let responseBody = '';
    proxyRes.on('data', (chunk) => {
      responseBody += chunk;
    });

    proxyRes.on('end', () => {
      try {
        const parsedBody = JSON.parse(responseBody);
        logResponse(proxyRes.statusCode, parsedBody);
      } catch (error) {
        logResponse(proxyRes.statusCode, responseBody);
      }
    });
  }
});

// Parse JSON bodies
app.use(express.json());

// Handle preflight requests
app.options('*', cors());

// Proxy all requests to /api/* to Anthropic
app.use('/api', apiProxy);

const PORT = 3002;
app.listen(PORT, () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Proxy server running on port ${PORT}`);
});
