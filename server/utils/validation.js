// Input rules shared by the controllers. Each check returns an error message
// for the client, or null when the input is acceptable.

const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,30}$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX_BYTES = 72; // bcrypt ignores anything past 72 bytes
const TITLE_MAX = 200;

// Registration only: existing accounts can still log in with older usernames
const registrationError = (username, password) => {
  if (typeof username !== "string" || !username.trim() || typeof password !== "string" || !password) {
    return "Username and password are required.";
  }
  if (!USERNAME_PATTERN.test(username.trim())) {
    return "Usernames are 3 to 30 characters: letters, numbers, dots, dashes or underscores.";
  }
  if (password.length < PASSWORD_MIN) {
    return `Passwords need at least ${PASSWORD_MIN} characters.`;
  }
  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    return `Passwords can be at most ${PASSWORD_MAX_BYTES} characters.`;
  }
  return null;
};

const titleError = (title) => {
  if (typeof title !== "string" || !title.trim()) return "Title is required.";
  if (title.length > TITLE_MAX) return `Titles can be at most ${TITLE_MAX} characters.`;
  return null;
};

// A due date is a calendar day ("YYYY-MM-DD") or null (no due date)
const dueDateError = (value) => {
  if (value === null) return null;
  const match = typeof value === "string" && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    const [, y, m, d] = match.map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    if (date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d) return null;
  }
  return "Due dates must be a real date in YYYY-MM-DD format.";
};

module.exports = { registrationError, titleError, dueDateError, TITLE_MAX };
