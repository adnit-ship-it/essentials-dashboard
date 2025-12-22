"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { useOrganizationStore } from "@/lib/stores/organization-store"

interface OrganizationConfigModalProps {
	isOpen: boolean
	onClose: () => void
	initialRepoOwner?: string
	initialRepoName?: string
	initialLinkName?: string
}

export function OrganizationConfigModal({ 
	isOpen, 
	onClose,
	initialRepoOwner,
	initialRepoName,
	initialLinkName,
}: OrganizationConfigModalProps) {
	const { repoOwnerFromLink, repoNameFromLink, linkNameFromLink, organizationBrandInfo, updatePartnerIntegrationBillOfRights, isLoading, selectedOrgId, fetchOrganizationBrandInfo } = useOrganizationStore()
	const [repoOwner, setRepoOwner] = useState<string>("")
	const [repoName, setRepoName] = useState<string>("")
	const [linkName, setLinkName] = useState<string>("")
	
	useEffect(() => {
		if (isOpen && selectedOrgId) {
			fetchOrganizationBrandInfo(selectedOrgId).catch(() => {})
		}
	}, [isOpen, selectedOrgId, fetchOrganizationBrandInfo])
	
	useEffect(() => {
		if (isOpen) {
			setRepoOwner(initialRepoOwner || repoOwnerFromLink || "")
			setRepoName(initialRepoName || repoNameFromLink || "")
			const storedLinkName = initialLinkName || linkNameFromLink || organizationBrandInfo?.partnerIntegrationInfo?.linkName || ""
			setLinkName(storedLinkName)
		}
	}, [isOpen, initialRepoOwner, initialRepoName, initialLinkName, repoOwnerFromLink, repoNameFromLink, linkNameFromLink, organizationBrandInfo])

	if (!isOpen) return null

	const onSave = async () => {
		if (!repoOwner || !repoName) return
		try {
			await updatePartnerIntegrationBillOfRights({ 
				repoOwner, 
				repoName, 
				linkName: linkName.trim() || undefined 
			})
			toast.success(`Repository "${repoName}" linked to organization successfully!`)
			onClose()
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to link repository to organization")
		}
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

