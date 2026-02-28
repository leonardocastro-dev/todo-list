import { db } from '@/server/utils/firebase-admin'
import {
  verifyAuth,
  getMemberData,
  hasAnyPermission,
  canAccessProject,
  deleteProjectAssignments,
  deleteTaskAssignments
} from '@/server/utils/permissions'
import { PERMISSIONS } from '@/constants/permissions'

export default defineEventHandler(async (event) => {
  const { uid } = await verifyAuth(event)
  const projectId = getRouterParam(event, 'projectId')

  const { workspaceId } = await readBody(event)

  if (!workspaceId || !projectId) {
    throw createError({
      statusCode: 400,
      message: 'Workspace ID and Project ID are required'
    })
  }

  // Check access via isOwnerOrAdmin, access-projects permission, OR projectAssignment
  const hasAccess = await canAccessProject(workspaceId, projectId, uid)

  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      message: 'You do not have access to this project'
    })
  }

  // Verify user has permission to delete projects
  const member = await getMemberData(workspaceId, uid)

  if (
    !hasAnyPermission(member?.role, member?.permissions ?? null, [
      PERMISSIONS.MANAGE_PROJECTS,
      PERMISSIONS.DELETE_PROJECTS
    ])
  ) {
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to delete projects'
    })
  }

  const projectRef = db.doc(`workspaces/${workspaceId}/projects/${projectId}`)
  const projectSnap = await projectRef.get()

  if (!projectSnap.exists) {
    throw createError({ statusCode: 404, message: 'Project not found' })
  }

  // Query tasks that belong to this project
  const tasksSnap = await db
    .collection(`workspaces/${workspaceId}/tasks`)
    .where('projectId', '==', projectId)
    .get()

  const batch = db.batch()

  // Delete tasks and their assignments
  for (const taskDoc of tasksSnap.docs) {
    await deleteTaskAssignments(workspaceId, taskDoc.id)
    batch.delete(taskDoc.ref)
  }

  batch.delete(projectRef)

  await batch.commit()

  // Delete project assignments
  await deleteProjectAssignments(workspaceId, projectId)

  return { success: true }
})
