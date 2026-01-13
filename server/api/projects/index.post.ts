import { db } from '@/server/utils/firebase-admin'
import { verifyAuth, requirePermission } from '@/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const { uid } = await verifyAuth(event)

  const { workspaceId, title, description, emoji, tags } = await readBody(event)

  if (!workspaceId) {
    throw createError({ statusCode: 400, message: 'Workspace ID is required' })
  }

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'Project title is required' })
  }

  await requirePermission(workspaceId, uid, ['manage-projects', 'create-projects'])

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

  return { success: true, project }
})
