import { db } from '@/server/utils/firebase-admin'
import {
  verifyAuth,
  requirePermission,
  updateProjectMemberAccess
} from '@/server/utils/permissions'
import { PERMISSIONS } from '@/constants/permissions'

export default defineEventHandler(async (event) => {
  const { uid } = await verifyAuth(event)

  const { workspaceId, title, description, emoji, tags, memberIds } =
    await readBody(event)

  if (!workspaceId) {
    throw createError({ statusCode: 400, message: 'Workspace ID is required' })
  }

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'Project title is required' })
  }

  await requirePermission(workspaceId, uid, [
    PERMISSIONS.MANAGE_PROJECTS,
    PERMISSIONS.CREATE_PROJECTS
  ])

  const projectId = String(Date.now())

  const project = {
    id: projectId,
    title: title.trim(),
    description: description?.trim() || null,
    emoji: emoji || null,
    tags: Array.isArray(tags) ? tags : [],
    workspaceId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  const projectRef = db.doc(`workspaces/${workspaceId}/projects/${projectId}`)
  await projectRef.set(project)

  // Assign member access if provided
  if (Array.isArray(memberIds) && memberIds.length > 0) {
    await updateProjectMemberAccess(workspaceId, projectId, memberIds)
  }

  return { success: true, project }
})
