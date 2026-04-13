import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './db/postgres'; // Initialize PostgreSQL connection
import authRoutes from './routes/auth.routes';
import examRoutes from './routes/exam.routes';
import userRoutes from './routes/user.routes';
import weeklyActionsRoutes from './routes/weekly-actions.routes';
import biomarkerHistoryRoutes from './routes/biomarker-history.routes';
import dashboardRoutes from './routes/dashboard.routes';
import weeklyTransitionRoutes from './routes/weekly-transition.routes';
import { initializeCronJobs } from './jobs/cron';
import './events/event-handlers'; // Register event handlers

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/weekly-actions', weeklyActionsRoutes);
app.use('/api/biomarkers', biomarkerHistoryRoutes);
app.use('/api/weekly-transition', weeklyTransitionRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 GULA Backend running on port ${PORT}`);
  
  // Initialize cron jobs
  if (process.env.NODE_ENV !== 'test') {
    initializeCronJobs();
  }
});

