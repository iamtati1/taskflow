function TaskItem(props) {
  const {
    task,
    onDelete = () => { },
    onToggle = () => { },
    onSelect = () => { },
    onEdit = async () => { },
    isSelected = false,
  } = props;

  if (!task) return null;

  const safeTask = task;

  const [isEditing, setIsEditing] = useState(false);

  const [editedTitle, setEditedTitle] = useState(safeTask.title || "");
  const [editedPriority, setEditedPriority] = useState(safeTask.priority || "medium");
  const [editedDueDate, setEditedDueDate] = useState(
    safeTask.due_date ? safeTask.due_date.slice(0, 10) : ""
  );

  useEffect(() => {
    setEditedTitle(safeTask.title || "");
    setEditedPriority(safeTask.priority || "medium");
    setEditedDueDate(safeTask.due_date ? safeTask.due_date.slice(0, 10) : "");
  }, [safeTask]);

  const handleSave = async () => {
    await onEdit({
      title: editedTitle,
      priority: editedPriority,
      due_date: editedDueDate || null,
    });

    setIsEditing(false);
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: safeTask.id,
    disabled: isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.li
      ref={setNodeRef}
      style={style}
      className="relative"
    >
      <div onClick={onSelect}>
        <h3>{safeTask.title || "Untitled Task"}</h3>

        <button onClick={(e) => { e.stopPropagation(); onToggle(); }}>
          Toggle
        </button>

        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          Delete
        </button>
      </div>
    </motion.li>
  );
}

export default TaskItem;