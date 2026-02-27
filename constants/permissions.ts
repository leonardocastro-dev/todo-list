export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member'
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const PERMISSIONS = {
  ACCESS_PROJECTS: 'access-projects',
  MANAGE_PROJECTS: 'manage-projects',
  CREATE_PROJECTS: 'create-projects',
  EDIT_PROJECTS: 'edit-projects',
  DELETE_PROJECTS: 'delete-projects',
  MANAGE_TASKS: 'manage-tasks',
  CREATE_TASKS: 'create-tasks',
  EDIT_TASKS: 'edit-tasks',
  DELETE_TASKS: 'delete-tasks',
  TOGGLE_STATUS: 'toggle-status',
  MANAGE_MEMBERS: 'manage-members',
  ADD_MEMBERS: 'add-members',
  REMOVE_MEMBERS: 'remove-members',
  ASSIGN_PROJECT: 'assign-project'
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const implies: Record<string, string[]> = {
  [PERMISSIONS.MANAGE_PROJECTS]: [
    PERMISSIONS.CREATE_PROJECTS,
    PERMISSIONS.EDIT_PROJECTS,
    PERMISSIONS.DELETE_PROJECTS
  ],
  [PERMISSIONS.MANAGE_TASKS]: [
    PERMISSIONS.CREATE_TASKS,
    PERMISSIONS.EDIT_TASKS,
    PERMISSIONS.DELETE_TASKS,
    PERMISSIONS.TOGGLE_STATUS
  ],
  [PERMISSIONS.MANAGE_MEMBERS]: [
    PERMISSIONS.ADD_MEMBERS,
    PERMISSIONS.REMOVE_MEMBERS,
    PERMISSIONS.ASSIGN_PROJECT
  ]
}

export const isOwner = (role: Role | string | null | undefined): boolean => {
  return role === ROLES.OWNER
}

export const isAdmin = (role: Role | string | null | undefined): boolean => {
  return role === ROLES.ADMIN
}

export const isOwnerOrAdmin = (
  role: Role | string | null | undefined
): boolean => {
  return isOwner(role) || isAdmin(role)
}

export const hasPermission = (
  role: Role | string | null | undefined,
  permissions: Record<string, boolean> | null,
  permission: string
): boolean => {
  if (isOwnerOrAdmin(role)) return true
  if (!permissions) return false
  if (permissions[permission] === true) return true
  for (const [parent, children] of Object.entries(implies)) {
    if (permissions[parent] === true && children.includes(permission))
      return true
  }
  return false
}

export const hasAnyPermission = (
  role: Role | string | null | undefined,
  permissions: Record<string, boolean> | null,
  permissionList: string[]
): boolean => {
  if (isOwnerOrAdmin(role)) return true
  return permissionList.some((p) => hasPermission(role, permissions, p))
}
