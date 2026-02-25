import { db } from '@/server/utils/firebase-admin'
import {
  verifyAuth,
  canAccessProject,
  deleteTaskAssignments,
  requirePermission,
  updateProjectTaskCounters
} from '@/server/utils/permissions'
import { PERMISSIONS } from '@/constants/permissions'

export default defineEventHandler(async (event) => {
  const { uid } = await verifyAuth(event)

  const taskId = getRouterParam(event, 'taskId')

  if (!taskId) {
    throw createError({ statusCode: 400, message: 'Task ID is required' })
  }

  const { workspaceId } = await readBody(event)

  if (!workspaceId) {
    throw createError({
      statusCode: 400,
      message: 'Workspace ID is required'
    })
  }

  // Check if user has permission to delete tasks
  await requirePermission(workspaceId, uid, [
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.DELETE_TASKS
  ])

  const taskRef = db.doc(`workspaces/${workspaceId}/tasks/${taskId}`)
  const taskDoc = await taskRef.get()

  if (!taskDoc.exists) {
    throw createError({ statusCode: 404, message: 'Task not found' })
  }

  const taskProjectId =
    typeof taskDoc.data()?.projectId === 'string' &&
    taskDoc.data()?.projectId.trim().length > 0
      ? taskDoc.data()?.projectId
      : undefined

  if (taskProjectId) {
    const hasAccess = await canAccessProject(workspaceId, taskProjectId, uid)
    if (!hasAccess) {
      throw createError({
        statusCode: 403,
        message: 'You do not have access to this project'
      })
    }
  }

  // Delete task assignments
  await deleteTaskAssignments(workspaceId, taskProjectId, taskId)

  // Delete the task
  await taskRef.delete()

  const taskStatus = taskDoc.data()?.status
  await updateProjectTaskCounters(
    workspaceId,
    taskProjectId,
    -1,
    taskStatus === 'completed' ? -1 : 0
  )

  return { success: true }
})
