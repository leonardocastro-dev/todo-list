<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Mail, Crown, X } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{
  memberId: string
  memberName: string
  workspaceOwnerId: string
  workspaceId: string
}>()

const { user } = useAuth()

const removeMember = async () => {
  // TODO: Implement member removal
  console.log('Remove member:', props.memberId)
}
</script>

<template>
  <div class="flex items-center justify-between p-4 border rounded-lg transition-colors">
    <div class="flex items-center gap-3">
      <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Mail class="h-5 w-5 text-primary" />
      </div>
      <div>
        <p class="font-medium text-foreground">
          {{ memberName }}
        </p>
        <p class="text-sm text-muted-foreground">Member</p>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <Badge v-if="workspaceOwnerId === memberId" variant="secondary" class="gap-1">
        <Crown class="h-3 w-3" />
        Owner
      </Badge>

      <DropdownMenu v-if="workspaceOwnerId !== memberId && workspaceOwnerId === user?.uid">
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
            <span class="sr-only">Open menu</span>
            <MoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem class="text-destructive focus:text-destructive" @click="removeMember">
            Remove Member
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>
