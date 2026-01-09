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
 * Automation Policy Routes
 * Handles automation rules, policy management, and execution tracking
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/automation/policies/:eventId
 * Get all automation policies for an event
 */
router.get('/policies/:eventId', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { status } = req.query;

    const where: any = { eventId };
    if (status) {
      where.status = status;
    }

    const policies = await prisma.automationPolicy.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: policies,
      count: policies.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/automation/policies/detail/:id
 * Get specific automation policy details
 */
router.get('/policies/detail/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const policy = await prisma.automationPolicy.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { executedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
    }

    res.json({
      success: true,
      data: policy
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/automation/policies
 * Create new automation policy
 */
router.post('/policies', authenticate, authorize(['ORGANIZER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      name,
      description,
      triggerType,
      triggerConditions,
      actions,
      priority,
      isActive
    } = req.body;

    const policy = await prisma.automationPolicy.create({
      data: {
        eventId,
        name,
        description,
        triggerType,
        triggerConditions,
        actions,
        priority: priority || 'MEDIUM',
        isActive: isActive !== undefined ? isActive : true,
        executionCount: 0,
        successCount: 0,
        failureCount: 0
      }
    });

    res.status(201).json({
      success: true,
      data: policy,
      message: 'Automation policy created successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/automation/policies/:id
 * Update automation policy
 */
router.put('/policies/:id', authenticate, authorize(['ORGANIZER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const policy = await prisma.automationPolicy.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: policy,
      message: 'Policy updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/automation/policies/:id
 * Delete automation policy
 */
router.delete('/policies/:id', authenticate, authorize(['ORGANIZER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.automationPolicy.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Policy deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/automation/policies/:id/toggle
 * Toggle policy active status
 */
router.post('/policies/:id/toggle', authenticate, authorize(['ORGANIZER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const policy = await prisma.automationPolicy.findUnique({
      where: { id }
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
    }

    const updated = await prisma.automationPolicy.update({
      where: { id },
      data: { isActive: !policy.isActive }
    });

    res.json({
      success: true,
      data: updated,
      message: `Policy ${updated.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/automation/execute
 * Manually execute automation policy
 */
router.post('/execute/:id', authenticate, authorize(['ORGANIZER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { context } = req.body;

    const policy = await prisma.automationPolicy.findUnique({
      where: { id }
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
    }

    // Create execution record
    const execution = await prisma.automationExecution.create({
      data: {
        policyId: id,
        executedAt: new Date(),
        triggerSource: 'MANUAL',
        context,
        status: 'RUNNING'
      }
    });

    // Execute actions (simplified - implement actual execution logic)
    const results: any[] = [];
    for (const action of policy.actions as any[]) {
      // Execute each action based on type
      results.push({
        action: action.type,
        status: 'SUCCESS',
        timestamp: new Date()
      });
    }

    // Update execution with results
    const completedExecution = await prisma.automationExecution.update({
      where: { id: execution.id },
      data: {
        completedAt: new Date(),
        status: 'SUCCESS',
        result: results,
        actionsExecuted: results.length
      }
    });

    // Update policy stats
    await prisma.automationPolicy.update({
      where: { id },
      data: {
        executionCount: { increment: 1 },
        successCount: { increment: 1 },
        lastExecutedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: completedExecution,
      message: 'Policy executed successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/automation/executions/:eventId
 * Get automation execution history
 */
router.get('/executions/:eventId', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { limit = 50, status } = req.query;

    const policies = await prisma.automationPolicy.findMany({
      where: { eventId },
      select: { id: true }
    });

    const policyIds = policies.map((p: any) => p.id);

    const where: any = {
      policyId: { in: policyIds }
    };

    if (status) {
      where.status = status;
    }

    const executions = await prisma.automationExecution.findMany({
      where,
      orderBy: { executedAt: 'desc' },
      take: Number(limit),
      include: {
        policy: {
          select: {
            name: true,
            triggerType: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: executions,
      count: executions.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/automation/stats/:eventId
 * Get automation statistics
 */
router.get('/stats/:eventId', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const policies = await prisma.automationPolicy.findMany({
      where: { eventId }
    });

    const stats = {
      totalPolicies: policies.length,
      activePolicies: policies.filter((p: any) => p.isActive).length,
      totalExecutions: policies.reduce((sum: number, p: any) => sum + p.executionCount, 0),
      successfulExecutions: policies.reduce((sum: number, p: any) => sum + p.successCount, 0),
      failedExecutions: policies.reduce((sum: number, p: any) => sum + p.failureCount, 0),
      successRate: 0
    };

    if (stats.totalExecutions > 0) {
      stats.successRate = (stats.successfulExecutions / stats.totalExecutions) * 100;
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
