export interface ProjectValidationErrors {
  title?: string
  description?: string
  tags?: string
}

export const validateProjectForm = (data: {
  title: string
  description?: string
  tags?: string[]
}): ProjectValidationErrors => {
  const errors: ProjectValidationErrors = {}

  // Title validation
  const trimmedTitle = data.title.trim()
  if (!trimmedTitle) {
    errors.title = 'Title is required'
  } else if (trimmedTitle.length < 3) {
    errors.title = 'Title must be at least 3 characters'
  } else if (trimmedTitle.length > 100) {
    errors.title = 'Title must be less than 100 characters'
  }

  // Description validation
  if (data.description && data.description.length > 500) {
    errors.description = 'Description must be less than 500 characters'
  }

  // Tags validation
  if (data.tags) {
    if (data.tags.length > 10) {
      errors.tags = 'Maximum 10 tags allowed'
    }

    const hasLongTag = data.tags.some(tag => tag.length > 30)
    if (hasLongTag) {
      errors.tags = 'Each tag must be less than 30 characters'
    }
  }

  return errors
}

export const hasValidationErrors = (errors: ProjectValidationErrors): boolean => {
  return Object.keys(errors).length > 0
}
