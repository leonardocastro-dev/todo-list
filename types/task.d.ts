declare type Priority = 'urgent' | 'important' | 'normal'
declare type Status = 'pending' | 'completed'

declare interface Task {
  id: string
  projectId: string
  title: string
  description?: string
  status: 'pending' | 'completed'
  priority: 'normal' | 'important' | 'urgent'
  dueDate?: string
  createdAt: string
}
