declare interface Project {
  id: string
  title: string
  description?: string
  emoji?: string
  members?: string[]
  workspaceId?: string
  createdAt: string
  updatedAt: string
  assigneeIds?: string[]
  taskCount?: number
  completedTaskCount?: number
}
