import { db } from '@/server/utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const token = event.context.params!.token

  const snap = await db
    .collection('invites')
    .where('token', '==', token)
    .where('status', '==', 'pending')
    .limit(1)
    .get()

  if (snap.empty) {
    throw createError({ statusCode: 404, statusMessage: 'Invalid invite' })
  }

  const invite = snap.docs[0]
  const data = invite.data()

  if (!data.expiresAt || data.expiresAt.toMillis() < Date.now()) {
    throw createError({ statusCode: 410, statusMessage: 'Invite expired' })
  }

  return {
    id: invite.id,
    workspaceId: data.workspaceId,
    workspaceName: data.workspaceName,
    inviterName: data.inviterName
  }
})
