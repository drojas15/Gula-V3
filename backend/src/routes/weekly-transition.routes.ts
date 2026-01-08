/**
 * WEEKLY TRANSITION ROUTES
 * 
 * Endpoints para el cierre semanal y transición a nueva semana
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import {
  getWeeklyTransitionData,
  executeWeeklyRecalculation,
  markWeeklyTransitionSeen
} from '../services/weekly-transition.service';

const router = Router();

/**
 * GET /api/weekly-transition
 * 
 * Obtiene datos para la transición semanal
 * - Detecta si es una nueva semana
 * - Verifica si ya vio la transición
 * - Retorna resumen de semana anterior
 */
router.get(
  '/',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const transitionData = getWeeklyTransitionData(req.userId);

      res.json(transitionData);
    } catch (error: any) {
      console.error('[Weekly Transition API] Error getting transition data:', error);
      res.status(500).json({ 
        error: 'Failed to get weekly transition data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/weekly-transition/confirm
 * 
 * Confirma la transición y ejecuta re-cálculo semanal
 * - Ejecuta internalización, adaptación, reemplazos
 * - Genera nuevo set de 3 acciones
 * - Marca que vio la transición esta semana
 */
router.post(
  '/confirm',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // 1. Ejecutar re-cálculo semanal
      const success = await executeWeeklyRecalculation(req.userId);

      if (!success) {
        res.status(500).json({ error: 'Failed to execute weekly recalculation' });
        return;
      }

      // 2. Marcar que vio la transición
      markWeeklyTransitionSeen(req.userId);

      // 3. Retornar éxito
      res.json({
        success: true,
        message: 'Weekly recalculation completed'
      });
    } catch (error: any) {
      console.error('[Weekly Transition API] Error confirming transition:', error);
      res.status(500).json({ 
        error: 'Failed to confirm weekly transition',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/weekly-transition/dismiss
 * 
 * Marca que vio la transición sin ejecutar re-cálculo
 * (Para cuando el usuario cierra sin confirmar)
 */
router.post(
  '/dismiss',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Marcar que vio la transición
      markWeeklyTransitionSeen(req.userId);

      res.json({
        success: true,
        message: 'Weekly transition dismissed'
      });
    } catch (error: any) {
      console.error('[Weekly Transition API] Error dismissing transition:', error);
      res.status(500).json({ 
        error: 'Failed to dismiss weekly transition',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

export default router;
