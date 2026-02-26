import { EditableSpan } from "@/common/components"
import { useRemoveTodolistMutation, useUpdateTodolistTitleMutation } from "@/features/todolists/api/todolistsApi"
import type { DomainTodolist } from "@/features/todolists/lib/types"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"
import DeleteIcon from "@mui/icons-material/Delete"
import IconButton from "@mui/material/IconButton"
import styles from "./TodolistTitle.module.css"

type Props = {
  todolist: DomainTodolist
  dragHandleRef?: (node: HTMLButtonElement | null) => void
}

export const TodolistTitle = ({ todolist, dragHandleRef }: Props) => {
  const { id, title } = todolist

  const [removeTodolist, { isLoading}] = useRemoveTodolistMutation()
  const [updateTodolistTitle] = useUpdateTodolistTitleMutation()

  const deleteTodolist = () => removeTodolist(id)

  const changeTodolistTitle = (title: string) => {
    updateTodolistTitle({ id, title })
  }

  return (
    <div className={styles.container}>
      {dragHandleRef && (
        <IconButton
          size="small"
          ref={dragHandleRef}
          aria-label="Перетащить список"
          sx={{ cursor: "grab" }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
      )}
      <h3>
        <EditableSpan value={title} onChange={changeTodolistTitle} />
      </h3>
      <IconButton onClick={deleteTodolist} disabled={isLoading}>
        <DeleteIcon />
      </IconButton>
    </div>
  )
}
