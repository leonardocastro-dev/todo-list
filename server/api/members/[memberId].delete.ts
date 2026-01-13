import { FieldValue } from 'firebase-admin/firestore'
import { db } from '@/server/utils/firebase-admin'
import {
  verifyAuth,
  getMemberPermissions,
  isOwner,
  isAdmin,
  hasAnyPermission
} from '@/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const { uid } = await verifyAuth(event)
  const memberId = getRouterParam(event, 'memberId')

  const { workspaceId } = await readBody(event)

  if (!workspaceId || !memberId) {
    throw createError({ statusCode: 400, message: 'Workspace ID and Member ID are required' })
  }

  const currentUserPermissions = await getMemberPermissions(workspaceId, uid)

  if (!currentUserPermissions) {
    throw createError({ statusCode: 403, message: 'You are not a member of this workspace' })
  }

  const targetMemberPermissions = await getMemberPermissions(workspaceId, memberId)

  if (!targetMemberPermissions) {
    throw createError({ statusCode: 404, message: 'Member not found' })
  }

  if (isOwner(targetMemberPermissions)) {
    throw createError({ statusCode: 403, message: 'Cannot remove the workspace owner' })
  }

  if (memberId === uid) {
    throw createError({ statusCode: 403, message: 'You cannot remove yourself' })
  }

  const canRemove = isOwner(currentUserPermissions) ||
    (isAdmin(currentUserPermissions) && memberId !== uid) ||
    hasAnyPermission(currentUserPermissions, ['manage-members', 'remove-members'])

  if (!canRemove) {
    throw createError({ statusCode: 403, message: 'You do not have permission to remove members' })
  }

  const batch = db.batch()

  const memberRef = db.doc(`workspaces/${workspaceId}/members/${memberId}`)
  batch.delete(memberRef)

  const workspaceRef = db.doc(`workspaces/${workspaceId}`)
  batch.update(workspaceRef, {
    members: FieldValue.arrayRemove(memberId)
  })

  await batch.commit()

  return { success: true }
})
