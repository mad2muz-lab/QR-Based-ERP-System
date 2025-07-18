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