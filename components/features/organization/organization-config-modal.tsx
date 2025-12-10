"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useOrganizationStore } from "@/lib/stores/organization-store"

interface OrganizationConfigModalProps {
	isOpen: boolean
	onClose: () => void
}

export function OrganizationConfigModal({ isOpen, onClose }: OrganizationConfigModalProps) {
	const { repoOwnerFromLink, repoNameFromLink, linkNameFromLink, organizationBrandInfo, updatePartnerIntegrationBillOfRights, isLoading, selectedOrgId, fetchOrganizationBrandInfo } = useOrganizationStore()
	const [repoOwner, setRepoOwner] = useState<string>(repoOwnerFromLink || "")
	const [repoName, setRepoName] = useState<string>(repoNameFromLink || "")
	const [linkName, setLinkName] = useState<string>("")
	
	// Refresh organization data when modal opens to ensure we have the latest values
	useEffect(() => {
		if (isOpen && selectedOrgId) {
			fetchOrganizationBrandInfo(selectedOrgId).catch(() => {})
		}
	}, [isOpen, selectedOrgId, fetchOrganizationBrandInfo])
	
	useEffect(() => {
		if (isOpen) {
			setRepoOwner(repoOwnerFromLink || "")
			setRepoName(repoNameFromLink || "")
			// Initialize linkName from store (from URL) or from organizationBrandInfo
			const storedLinkName = linkNameFromLink || organizationBrandInfo?.partnerIntegrationInfo?.linkName || ""
			setLinkName(storedLinkName)
		}
	}, [isOpen, repoOwnerFromLink, repoNameFromLink, linkNameFromLink, organizationBrandInfo])

	if (!isOpen) return null

	const onSave = async () => {
		if (!repoOwner || !repoName) return
		await updatePartnerIntegrationBillOfRights({ 
			repoOwner, 
			repoName, 
			linkName: linkName.trim() || undefined 
		})
		onClose()
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<Card className="w-full max-w-lg">
				<CardContent className="p-6 space-y-4">
					<h3 className="text-lg font-semibold">Configure Organization</h3>
					<div className="space-y-2">
						<label className="text-sm">Repository Owner</label>
						<Input
							placeholder="e.g. org-or-user"
							value={repoOwner}
							onChange={(e) => setRepoOwner(e.target.value)}
							disabled={isLoading}
						/>
					</div>
					<div className="space-y-2">
						<label className="text-sm">Repository Name</label>
						<Input
							placeholder="e.g. my-repo"
							value={repoName}
							onChange={(e) => setRepoName(e.target.value)}
							disabled={isLoading}
						/>
					</div>
					<div className="space-y-2">
						<label className="text-sm">Link Name (optional)</label>
						<Input
							placeholder="e.g. better-days-pt-wellness"
							value={linkName}
							onChange={(e) => setLinkName(e.target.value)}
							disabled={isLoading}
						/>
						<p className="text-xs text-muted-foreground">
							Used to fetch product bundles for this organization
						</p>
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button variant="outline" onClick={onClose} disabled={isLoading}>
							Cancel
						</Button>
						<Button onClick={onSave} disabled={!repoOwner || !repoName || isLoading}>
							{isLoading ? "Saving..." : "Save"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}


