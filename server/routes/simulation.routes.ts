/**
 * Copyright Â© 2025 DrishtiX. All Rights Reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is the proprietary information of DrishtiX.
 * Unauthorized copying, distribution, modification, or use of this software,
 * via any medium, is strictly prohibited without the express written permission
 * of DrishtiX.
 * 
 * This software is provided "as is" without warranty of any kind, express or implied.
 * 
 * For licensing inquiries: licensing@drishtix.com
 * License: See LICENSE file in the project root
 */
/**
 * DrishtiX Simulation API Routes
 * Hardware-free simulation and testing
 */

import { Router, Request, Response } from 'express';
import { simulationEngineService } from '../services/simulation.service';

const router = Router();

/**
 * POST /api/simulation/generate
 * Generate new simulation
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      sceneType,
      location,
      expectedCrowd,
      duration,
      weatherCondition,
      timeOfDay,
    } = req.body;

    if (!sceneType || !location || !expectedCrowd || !duration) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: sceneType, location, expectedCrowd, duration',
      });
    }

    const frames = await simulationEngineService.generateSimulation({
      sceneType,
      location,
      expectedCrowd,
      duration,
      weatherCondition: weatherCondition || 'clear',
      timeOfDay: timeOfDay || 'afternoon',
    });

    res.json({
      success: true,
      data: {
        frames: frames.slice(0, 10), // Return first 10 frames
        totalFrames: frames.length,
        message: 'Simulation generated successfully. Full data saved to storage.',
      },
    });
  } catch (error) {
    console.error('Generate simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate simulation',
    });
  }
});

/**
 * GET /api/simulation/list
 * List all simulations
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const simulations = await simulationEngineService.listSimulations();

    res.json({
      success: true,
      data: simulations,
      total: simulations.length,
    });
  } catch (error) {
    console.error('List simulations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list simulations',
    });
  }
});

/**
 * GET /api/simulation/:id
 * Get simulation by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const simulation = await simulationEngineService.loadSimulation(id);

    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found',
      });
    }

    res.json({
      success: true,
      data: simulation,
    });
  } catch (error) {
    console.error('Get simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch simulation',
    });
  }
});

export default router;
