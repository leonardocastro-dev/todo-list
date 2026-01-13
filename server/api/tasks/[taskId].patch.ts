import { db } from '@/server/utils/firebase-admin'
import { verifyAuth, getMemberPermissions, canAccessProject } from '@/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const { uid } = await verifyAuth(event)

  const taskId = getRouterParam(event, 'taskId')

  if (!taskId) {
    throw createError({ statusCode: 400, message: 'Task ID is required' })
  }

  const { workspaceId, projectId, title, description, status, priority, dueDate, completed } = await readBody(event)

  if (!workspaceId || !projectId) {
    throw createError({ statusCode: 400, message: 'Workspace ID and Project ID are required' })
  }

  const permissions = await getMemberPermissions(workspaceId, uid)

  if (!permissions) {
    throw createError({ statusCode: 403, message: 'You are not a member of this workspace' })
  }

  if (!canAccessProject(permissions, projectId)) {
    throw createError({ statusCode: 403, message: 'You do not have access to this project' })
  }

  const taskRef = db.doc(`workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`)
  const taskDoc = await taskRef.get()

  if (!taskDoc.exists) {
    throw createError({ statusCode: 404, message: 'Task not found' })
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString()
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      throw createError({ statusCode: 400, message: 'Task title cannot be empty' })
    }
    updates.title = title.trim()
  }

  if (description !== undefined) {
    updates.description = description?.trim() || null
  }

  if (status !== undefined) {
    updates.status = status
  }

  if (priority !== undefined) {
    updates.priority = priority
  }

  if (dueDate !== undefined) {
    updates.dueDate = dueDate
  }

  if (completed !== undefined) {
    updates.completed = completed
  }

  await taskRef.update(updates)

  return { success: true }
})
