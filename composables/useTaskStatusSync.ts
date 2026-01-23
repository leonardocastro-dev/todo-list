import { ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'

interface UseTaskStatusSyncOptions {
  taskId: string
  initialStatus: 'pending' | 'completed'
  onLocalUpdate: (status: 'pending' | 'completed') => void
  onServerSync: (status: 'pending' | 'completed') => Promise<void>
  debounceMs?: number
}

export function useTaskStatusSync(options: UseTaskStatusSyncOptions) {
  const { initialStatus, onLocalUpdate, onServerSync, debounceMs = 300 } = options

  // Estado local para resposta imediata da UI
  const localChecked = ref(initialStatus === 'completed')

  // ID da request para controle de race conditions
  let currentRequestId = 0

  // Indica se há sincronização pendente
  const hasPendingSync = ref(false)

  // Função de sync com servidor (debounced)
  const debouncedServerSync = useDebounceFn(async (status: 'pending' | 'completed', requestId: number) => {
    if (requestId !== currentRequestId) return

    try {
      await onServerSync(status)
    } finally {
      if (requestId === currentRequestId) {
        hasPendingSync.value = false
      }
    }
  }, debounceMs)

  // Handler do toggle
  function toggle(checked: boolean) {
    localChecked.value = checked
    currentRequestId++
    hasPendingSync.value = true
    const status = checked ? 'completed' : 'pending'

    // Atualiza store imediatamente (para stats e outros componentes)
    onLocalUpdate(status)

    // Sincroniza com servidor com debounce
    debouncedServerSync(status, currentRequestId)
  }

  // Sincroniza com mudanças externas (ex: outro usuário)
  function syncFromExternal(externalStatus: 'pending' | 'completed') {
    const externalChecked = externalStatus === 'completed'
    if (!hasPendingSync.value && localChecked.value !== externalChecked) {
      localChecked.value = externalChecked
    }
  }

  return { localChecked, toggle, syncFromExternal, hasPendingSync }
}
