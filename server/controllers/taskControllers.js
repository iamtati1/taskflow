const taskModel = require('../models/taskModel');

// Task ids are positive integers; anything else (e.g. a client-side temp id) can't exist
const isTaskId = (value) => /^\d+$/.test(String(value));

// pg may return ids as numbers or strings depending on the column type
const sameUser = (a, b) => String(a) === String(b);

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

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required." });
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

    if (!isTaskId(task_id)) {
      return res.status(404).send({ error: 'Task not found.' });
    }

    const task = await taskModel.getTaskById(task_id);

    if (!task) {
      return res.status(404).send({ error: 'Task not found.' });
    }

    if (!sameUser(task.user_id, req.session.user_id)) {
      return res.status(403).send({ error: 'Not authorized.' });
    }

    const { title, is_complete, due_date } = req.body;

    if (title !== undefined && (typeof title !== "string" || !title.trim())) {
      return res.status(400).send({ error: 'Title cannot be empty.' });
    }

    const updatedTask = await taskModel.updateTask(task_id, req.session.user_id, {
      title, is_complete, due_date
    });

    if (!updatedTask) {
      return res.status(404).send({ error: 'Task not found.' });
    }

    res.send(updatedTask);

  } catch (err) {
    next(err);
  }
};

module.exports.deleteTask = async (req, res, next) => {
  try {
    const { task_id } = req.params;

    if (!isTaskId(task_id)) {
      return res.status(404).send({ error: 'Task not found.' });
    }

    // First find the task to verify ownership
    const task = await taskModel.getTaskById(task_id);
    if (!task) return res.status(404).send({ error: 'Task not found.' });
    if (!sameUser(task.user_id, req.session.user_id)) {
      return res.status(403).send({ error: 'Not authorized.' });
    }

    // Destroy the task only after ownership has been verified
    const destroyedTask = await taskModel.deleteTask(task_id, req.session.user_id);
    res.send(destroyedTask);
  } catch (err) {
    next(err);
  }
};
