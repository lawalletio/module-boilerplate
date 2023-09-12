import './lib/websockets';

import * as dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import * as middlewares from './lib/middlewares';

// Instantiate .env
dotenv.config({ path: __dirname + '/.env' });

// Instantiate expresss
console.info('Instantiate express');
const app = express();

// Header Middleware
app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());
app.use(cors());

// Setup express routes
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
