import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (GDPR compliance)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Mock deletion
    res.json({ message: 'User deleted (mock)' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;