import { db } from '@/server/utils/firebase-admin'
import {
  verifyAuth,
  canAccessProject,
  updateTaskMembers,
  validateWorkspaceMemberIds
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
    dueDate,
    memberIds
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

  const hasAccess = await canAccessProject(workspaceId, projectId, uid)

  if (!hasAccess) {
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

  // Assign members to task if provided (validate memberIds first)
  if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
    const { valid, invalid } = await validateWorkspaceMemberIds(
      workspaceId,
      memberIds
    )

    if (invalid.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Invalid member IDs: ${invalid.join(', ')}`
      })
    }

    if (valid.length > 0) {
      await updateTaskMembers(workspaceId, projectId, taskId, valid, uid)
    }
  }

  return { success: true, task }
})
