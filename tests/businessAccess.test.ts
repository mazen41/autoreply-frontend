import { describe, expect, it } from 'vitest'
import { hasPermission } from '../lib/businessAccess'

// Mirrors backend TeamMember::ROLE_PERMISSIONS. Keep in sync.
const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ['read', 'write', 'delete', 'manage_team', 'manage_billing', 'conversation_read', 'conversation_write', 'assigned_work', 'automation_read', 'automation_write'],
  manager: ['read', 'write', 'conversation_read', 'conversation_write', 'assigned_work', 'automation_read', 'automation_write'],
  agent: ['conversation_read', 'conversation_write', 'assigned_work', 'automation_read'],
  viewer: ['read', 'conversation_read', 'automation_read'],
}

describe('hasPermission', () => {
  it('returns true only for listed permissions', () => {
    expect(hasPermission(['manage_team'], 'manage_team')).toBe(true)
    expect(hasPermission(['manage_team'], 'write')).toBe(false)
  })

  it('returns false for an empty list (no access)', () => {
    expect(hasPermission([], 'read')).toBe(false)
  })
})

describe('role matrix', () => {
  it('only owners manage the team and billing', () => {
    expect(hasPermission(ROLE_PERMISSIONS.owner, 'manage_team')).toBe(true)
    expect(hasPermission(ROLE_PERMISSIONS.owner, 'manage_billing')).toBe(true)
    for (const role of ['manager', 'agent', 'viewer']) {
      expect(hasPermission(ROLE_PERMISSIONS[role], 'manage_team')).toBe(false)
      expect(hasPermission(ROLE_PERMISSIONS[role], 'manage_billing')).toBe(false)
    }
  })

  it('agents can reply and assign but cannot run business writes', () => {
    expect(hasPermission(ROLE_PERMISSIONS.agent, 'conversation_write')).toBe(true)
    expect(hasPermission(ROLE_PERMISSIONS.agent, 'assigned_work')).toBe(true)
    expect(hasPermission(ROLE_PERMISSIONS.agent, 'write')).toBe(false)
  })

  it('viewers are read-only', () => {
    expect(hasPermission(ROLE_PERMISSIONS.viewer, 'conversation_write')).toBe(false)
    expect(hasPermission(ROLE_PERMISSIONS.viewer, 'write')).toBe(false)
    expect(hasPermission(ROLE_PERMISSIONS.viewer, 'conversation_read')).toBe(true)
  })

  it('managers cannot manage the team', () => {
    expect(hasPermission(ROLE_PERMISSIONS.manager, 'manage_team')).toBe(false)
    expect(hasPermission(ROLE_PERMISSIONS.manager, 'delete')).toBe(false)
  })
})
