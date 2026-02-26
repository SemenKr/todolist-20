import { containerSx } from "@/common/styles"
import { useGetTodolistsQuery, useReorderTodolistMutation } from "@/features/todolists/api/todolistsApi"
import type { DomainTodolist } from "@/features/todolists/lib/types"
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import Box from "@mui/material/Box"
import { TodolistSkeleton } from "./TodolistSkeleton/TodolistSkeleton"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import { TodolistItem } from "./TodolistItem/TodolistItem"
import { useMemo } from "react"

const arrayMove = <T,>(items: T[], from: number, to: number) => {
  if (from === to) {
    return items
  }
  const next = items.slice()
  next.splice(to, 0, next.splice(from, 1)[0])
  return next
}

const getSortableIndex = (entity: unknown): number | null => {
  if (!entity || typeof entity !== "object") {
    return null
  }
  const sortable = (entity as { sortable?: { index?: number } }).sortable
  if (!sortable || typeof sortable.index !== "number") {
    return null
  }
  return sortable.index
}

type SortableTodolistProps = {
  todolist: DomainTodolist
  index: number
}

const SortableTodolist = ({ todolist, index }: SortableTodolistProps) => {
  const { ref, handleRef, isDragging } = useSortable({
    id: todolist.id,
    index,
    group: "todolists",
  })
  const setHandleRef = (node: HTMLButtonElement | null) => handleRef(node)

  return (
    <Grid key={todolist.id}>
      <Paper
        ref={ref}
        sx={{ p: "0 20px 20px 20px", ...(isDragging ? { opacity: 0.6 } : {}) }}
      >
        <TodolistItem todolist={todolist} dragHandleRef={setHandleRef} />
      </Paper>
    </Grid>
  )
}

export const Todolists = () => {
  const { data: todolists, isLoading } = useGetTodolistsQuery()
  const [reorderTodolist] = useReorderTodolistMutation()
  const todolistsToRender = useMemo(() => todolists ?? [], [todolists])

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled) {
      return
    }
    const { operation } = event
    const { source, target } = operation
    if (!source) {
      return
    }
    const from = todolistsToRender.findIndex((item) => item.id === source.id)
    const sortableIndex = getSortableIndex(source)
    const fallbackIndex = target ? todolistsToRender.findIndex((item) => item.id === target.id) : -1
    const to = sortableIndex !== null ? sortableIndex : fallbackIndex
    if (from === -1 || to === -1 || from === to) {
      return
    }
    const next = arrayMove(todolistsToRender, from, to)
    const movedIndex = next.findIndex((item) => item.id === source.id)
    const putAfterItemId = movedIndex > 0 ? next[movedIndex - 1].id : null
    reorderTodolist({ id: source.id, model: { putAfterItemId } })
  }

  if (isLoading) {
    return (
      <Box sx={containerSx} style={{ gap: "32px" }}>
        {Array(3)
          .fill(null)
          .map((_, id) => (
            <TodolistSkeleton key={id} />
          ))}
      </Box>
    )
  }

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      {todolistsToRender.map((todolist, index) => (
        <SortableTodolist key={todolist.id} todolist={todolist} index={index} />
      ))}
    </DragDropProvider>
  )
}
