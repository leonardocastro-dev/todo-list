import type { H3Event } from 'h3'
import { createError, getHeader } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { auth, db } from './firebase-admin'
import type { Role } from '@/constants/permissions'
import {
  ROLES,
  PERMISSIONS,
  WORKSPACE_PERMISSIONS,
  PROJECT_PERMISSIONS,
  impliesWorkspace,
  impliesProject,
  isOwner,
  isAdmin,
  isOwnerOrAdmin,
  hasPermission,
  hasAnyPermission,
  hasWorkspacePermission,
  hasProjectPermission,
  WORKSPACE_PERMISSION_SET,
  PROJECT_PERMISSION_SET
} from '@/constants/permissions'

export {
  isOwner,
  isAdmin,
  isOwnerOrAdmin,
  hasPermission,
  hasAnyPermission,
  hasWorkspacePermission,
  hasProjectPermission,
  ROLES,
  PERMISSIONS,
  WORKSPACE_PERMISSIONS,
  PROJECT_PERMISSIONS,
  impliesWorkspace,
  impliesProject,
  WORKSPACE_PERMISSION_SET,
  PROJECT_PERMISSION_SET
}

export interface MemberData {
  role: Role | string
  permissions: Record<string, boolean> | null
}

export interface AuthResult {
  uid: string
  email?: string
}

export async function verifyAuth(event: H3Event): Promise<AuthResult> {
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const idToken = authHeader.replace('Bearer ', '')
  const decoded = await auth.verifyIdToken(idToken)

  return {
    uid: decoded.uid,
    email: decoded.email
  }
}

export async function getMemberData(
  workspaceId: string,
  userId: string
): Promise<MemberData | null> {
  const memberRef = db.doc(`workspaces/${workspaceId}/members/${userId}`)
  const memberSnap = await memberRef.get()

  if (!memberSnap.exists) {
    return null
  }

  const data = memberSnap.data()
  return {
    role: data?.role || ROLES.MEMBER,
    permissions: data?.permissions || {}
  }
}

export async function canAccessProject(
  workspaceId: string,
  projectId: string,
  userId: string
): Promise<boolean> {
  const member = await getMemberData(workspaceId, userId)
  if (!member) return false
  if (isOwnerOrAdmin(member.role)) return true

  // Check if user has access-projects permission (grants access to ALL projects)
  if (
    hasPermission(member.role, member.permissions, PERMISSIONS.ACCESS_PROJECTS)
  )
    return true

  // Check for specific project assignment
  const assignmentRef = db.doc(
    `workspaces/${workspaceId}/projectAssignments/${projectId}/users/${userId}`
  )
  const snap = await assignmentRef.get()
  return snap.exists
}

export async function requireWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<void> {
  const workspaceRef = db.doc(`workspaces/${workspaceId}`)
  const workspaceSnap = await workspaceRef.get()

  if (!workspaceSnap.exists) {
    throw createError({ statusCode: 404, message: 'Workspace not found' })
  }

  const members = workspaceSnap.data()?.members || []
  if (!members.includes(userId)) {
    throw createError({
      statusCode: 403,
      message: 'You are not a member of this workspace'
    })
  }
}

export async function requirePermission(
  workspaceId: string,
  userId: string,
  requiredPermissions: string[]
): Promise<MemberData> {
  await requireWorkspaceMember(workspaceId, userId)

  const member = await getMemberData(workspaceId, userId)

  if (
    !member ||
    !hasAnyPermission(member.role, member.permissions, requiredPermissions)
  ) {
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to perform this action'
    })
  }

  return member
}

export async function requireProjectPermission(
  workspaceId: string,
  projectId: string,
  userId: string,
  requiredPermissions: string[]
): Promise<MemberData> {
  await requireWorkspaceMember(workspaceId, userId)

  const member = await getMemberData(workspaceId, userId)

  if (!member) {
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to perform this action'
    })
  }

  if (isOwnerOrAdmin(member.role)) return member

  // Check project-level permissions (assignment)
  const assignmentRef = db.doc(
    `workspaces/${workspaceId}/projectAssignments/${projectId}/users/${userId}`
  )
  const snap = await assignmentRef.get()
  const projectPerms = snap.exists ? snap.data()?.permissions || {} : {}

  for (const perm of requiredPermissions) {
    if (hasProjectPermission(null, projectPerms, perm)) return member
  }

  throw createError({
    statusCode: 403,
    message: 'You do not have permission to perform this action'
  })
}

export async function requireOwner(
  workspaceId: string,
  userId: string
): Promise<MemberData> {
  await requireWorkspaceMember(workspaceId, userId)

  const member = await getMemberData(workspaceId, userId)

  if (!member || !isOwner(member.role)) {
    throw createError({
      statusCode: 403,
      message: 'Only the workspace owner can perform this action'
    })
  }

  return member
}

export async function requireOwnerOrAdmin(
  workspaceId: string,
  userId: string
): Promise<MemberData> {
  await requireWorkspaceMember(workspaceId, userId)

  const member = await getMemberData(workspaceId, userId)

  if (!member || !isOwnerOrAdmin(member.role)) {
    throw createError({
      statusCode: 403,
      message: 'Only owners and admins can perform this action'
    })
  }

  return member
}

// Project Assignment Functions

export async function assignUserToProject(
  workspaceId: string,
  projectId: string,
  userId: string,
  role: ProjectRole = 'editor',
  assignedBy?: string
): Promise<void> {
  const assignmentRef = db.doc(
    `workspaces/${workspaceId}/projectAssignments/${projectId}/users/${userId}`
  )
  const assignment: ProjectAssignment = {
    role,
    assignedAt: new Date().toISOString(),
    assignedBy
  }
  await assignmentRef.set(assignment)
}

export async function removeUserFromProject(
  workspaceId: string,
  projectId: string,
  userId: string
): Promise<void> {
  const assignmentRef = db.doc(
    `workspaces/${workspaceId}/projectAssignments/${projectId}/users/${userId}`
  )
  await assignmentRef.delete()
}

export async function getProjectMembers(
  workspaceId: string,
  projectId: string
): Promise<string[]> {
  const assignmentsRef = db.collection(
    `workspaces/${workspaceId}/projectAssignments/${projectId}/users`
  )
  const snapshot = await assignmentsRef.get()
  return snapshot.docs.map((doc) => doc.id)
}

export async function updateProjectMembers(
  workspaceId: string,
  projectId: string,
  memberIds: string[],
  assignedBy?: string
): Promise<void> {
  const assignmentsRef = db.collection(
    `workspaces/${workspaceId}/projectAssignments/${projectId}/users`
  )
  const currentSnapshot = await assignmentsRef.get()
  const currentMemberIds = currentSnapshot.docs.map((doc) => doc.id)

  const batch = db.batch()

  // Add new members
  for (const memberId of memberIds) {
    if (!currentMemberIds.includes(memberId)) {
      const assignmentRef = db.doc(
        `workspaces/${workspaceId}/projectAssignments/${projectId}/users/${memberId}`
      )
      const assignment: ProjectAssignment = {
        role: 'editor',
        assignedAt: new Date().toISOString(),
        assignedBy
      }
      batch.set(assignmentRef, assignment)
    }
  }

  // Remove members no longer in the list
  for (const doc of currentSnapshot.docs) {
    if (!memberIds.includes(doc.id)) {
      batch.delete(doc.ref)
    }
  }

  await batch.commit()
}

export async function updateMemberProjectAssignment(
  workspaceId: string,
  projectId: string,
  memberId: string,
  permissions: ProjectAssignmentPermissions,
  assignedBy?: string
): Promise<void> {
  const assignmentRef = db.doc(
    `workspaces/${workspaceId}/projectAssignments/${projectId}/users/${memberId}`
  )
  const assignmentSnap = await assignmentRef.get()

  if (assignmentSnap.exists) {
    // Update existing assignment with new permissions
    await assignmentRef.update({ permissions })
  } else {
    // Create new assignment with permissions
    const assignment: ProjectAssignment = {
      role: 'editor',
      assignedAt: new Date().toISOString(),
      assignedBy,
      permissions
    }
    await assignmentRef.set(assignment)
  }
}

// Task Assignment Functions
// Path: workspaces/{workspaceId}/taskAssignments/{taskId}/users/{userId}

export async function assignUserToTask(
  workspaceId: string,
  projectId: string,
  taskId: string,
  userId: string,
  assignedBy?: string
): Promise<void> {
  const assignmentRef = db.doc(
    `workspaces/${workspaceId}/taskAssignments/${taskId}/users/${userId}`
  )
  const assignment: TaskAssignment = {
    role: 'assignee',
    assignedAt: new Date().toISOString(),
    assignedBy
  }
  await assignmentRef.set(assignment)
}

export async function removeUserFromTask(
  workspaceId: string,
  taskId: string,
  userId: string
): Promise<void> {
  const assignmentRef = db.doc(
    `workspaces/${workspaceId}/taskAssignments/${taskId}/users/${userId}`
  )
  await assignmentRef.delete()
}

export async function getTaskAssignees(
  workspaceId: string,
  taskId: string
): Promise<string[]> {
  const assignmentsRef = db.collection(
    `workspaces/${workspaceId}/taskAssignments/${taskId}/users`
  )
  const snapshot = await assignmentsRef.get()
  return snapshot.docs.map((doc) => doc.id)
}

export async function isUserAssignedToTask(
  workspaceId: string,
  taskId: string,
  userId: string
): Promise<boolean> {
  const assignmentRef = db.doc(
    `workspaces/${workspaceId}/taskAssignments/${taskId}/users/${userId}`
  )
  const snap = await assignmentRef.get()
  return snap.exists
}

export async function canToggleTaskStatus(
  workspaceId: string,
  projectId: string,
  userId: string
): Promise<boolean> {
  const member = await getMemberData(workspaceId, userId)
  if (!member) return false

  // Owner/Admin can always toggle
  if (isOwnerOrAdmin(member.role)) return true

  const assignmentRef = db.doc(
    `workspaces/${workspaceId}/projectAssignments/${projectId}/users/${userId}`
  )
  const assignmentSnap = await assignmentRef.get()

  if (!assignmentSnap.exists) return false

  const assignmentPermissions = assignmentSnap.data()?.permissions || {}
  return assignmentPermissions[PERMISSIONS.TOGGLE_STATUS] === true
}

export async function deleteTaskAssignments(
  workspaceId: string,
  taskId: string
): Promise<void> {
  const assignmentsRef = db.collection(
    `workspaces/${workspaceId}/taskAssignments/${taskId}/users`
  )
  const snapshot = await assignmentsRef.get()

  const batch = db.batch()
  snapshot.docs.forEach((doc) => batch.delete(doc.ref))
  await batch.commit()
}

export async function deleteProjectAssignments(
  workspaceId: string,
  projectId: string
): Promise<void> {
  const assignmentsRef = db.collection(
    `workspaces/${workspaceId}/projectAssignments/${projectId}/users`
  )
  const snapshot = await assignmentsRef.get()

  const batch = db.batch()
  snapshot.docs.forEach((doc) => batch.delete(doc.ref))
  await batch.commit()
}

export async function updateTaskMembers(
  workspaceId: string,
  projectId: string,
  taskId: string,
  memberIds: string[],
  assignedBy?: string
): Promise<void> {
  const assignmentsRef = db.collection(
    `workspaces/${workspaceId}/taskAssignments/${taskId}/users`
  )
  const currentSnapshot = await assignmentsRef.get()
  const currentMemberIds = currentSnapshot.docs.map((doc) => doc.id)

  const batch = db.batch()

  // Add new members
  for (const memberId of memberIds) {
    if (!currentMemberIds.includes(memberId)) {
      const assignmentRef = db.doc(
        `workspaces/${workspaceId}/taskAssignments/${taskId}/users/${memberId}`
      )
      const assignment: TaskAssignment = {
        role: 'assignee',
        assignedAt: new Date().toISOString(),
        assignedBy
      }
      batch.set(assignmentRef, assignment)
    }
  }

  // Remove members no longer in the list
  for (const doc of currentSnapshot.docs) {
    if (!memberIds.includes(doc.id)) {
      batch.delete(doc.ref)
    }
  }

  await batch.commit()

  // Sync assigneeIds to task document
  const taskRef = db.doc(`workspaces/${workspaceId}/tasks/${taskId}`)
  await taskRef.update({
    assigneeIds: memberIds,
    updatedAt: new Date().toISOString()
  })

  // Recalculate and update project assignedUserIds
  await syncProjectAssignees(workspaceId, projectId)
}

async function syncProjectAssignees(
  workspaceId: string,
  projectId: string
): Promise<void> {
  // Get all tasks for this project
  const tasksRef = db.collection(`workspaces/${workspaceId}/tasks`)
  const tasksQuery = tasksRef.where('projectId', '==', projectId)
  const tasksSnapshot = await tasksQuery.get()

  // Collect all unique assignee IDs
  const assigneeSet = new Set<string>()
  tasksSnapshot.docs.forEach((doc) => {
    const assigneeIds = doc.data().assigneeIds || []
    assigneeIds.forEach((id: string) => assigneeSet.add(id))
  })

  // Update project document
  const projectRef = db.doc(`workspaces/${workspaceId}/projects/${projectId}`)
  await projectRef.update({
    assignedUserIds: Array.from(assigneeSet),
    updatedAt: new Date().toISOString()
  })
}

// Cleanup Functions

export async function cleanupWorkspaceAssignments(
  workspaceId: string
): Promise<void> {
  const batch = db.batch()

  // Delete all projectAssignments
  const projectAssignmentsRef = db.collection(
    `workspaces/${workspaceId}/projectAssignments`
  )
  const projectAssignmentsSnap = await projectAssignmentsRef.get()

  for (const projectDoc of projectAssignmentsSnap.docs) {
    const usersSnap = await projectDoc.ref.collection('users').get()
    usersSnap.docs.forEach((userDoc) => batch.delete(userDoc.ref))
    batch.delete(projectDoc.ref)
  }

  // Delete all taskAssignments (at workspace level)
  const taskAssignmentsRef = db.collection(
    `workspaces/${workspaceId}/taskAssignments`
  )
  const taskAssignmentsSnap = await taskAssignmentsRef.get()

  for (const taskDoc of taskAssignmentsSnap.docs) {
    const usersSnap = await taskDoc.ref.collection('users').get()
    usersSnap.docs.forEach((userDoc) => batch.delete(userDoc.ref))
    batch.delete(taskDoc.ref)
  }

  await batch.commit()
}

export async function cleanupMemberAssignments(
  workspaceId: string,
  memberId: string
): Promise<void> {
  const batch = db.batch()

  // Remove from all projectAssignments
  const projectAssignmentsRef = db.collection(
    `workspaces/${workspaceId}/projectAssignments`
  )
  const projectAssignmentsSnap = await projectAssignmentsRef.get()

  for (const projectDoc of projectAssignmentsSnap.docs) {
    const userRef = projectDoc.ref.collection('users').doc(memberId)
    const userSnap = await userRef.get()
    if (userSnap.exists) {
      batch.delete(userRef)
    }
  }

  // Remove from all taskAssignments (at workspace level)
  const taskAssignmentsRef = db.collection(
    `workspaces/${workspaceId}/taskAssignments`
  )
  const taskAssignmentsSnap = await taskAssignmentsRef.get()

  for (const taskDoc of taskAssignmentsSnap.docs) {
    const userRef = taskDoc.ref.collection('users').doc(memberId)
    const userSnap = await userRef.get()
    if (userSnap.exists) {
      batch.delete(userRef)
    }
  }

  await batch.commit()
}

// Validation Functions

export async function validateWorkspaceMemberIds(
  workspaceId: string,
  memberIds: string[]
): Promise<{ valid: string[]; invalid: string[] }> {
  const valid: string[] = []
  const invalid: string[] = []

  for (const memberId of memberIds) {
    const memberRef = db.doc(`workspaces/${workspaceId}/members/${memberId}`)
    const memberSnap = await memberRef.get()

    if (memberSnap.exists) {
      valid.push(memberId)
    } else {
      invalid.push(memberId)
    }
  }

  return { valid, invalid }
}

// Project Task Counters

export async function updateProjectTaskCounters(
  workspaceId: string,
  projectId: string,
  taskCountDelta: number,
  completedCountDelta: number
): Promise<void> {
  const projectRef = db.doc(`workspaces/${workspaceId}/projects/${projectId}`)
  const projectSnap = await projectRef.get()
  if (!projectSnap.exists) return

  const data = projectSnap.data()

  // Backfill: if counters don't exist yet, calculate from scratch
  if (data?.taskCount === undefined || data?.taskCount === null) {
    const tasksRef = db.collection(`workspaces/${workspaceId}/tasks`)
    const tasksSnap = await tasksRef.where('projectId', '==', projectId).get()

    let totalCount = 0
    let completedCount = 0
    tasksSnap.docs.forEach((doc) => {
      totalCount++
      if (doc.data().status === 'completed') completedCount++
    })

    await projectRef.update({
      taskCount: totalCount,
      completedTaskCount: completedCount
    })
    return
  }

  // Fast path: use atomic increment
  const updates: Record<string, unknown> = {}
  if (taskCountDelta !== 0) {
    updates.taskCount = FieldValue.increment(taskCountDelta)
  }
  if (completedCountDelta !== 0) {
    updates.completedTaskCount = FieldValue.increment(completedCountDelta)
  }
  if (Object.keys(updates).length > 0) {
    await projectRef.update(updates)
  }
}
