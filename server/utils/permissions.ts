import { H3Event, createError, getHeader } from 'h3'
import { auth, db } from './firebase-admin'

export interface MemberPermissions {
  owner?: boolean
  admin?: boolean
  'all-projects'?: boolean
  'manage-projects'?: boolean
  'create-projects'?: boolean
  'edit-projects'?: boolean
  'delete-projects'?: boolean
  'manage-members'?: boolean
  'add-members'?: boolean
  'remove-members'?: boolean
  [key: string]: boolean | undefined
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

export async function getMemberPermissions(
  workspaceId: string,
  userId: string
): Promise<MemberPermissions | null> {
  const memberRef = db.doc(`workspaces/${workspaceId}/members/${userId}`)
  const memberSnap = await memberRef.get()

  if (!memberSnap.exists) {
    return null
  }

  return memberSnap.data()?.permissions || {}
}

export function isOwner(permissions: MemberPermissions | null): boolean {
  return permissions?.owner === true
}

export function isAdmin(permissions: MemberPermissions | null): boolean {
  return permissions?.admin === true
}

export function isOwnerOrAdmin(permissions: MemberPermissions | null): boolean {
  return isOwner(permissions) || isAdmin(permissions)
}

export function hasPermission(
  permissions: MemberPermissions | null,
  permission: string
): boolean {
  if (!permissions) return false
  return isOwner(permissions) || isAdmin(permissions) || permissions[permission] === true
}

export function hasAnyPermission(
  permissions: MemberPermissions | null,
  permissionList: string[]
): boolean {
  if (!permissions) return false
  if (isOwnerOrAdmin(permissions)) return true
  return permissionList.some(p => permissions[p] === true)
}

export function canAccessProject(
  permissions: MemberPermissions | null,
  projectId: string
): boolean {
  if (!permissions) return false
  return isOwnerOrAdmin(permissions) ||
    permissions['all-projects'] === true ||
    permissions[projectId] === true
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
    throw createError({ statusCode: 403, message: 'You are not a member of this workspace' })
  }
}

export async function requirePermission(
  workspaceId: string,
  userId: string,
  requiredPermissions: string[]
): Promise<MemberPermissions> {
  await requireWorkspaceMember(workspaceId, userId)

  const permissions = await getMemberPermissions(workspaceId, userId)

  if (!hasAnyPermission(permissions, requiredPermissions)) {
    throw createError({ statusCode: 403, message: 'You do not have permission to perform this action' })
  }

  return permissions!
}

export async function requireOwner(
  workspaceId: string,
  userId: string
): Promise<MemberPermissions> {
  await requireWorkspaceMember(workspaceId, userId)

  const permissions = await getMemberPermissions(workspaceId, userId)

  if (!isOwner(permissions)) {
    throw createError({ statusCode: 403, message: 'Only the workspace owner can perform this action' })
  }

  return permissions!
}

export async function requireOwnerOrAdmin(
  workspaceId: string,
  userId: string
): Promise<MemberPermissions> {
  await requireWorkspaceMember(workspaceId, userId)

  const permissions = await getMemberPermissions(workspaceId, userId)

  if (!isOwnerOrAdmin(permissions)) {
    throw createError({ statusCode: 403, message: 'Only owners and admins can perform this action' })
  }

  return permissions!
}
