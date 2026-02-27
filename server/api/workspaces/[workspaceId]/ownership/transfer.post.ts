import { db } from '@/server/utils/firebase-admin'
import {
  verifyAuth,
  requireOwner,
  getMemberData,
  isOwner,
  ROLES
} from '@/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const { uid } = await verifyAuth(event)
  const workspaceId = getRouterParam(event, 'workspaceId')
  const { targetMemberId } = await readBody(event)

  if (!workspaceId) {
    throw createError({
      statusCode: 400,
      message: 'Workspace ID is required'
    })
  }

  if (
    typeof targetMemberId !== 'string' ||
    targetMemberId.trim().length === 0
  ) {
    throw createError({
      statusCode: 400,
      message: 'Target member ID is required'
    })
  }

  const normalizedTargetId = targetMemberId.trim()

  if (normalizedTargetId === uid) {
    throw createError({
      statusCode: 400,
      message: 'Cannot transfer ownership to yourself'
    })
  }

  await requireOwner(workspaceId, uid)
  const targetMember = await getMemberData(workspaceId, normalizedTargetId)

  if (!targetMember) {
    throw createError({
      statusCode: 404,
      message: 'Target member not found'
    })
  }

  if (isOwner(targetMember.role)) {
    throw createError({
      statusCode: 400,
      message: 'Target member is already the owner'
    })
  }

  const workspaceRef = db.doc(`workspaces/${workspaceId}`)
  const currentOwnerRef = db.doc(`workspaces/${workspaceId}/members/${uid}`)
  const targetOwnerRef = db.doc(
    `workspaces/${workspaceId}/members/${normalizedTargetId}`
  )

  const batch = db.batch()
  batch.update(workspaceRef, {
    ownerId: normalizedTargetId,
    updatedAt: new Date().toISOString()
  })
  batch.update(currentOwnerRef, { role: ROLES.ADMIN })
  batch.update(targetOwnerRef, { role: ROLES.OWNER })
  await batch.commit()

  return {
    success: true,
    ownerId: normalizedTargetId
  }
})
