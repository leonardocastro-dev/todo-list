declare interface Project {
  id: string
  title: string
  description?: string
  emoji?: string
  members?: string[]
  workspaceId?: string
  createdAt: string
  updatedAt: string
  assignedUserIds?: string[] // Denormalized - for UI tracking only
  taskCount?: number
  completedTaskCount?: number
}
