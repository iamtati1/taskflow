const taskModel = require('../models/taskModel');
const {
  titleError,
  dueDateError,
  descriptionError,
  normalizeDescription,
  scheduledTimeError,
} = require('../utils/validation');

// Task ids are positive integers; anything else (e.g. a client-side temp id) can't exist
const isTaskId = (value) => /^\d+$/.test(String(value));

// pg may return ids as numbers or strings depending on the column type
const sameUser = (a, b) => String(a) === String(b);

// Checks the optional fields of a create or update. Returns
// { error, status } to send, or { fields } with the values to save
// (undefined = not sent). A description or time sent to a database that
// doesn't have that column yet is refused, never silently dropped; an empty
// one is simply ignored there.
const optionalFields = async (body) => {
  const { description, scheduled_time } = body;

  const invalid =
    (description === undefined ? null : descriptionError(description)) ||
    (scheduled_time === undefined ? null : scheduledTimeError(scheduled_time));
  if (invalid) return { error: invalid, status: 400 };

  const fields = {
    description: description === undefined ? undefined : normalizeDescription(description),
    scheduled_time,
  };

  const available = await taskModel.optionalColumns();
  for (const [name, label] of [['description', 'Descriptions'], ['scheduled_time', 'Times']]) {
    if (available.has(name)) continue;
    if (fields[name] !== undefined && fields[name] !== null) {
      return { error: `${label} can't be saved yet: this database hasn't been updated for them.`, status: 503 };
    }
    fields[name] = undefined;
  }
  return { fields };
};

const TIME_NEEDS_DATE = 'A time needs a due date. Choose a date first, or remove the time.';

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
    const { title, due_date } = req.body;

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

    const optional = await optionalFields(req.body);
    if (optional.error) {
      return res.status(optional.status).json({ error: optional.error });
    }
    if (optional.fields.scheduled_time && !due_date) {
      return res.status(400).json({ error: TIME_NEEDS_DATE });
    }

    const task = await taskModel.createTask({
      title,
      due_date: due_date || null,
      user_id,
      ...optional.fields,
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

    const { title, is_complete, due_date, description, scheduled_time } = req.body || {};

    // Nothing recognisable to save (e.g. the JSON body didn't arrive). Saying so
    // beats returning the unchanged task, which looks like a silent revert.
    if (
      title === undefined && is_complete === undefined && due_date === undefined &&
      description === undefined && scheduled_time === undefined
    ) {
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

    const optional = await optionalFields(req.body);
    if (optional.error) {
      return res.status(optional.status).send({ error: optional.error });
    }

    // A time belongs to a due date: setting one needs a date (sent now or
    // already saved), and removing the date removes its time too
    const fields = { title, is_complete, due_date, ...optional.fields };
    const dateAfter = due_date === undefined ? task.due_date : due_date;
    if (fields.scheduled_time && !dateAfter) {
      return res.status(400).send({ error: TIME_NEEDS_DATE });
    }
    if (due_date === null && 'scheduled_time' in task && fields.scheduled_time === undefined) {
      fields.scheduled_time = null;
    }

    const updatedTask = await taskModel.updateTask(task_id, req.session.user_id, fields);

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
