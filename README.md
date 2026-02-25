# Task Manager - Full-Stack Todo Application

#### Video Demo: [URL HERE]

#### Description:

Task Manager is a comprehensive full-stack todo application built with modern web technologies, featuring user authentication, real-time data synchronization, and an intuitive user interface. This project demonstrates proficiency in Vue.js ecosystem, Firebase integration, state management, and responsive design principles.

## Project Overview

This application serves as a complete task management solution that allows users to create, organize, and track their daily tasks efficiently. The project combines a robust frontend built with Nuxt.js and Vue 3, a Firebase backend for authentication and data storage, and a carefully designed user experience with modern UI components.

The application supports both authenticated and guest modes. Authenticated users benefit from cloud synchronization across devices, while guest users can utilize local storage for immediate task management without registration requirements. This dual approach ensures accessibility while providing enhanced features for registered users.

## Architecture and Technology Stack

The project is built on a modern JavaScript/TypeScript stack:

**Frontend Framework**: Nuxt.js 3 with Vue 3 composition API provides the foundation for a reactive, server-side rendered application with excellent performance and SEO capabilities.

**Styling**: TailwindCSS for utility-first styling, combined with custom CSS variables for consistent theming. The UI components are based on Shadcn/ui, providing a professional and accessible design system.

**State Management**: Pinia serves as the centralized state management solution, handling task operations, filtering, and user interface state with reactive getters and async actions.

**Authentication & Database**: Firebase Authentication manages user registration, login, and session handling, while Firebase Realtime Database provides real-time data synchronization across devices.

**Type Safety**: TypeScript throughout the entire codebase ensures type safety and better developer experience with comprehensive interface definitions for tasks, user data, and component props.

## Core Files and Their Functionality

### Backend Integration (`plugins/firebase.ts`)

This file configures Firebase services including Authentication and Realtime Database. It initializes the Firebase SDK with environment-specific configuration and makes these services available throughout the Nuxt application via dependency injection.

### State Management (`store.ts`)

The Pinia store manages the entire application state, including tasks array, filtering options, and loading states. Key functionalities include:

- **Task CRUD Operations**: Create, read, update, and delete tasks with both local storage and Firebase synchronization
- **Filtering System**: Multi-dimensional filtering by status (pending/completed), priority (normal/important/urgent), and text search
- **Statistics Calculation**: Real-time computation of task completion percentages, urgent task counts, and progress metrics
- **Dual Storage Strategy**: Seamlessly handles both authenticated users (Firebase) and guest users (localStorage)

### Authentication Composable (`composables/useAuth.ts`)

This composable encapsulates all authentication logic using Firebase Auth. It provides reactive user state, login/logout functionality, user registration with automatic database user profile creation, and comprehensive error handling with user-friendly toast notifications.

### Type Definitions (`types/Task.ts`)

Defines the core Task interface with properties including id, title, description, status (pending/completed), priority levels, and creation timestamps. This ensures type safety across all task-related operations.

### Main Application Layout (`app.vue`)

The root component that sets up the application shell, including the toast notification system for user feedback and the main routing outlet for page components.

### Primary Interface (`pages/index.vue`)

The main application interface that orchestrates all major components:

- **Header Section**: Displays application branding and authentication controls
- **Task Statistics**: Shows completion percentages and task counts
- **Filtering Controls**: Provides search and filter options
- **Task Management**: Lists tasks and provides creation interface
- **Responsive Design**: Adapts to different screen sizes with mobile-first approach

### Component Architecture

**TaskForm Component** (`components/TaskForm.vue`): A modal-based form for creating and editing tasks, featuring form validation, priority selection, due date handling, and responsive design.

**TaskList Component** (`components/TaskList.vue`): Renders the filterable list of tasks with support for status toggling, inline editing, task deletion, and empty state handling.

**TaskItem Component** (`components/TaskItem.vue`): Individual task representation with checkbox controls, priority indicators, action buttons, and status-based styling.

**TaskFilters Component** (`components/TaskFilters.vue`): Provides search input and dropdown filters for status and priority, with real-time filtering updates.

### UI Component Library (`components/ui/`)

A comprehensive collection of reusable UI components based on Radix UI and styled with TailwindCSS, including buttons, cards, dialogs, forms, inputs, and more. These components ensure consistency across the application and provide accessibility features out of the box.

## Design Decisions and Implementation Choices

**State Management Strategy**: I chose Pinia over Vuex due to its better TypeScript integration, simpler API, and excellent developer experience. The store design separates concerns between data management and UI state, making the codebase more maintainable.

**Authentication Architecture**: Firebase Authentication was selected for its robust security features, social login capabilities, and seamless integration with other Firebase services. The composable pattern encapsulates auth logic, making it reusable and testable.

**Data Persistence Strategy**: The dual storage approach (Firebase for authenticated users, localStorage for guests) maximizes accessibility while providing premium features for registered users. This decision balances user convenience with data persistence requirements.

**Component Design**: I implemented a component-based architecture with clear separation of concerns. Each component handles a specific aspect of the user interface, promoting reusability and maintainability.

**Styling Approach**: TailwindCSS was chosen for its utility-first approach, which enables rapid development while maintaining design consistency. The integration with Shadcn/ui components provides professional aesthetics with minimal custom CSS.

**Type Safety Implementation**: TypeScript usage throughout ensures runtime safety and better developer experience. Interface definitions for tasks, user data, and component props prevent common errors and improve code documentation.

## Features and Functionality

The application provides comprehensive task management capabilities including task creation with title, description, priority, and due date settings, real-time task status updates with visual feedback, advanced filtering by text search, status, and priority, progress tracking with completion statistics, user authentication with secure login/registration, cloud synchronization for authenticated users, responsive design for mobile and desktop use, and accessibility features throughout the interface.

## Development and Deployment

The project uses modern development tools including ESLint for code quality, Prettier for code formatting, TypeScript for type safety, and Pnpm for efficient package management. The development server provides hot module replacement for rapid iteration, while the build process optimizes assets for production deployment.

This Task Manager application demonstrates proficiency in modern web development practices, including reactive programming with Vue 3, state management patterns, authentication integration, responsive design, and type-safe development. The codebase structure promotes maintainability and scalability, making it suitable for both educational purposes and real-world deployment.
