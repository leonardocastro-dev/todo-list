import { computed, ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { toast } from 'vue-sonner'

interface UseTaskStatusSyncOptions {
  taskId: string
  initialStatus: Status
  onLocalUpdate: (status: Status) => void
  onServerSync: (status: Status) => Promise<void>
  debounceMs?: number
}

export function useTaskStatusSync(options: UseTaskStatusSyncOptions) {
  const {
    initialStatus,
    onLocalUpdate,
    onServerSync,
    debounceMs = 300
  } = options

  // Estado local para resposta imediata da UI
  const localStatus = ref<Status>(initialStatus)
  const localChecked = computed(() => localStatus.value === 'completed')

  // ID da request para controle de race conditions
  let currentRequestId = 0

  // Indica se há sincronização pendente
  const hasPendingSync = ref(false)

  // Função de sync com servidor (debounced)
  const debouncedServerSync = useDebounceFn(
    async (status: Status, requestId: number, previousStatus: Status) => {
      if (requestId !== currentRequestId) return

      try {
        await onServerSync(status)
      } catch {
        // Reverte UI em caso de erro
        if (requestId === currentRequestId) {
          localStatus.value = previousStatus
          onLocalUpdate(previousStatus)
          toast.error('Failed to sync task status', {
            style: { background: '#fda4af' },
            duration: 3000
          })
        }
      } finally {
        if (requestId === currentRequestId) {
          hasPendingSync.value = false
        }
      }
    },
    debounceMs
  )

  // Handler do toggle
  function toggle(checked: boolean) {
    const previousStatus = localStatus.value
    const status: Status = checked ? 'completed' : 'pending'
    localStatus.value = status
    currentRequestId++
    hasPendingSync.value = true

    // Atualiza store imediatamente (para stats e outros componentes)
    onLocalUpdate(status)

    // Sincroniza com servidor com debounce (passa status anterior para rollback)
    debouncedServerSync(status, currentRequestId, previousStatus)
  }

  // Sincroniza com mudanças externas (ex: outro usuário)
  function syncFromExternal(externalStatus: Status) {
    if (!hasPendingSync.value && localStatus.value !== externalStatus) {
      localStatus.value = externalStatus
    }
  }

  return { localChecked, toggle, syncFromExternal, hasPendingSync }
}
