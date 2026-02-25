import { db } from '@/server/utils/firebase-admin'
import {
  verifyAuth,
  canAccessProject,
  updateTaskMembers,
  validateWorkspaceMemberIds,
  requirePermission,
  updateProjectTaskCounters
} from '@/server/utils/permissions'
import { PERMISSIONS } from '@/constants/permissions'

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

  if (!workspaceId) {
    throw createError({
      statusCode: 400,
      message: 'Workspace ID is required'
    })
  }

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'Task title is required' })
  }

  // Check if user has permission to create tasks
  await requirePermission(workspaceId, uid, [
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.CREATE_TASKS
  ])

  const normalizedProjectId =
    typeof projectId === 'string' && projectId.trim().length > 0
      ? projectId.trim()
      : undefined

  if (normalizedProjectId) {
    const hasAccess = await canAccessProject(
      workspaceId,
      normalizedProjectId,
      uid
    )

    if (!hasAccess) {
      throw createError({
        statusCode: 403,
        message: 'You do not have access to this project'
      })
    }
  }

  const taskId = String(Date.now())

  const task = {
    id: taskId,
    title: title.trim(),
    description: description?.trim() || null,
    status: status || 'pending',
    priority: priority || 'normal',
    dueDate: dueDate || null,
    ...(normalizedProjectId ? { projectId: normalizedProjectId } : {}),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assigneeIds: memberIds || []
  }

  const taskRef = db.doc(`workspaces/${workspaceId}/tasks/${taskId}`)
  await taskRef.set(task)

  await updateProjectTaskCounters(
    workspaceId,
    normalizedProjectId,
    1,
    task.status === 'completed' ? 1 : 0
  )

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
      await updateTaskMembers(
        workspaceId,
        normalizedProjectId,
        taskId,
        valid,
        uid
      )
    }
  }

  return { success: true, task }
})
