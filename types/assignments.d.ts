declare type ProjectRole = 'owner' | 'editor' | 'viewer'
declare type TaskRole = 'assignee'

declare interface ProjectAssignmentPermissions {
  'manage-tasks'?: boolean
  'create-tasks'?: boolean
  'edit-tasks'?: boolean
  'delete-tasks'?: boolean
}

declare interface ProjectAssignment {
  role: ProjectRole
  assignedAt: string
  assignedBy?: string
  permissions?: ProjectAssignmentPermissions
}

declare interface TaskAssignment {
  role: TaskRole
  assignedAt: string
  assignedBy?: string
}
