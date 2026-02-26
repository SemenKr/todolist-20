import { TaskStatus } from "@/common/enums"
import { useGetTasksQuery, useReorderTaskMutation } from "@/features/todolists/api/tasksApi"
import type { DomainTodolist } from "@/features/todolists/lib/types"
import { TasksPagination } from "@/features/todolists/ui/Todolists/TodolistItem/Tasks/TasksPagination/TasksPagination"
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react"
import List from "@mui/material/List"
import { useMemo, useState } from "react"
import { TaskItem } from "./TaskItem/TaskItem"
import { TasksSkeleton } from "./TasksSkeleton/TasksSkeleton"

type Props = {
  todolist: DomainTodolist
}

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

export const Tasks = ({ todolist }: Props) => {
  const { id, filter } = todolist

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [reorderTask] = useReorderTaskMutation()

  const { data, isLoading } = useGetTasksQuery({
    todolistId: id,
    params: { page, count: pageSize },
  })

  const filteredTasks = useMemo(() => {
    let tasks = data?.items ?? []
    if (filter === "active") {
      tasks = tasks.filter((task) => task.status === TaskStatus.New)
    }
    if (filter === "completed") {
      tasks = tasks.filter((task) => task.status === TaskStatus.Completed)
    }
    return tasks
  }, [data?.items, filter])

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled) {
      return
    }
    const { operation } = event
    const { source, target } = operation
    if (!source) {
      return
    }
    const from = filteredTasks.findIndex((task) => task.id === source.id)
    const sortableIndex = getSortableIndex(source)
    const fallbackIndex = target ? filteredTasks.findIndex((task) => task.id === target.id) : -1
    const to = sortableIndex !== null ? sortableIndex : fallbackIndex
    if (from === -1 || to === -1 || from === to) {
      return
    }
    const next = arrayMove(filteredTasks, from, to)
    const movedIndex = next.findIndex((task) => task.id === source.id)
    const putAfterItemId = movedIndex > 0 ? next[movedIndex - 1].id : null
    reorderTask({ todolistId: id, taskId: source.id, model: { putAfterItemId } })
  }

  const tasksToRender = filteredTasks

  if (isLoading) {
    return <TasksSkeleton />
  }

  return (
    <>
      {tasksToRender.length === 0 ? (
        <p>Тасок нет</p>
      ) : (
        <DragDropProvider onDragEnd={handleDragEnd}>
          <List>
            {tasksToRender.map((task, index) => (
              <TaskItem key={task.id} task={task} todolist={todolist} index={index} />
            ))}
          </List>
        </DragDropProvider>
      )}
      {data && data.totalCount > pageSize && (
        <TasksPagination
          totalCount={data.totalCount}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      )}
    </>
  )
}
