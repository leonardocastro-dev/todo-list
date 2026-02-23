import { Resend } from 'resend'
import { Timestamp } from 'firebase-admin/firestore'
import { db } from '@/server/utils/firebase-admin'
import { verifyAuth, requirePermission } from '@/server/utils/permissions'
import crypto from 'node:crypto'

const resend = new Resend(process.env.NUXT_RESEND_API_KEY)

export default defineEventHandler(async (event) => {
  const { uid } = await verifyAuth(event)

  const { to, workspaceId } = await readBody(event)

  if (!to || !workspaceId) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: to, workspaceId'
    })
  }

  await requirePermission(workspaceId, uid, ['manage-members', 'add-members'])

  const email = to.toLowerCase().trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    throw createError({ statusCode: 400, message: 'Invalid email address' })
  }

  const workspaceRef = db.doc(`workspaces/${workspaceId}`)
  const workspaceSnap = await workspaceRef.get()
  const workspace = workspaceSnap.data()!

  const usersSnapshot = await db
    .collection('users')
    .where('email', '==', email)
    .limit(1)
    .get()

  if (!usersSnapshot.empty) {
    const invitedUserId = usersSnapshot.docs[0].id
    if (workspace.members.includes(invitedUserId)) {
      throw createError({
        statusCode: 400,
        message: 'User already belongs to this workspace'
      })
    }
  }

  const inviterSnap = await db.doc(`users/${uid}`).get()
  const inviter = inviterSnap.data()

  const inviteToken = crypto.randomUUID()

  await db.collection('invites').add({
    token: inviteToken,
    workspaceId,
    workspaceName: workspace.name,
    invitedEmail: email,
    inviterId: uid,
    inviterName: inviter?.name || inviter?.email || 'Someone',
    status: 'pending',
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromMillis(Date.now() + 7 * 86400000)
  })

  const config = useRuntimeConfig()
  const baseUrl = config.public.baseUrl
  const inviteLink = `${baseUrl}/invite/${inviteToken}`
  const inviterName = inviter?.name || inviter?.email || 'Someone'

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      </head>
      <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; padding: 40px; margin: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="width: fit-content; margin: 0 auto;">
          <tr>
            <td align="center">
              <table width="100%" style="background: #ffffff; padding: 40px 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding-bottom: 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <img src="${baseUrl}/logo-light.png" alt="Fokuz" height="40" style="display: block;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h2 style="margin: 0 0 24px 0; color: #0f172a; font-size: 24px; font-weight: 600; line-height: 1.3; font-family: 'Inter', sans-serif;">
                      You've been invited! 🎉
                    </h2>

                    <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.6; font-family: 'Inter', sans-serif;">
                      <strong>${inviterName}</strong> has invited you to join the workspace
                      <strong>${workspace.name}</strong>.
                    </p>

                    <p style="margin: 32px 0;">
                      <a
                        href="${inviteLink}"
                        style="
                          display: inline-block;
                          padding: 10px 24px;
                          background: #8e51ff;
                          color: #ffffff;
                          text-decoration: none;
                          border-radius: 8px;
                          font-weight: 500;
                          font-size: 14px;
                          font-family: 'Inter', sans-serif;
                          box-shadow: 0 1px 2px rgba(139, 92, 246, 0.2);
                        "
                      >
                        Accept Invitation
                      </a>
                    </p>

                    <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b; line-height: 1.5; font-family: 'Inter', sans-serif;">
                      This invitation will expire in 7 days. If you weren't expecting this email,
                      you can safely ignore it.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; font-size: 12px; color: #94a3b8; text-align: center; font-family: 'Inter', sans-serif;">
                Fokuz · Workspace Management
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  await resend.emails.send({
    from: 'Fokuz <invite@leocastro.me>',
    to: email,
    subject: `Invitation to ${workspace.name}`,
    html: emailHtml
  })

  return { success: true }
})
