import { Debugger } from 'debug';
import * as dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';

import { logger } from './lib/utils';

// Instantiate .env
dotenv.config({ path: __dirname + '/.env' });

const log: Debugger = logger.extend('app');

// Instantiate expresss
log('Instantiate express');
const app = express();

// Header Middleware
app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());
app.use(cors());

export default app;
