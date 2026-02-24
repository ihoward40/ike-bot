#!/usr/bin/env node
/**
 * router-server.ts
 * Standalone server for SintraPrime Orchestration Router v1
 * 
 * Usage:
 *   npm run router:dev   # Development mode with hot reload
 *   npm run router:start # Production mode
 */

import dotenv from 'dotenv';
import app from './services/router-microservice';
import { logger } from './config/logger';

// Load environment variables
dotenv.config();

const PORT = process.env.ROUTER_PORT || process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Start the server
app.listen(PORT as number, HOST, () => {
  logger.info({
    message: '🚀 SintraPrime Router v1 Microservice Started',
    port: PORT,
    host: HOST,
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: `http://${HOST}:${PORT}/health`,
      routeEmail: `http://${HOST}:${PORT}/route-email`,
      batchRoute: `http://${HOST}:${PORT}/route-email/batch`,
      testRouter: `http://${HOST}:${PORT}/test-router`
    }
  });
  
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🎯 SintraPrime Orchestration Router v1 Microservice        ║
╠══════════════════════════════════════════════════════════════╣
║  Status:     Running                                         ║
║  Port:       ${PORT}                                              ║
║  Host:       ${HOST}                                      ║
║  Environment: ${process.env.NODE_ENV || 'development'}                              ║
╠══════════════════════════════════════════════════════════════╣
║  Endpoints:                                                  ║
║  • GET  /health              Health check                   ║
║  • POST /route-email         Route single Gmail message     ║
║  • POST /route-email/batch   Route multiple messages        ║
║  • POST /test-router         Test routing logic             ║
╠══════════════════════════════════════════════════════════════╣
║  Documentation:                                              ║
║  📖 docs/SINTRAPRIME_ROUTER_USAGE.md                        ║
║  📖 docs/SINTRAPRIME_ROUTER_MICROSERVICE.md                 ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info({ message: 'SIGTERM signal received: closing HTTP server' });
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info({ message: 'SIGINT signal received: closing HTTP server' });
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error({
    message: 'Uncaught exception',
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({
    message: 'Unhandled rejection',
    reason,
    promise
  });
  process.exit(1);
});
