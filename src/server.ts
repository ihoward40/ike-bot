import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import config from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import logger from './utils/logger';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting (applied globally)
app.use('/api', generalLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (_req, res) => {
  res.json({ 
    success: true, 
    message: 'IKE-BOT API running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      webhooks: '/api/webhooks',
      notion: '/api/notion',
      filings: '/api/filings',
      documents: '/api/documents',
      logs: '/api/logs',
    },
  });
});

// Mount API routes
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

const port = config.port;
app.listen(port, () => {
  logger.info(`IKE-BOT API server listening on http://127.0.0.1:${port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`API Base: http://127.0.0.1:${port}/api`);
});
