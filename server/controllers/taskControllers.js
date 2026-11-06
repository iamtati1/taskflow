const taskModel = require('../models/taskModel');
const { recordActivity } = require('../models/activityModel');
const { isOwnCategory } = require('../models/categoryModel');
const withTransaction = require('../db/transaction');
const {
  titleError,
  dueDateError,
  priorityError,
  descriptionError,
  normalizeDescription,
  categoryIdError,
} = require('../utils/validation');

// Task ids are positive integers; anything else (e.g. a client-side temp id) can't exist
const isTaskId = (value) => /^\d+$/.test(String(value));

// pg may return ids as numbers or strings depending on the column type
const sameUser = (a, b) => String(a) === String(b);

// Checks the optional fields (undefined = not sent). Returns a message or null.
const optionalFieldError = ({ priority, description, category_id }) =>
  (priority !== undefined && priorityError(priority)) ||
  (description !== undefined && descriptionError(description)) ||
  (category_id !== undefined && categoryIdError(category_id)) ||
  null;

// A category that isn't the user's is refused (without saying whose it is)
const refusesCategory = async (category_id, user_id) =>
  category_id !== undefined && category_id !== null && !(await isOwnCategory(category_id, user_id));

const CATEGORY_REFUSED = "That category doesn't exist.";

// History entries for one saved change: completing or reopening, and any
// edit that actually changed a field (the edit form re-sends unchanged ones)
const EDITED_FIELDS = ['title', 'due_date', 'priority', 'description', 'category_id'];
const activityFor = (before, after) => {
  const actions = [];
  if (Boolean(before.is_complete) !== Boolean(after.is_complete)) {
    actions.push(after.is_complete ? 'completed' : 'reopened');
  }
  if (EDITED_FIELDS.some((field) => String(before[field]) !== String(after[field]))) {
    actions.push('updated');
  }
  return actions;
};

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
    const { title, due_date, priority, description, category_id } = req.body;

    const user_id = req.session.user_id;

    if (!user_id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const invalidTitle = titleError(title);
    if (invalidTitle) {
      return res.status(400).json({ error: invalidTitle });
    }

    const invalidDate = due_date === undefined || due_date === "" ? null : dueDateError(due_date);
    if (invalidDate) {
      return res.status(400).json({ error: invalidDate });
    }

    const invalidField = optionalFieldError({ priority, description, category_id });
    if (invalidField) {
      return res.status(400).json({ error: invalidField });
    }

    if (await refusesCategory(category_id, user_id)) {
      return res.status(400).json({ error: CATEGORY_REFUSED });
    }

    const task = await withTransaction(async (db) => {
      const created = await taskModel.createTask({
        title,
        due_date: due_date || null,
        user_id,
        priority,
        description: description === undefined ? undefined : normalizeDescription(description),
        category_id,
      }, db);
      await recordActivity({ user_id, task_id: created.task_id, task_title: created.title, action: 'created' }, db);
      return created;
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

    const { title, is_complete, due_date, priority, description, category_id } = req.body || {};

    // Nothing recognisable to save (e.g. the JSON body didn't arrive). Saying so
    // beats returning the unchanged task, which looks like a silent revert.
    if ([title, is_complete, due_date, priority, description, category_id].every((value) => value === undefined)) {
      const receivedFields = Object.keys(req.body || {});
      console.warn("TASK UPDATE: no updatable fields; received field names:", JSON.stringify(receivedFields), "content-type:", req.get("content-type") || "(none)");
      return res.status(400).send({ error: 'No changes were received. Please try again.' });
    }

    const invalidTitle = title === undefined ? null : titleError(title);
    if (invalidTitle) {
      return res.status(400).send({ error: invalidTitle });
    }

    const invalidDate = due_date === undefined ? null : dueDateError(due_date);
    if (invalidDate) {
      return res.status(400).send({ error: invalidDate });
    }

    if (is_complete !== undefined && typeof is_complete !== "boolean") {
      return res.status(400).send({ error: 'is_complete must be true or false.' });
    }

    const invalidField = optionalFieldError({ priority, description, category_id });
    if (invalidField) {
      return res.status(400).send({ error: invalidField });
    }

    const user_id = req.session.user_id;
    if (await refusesCategory(category_id, user_id)) {
      return res.status(400).send({ error: CATEGORY_REFUSED });
    }

    const changes = {
      title,
      is_complete,
      due_date,
      priority,
      description: description === undefined ? undefined : normalizeDescription(description),
      category_id,
    };

    const updatedTask = await withTransaction(async (db) => {
      const updated = await taskModel.updateTask(task_id, user_id, changes, db);
      if (!updated) return null;
      for (const action of activityFor(task, updated)) {
        await recordActivity({ user_id, task_id: updated.task_id, task_title: updated.title, action }, db);
      }
      return updated;
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

    // Destroy the task only after ownership has been verified. Its history
    // keeps the title; task_id is null because the task no longer exists.
    const user_id = req.session.user_id;
    const destroyedTask = await withTransaction(async (db) => {
      const deleted = await taskModel.deleteTask(task_id, user_id, db);
      if (deleted) {
        await recordActivity({ user_id, task_id: null, task_title: deleted.title, action: 'deleted' }, db);
      }
      return deleted;
    });
    if (!destroyedTask) return res.status(404).send({ error: 'Task not found.' });
    res.send(destroyedTask);
  } catch (err) {
    next(err);
  }
};
