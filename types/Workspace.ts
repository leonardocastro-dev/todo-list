export interface Workspace {
  id: string
  slug: string
  name: string
  description?: string
  ownerId: string
  members: string[]
  createdAt: number
  updatedAt: number
}
