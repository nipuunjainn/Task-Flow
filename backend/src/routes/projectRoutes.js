const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

const projectSchema = z.object({
  name: z.string().min(2, 'Project name is required'),
  description: z.string().optional().nullable(),
  startDate: z.string().min(1, 'Start date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD']).optional(),
});

function canAccessProject(project, user) {
  return user.role === 'ADMIN' && project.createdById === user.userId;
}

router.post('/', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const data = projectSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description || '',
        startDate: new Date(data.startDate),
        dueDate: new Date(data.dueDate),
        status: data.status || 'ACTIVE',
        createdById: req.user.userId,
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
    });

    res.status(201).json(project);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const where =
      req.user.role === 'ADMIN'
        ? { createdById: req.user.userId }
        : {
            members: {
              some: {
                userId: req.user.userId,
              },
            },
          };

    const projects = await prisma.project.findMany({
      where,
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        tasks: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project id' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        tasks: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isOwner = project.createdById === req.user.userId;
    const isMember = project.members.some((m) => m.userId === req.user.userId);

    if (!isOwner && !isMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.put('/:id', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const data = projectSchema.parse(req.body);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.createdById !== req.user.userId) {
      return res.status(403).json({ error: 'You can only edit projects you created' });
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: data.name,
        description: data.description || '',
        startDate: new Date(data.startDate),
        dueDate: new Date(data.dueDate),
        status: data.status || project.status,
      },
    });

    res.json(updated);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/:id', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const projectId = Number(req.params.id);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.createdById !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete projects you created' });
    }

    await prisma.$transaction([
      prisma.task.deleteMany({ where: { projectId } }),
      prisma.projectMember.deleteMany({ where: { projectId } }),
      prisma.project.delete({ where: { id: projectId } }),
    ]);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

router.post('/:id/members', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const userId = Number(req.body.userId);

    if (Number.isNaN(projectId) || Number.isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid project or user id' });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.createdById !== req.user.userId) {
      return res.status(403).json({ error: 'You can only manage your own projects' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existing = await prisma.projectMember.findFirst({
      where: { projectId, userId },
    });

    if (existing) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    const member = await prisma.projectMember.create({
      data: { projectId, userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.status(201).json(member);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

router.delete('/:id/members/:userId', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const userId = Number(req.params.userId);

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.createdById !== req.user.userId) {
      return res.status(403).json({ error: 'You can only manage your own projects' });
    }

    await prisma.projectMember.deleteMany({
      where: { projectId, userId },
    });

    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

router.get('/:id/members', verifyToken, async (req, res) => {
  try {
    const projectId = Number(req.params.id);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isOwner = project.createdById === req.user.userId;
    const isMember = project.members.some((m) => m.userId === req.user.userId);

    if (!isOwner && !isMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(project.members.map((m) => m.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

module.exports = router;