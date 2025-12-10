import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { Organization as DbOrganization } from '@/lib/types/database'
import { fetchGraphQL } from '@/lib/services/graphql'

interface OrganizationStore {
  organizations: Array<{ id: string; name: string }>
  selectedOrgId: string | null
  organizationBrandInfo: {
    id: string
    name: string
    isPartner: boolean
    partnerIntegrationInfoId: string | null
    partnerIntegrationInfo?: { linkName: string | null } | null
  } | null
  billOfRightsLink: string | null
  partnerIntegrationPublicId: string | null
  repoOwnerFromLink: string | null
  repoNameFromLink: string | null
  linkNameFromLink: string | null
  needsRepoConfig: boolean
  isLoading: boolean
  error: string | null
  hasFetched: boolean
  
  // Actions
  fetchOrganizations: () => Promise<void>
  setSelectedOrgId: (orgId: string | null) => void
  fetchOrganizationBrandInfo: (orgId: string) => Promise<void>
  fetchPartnerPublicInfoByLinkName: (linkName: string) => Promise<void>
  updatePartnerIntegrationBillOfRights: (params: { repoOwner: string; repoName: string; linkName?: string }) => Promise<void>
  clearError: () => void
}

export const useOrganizationStore = create<OrganizationStore>((set, get) => ({
  organizations: [],
  selectedOrgId: null,
  organizationBrandInfo: null,
  billOfRightsLink: null,
  partnerIntegrationPublicId: null,
  repoOwner: null as any, // legacy placeholder, will be removed if present
    repoOwnerFromLink: null,
    repoNameFromLink: null,
    linkNameFromLink: null,
    needsRepoConfig: false,
  isLoading: false,
  error: null,
  hasFetched: false,

  fetchOrganizations: async () => {
    set({ isLoading: true, error: null })
    try {
      const query = `
        query AllOrganizationsQuery {
          allOrganizations {
            id
            name
            contactEmail
            isPartner
            partnerIntegrationInfoId
            caseCategories {
              id
              name
              __typename
            }
            __typename
          }
        }
      `
      const data = await fetchGraphQL<{ allOrganizations: Array<{ id: string; name: string }> }>({
        query,
        variables: {},
      })
      const orgs = (data?.allOrganizations || []).map(o => ({ id: o.id, name: o.name }))
      set({
        organizations: orgs,
        isLoading: false,
        hasFetched: true,
      })
      const { selectedOrgId } = get()
      if (!selectedOrgId && orgs.length > 0) {
        set({ selectedOrgId: orgs[0].id })
        // Prime brand info for the first org
        get().fetchOrganizationBrandInfo(orgs[0].id).catch(() => {})
      }
    } catch (error) {
      console.error('Error fetching organizations (GraphQL):', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch organizations',
        isLoading: false,
        hasFetched: true,
      })
    }
  },

  setSelectedOrgId: (orgId) => {
    set({ selectedOrgId: orgId })
    if (orgId) {
      get().fetchOrganizationBrandInfo(orgId).catch(() => {})
    } else {
      set({ organizationBrandInfo: null })
    }
  },

  fetchOrganizationBrandInfo: async (orgId: string) => {
    set({ isLoading: true, error: null })
    try {
      const query = `
        query OrganizationBrandInfo($organizationId: String) {
          organizationBrandInfo(organizationId: $organizationId) {
            id
            name
            isPartner
            partnerIntegrationInfoId
            partnerIntegrationInfo {
              linkName
              __typename
            }
            __typename
          }
        }
      `
      const data = await fetchGraphQL<{
        organizationBrandInfo: {
          id: string
          name: string
          isPartner: boolean
          partnerIntegrationInfoId: string | null
          partnerIntegrationInfo?: { linkName: string | null } | null
        } | null
      }>({
        query,
        variables: { organizationId: orgId },
      })
      // eslint-disable-next-line no-console
      set({
        organizationBrandInfo: data?.organizationBrandInfo || null,
        isLoading: false,
      })
      const linkName = data?.organizationBrandInfo?.partnerIntegrationInfo?.linkName || null
      if (linkName) {
        // Chain load partner integration public info using linkName
        await get().fetchPartnerPublicInfoByLinkName(linkName)
      } else {
        set({ billOfRightsLink: null })
      }
    } catch (error) {
      console.error('Error fetching organization brand info (GraphQL):', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch organization brand info',
        isLoading: false,
      })
    }
  },

  fetchPartnerPublicInfoByLinkName: async (linkNameParam: string) => {
    set({ isLoading: true, error: null })
    try {
      const query = `
        query OrganizationPartnerIntegrationPublicInfo($linkName: String) {
          organizationPartnerIntegrationPublicInfo(linkName: $linkName) {
            id
            billOfRightsLink
            __typename
          }
        }
      `
      const data = await fetchGraphQL<{
        organizationPartnerIntegrationPublicInfo: {
          id: string | null
          billOfRightsLink: string | null
        } | null
      }>({
        query,
        variables: { linkName: linkNameParam },
      })
      const envFallback =
        process.env.NEXT_PUBLIC_BOR_LINK ||
        // Support non-public var name if provided (will be undefined on client unless exposed)
        process.env.NEXT_BOR_LINK ||
        null
      const bill =
        data?.organizationPartnerIntegrationPublicInfo?.billOfRightsLink ||
        envFallback
      const publicId = data?.organizationPartnerIntegrationPublicInfo?.id || null
      // eslint-disable-next-line no-console
      let repoOwner: string | null = null
      let repoName: string | null = null
      let linkName: string | null = null
      if (bill) {
        try {
          const url = new URL(bill)
          repoOwner = url.searchParams.get("repo-owner")
          repoName = url.searchParams.get("repo-name")
          linkName = url.searchParams.get("link-name") || url.searchParams.get("linkName")
        } catch {
          // ignore invalid URL
        }
      }
      set({
        billOfRightsLink: bill,
        partnerIntegrationPublicId: publicId,
        repoOwnerFromLink: repoOwner,
        repoNameFromLink: repoName,
        linkNameFromLink: linkName,
        needsRepoConfig: !repoOwner || !repoName,
        isLoading: false,
      })
    } catch (error) {
      console.error('Error fetching partner public info (GraphQL):', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch partner public info',
        isLoading: false,
      })
    }
  },

  updatePartnerIntegrationBillOfRights: async ({ repoOwner, repoName, linkName }) => {
    const state = get()
    const integrationInfoId = state.organizationBrandInfo?.partnerIntegrationInfoId || state.partnerIntegrationPublicId || null
    if (!integrationInfoId) {
      set({ error: "Missing integration info id to update bill of rights link" })
      console.error("updatePartnerIntegrationBillOfRights: No integrationInfoId available")
      return
    }
    const base = process.env.NEXT_PUBLIC_BOR_LINK || process.env.NEXT_BOR_LINK || ""
    const url = new URL(base, typeof window !== "undefined" ? window.location.origin : "https://placeholder.local")
    // Ensure we keep existing query params if any
    // Clear existing repo params first
    url.searchParams.delete("repo-owner")
    url.searchParams.delete("repo-name")
    url.searchParams.delete("link-name")
    url.searchParams.set("repo-owner", repoOwner)
    url.searchParams.set("repo-name", repoName)
    if (linkName) {
      url.searchParams.set("link-name", linkName)
    }
    // Build final link with all params
    const params = new URLSearchParams()
    params.set("repo-owner", repoOwner)
    params.set("repo-name", repoName)
    if (linkName) {
      params.set("link-name", linkName)
    }
    const finalLink = url.origin === "https://placeholder.local" 
      ? `${base}?${params.toString()}` 
      : url.toString()
    const mutation = `
      mutation TheMutation($integrationInfoId: String, $integrationInfo: OrganizationPartnerIntegrationInfoInput) {
        updateOrganizationPartnerIntegrationInfo(
          integrationInfoId: $integrationInfoId
          integrationInfo: $integrationInfo
        ) {
          success
          __typename
        }
      }
    `
    set({ isLoading: true, error: null })
    try {
      const result = await fetchGraphQL<{ updateOrganizationPartnerIntegrationInfo: { success: boolean } }>({
        query: mutation,
        variables: {
          integrationInfoId: integrationInfoId,
          integrationInfo: {
            billOfRightsLink: finalLink,
          },
        },
      })
      // eslint-disable-next-line no-console
      // Refresh local state with new link and params
      set({
        billOfRightsLink: finalLink,
        repoOwnerFromLink: repoOwner,
        repoNameFromLink: repoName,
        linkNameFromLink: linkName || null,
        needsRepoConfig: false,
        isLoading: false,
      })
    } catch (error) {
      console.error('Error updating partner integration info (GraphQL):', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to update partner integration info',
        isLoading: false,
      })
    }
  },

  clearError: () => {
    set({ error: null })
  }
}))