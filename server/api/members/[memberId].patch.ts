import { db } from '@/server/utils/firebase-admin'
import {
  verifyAuth,
  getMemberPermissions,
  isOwner,
  isAdmin,
  isOwnerOrAdmin
} from '@/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const { uid } = await verifyAuth(event)
  const memberId = getRouterParam(event, 'memberId')

  const { workspaceId, permissions } = await readBody(event)

  if (!workspaceId || !memberId) {
    throw createError({ statusCode: 400, message: 'Workspace ID and Member ID are required' })
  }

  if (permissions === undefined) {
    throw createError({ statusCode: 400, message: 'Permissions are required' })
  }

  const currentUserPermissions = await getMemberPermissions(workspaceId, uid)

  if (!currentUserPermissions) {
    throw createError({ statusCode: 403, message: 'You are not a member of this workspace' })
  }

  if (!isOwnerOrAdmin(currentUserPermissions)) {
    throw createError({ statusCode: 403, message: 'Only owners and admins can update permissions' })
  }

  const targetMemberPermissions = await getMemberPermissions(workspaceId, memberId)

  if (!targetMemberPermissions) {
    throw createError({ statusCode: 404, message: 'Member not found' })
  }

  if (isOwner(targetMemberPermissions)) {
    throw createError({ statusCode: 403, message: 'Cannot modify owner permissions' })
  }

  if (permissions?.owner === true) {
    throw createError({ statusCode: 403, message: 'Cannot assign owner permission' })
  }

  if (isAdmin(currentUserPermissions) && !isOwner(currentUserPermissions) && memberId === uid) {
    throw createError({ statusCode: 403, message: 'Admins cannot modify their own permissions' })
  }

  const memberRef = db.doc(`workspaces/${workspaceId}/members/${memberId}`)

  await memberRef.update({ permissions })

  return { success: true }
})
