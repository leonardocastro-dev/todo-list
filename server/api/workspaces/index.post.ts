import { Timestamp } from 'firebase-admin/firestore'
import { db } from '@/server/utils/firebase-admin'
import { verifyAuth } from '@/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const { uid, email } = await verifyAuth(event)

  const { name, description } = await readBody(event)

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Workspace name is required'
    })
  }

  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  const workspaceId = `${slug}-${Date.now()}`

  const userSnap = await db.doc(`users/${uid}`).get()
  const userData = userSnap.data()

  const workspace = {
    id: workspaceId,
    slug,
    name: name.trim(),
    description: description?.trim() || null,
    ownerId: uid,
    members: [uid],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  const batch = db.batch()

  const workspaceRef = db.doc(`workspaces/${workspaceId}`)
  batch.set(workspaceRef, workspace)

  const memberRef = db.doc(`workspaces/${workspaceId}/members/${uid}`)
  batch.set(memberRef, {
    uid,
    email: email || userData?.email || '',
    username:
      userData?.username || userData?.name || email?.split('@')[0] || '',
    photoURL: userData?.photoURL || null,
    permissions: {
      owner: true
    },
    joinedAt: Timestamp.now()
  })

  await batch.commit()

  return { success: true, workspace }
})
