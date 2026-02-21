import { baseApi } from "@/app/baseApi"
import type { BaseResponse } from "@/common/types"
import type { DomainTask, GetTasksResponse, UpdateTaskModel } from "./tasksApi.types"

export const tasksApi = baseApi.injectEndpoints({
  endpoints: (build) => {
    return {
      // 📥 Получение задач конкретного todolist
      getTasks: build.query<GetTasksResponse, string>({
        query: (todolistId) => `todo-lists/${todolistId}/tasks`,

        // 🏷️ Говорим RTK Query, какие теги создаёт этот query
        // Каждый task получает свой тег + отдельный тег для всего списка
        providesTags: (result, _error, todolistId) =>
          result
            ? [
                // 🔹 Теги отдельных задач (для точечного обновления)
                ...result.items.map(({ id }) => ({ type: "Task" as const, id })),
                // 🔹 Тег всего списка (для add/remove)
                { type: "Task", id: `LIST-${todolistId}` },
              ]
            : [
                // Даже при ошибке сохраняем тег списка,
                // чтобы можно было его инвалидировать позже
                { type: "Task", id: `LIST-${todolistId}` },
              ],
      }),

      // ➕ Добавление задачи
      addTask: build.mutation<BaseResponse<{ item: DomainTask }>, { todolistId: string; title: string }>({
        query: ({ todolistId, title }) => ({
          url: `todo-lists/${todolistId}/tasks`,
          method: "POST",
          body: { title },
        }),

        // 🔄 Инвалидируем только конкретный список,
        // чтобы перезапросился именно он, а не все задачи
        invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: `LIST-${todolistId}` }],
      }),

      // ❌ Удаление задачи
      removeTask: build.mutation<BaseResponse, { todolistId: string; taskId: string }>({
        query: ({ todolistId, taskId }) => ({
          url: `todo-lists/${todolistId}/tasks/${taskId}`,
          method: "DELETE",
        }),

        // 🧹 Инвалидируем:
        // 1️⃣ конкретную задачу
        // 2️⃣ весь список (так как изменилась структура массива)
        invalidatesTags: (_result, _error, { todolistId, taskId }) => [
          { type: "Task", id: taskId },
          { type: "Task", id: `LIST-${todolistId}` },
        ],
      }),

      // ✏️ Обновление задачи
      updateTask: build.mutation<
        BaseResponse<{ item: DomainTask }>,
        { todolistId: string; taskId: string; model: UpdateTaskModel }
      >({
        query: ({ todolistId, taskId, model }) => ({
          url: `todo-lists/${todolistId}/tasks/${taskId}`,
          method: "PUT",
          body: model,
        }),

        // 🎯 Инвалидируем только конкретную задачу
        // Список не трогаем, потому что структура массива не изменилась
        invalidatesTags: (_result, _error, { taskId }) => [{ type: "Task", id: taskId }],
      }),
    }
  },
})

export const { useGetTasksQuery, useAddTaskMutation, useRemoveTaskMutation, useUpdateTaskMutation } = tasksApi
