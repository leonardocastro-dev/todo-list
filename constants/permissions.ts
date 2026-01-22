export const PERMISSIONS = {
  OWNER: 'owner',
  ADMIN: 'admin',
  ACCESS_PROJECTS: 'access-projects',
  MANAGE_PROJECTS: 'manage-projects',
  CREATE_PROJECTS: 'create-projects',
  EDIT_PROJECTS: 'edit-projects',
  DELETE_PROJECTS: 'delete-projects',
  MANAGE_MEMBERS: 'manage-members',
  ADD_MEMBERS: 'add-members',
  REMOVE_MEMBERS: 'remove-members'
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const isOwner = (
  permissions: Record<string, boolean> | null
): boolean => {
  return permissions?.[PERMISSIONS.OWNER] === true
}

export const isAdmin = (
  permissions: Record<string, boolean> | null
): boolean => {
  return permissions?.[PERMISSIONS.ADMIN] === true
}

export const isOwnerOrAdmin = (
  permissions: Record<string, boolean> | null
): boolean => {
  return isOwner(permissions) || isAdmin(permissions)
}

export const hasPermission = (
  permissions: Record<string, boolean> | null,
  permission: string
): boolean => {
  if (!permissions) return false
  return isOwnerOrAdmin(permissions) || permissions[permission] === true
}

export const hasAnyPermission = (
  permissions: Record<string, boolean> | null,
  permissionList: string[]
): boolean => {
  if (!permissions) return false
  if (isOwnerOrAdmin(permissions)) return true
  return permissionList.some((p) => permissions[p] === true)
}
