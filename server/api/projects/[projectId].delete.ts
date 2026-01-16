import { db } from '@/server/utils/firebase-admin'
import {
  verifyAuth,
  getMemberPermissions,
  isOwnerOrAdmin,
  hasAnyPermission,
  canAccessProject
} from '@/server/utils/permissions'

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

  const permissions = await getMemberPermissions(workspaceId, uid)

  if (!permissions) {
    throw createError({
      statusCode: 403,
      message: 'You are not a member of this workspace'
    })
  }

  const canDelete =
    isOwnerOrAdmin(permissions) ||
    (hasAnyPermission(permissions, ['manage-projects', 'delete-projects']) &&
      canAccessProject(permissions, projectId))

  if (!canDelete) {
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to delete this project'
    })
  }

  const projectRef = db.doc(`workspaces/${workspaceId}/projects/${projectId}`)
  const projectSnap = await projectRef.get()

  if (!projectSnap.exists) {
    throw createError({ statusCode: 404, message: 'Project not found' })
  }

  const batch = db.batch()

  const tasksSnap = await db
    .collection(`workspaces/${workspaceId}/projects/${projectId}/tasks`)
    .get()
  tasksSnap.docs.forEach((taskDoc) => {
    batch.delete(taskDoc.ref)
  })

  batch.delete(projectRef)

  await batch.commit()

  return { success: true }
})
