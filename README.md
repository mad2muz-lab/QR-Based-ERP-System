# QR-Based ERP System

## Overview
A modern ERP system for construction and site management, leveraging QR codes for tracking employees, equipment, materials, and site activities. The system supports both online (Supabase) and offline (localStorage) operation, with robust synchronization and role-based access control.

## Features
- **QR Code Scanning** for employees, equipment, materials, and sites
- **Role-based Authentication** (Developer, Admin, Manager, Operator, Viewer)
- **Offline-first**: Works without internet, syncs when online
- **Entity Management**: Register, update, and list employees, equipment, materials, and sites
- **Time & Usage Logs**: Track clock-ins, equipment usage, material in/out, and site check-ins
- **Admin Panel**: User, department, equipment, material, and company management
- **Dashboard**: Real-time stats, reports, and sync status
- **Map View**: Visualize sites and drill down by province
- **CSV/Excel Import/Export** for bulk data
- **Custom ID Support**: User-defined IDs for entities

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL, Auth, RLS)
- **QR/Barcode**: qr-scanner, qrcode
- **State/Sync**: LocalStorage, custom OfflineSyncManager
- **Other**: MapLibre GL, Lucide Icons, PapaParse, XLSX

## Architecture
- **src/components/**: UI components (dashboard, admin, registration, scanner, map, etc.)
- **src/utils/**: Core logic (auth, sync, data storage, QR, logs, etc.)
- **src/data/**: Static data (cities, material/equipment types)
- **src/types/**: TypeScript types for all entities
- **supabase/migrations/**: Database schema and migration scripts

## Main Modules
- **Authentication**: Supports both local and Supabase auth. Role-based access enforced in UI and backend (RLS).
- **Offline Sync**: All create/update/delete operations are queued when offline and synced to Supabase when online. Conflict resolution and retry logic included.
- **Entity Management**: Employees, Equipment, Materials, Sites, and their logs. Each entity has forms, lists, and QR code integration.
- **Logging**: Separate log tables for employees, equipment, and materials. Time logs for tracking actions.
- **Map & Dashboard**: Visual and statistical overview of all entities and activities.

## Data Model (Simplified)
- **User**: id, username, password, role, name, email, site, isFirstLogin, createdAt, lastLogin
- **Employee**: id, name, type, department, position, bloodGroup, site, qrCode, status, ...
- **Equipment**: id, custom_equipment_id, name, type, model, site, qrCode, status, ...
- **Material**: id, name, type, unit, site, qrCode, quantity, status, ...
- **Site**: id, name, province, address, type, ...
- **Logs**: employee_logs, equipment_logs, material_logs, time_logs

## Authentication & User Management
- **Local**: Default admin/developer users created on first run
- **Supabase**: Users table with RLS, role enum, and profile triggers
- **Role Hierarchy**: developer > admin > manager > operator > viewer
- **UI**: Login form, protected routes, password change modal

## Offline/Online Sync
- **OfflineSyncManager**: Queues all operations, syncs to Supabase when online
- **Conflict Resolution**: Server-wins, client-wins, merge, or manual
- **Sync Status**: Real-time indicator in UI, manual sync option

## Setup & Usage
1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start development server**:
   ```bash
   npm run dev
   ```
3. **Configure Supabase**:
   - Set up a Supabase project
   - Run migrations in `supabase/migrations/`
   - Add Supabase keys/config to `.env` or `src/utils/supabaseClient.ts`
4. **Build for production**:
   ```bash
   npm run build
   ```

## Folder Structure
- `src/components/` - UI components (dashboard, admin, registration, scanner, map, etc.)
- `src/utils/` - Core logic (auth, sync, data storage, QR, logs, etc.)
- `src/data/` - Static data (cities, material/equipment types)
- `src/types/` - TypeScript types for all entities
- `supabase/migrations/` - Database schema and migration scripts

## License
MIT 

# Role Management UI (Admin Panel)

## Features
- **Create, edit, and delete roles** (with optional parent/child hierarchy)
- **Assign page permissions to roles** (checkboxes for each page, save per role)
- **Assign multiple roles to users** (multi-select, save per user)
- **All actions are DB-driven and reflected in the UI immediately**

## How to Use
1. **Roles Table:**
   - Click "Add Role" to create a new role (set name, description, parent role).
   - Use Edit/Delete buttons to modify or remove roles.
2. **Role Page Permissions:**
   - For each role, check/uncheck pages to grant/revoke access.
   - Click "Save" to update permissions for that role.
3. **Assign Roles to Users:**
   - For each user, select one or more roles from the dropdown.
   - Changes are saved and reflected in the UI.

## Notes
- All permissions and assignments are stored in the database and used for access control throughout the app.
- Only users with admin privileges can access the Role Management UI. 


QR-Based ERP System - Comprehensive Analysis
Project Structure Overview
Directory Organization
The project follows a well-organized modular structure:
Apply to README.md
endpoints
Key Technologies & Frameworks
Frontend Stack:
React 18.3.1 - Main UI framework with TypeScript
Vite 5.4.2 - Build tool and development server
React Router DOM 7.6.3 - Client-side routing
Tailwind CSS 3.4.1 - Utility-first CSS framework
Lucide React 0.344.0 - Icon library
Backend & Database:
Supabase - Backend-as-a-Service (PostgreSQL + Auth + Real-time)
PostgreSQL - Primary database
Row Level Security (RLS) - Database security
QR & Scanning:
qr-scanner 1.4.2 - QR code scanning library
qrcode 1.5.4 - QR code generation
html2canvas 1.4.1 - Screenshot generation
Data Management:
Local Storage - Offline data persistence
IndexedDB - Advanced offline storage
PapaParse 5.5.3 - CSV parsing
XLSX 0.18.5 - Excel file handling
State Management:
React Context API - Global state management
Custom hooks - Local state management
Offline sync system - Data synchronization
Click Interactions & User Interface
Primary Interactive Elements
1. Navigation System
Header Navigation: Dashboard, Scan, Register, Map, Admin
Tab-based Navigation: Overview/Reports tabs in Dashboard
Entity-specific Tabs: Employees, Equipment, Materials, Sites
View Toggle: Form/List view switching
2. QR Scanner Interface
Apply to README.md
)
3. Registration Forms
Apply to README.md
generation
4. Dashboard Interactions
Apply to README.md
panels
Event Handlers & Functions
QR Scanner Actions
Apply to README.md
;
Form Submissions
Apply to README.md
;
Data Synchronization
Apply to README.md
;
Data Flow to Tables
Data Pipeline Architecture
1. Data Sources
Supabase Database: Primary cloud database
Local Storage: Offline data persistence
IndexedDB: Advanced offline storage
CSV/Excel Files: Import/export functionality
2. Data Fetching Strategy
Apply to README.md
}
3. Data Transformation Pipeline
Apply to README.md
;
4. Table Rendering
Apply to README.md
;
Database Schema Overview
Core Tables
Apply to README.md
;
Log Tables
Apply to README.md
;
Application Logic
Core Business Logic
1. Authentication & Authorization
Apply to README.md
}
2. QR Code Processing
Apply to README.md
;
3. Time Tracking Logic
Apply to README.md
;
4. Equipment Status Management
Apply to README.md
;
State Management Patterns
1. Singleton Pattern
Apply to README.md
}
2. Observer Pattern
Apply to README.md
}
3. Factory Pattern
Apply to README.md
;
Error Handling & Edge Cases
1. Network Resilience
Apply to README.md
;
2. Data Validation
Apply to README.md
}
3. Conflict Resolution
Apply to README.md
;
Performance Optimizations & Best Practices
1. Code Splitting & Lazy Loading
Apply to README.md
>
2. Debounced Search
Apply to README.md
;
3. Batch Processing
Apply to README.md
}
4. Memory Management
Apply to README.md
}
Areas for Improvement
1. Performance Bottlenecks
Large dataset handling: Implement virtual scrolling for large lists
Image processing: Optimize QR code generation for bulk operations
Database queries: Add proper indexing and query optimization
2. Scalability Enhancements
Caching strategy: Implement Redis for frequently accessed data
API rate limiting: Add proper rate limiting for Supabase operations
Background sync: Implement service workers for background synchronization
3. User Experience Improvements
Progressive Web App: Add PWA capabilities for offline functionality
Real-time updates: Implement WebSocket connections for live data updates
Mobile optimization: Enhance mobile responsiveness and touch interactions
4. Security Enhancements
Input validation: Strengthen client-side and server-side validation
Audit logging: Enhance audit trail for sensitive operations
Data encryption: Implement end-to-end encryption for sensitive data
This comprehensive analysis demonstrates a well-architected ERP system with robust offline capabilities, modular design, and extensive functionality for QR-based time tracking and resource management.