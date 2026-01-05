"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { AlertTriangle, X } from "lucide-react"
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
	const { 
		repoOwnerFromLink, 
		repoNameFromLink, 
		linkNameFromLink, 
		organizationBrandInfo, 
		updatePartnerIntegrationBillOfRights, 
		clearRepositoryLink,
		repoValidationError,
		isLoading, 
		selectedOrgId, 
		fetchOrganizationBrandInfo 
	} = useOrganizationStore()
	const [repoOwner, setRepoOwner] = useState<string>("")
	const [repoName, setRepoName] = useState<string>("")
	const [linkName, setLinkName] = useState<string>("")
	const [isClearing, setIsClearing] = useState(false)
	
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

	const onClear = async () => {
		if (!selectedOrgId) return
		setIsClearing(true)
		try {
			await clearRepositoryLink(selectedOrgId)
			toast.success("Repository link cleared successfully")
			setRepoOwner("")
			setRepoName("")
			onClose()
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to clear repository link")
		} finally {
			setIsClearing(false)
		}
	}

	const hasValidationError = repoValidationError && repoOwner && repoName && 
		repoOwner === repoOwnerFromLink && repoName === repoNameFromLink

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<Card className="w-full max-w-lg">
				<CardContent className="p-6 space-y-4">
					<h3 className="text-lg font-semibold">Configure Organization</h3>
					
					{hasValidationError && (
						<Alert className="border-destructive/50 bg-destructive/10">
							<AlertTriangle className="h-4 w-4 text-destructive" />
							<AlertDescription className="text-sm text-destructive">
								This repository doesn't exist or has been deleted. Please update the link or clear it.
							</AlertDescription>
						</Alert>
					)}
					
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
					<div className="flex justify-between items-center pt-2">
						{hasValidationError && (
							<Button 
								variant="outline" 
								onClick={onClear} 
								disabled={isClearing || isLoading}
								className="text-destructive hover:text-destructive"
							>
								{isClearing ? "Clearing..." : "Clear Repository Link"}
							</Button>
						)}
						<div className="flex justify-end gap-2 ml-auto">
							<Button variant="outline" onClick={onClose} disabled={isLoading || isClearing}>
								Cancel
							</Button>
							<Button onClick={onSave} disabled={!repoOwner || !repoName || isLoading || isClearing}>
								{isLoading ? "Saving..." : "Save"}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

