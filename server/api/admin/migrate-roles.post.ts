import { db } from '@/server/utils/firebase-admin'
import { verifyAuth, getMemberData } from '@/server/utils/permissions'
import { ROLES } from '@/constants/permissions'

export default defineEventHandler(async (event) => {
  const { uid } = await verifyAuth(event)

  // Get all workspaces
  const workspacesSnap = await db.collection('workspaces').get()
  const results: Array<{
    workspaceId: string
    migrated: number
    skipped: number
    errors: string[]
  }> = []

  for (const wsDoc of workspacesSnap.docs) {
    const workspaceId = wsDoc.id
    const workspaceData = wsDoc.data()

    // Verify the caller is the workspace owner
    const callerMember = await getMemberData(workspaceId, uid)
    if (!callerMember || callerMember.role !== ROLES.OWNER) {
      // For safety: check if caller has owner permission in old format
      const callerSnap = await db
        .doc(`workspaces/${workspaceId}/members/${uid}`)
        .get()
      const callerData = callerSnap.data()
      if (!callerData?.permissions?.owner && workspaceData?.ownerId !== uid) {
        results.push({
          workspaceId,
          migrated: 0,
          skipped: 0,
          errors: ['Not owner of this workspace, skipping']
        })
        continue
      }
    }

    const membersSnap = await db
      .collection(`workspaces/${workspaceId}/members`)
      .get()

    let migrated = 0
    let skipped = 0
    const errors: string[] = []

    for (const memberDoc of membersSnap.docs) {
      try {
        const data = memberDoc.data()

        // Skip if already migrated (has role field and no owner/admin in permissions)
        if (data.role && !data.permissions?.owner && !data.permissions?.admin) {
          skipped++
          continue
        }

        // Determine role
        let role: string = ROLES.MEMBER
        if (data.permissions?.owner === true) {
          role = ROLES.OWNER
        } else if (data.permissions?.admin === true) {
          role = ROLES.ADMIN
        } else if (data.role) {
          role = data.role
        }

        // Clean permissions: remove owner and admin flags
        const cleanPermissions = { ...(data.permissions || {}) }
        delete cleanPermissions.owner
        delete cleanPermissions.admin

        await memberDoc.ref.update({
          role,
          permissions: cleanPermissions
        })

        migrated++
      } catch (err: any) {
        errors.push(`${memberDoc.id}: ${err.message}`)
      }
    }

    results.push({ workspaceId, migrated, skipped, errors })
  }

  return { success: true, results }
})
