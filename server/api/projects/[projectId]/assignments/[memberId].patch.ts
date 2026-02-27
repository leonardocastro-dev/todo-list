import { db } from '@/server/utils/firebase-admin'
import {
  verifyAuth,
  getMemberData,
  hasAnyPermission,
  canAccessProject
} from '@/server/utils/permissions'
import { PERMISSIONS } from '@/constants/permissions'

export default defineEventHandler(async (event) => {
  const { uid } = await verifyAuth(event)
  const projectId = getRouterParam(event, 'projectId')
  const memberId = getRouterParam(event, 'memberId')

  const { workspaceId, permissions: taskPermissions } = await readBody(event)

  if (!workspaceId || !projectId || !memberId) {
    throw createError({
      statusCode: 400,
      message: 'Workspace ID, Project ID, and Member ID are required'
    })
  }

  // Check access via isOwnerOrAdmin, access-projects permission, OR projectAssignment
  const hasAccess = await canAccessProject(workspaceId, projectId, uid)

  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      message: 'You do not have access to this project'
    })
  }

  // Verify user has permission to assign members to projects
  const member = await getMemberData(workspaceId, uid)

  if (
    !hasAnyPermission(member?.role, member?.permissions ?? null, [
      PERMISSIONS.ASSIGN_PROJECT
    ])
  ) {
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to manage project assignments'
    })
  }

  // Prevent self-assignment to avoid privilege escalation
  if (memberId === uid) {
    throw createError({
      statusCode: 403,
      message: 'You cannot assign yourself to a project'
    })
  }

  // Validate task permissions against allowed keys
  const ALLOWED_PROJECT_PERMISSIONS = new Set<string>([
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.CREATE_TASKS,
    PERMISSIONS.EDIT_TASKS,
    PERMISSIONS.DELETE_TASKS,
    PERMISSIONS.TOGGLE_STATUS
  ])

  if (taskPermissions && typeof taskPermissions === 'object') {
    const invalidKeys = Object.keys(taskPermissions).filter(
      (key) => !ALLOWED_PROJECT_PERMISSIONS.has(key)
    )
    if (invalidKeys.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Invalid permission keys: ${invalidKeys.join(', ')}`
      })
    }
  }

  // Verify the target member exists in workspace
  const memberRef = db.doc(`workspaces/${workspaceId}/members/${memberId}`)
  const memberSnap = await memberRef.get()

  if (!memberSnap.exists) {
    throw createError({
      statusCode: 404,
      message: 'Member not found in workspace'
    })
  }

  // Get or create the assignment
  const assignmentRef = db.doc(
    `workspaces/${workspaceId}/projectAssignments/${projectId}/users/${memberId}`
  )
  const assignmentSnap = await assignmentRef.get()

  if (assignmentSnap.exists) {
    // Update existing assignment with new permissions
    await assignmentRef.update({
      permissions: taskPermissions || null
    })
  } else {
    // Create new assignment with permissions
    const assignment: ProjectAssignment = {
      role: 'editor',
      assignedAt: new Date().toISOString(),
      assignedBy: uid,
      permissions: taskPermissions || undefined
    }
    await assignmentRef.set(assignment)
  }

  const updatedSnap = await assignmentRef.get()

  return {
    success: true,
    assignment: {
      memberId,
      projectId,
      ...updatedSnap.data()
    }
  }
})
