import { useOrganizationStore } from '@/lib/stores/organization-store'

export function useSelectedOrganization() {
  const { organizations, selectedOrgId } = useOrganizationStore()
  
  const selectedOrganization = organizations.find(org => org.id === selectedOrgId)
  
  return {
    selectedOrganization,
    selectedOrgId,
    hasSelectedOrg: !!selectedOrganization
  }
}