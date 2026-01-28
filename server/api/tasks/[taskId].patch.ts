import { db } from '@/server/utils/firebase-admin'
import {
  verifyAuth,
  canAccessProject,
  updateTaskMembers,
  validateWorkspaceMemberIds,
  requirePermission
} from '@/server/utils/permissions'
import { PERMISSIONS } from '@/constants/permissions'

export default defineEventHandler(async (event) => {
  const { uid } = await verifyAuth(event)

  const taskId = getRouterParam(event, 'taskId')

  if (!taskId) {
    throw createError({ statusCode: 400, message: 'Task ID is required' })
  }

  const {
    workspaceId,
    projectId,
    title,
    description,
    status,
    priority,
    dueDate,
    completed,
    memberIds
  } = await readBody(event)

  if (!workspaceId || !projectId) {
    throw createError({
      statusCode: 400,
      message: 'Workspace ID and Project ID are required'
    })
  }

  // Check if user has permission to edit tasks
  await requirePermission(workspaceId, uid, [
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.EDIT_TASKS
  ])

  const hasAccess = await canAccessProject(workspaceId, projectId, uid)

  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      message: 'You do not have access to this project'
    })
  }

  const taskRef = db.doc(
    `workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`
  )
  const taskDoc = await taskRef.get()

  if (!taskDoc.exists) {
    throw createError({ statusCode: 404, message: 'Task not found' })
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString()
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Task title cannot be empty'
      })
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

  // Update task member assignments if provided (validate memberIds first)
  if (memberIds !== undefined && Array.isArray(memberIds)) {
    if (memberIds.length > 0) {
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

      await updateTaskMembers(workspaceId, projectId, taskId, valid, uid)
    } else {
      // Empty array means remove all members
      await updateTaskMembers(workspaceId, projectId, taskId, [], uid)
    }
  }

  return { success: true }
})
