declare type Priority = 'urgent' | 'important' | 'normal'
declare type Status = 'pending' | 'inProgress' | 'completed'

declare interface Task {
  id: string
  projectId?: string
  title: string
  description?: string
  status: Status
  priority: Priority
  dueDate?: string
  createdAt: string
  updatedAt: string
  assigneeIds?: string[]
}
