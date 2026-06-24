import { Response } from 'express';
import { Router } from 'express';
import pool from '../db.js';
import { verifyToken, AuthenticatedRequest } from '../middleware/verifyToken.js';

const router = Router();

// Apply verifyToken middleware to all task routes
router.use(verifyToken);

// Helper to format due_date correctly for MySQL DATE type (YYYY-MM-DD)
const formatMySQLDate = (dateVal: any): string | null => {
  if (!dateVal) return null;
  
  if (dateVal instanceof Date) {
    const year = dateVal.getUTCFullYear();
    const month = String(dateVal.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateVal.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  const str = String(dateVal).trim();
  if (str === '') return null;
  
  if (str.includes('T')) {
    return str.split('T')[0];
  }
  
  try {
    const dateObj = new Date(str);
    if (!isNaN(dateObj.getTime())) {
      const year = dateObj.getUTCFullYear();
      const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // fallback
  }
  return str;
};

// GET /api/tasks — return all tasks for logged-in user
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const [tasks]: any = await pool.query(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return res.status(200).json(tasks);
  } catch (error: any) {
    console.error('Get tasks error:', error);
    return res.status(500).json({ error: 'Server error. Failed to retrieve tasks.' });
  }
});

// POST /api/tasks — create task for logged-in user
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { title, description, status, priority, due_date } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const taskStatus = status || 'todo';
    const taskPriority = priority || 'medium';
    const taskDueDate = formatMySQLDate(due_date);

    const [result]: any = await pool.query(
      'INSERT INTO tasks (user_id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, title, description || '', taskStatus, taskPriority, taskDueDate]
    );

    const taskId = result.insertId;

    const [newTasks]: any = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);

    return res.status(201).json(newTasks[0]);
  } catch (error: any) {
    console.error('Create task error:', error);
    return res.status(500).json({ error: 'Server error. Failed to create task.' });
  }
});

// PUT /api/tasks/:id — update task (verify ownership)
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { title, description, status, priority, due_date } = req.body;

    // Check ownership
    const [tasks]: any = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = tasks[0];
    if (task.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this task' });
    }

    // Merge or set values
    const updatedTitle = title !== undefined ? title : task.title;
    const updatedDescription = description !== undefined ? description : task.description;
    const updatedStatus = status !== undefined ? status : task.status;
    const updatedPriority = priority !== undefined ? priority : task.priority;
    const updatedDueDate = due_date !== undefined 
      ? formatMySQLDate(due_date) 
      : formatMySQLDate(task.due_date);

    if (!updatedTitle) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    await pool.query(
      'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ? WHERE id = ?',
      [updatedTitle, updatedDescription, updatedStatus, updatedPriority, updatedDueDate, id]
    );

    const [updatedTasks]: any = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);

    return res.status(200).json(updatedTasks[0]);
  } catch (error: any) {
    console.error('Update task error:', error);
    return res.status(500).json({ error: 'Server error. Failed to update task.' });
  }
});

// DELETE /api/tasks/:id — delete task (verify ownership)
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Check ownership
    const [tasks]: any = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = tasks[0];
    if (task.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this task' });
    }

    await pool.query('DELETE FROM tasks WHERE id = ?', [id]);

    return res.status(200).json({ message: 'Task deleted successfully', id: parseInt(id) });
  } catch (error: any) {
    console.error('Delete task error:', error);
    return res.status(500).json({ error: 'Server error. Failed to delete task.' });
  }
});

export default router;
