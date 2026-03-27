# Mizan Core Features Specification

This document details the 11 MVP features required to build Mizan, conforming to the PRD.

## F-001: Authentication & Onboarding
- **Description:** Registration, login, office creation, and joining an existing office.
- **Actors:** Guest Users, New Owners, Invited Users.
- **Behavior:**
  - Login via email and password string.
  - Registration sets up Supabase auth and initial profile entry.
  - Onboard path: Free Trial (creates office + trial record), Join Code (adds user to existing office), Choose Plan (redirects to subscription setting).
- **Forms & Validation:**
  - Login/Register: `email` (valid email), `password` (min 8 chars), `full_name` (string, max 50).
- **States:** Loading spinner during network reqs; errors shown field-level.
- **DB Tables:** auth.users, profiles, offices, office_members, office_subscriptions.
- **RLS:** Open for account creation; insert restricted to own ID.
- **Priority:** CORE

## F-002: Case Management
- **Description:** Manage legal cases with detailed tracking.
- **Actors:** Owner, Lawyer, Assistant.
- **Behavior:**
  - View paginated cases list with advanced search and filters.
  - Modal form to create or edit cases.
  - Case detail layout showing details, associated sessions, and tasks.
- **Forms & Validation:**
  - `title` (required), `client_id` (required, foreign key), `case_type` (required, enum), `status` (enum), `priority` (enum), `litigation_degree` (optional), `notes` (text).
- **States:** Empty states visually distinct; skeletons for loading data.
- **DB Tables:** cases, clients, sessions, tasks.
- **RLS:** Isolated to current_office_id.
- **Priority:** CORE

## F-003: Client Management
- **Description:** Manage clients associated with the law office.
- **Actors:** Owner, Lawyer, Assistant.
- **Behavior:**
  - List all clients, search capabilities.
  - Create new client modal.
  - Detail page showing client info and their linked cases.
- **Forms & Validation:**
  - `name` (required), `phone` (optional, string), `email` (optional, email format), `notes` (text).
- **States:** List vs Empty Illustration state.
- **DB Tables:** clients, cases.
- **RLS:** Isolated to office.
- **Priority:** CORE

## F-004: Session Scheduling
- **Description:** Court and office session calendar management.
- **Actors:** Owner, Lawyer, Assistant.
- **Behavior:**
  - Visual monthly calendar (Arabic locale using FullCalendar) and list toggle.
  - Add session from the main calendar view or from within a case details page.
- **Forms & Validation:**
  - `case_id` (required), `session_date` (required), `session_time` (optional), `court`, `hall`, `session_type`, `outcome`, `notes`.
- **States:** Indicators on calendar days with events.
- **DB Tables:** sessions, cases.
- **RLS:** Isolated to office.
- **Priority:** CORE

## F-005: Task Management
- **Description:** Kanban-style task management framework for the team.
- **Actors:** Owner, Lawyer, Assistant.
- **Behavior:**
  - Three columns: معلقة (Pending), قيد التنفيذ (In-progress), مكتملة (Completed).
  - Drag and drop functionality to update task status in real-time.
  - Colored priority badges and overdue warnings.
- **Forms & Validation:**
  - `title` (required), `description`, `status` (enum), `priority` (enum), `due_date`, `assigned_to`, `case_id`.
- **States:** Drag active, hover, dropped.
- **DB Tables:** tasks.
- **RLS:** Isolated to office.
- **Priority:** IMPORTANT

## F-006: Team Management
- **Description:** Manage users under a specific office tenant.
- **Actors:** Owner (Only).
- **Behavior:**
  - View member list and roles.
  - Generate expiring invite codes for new members.
  - Manage member roles, or deactivate members. Ensure subscription logic checks limits.
- **Forms & Validation:**
  - Role dropdowns (Owner, Lawyer, Assistant); `code` auto-generated (length 6-8).
- **States:** Warning banners if limits hit.
- **DB Tables:** office_members, invitations.
- **RLS:** Strict Owner modifications only.
- **Priority:** IMPORTANT

## F-007: Notification System
- **Description:** Real-time in-app notification engine.
- **Actors:** All Authenticated Users.
- **Behavior:**
  - Bell icon shows unread count.
  - Dropdown and page list to view, mark read, or filter notifications by type.
- **Forms & Validation:** N/A (System generated).
- **States:** Count badges, Read vs Unread styling.
- **DB Tables:** notifications.
- **RLS:** Isolated to user.
- **Priority:** IMPORTANT

## F-008: Subscription Management
- **Description:** Handles office plans and upgrades/downgrades manually.
- **Actors:** Owner.
- **Behavior:**
  - View current plan. Select upgrades.
  - Submit request for tier upgrade which enters pending state awaiting admin approval.
- **Forms & Validation:** Simple confirmation modal.
- **States:** Pending approval banner.
- **DB Tables:** subscription_plans, office_subscriptions, subscription_requests.
- **RLS:** Read for members, request insert for Owner.
- **Priority:** IMPORTANT

## F-009: Office Settings
- **Description:** Configuration and preferences for the tenant.
- **Actors:** Owner for global settings; any member for personal preferences.
- **Behavior:**
  - Update office name. Toggle specific features/notification preferences.
- **Forms & Validation:**
  - `name` (required, Owner), `settings` JSON manipulators.
- **DB Tables:** offices.
- **RLS:** Updates strictly for Owner.
- **Priority:** IMPORTANT

## F-010: Admin Dashboard
- **Description:** Super admin panel to manage the platform SaaS.
- **Actors:** Platform Admin.
- **Behavior:**
  - Separate layout accessed via admin route.
  - Global stats, pending subscription approvals, offices directory.
  - Suspend offices, approve manual payments.
- **Forms & Validation:** Approval checks.
- **States:** Loading stats, critical dashboard alerts.
- **DB Tables:** All tables viewable, subscription_requests interactable.
- **RLS:** Blocked unless profile `is_admin` is true.
- **Priority:** CORE

## F-011: Landing Page
- **Description:** Static marketing page for SEO.
- **Actors:** Public.
- **Behavior:** Hero section, Feature grid, FAQ, Pricing.
- **Forms & Validation:** N/A.
- **States:** Responsive layout.
- **DB Tables:** Static (or dynamic plans fetch).
- **RLS:** Public.
- **Priority:** IMPORTANT
