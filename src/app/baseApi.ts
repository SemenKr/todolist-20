import { AUTH_TOKEN } from "@/common/constants"
import { handleError } from "@/common/utils"
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

export const baseApi = createApi({
  reducerPath: "todolistsApi",

  // 🏷️ Глобальные типы тегов для cache invalidation
  tagTypes: ["Todolist", "Task"],

  // ⏳ Кэш хранится 60 секунд после размонтирования последнего подписчика
  keepUnusedDataFor: 60,

  // 🔄 Автоматический refetch при возвращении на вкладку
  refetchOnFocus: true,

  baseQuery: async (args, api, extraOptions) => {
    // 🌐 Создаём базовый запрос с конфигурацией
    const result = await fetchBaseQuery({
      baseUrl: import.meta.env.VITE_BASE_URL,
      // разрешить браузеру работать с cookies при запросах к API
      credentials: "include",
      // 🔑 Статический API-KEY для всех запросов
      headers: {
        "API-KEY": import.meta.env.VITE_API_KEY,
      },

      // 🔐 Динамическое добавление JWT токена в каждый запрос
      prepareHeaders: (headers) => {
        const token = localStorage.getItem(AUTH_TOKEN)

        if (token) {
          headers.set("Authorization", `Bearer ${token}`)
        }

        return headers
      },
    })(args, api, extraOptions)

    // 🚨 Если сервер вернул 401 — токен невалиден или истёк
    // Удаляем его из localStorage (можно дополнительно инициировать logout)
    if (result.error?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN)
    }

    // ⚠️ Глобальная обработка ошибок (показ уведомлений и т.д.)
    handleError(api, result)

    return result
  },

  endpoints: () => ({}),
})
