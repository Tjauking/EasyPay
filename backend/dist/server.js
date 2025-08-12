import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallets.js';
import transferRoutes from './routes/transfers.js';
import withdrawalsRoutes from './routes/withdrawals.js';
import agentsRoutes from './routes/agents.js';
import webhooksRoutes from './routes/webhooks.js';
import { errorHandler } from './middleware/error.js';
export function createServer() {
    const app = express();
    app.use(express.json());
    app.use(cors());
    app.use(helmet());
    app.use(morgan('combined'));
    app.set('trust proxy', true);
    const limiter = rateLimit({ windowMs: 60000, max: 100 });
    app.use(limiter);
    // Docs
    const openapi = YAML.load('openapi.yaml');
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
    app.get('/v1/health', (_req, res) => res.json({ status: 'ok' }));
    app.use('/v1/auth', authRoutes);
    app.use('/v1/wallets', walletRoutes);
    app.use('/v1/transfers', transferRoutes);
    app.use('/v1/withdrawals', withdrawalsRoutes);
    app.use('/v1/agents', agentsRoutes);
    app.use('/v1/webhooks', webhooksRoutes);
    app.use(errorHandler);
    return app;
}
