const express = require('express');
const prisma = require('../config/prisma');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', verifyToken, async (req, res) => {
  try {
    const now = new Date();
    const userId = req.user.userId;
    const role = req.user.role;

    let projectsWhere = {};
    let tasksWhere = {};

    if (role === 'ADMIN') {
      projectsWhere = { createdById: userId };
      tasksWhere = { project: { createdById: userId } };
    } else {
      projectsWhere = { members: { some: { userId } } };
      tasksWhere = { assignedTo: userId };
    }

    const [
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      toDoTasks,
      inProgressTasks,
      reviewTasks,
    ] = await Promise.all([
      prisma.project.count({ where: projectsWhere }),
      prisma.task.count({ where: tasksWhere }),
      prisma.task.count({ where: { ...tasksWhere, status: 'COMPLETED' } }),
      prisma.task.count({ where: { ...tasksWhere, status: { not: 'COMPLETED' } } }),
      prisma.task.count({
        where: {
          ...tasksWhere,
          status: { not: 'COMPLETED' },
          dueDate: { lt: now },
        },
      }),
      prisma.task.count({ where: { ...tasksWhere, status: 'TO_DO' } }),
      prisma.task.count({ where: { ...tasksWhere, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { ...tasksWhere, status: 'REVIEW' } }),
    ]);

    res.json({
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      statusBreakdown: [
        { status: 'TO_DO', count: toDoTasks },
        { status: 'IN_PROGRESS', count: inProgressTasks },
        { status: 'REVIEW', count: reviewTasks },
        { status: 'COMPLETED', count: completedTasks },
      ],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
});

module.exports = router;