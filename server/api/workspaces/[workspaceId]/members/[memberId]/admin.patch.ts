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
  const memberId = getRouterParam(event, 'memberId')
  const { isAdmin } = await readBody(event)

  if (!workspaceId || !memberId) {
    throw createError({
      statusCode: 400,
      message: 'Workspace ID and Member ID are required'
    })
  }

  if (typeof isAdmin !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: 'isAdmin must be a boolean'
    })
  }

  await requireOwner(workspaceId, uid)

  const targetMember = await getMemberData(workspaceId, memberId)
  if (!targetMember) {
    throw createError({
      statusCode: 404,
      message: 'Member not found'
    })
  }

  if (isOwner(targetMember.role)) {
    throw createError({
      statusCode: 403,
      message: 'Cannot modify owner admin role'
    })
  }

  const nextRole = isAdmin ? ROLES.ADMIN : ROLES.MEMBER

  const memberRef = db.doc(`workspaces/${workspaceId}/members/${memberId}`)
  await memberRef.update({ role: nextRole })

  return {
    success: true,
    memberId,
    isAdmin
  }
})
