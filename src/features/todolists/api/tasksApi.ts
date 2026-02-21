import { baseApi } from "@/app/baseApi"
import type { BaseResponse } from "@/common/types"
import type { DomainTask, GetTasksResponse, UpdateTaskModel } from "./tasksApi.types"

export const tasksApi = baseApi.injectEndpoints({
  endpoints: (build) => {
    return {
      // 📥 Получение задач с серверной пагинацией
      // Аргумент содержит id списка и номер страницы
      getTasks: build.query<GetTasksResponse, { todolistId: string; params: { page: number; count: number } }>({
        query: ({ todolistId, params }) => ({
          url: `todo-lists/${todolistId}/tasks`,

          // 📄 Передаём page + фиксированный размер страницы
          // PAGE_SIZE добавляется централизованно, чтобы не дублировать в компонентах
          params: { ...params },
        }),

        // 🏷️ Описываем, какие теги создаёт этот query
        // RTK Query будет использовать их для точечного refetch
        providesTags: (result, _error, { todolistId }) =>
          result
            ? [
                // 🔹 Тег каждой отдельной задачи
                // Нужен для updateTask (точечное обновление)
                ...result.items.map((task) => ({
                  type: "Task" as const,
                  id: task.id,
                })),

                // 🔹 Тег всего списка
                // Нужен для add/remove (меняется структура массива)
                { type: "Task", id: `LIST-${todolistId}` },
              ]
            : [
                // Даже если данных нет (ошибка),
                // оставляем тег списка, чтобы можно было его инвалидировать
                { type: "Task", id: `LIST-${todolistId}` },
              ],
      }),

      // ➕ Добавление новой задачи
      addTask: build.mutation<BaseResponse<{ item: DomainTask }>, { todolistId: string; title: string }>({
        query: ({ todolistId, title }) => ({
          url: `todo-lists/${todolistId}/tasks`,
          method: "POST",
          body: { title },
        }),

        // 🔄 Инвалидируем только конкретный список
        // Это вызовет refetch всех активных страниц этого todolist
        invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: `LIST-${todolistId}` }],
      }),

      // ❌ Удаление задачи
      removeTask: build.mutation<BaseResponse, { todolistId: string; taskId: string }>({
        query: ({ todolistId, taskId }) => ({
          url: `todo-lists/${todolistId}/tasks/${taskId}`,
          method: "DELETE",
        }),

        // 🧹 Инвалидируем тег списка
        // Структура массива изменилась → нужно перезапросить текущие страницы
        invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: `LIST-${todolistId}` }],
      }),

      // ✏️ Обновление конкретной задачи
      updateTask: build.mutation<
        BaseResponse<{ item: DomainTask }>,
        { todolistId: string; taskId: string; model: UpdateTaskModel }
      >({
        query: ({ todolistId, taskId, model }) => ({
          url: `todo-lists/${todolistId}/tasks/${taskId}`,
          method: "PUT",
          body: model,
        }),
        async onQueryStarted({ taskId, model, todolistId }, { dispatch, queryFulfilled }) {
          const patchResult = dispatch(
            tasksApi.util.updateQueryData("getTasks", {todolistId, params: { page: 1, count: 10 } }, (state) => {
              const index = state.items.findIndex((task) => task.id === taskId)
              if (index !== -1) {
                state.items[index] = { ...state.items[index], ...model }
              }
            }),
          )
          try {
            await queryFulfilled
          } catch {
            patchResult.undo()
          }
        },

        // 🎯 Инвалидируем только конкретную задачу
        // Список не трогаем, так как структура не меняется
        invalidatesTags: (_result, _error, { taskId }) => [{ type: "Task", id: taskId }],
      }),
    }
  },
})

export const { useGetTasksQuery, useAddTaskMutation, useRemoveTaskMutation, useUpdateTaskMutation } = tasksApi
