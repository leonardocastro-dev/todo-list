import { db } from '@/server/utils/firebase-admin'
import {
  verifyAuth,
  getMemberPermissions,
  canAccessProject
} from '@/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const { uid } = await verifyAuth(event)

  const {
    workspaceId,
    projectId,
    title,
    description,
    status,
    priority,
    dueDate
  } = await readBody(event)

  if (!workspaceId || !projectId) {
    throw createError({
      statusCode: 400,
      message: 'Workspace ID and Project ID are required'
    })
  }

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'Task title is required' })
  }

  const permissions = await getMemberPermissions(workspaceId, uid)

  if (!permissions) {
    throw createError({
      statusCode: 403,
      message: 'You are not a member of this workspace'
    })
  }

  if (!canAccessProject(permissions, projectId)) {
    throw createError({
      statusCode: 403,
      message: 'You do not have access to this project'
    })
  }

  const taskId = String(Date.now())

  const task = {
    id: taskId,
    title: title.trim(),
    description: description?.trim() || null,
    status: status || 'pending',
    priority: priority || 'medium',
    dueDate: dueDate || null,
    projectId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  const taskRef = db.doc(
    `workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`
  )
  await taskRef.set(task)

  return { success: true, task }
})
