declare type ProjectRole = 'owner' | 'editor' | 'viewer'
declare type TaskRole = 'assignee'

declare interface ProjectAssignment {
  role: ProjectRole
  assignedAt: string
  assignedBy?: string
}

declare interface TaskAssignment {
  role: TaskRole
  assignedAt: string
  assignedBy?: string
}
