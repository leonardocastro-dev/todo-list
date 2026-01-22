import { db } from '@/server/utils/firebase-admin'
import {
  verifyAuth,
  canAccessProject,
  deleteTaskAssignments
} from '@/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const { uid } = await verifyAuth(event)

  const taskId = getRouterParam(event, 'taskId')

  if (!taskId) {
    throw createError({ statusCode: 400, message: 'Task ID is required' })
  }

  const { workspaceId, projectId } = await readBody(event)

  if (!workspaceId || !projectId) {
    throw createError({
      statusCode: 400,
      message: 'Workspace ID and Project ID are required'
    })
  }

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

  // Delete task assignments
  await deleteTaskAssignments(workspaceId, taskId)

  // Delete the task
  await taskRef.delete()

  return { success: true }
})
