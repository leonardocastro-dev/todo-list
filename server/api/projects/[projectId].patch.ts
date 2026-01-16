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

  const { workspaceId, title, description, emoji, tags } = await readBody(event)

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

  const canEdit =
    isOwnerOrAdmin(permissions) ||
    (hasAnyPermission(permissions, ['manage-projects', 'edit-projects']) &&
      canAccessProject(permissions, projectId))

  if (!canEdit) {
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to edit this project'
    })
  }

  const projectRef = db.doc(`workspaces/${workspaceId}/projects/${projectId}`)
  const projectSnap = await projectRef.get()

  if (!projectSnap.exists) {
    throw createError({ statusCode: 404, message: 'Project not found' })
  }

  const updateData: Record<string, any> = {
    updatedAt: new Date().toISOString()
  }

  if (title !== undefined) updateData.title = title.trim()
  if (description !== undefined)
    updateData.description = description?.trim() || null
  if (emoji !== undefined) updateData.emoji = emoji || null
  if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : []

  await projectRef.update(updateData)

  const updatedSnap = await projectRef.get()
  const project = { id: updatedSnap.id, ...updatedSnap.data() }

  return { success: true, project }
})
