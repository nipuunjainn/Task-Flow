const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

const taskSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional().nullable(),
  projectId: z.number().int(),
  assignedTo: z.number().int().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  status: z.enum(['TO_DO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
});

// 🔒 Helpers
async function ensureProjectOwnedByAdmin(projectId, userId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.createdById !== userId) return null;
  return project;
}

async function ensureAssigneeIsProjectMember(projectId, userId) {
  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId },
  });
  return !!member;
}

// ================= GET TASKS =================
router.get('/', verifyToken, async (req, res) => {
  try {
    const where =
      req.user.role === 'ADMIN'
        ? { project: { createdById: req.user.userId } }
        : { assignedTo: req.user.userId };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      }
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// ================= CREATE TASK =================
router.post('/', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { title, projectId, dueDate } = req.body;

    if (!title || !projectId || !dueDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const parsed = taskSchema.parse({
      ...req.body,
      projectId: Number(req.body.projectId),
      assignedTo: req.body.assignedTo ? Number(req.body.assignedTo) : null,
    });

    if (isNaN(parsed.projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await ensureProjectOwnedByAdmin(parsed.projectId, req.user.userId);
    if (!project) {
      return res.status(403).json({ error: 'Not allowed or project not found' });
    }

    if (parsed.assignedTo) {
      const validMember = await ensureAssigneeIsProjectMember(parsed.projectId, parsed.assignedTo);
      if (!validMember) {
        return res.status(400).json({ error: 'User must be a project member' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title: parsed.title,
        description: parsed.description || '',
        projectId: parsed.projectId,
        assignedTo: parsed.assignedTo || null,
        priority: parsed.priority || 'MEDIUM',
        dueDate: new Date(parsed.dueDate),
        status: parsed.status || 'TO_DO',
      },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// ================= UPDATE TASK =================
router.put('/:id', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (isNaN(taskId)) return res.status(400).json({ error: 'Invalid task ID' });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (task.project.createdById !== req.user.userId) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    const parsed = taskSchema.parse({
      ...req.body,
      projectId: Number(req.body.projectId),
      assignedTo: req.body.assignedTo ? Number(req.body.assignedTo) : null,
    });

    const project = await ensureProjectOwnedByAdmin(parsed.projectId, req.user.userId);
    if (!project) return res.status(403).json({ error: 'Invalid project' });

    if (parsed.assignedTo) {
      const validMember = await ensureAssigneeIsProjectMember(parsed.projectId, parsed.assignedTo);
      if (!validMember) {
        return res.status(400).json({ error: 'User must be a project member' });
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...parsed,
        dueDate: new Date(parsed.dueDate),
      },
    });

    res.json(updated);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// ================= UPDATE STATUS =================
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (isNaN(taskId)) return res.status(400).json({ error: 'Invalid task ID' });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    const newStatus = req.body.status;
    const allowed = ['TO_DO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];

    if (!allowed.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (req.user.role === 'MEMBER' && task.assignedTo !== req.user.userId) {
      return res.status(403).json({ error: 'Not your task' });
    }

    if (req.user.role === 'ADMIN' && task.project.createdById !== req.user.userId) {
      return res.status(403).json({ error: 'Not your project' });
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ================= DELETE TASK =================
router.delete('/:id', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (isNaN(taskId)) return res.status(400).json({ error: 'Invalid task ID' });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (task.project.createdById !== req.user.userId) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    await prisma.task.delete({ where: { id: taskId } });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;