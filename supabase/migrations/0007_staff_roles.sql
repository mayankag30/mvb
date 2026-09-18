-- Add role column to staff table
-- super: full access including staff management and shop settings
-- editor: can create/edit/delete inventory and brands
-- viewer: read-only access to inventory and enquiries

alter table staff add column if not exists
  role text not null default 'viewer'
  check (role in ('super', 'editor', 'viewer'));

-- Mahesh is the super user
update staff set role = 'super' where username = 'mahesh';
