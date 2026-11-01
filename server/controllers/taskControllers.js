const taskModel = require('../models/taskModel');

module.exports.listTasks = async (req, res, next) => {
  try {
    const tasks = await taskModel.getTasksByUser(req.session.user_id);
    res.send(tasks);
  } catch (err) {
    next(err);
  }
};

module.exports.createTask = async (req, res, next) => {
  try {
    const { title, priority, due_date, category_id } = req.body;

    const user_id = req.session.user_id;

    if (!user_id) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const task = await taskModel.createTask({
      title,
      priority,
      due_date,
      category_id,
      user_id,
    });

    return res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

module.exports.updateTask = async (req, res, next) => {
  try {

    const { task_id } = req.params;

    const task = await taskModel.getTaskById(task_id);

    if (!task) {
      return res.status(404).send({ error: 'Task not found.' });
    }

    if (task.user_id !== req.session.user_id) {
      return res.status(403).send({ error: 'Not authorized.' });
    }

    const { title, is_complete, priority, due_date, category_id } = req.body;

    const updatedTask = await taskModel.updateTask(task_id, {
      title, is_complete, priority, due_date, category_id
    });

    res.send(updatedTask);

  } catch (err) {
    next(err);
  }
};

module.exports.deleteTask = async (req, res, next) => {
  try {
    const { task_id } = req.params;

    // First find the task to verify ownership
    const task = await taskModel.getTaskById(task_id);
    if (!task) return res.status(404).send({ error: 'Task not found.' });
    if (task.user_id !== req.session.user_id) {
      return res.status(403).send({ error: 'Not authorized.' });
    }

    // Destroy the task only after ownership has been verified
    const destroyedTask = await taskModel.deleteTask(task_id, req.session.user_id);
    res.send(destroyedTask);
  } catch (err) {
    next(err);
  }
};
