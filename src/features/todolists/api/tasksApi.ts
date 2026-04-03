import { baseApi } from "@/app/baseApi"
import type { BaseResponse } from "@/common/types"
import type { DomainTask, GetTasksResponse, UpdateTaskModel } from "./tasksApi.types"

export const tasksApi = baseApi.injectEndpoints({
  endpoints: (build) => {
    return {
      // 📥 Получение задач конкретного todolist с серверной пагинацией
      // В аргументе передаём id списка и параметры пагинации (page + count)
      getTasks: build.query<GetTasksResponse, { todolistId: string; params: { page: number; count: number } }>({
        query: ({ todolistId, params }) => ({
          // 🌐 Запрос задач конкретного списка
          url: `/todo-lists/${todolistId}/tasks`,

          // 📄 Параметры пагинации уходят на сервер
          // Сервер вернёт только одну страницу данных
          params: { ...params },
        }),

        // 🏷️ Описываем, какие теги создаёт этот query
        // Эти теги используются RTK Query для точечной инвалидации
        providesTags: (result, _error, { todolistId }) =>
          result
            ? [
                // 🔹 Тег каждой задачи
                // Нужен для точечного обновления через updateTask
                ...result.items.map((task) => ({
                  type: "Task" as const,
                  id: task.id,
                })),

                // 🔹 Тег всего списка
                // Нужен для add/remove, когда меняется структура массива
                { type: "Task", id: `LIST-${todolistId}` },
              ]
            : [
                // Даже если произошла ошибка,
                // сохраняем тег списка для будущей инвалидации
                { type: "Task", id: `LIST-${todolistId}` },
              ],
      }),

      // ➕ Добавление новой задачи
      addTask: build.mutation<BaseResponse<{ item: DomainTask }>, { todolistId: string; title: string }>({
        query: ({ todolistId, title }) => ({
          url: `/todo-lists/${todolistId}/tasks`,
          method: "POST",
          body: { title },
        }),

        // 🔄 Инвалидируем тег списка
        // Это вызовет refetch всех активных страниц данного todolist
        invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: `LIST-${todolistId}` }],
      }),

      // ❌ Удаление задачи
      removeTask: build.mutation<BaseResponse, { todolistId: string; taskId: string }>({
        query: ({ todolistId, taskId }) => ({
          url: `/todo-lists/${todolistId}/tasks/${taskId}`,
          method: "DELETE",
        }),

        // 🧹 При удалении меняется структура массива,
        // поэтому инвалидируем весь список
        invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: `LIST-${todolistId}` }],
      }),

      // ✏️ Обновление конкретной задачи
      updateTask: build.mutation<
        BaseResponse<{ item: DomainTask }>,
        { todolistId: string; taskId: string; model: UpdateTaskModel }
      >({
        query: ({ todolistId, taskId, model }) => ({
          url: `/todo-lists/${todolistId}/tasks/${taskId}`,
          method: "PUT",
          body: model,
        }),

        // 🚀 Optimistic update
        // Мгновенно обновляем кэш до ответа сервера,
        // чтобы UI не ждал завершения запроса
        async onQueryStarted({ todolistId, taskId, model }, { dispatch, queryFulfilled, getState }) {
          // 📦 Получаем аргументы всех закешированных getTasks
          // (разные страницы и списки)
          const cachedArgs = tasksApi.util.selectCachedArgsForQuery(getState(), "getTasks")

          const patchResults: { undo: () => void }[] = []

          // 🔎 Обновляем только страницы текущего todolist
          cachedArgs
            .filter((arg) => arg.todolistId === todolistId)
            .forEach((arg) => {
              // 🛠 Обновляем данные конкретной задачи в кэше
              const patch = dispatch(
                tasksApi.util.updateQueryData("getTasks", arg, (state) => {
                  const task = state.items.find((t) => t.id === taskId)
                  if (task) {
                    // Объединяем старые данные с новыми полями
                    Object.assign(task, model)
                  }
                }),
              )

              // 💾 Сохраняем patch для возможного отката
              patchResults.push(patch)
            })

          try {
            // ⏳ Ожидаем подтверждение сервера
            await queryFulfilled
          } catch {
            // ❌ Если сервер вернул ошибку —
            // откатываем optimistic изменения
            patchResults.forEach((patch) => patch.undo())
          }
        },

        // 🎯 Инвалидируем только конкретную задачу
        // Если optimistic update полностью покрывает изменения,
        // этот refetch можно убрать
        invalidatesTags: (_result, _error, { taskId }) => [{ type: "Task", id: taskId }],
      }),
    }
  },
})

export const { useGetTasksQuery, useAddTaskMutation, useRemoveTaskMutation, useUpdateTaskMutation } = tasksApi
