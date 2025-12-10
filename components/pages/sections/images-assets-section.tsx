"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Save, X, RefreshCw, ExternalLink, ChevronDown, Trash2, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrganizationStore } from "@/lib/stores/organization-store";

type AssetCategory = "brand" | "before-after" | "client-logo";

const CATEGORY_METADATA: Record<
  AssetCategory,
  { title: string; description: string }
> = {
  brand: {
    title: "Brand Identity",
    description: "Hero imagery, favicon, and other core brand visuals.",
  },
  "client-logo": {
    title: "Client & Trust Logos",
    description: "Logos used in Trusted By sections and partner callouts.",
  },
  "before-after": {
    title: "Before & After Gallery",
    description: "Transformation imagery showcased on the site.",
  },
};

interface AssetItem {
  path: string;
  label: string;
  category: AssetCategory;
  url: string;
  sha: string;
  commitUrl?: string;
  websiteSrc?: string;
}

interface PendingAsset {
  preview: string;
  base64: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Unable to read file"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });

export function ImagesAssetsSection() {
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore();
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [pending, setPending] = useState<Record<string, PendingAsset>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [openSections, setOpenSections] = useState<Record<AssetCategory, boolean>>({
    brand: true,
    "client-logo": false,
    "before-after": false,
  });
  const [showAddLogoForm, setShowAddLogoForm] = useState(false);
  const [newLogoFileName, setNewLogoFileName] = useState("");
  const [newLogoAlt, setNewLogoAlt] = useState("");
  const [newLogoBase64, setNewLogoBase64] = useState<string | null>(null);
  const [newLogoPreview, setNewLogoPreview] = useState<string | null>(null);
  const [newLogoFileExtension, setNewLogoFileExtension] = useState("");
  const [creatingLogo, setCreatingLogo] = useState(false);
  const newLogoPreviewRef = useRef<string | null>(null);

  const groupedAssets = useMemo(() => {
    // Filter out logo and secondary logo - they're managed in Brand & Design tab
    const PRIMARY_LOGO_PATH = "public/assets/images/brand/logo.svg";
    const SECONDARY_LOGO_PATH = "public/assets/images/brand/logo-alt.svg";
    const FAVICON_PATH = "public/favicon.ico";
    
    const filteredAssets = assets.filter(
      (asset) =>
        asset.path !== PRIMARY_LOGO_PATH &&
        asset.path !== SECONDARY_LOGO_PATH &&
        asset.path !== FAVICON_PATH
    );
    
    return filteredAssets.reduce<Record<AssetCategory, AssetItem[]>>(
      (acc, asset) => {
        if (!acc[asset.category]) {
          acc[asset.category] = [];
        }
        acc[asset.category].push(asset);
        return acc;
      },
      { brand: [], "client-logo": [], "before-after": [] }
    );
  }, [assets]);

  const fetchAssets = async () => {
    const owner = repoOwnerFromLink || "";
    const repo = repoNameFromLink || "";
    if (!owner || !repo) {
      setError("Repository owner/name missing. Configure via organization settings.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}/api/assets?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
      const response = await fetch(url);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load assets");
      }
      const data = await response.json();
      setAssets(data.assets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (category: AssetCategory) => {
    setOpenSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  useEffect(() => {
    if (repoOwnerFromLink && repoNameFromLink) {
      setAssets([]);
      setPending({});
      setError(null);
      fetchAssets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoOwnerFromLink, repoNameFromLink]);

  const handleFileChange = async (asset: AssetItem, file?: File) => {
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      const previewUrl = URL.createObjectURL(file);
      setPending((prev) => {
        if (prev[asset.path]?.preview) {
          URL.revokeObjectURL(prev[asset.path].preview);
        }
        return { ...prev, [asset.path]: { preview: previewUrl, base64 } };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
    }
  };

  const handleCancel = (path: string) => {
    setPending((prev) => {
      const next = { ...prev };
      if (next[path]?.preview) {
        URL.revokeObjectURL(next[path].preview);
      }
      delete next[path];
      return next;
    });
  };

  const updateNewLogoPreview = (next: string | null) => {
    if (newLogoPreviewRef.current) {
      URL.revokeObjectURL(newLogoPreviewRef.current);
    }
    newLogoPreviewRef.current = next;
    setNewLogoPreview(next);
  };

  useEffect(() => {
    return () => {
      if (newLogoPreviewRef.current) {
        URL.revokeObjectURL(newLogoPreviewRef.current);
      }
    };
  }, []);

  const clearNewLogoState = () => {
    updateNewLogoPreview(null);
    setNewLogoBase64(null);
    setNewLogoFileName("");
    setNewLogoAlt("");
    setNewLogoFileExtension("");
  };

  const closeAddLogoForm = () => {
    clearNewLogoState();
    setShowAddLogoForm(false);
  };

  const resolveWebsiteSrc = (asset: AssetItem) => {
    if (asset.websiteSrc && asset.websiteSrc.trim().length > 0) {
      return asset.websiteSrc;
    }

    if (asset.path.startsWith("public/")) {
      const withoutPublic = asset.path.slice("public".length);
      return `/${withoutPublic.replace(/^\/+/, "")}`;
    }

    if (asset.path.startsWith("/")) {
      return asset.path;
    }

    return `/${asset.path}`;
  };

  const handleDeleteClientLogo = async (asset: AssetItem) => {
    if (asset.category !== "client-logo") {
      return;
    }

    const owner = repoOwnerFromLink || "";
    const repo = repoNameFromLink || "";
    if (!owner || !repo) {
      setError("Repository owner/name missing. Configure via organization settings.");
      return;
    }

    const src = resolveWebsiteSrc(asset);
    if (!src) {
      setError("Unable to resolve logo path for deletion.");
      return;
    }

    setDeleting((prev) => ({ ...prev, [asset.path]: true }));
    setError(null);

    try {
      const url = `${API_BASE_URL}/api/client-logos?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ src }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete client logo");
      }

      // Optimistically update state - remove the deleted logo from assets
      const normalizedSrc = src.startsWith("/") ? src : `/${src}`;
      setAssets((prev) =>
        prev.filter((item) => {
          const itemSrc = resolveWebsiteSrc(item);
          const normalizedItemSrc = itemSrc.startsWith("/") ? itemSrc : `/${itemSrc}`;
          return normalizedItemSrc !== normalizedSrc;
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete client logo");
    } finally {
      setDeleting((prev) => {
        const next = { ...prev };
        delete next[asset.path];
        return next;
      });
    }
  };

  const handleNewLogoFileChange = async (file?: File) => {
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setNewLogoBase64(base64);
      updateNewLogoPreview(URL.createObjectURL(file));
      setNewLogoFileName(file.name);
      const extension = file.name.includes(".")
        ? file.name.split(".").pop() || ""
        : "";
      setNewLogoFileExtension(extension);
      const derivedAlt = file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]/g, " ")
        .trim();
      setNewLogoAlt((prev) => (prev.trim() ? prev : derivedAlt));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
    }
  };

  const handleCreateClientLogo = async () => {
    const owner = repoOwnerFromLink || "";
    const repo = repoNameFromLink || "";
    if (!owner || !repo) {
      setError("Repository owner/name missing. Configure via organization settings.");
      return;
    }

    if (!newLogoBase64) {
      setError("Please select an image to upload.");
      return;
    }

    let finalFileName = newLogoFileName.trim();
    if (!finalFileName) {
      setError("Please provide a file name for the logo.");
      return;
    }

    if (
      finalFileName.includes("..") ||
      finalFileName.includes("/") ||
      finalFileName.includes("\\")
    ) {
      setError("File name cannot include path separators.");
      return;
    }

    if (!/\.[A-Za-z0-9]+$/.test(finalFileName)) {
      if (newLogoFileExtension) {
        finalFileName = `${finalFileName}.${newLogoFileExtension}`;
      } else {
        setError("File name must include an extension (e.g., .png, .svg).");
        return;
      }
    }

    const altText =
      newLogoAlt.trim() ||
      finalFileName.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim();

    setCreatingLogo(true);
    setError(null);

    try {
      const url = `${API_BASE_URL}/api/client-logos?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: finalFileName,
          alt: altText,
          contentBase64: newLogoBase64,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add client logo");
      }

      const data = await response.json();

      // Optimistically update state - add the new logo to assets
      const newAssetPath = `public/assets/images/clients/${finalFileName}`;
      const newAsset: AssetItem = {
        path: newAssetPath,
        label: altText,
        category: "client-logo",
        url: data.fileUrl || "",
        sha: data.assetSha || "",
        commitUrl: data.assetCommitUrl,
        websiteSrc: data.logo?.src || `/${newAssetPath.replace("public/", "")}`,
      };

      setAssets((prev) => [...prev, newAsset]);
      closeAddLogoForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add client logo");
    } finally {
      setCreatingLogo(false);
    }
  };

  const renderAddClientLogoForm = () => {
    return (
      <Card className="mb-4 border-2 border-dashed border-border">
        <CardHeader>
          <CardTitle className="text-base">Add Client Logo</CardTitle>
          <CardDescription>
            Upload a new client or press logo and register it with the content
            repo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Preview
              </Label>
              <div className="aspect-video rounded-md bg-muted flex items-center justify-center overflow-hidden">
                {newLogoPreview ? (
                  <img
                    src={newLogoPreview}
                    alt={newLogoAlt || "New client logo preview"}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No image selected
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <input
                  id="new-client-logo-upload"
                  type="file"
                  accept="image/*,.svg"
                  className="hidden"
                  onChange={(event) =>
                    handleNewLogoFileChange(event.target.files?.[0])
                  }
                />
                <Button
                  asChild
                  className="gap-2 bg-transparent text-muted-foreground hover:bg-muted border border-border"
                >
                  <label htmlFor="new-client-logo-upload">
                    <Upload className="h-4 w-4" />
                    Choose Image
                  </label>
                </Button>
                {newLogoBase64 ? (
                  <span className="text-xs text-muted-foreground">
                    Image ready to upload.
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    PNG, JPG, SVG supported. No size limits.
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-client-logo-name">File name</Label>
                <Input
                  id="new-client-logo-name"
                  value={newLogoFileName}
                  onChange={(event) => setNewLogoFileName(event.target.value)}
                  placeholder="trusted-partner.png"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-client-logo-alt">Alt text</Label>
                <Input
                  id="new-client-logo-alt"
                  value={newLogoAlt}
                  onChange={(event) => setNewLogoAlt(event.target.value)}
                  placeholder="Trusted Partner logo"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleCreateClientLogo}
              disabled={creatingLogo || !newLogoBase64}
              className="gap-2"
            >
              {creatingLogo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {creatingLogo ? "Uploading..." : "Upload Logo"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={creatingLogo}
              onClick={closeAddLogoForm}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const handleSave = async (asset: AssetItem) => {
    const candidate = pending[asset.path];
    if (!candidate) return;

    setSaving((prev) => ({ ...prev, [asset.path]: true }));
    setError(null);

    try {
      const owner = repoOwnerFromLink || "";
      const repo = repoNameFromLink || "";
      const url = `${API_BASE_URL}/api/assets/update?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: asset.path,
          contentBase64: candidate.base64,
          sha: asset.sha,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update asset");
      }

      const data = await response.json();
      
      // Optimistically update the asset with the new SHA, URL, and commit URL
      // The API response already contains all the data we need, no refetch required
      setAssets((prev) =>
        prev.map((item) =>
          item.path === asset.path
            ? {
                ...item,
                sha: data.newSha || item.sha,
                url: data.fileUrl || item.url,
                commitUrl: data.commitUrl,
              }
            : item
        )
      );
      
      handleCancel(asset.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update asset");
    } finally {
      setSaving((prev) => {
        const next = { ...prev };
        delete next[asset.path];
        return next;
      });
    }
  };

  const renderAssetCard = (asset: AssetItem) => {
    const pendingAsset = pending[asset.path];
    const preview = pendingAsset?.preview || asset.url;
    const isSaving = Boolean(saving[asset.path]);
    const isDeleting = Boolean(deleting[asset.path]);

    return (
      <Card key={asset.path}>
        <CardHeader>
          <CardTitle className="text-base">{asset.label}</CardTitle>
          <CardDescription className="capitalize">
            {asset.category === "brand"
              ? "Brand Asset"
              : asset.category === "client-logo"
              ? "Client Logo"
              : "Before & After"}
            {asset.path && (
              <span className="ml-2 text-xs opacity-70">
                ({asset.path.split(".").pop()?.toUpperCase() || "Unknown"})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video rounded-md bg-muted overflow-hidden flex items-center justify-center relative">
            {asset.category === "client-logo" && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={isDeleting || isSaving}
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteClientLogo(asset);
                }}
                className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white/80 text-red-600 hover:bg-red-100"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
            {preview ? (
              <>
                <img
                  src={preview}
                  alt={asset.label}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    console.error(`Failed to load image: ${preview}`);
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span
                  className="text-sm text-muted-foreground absolute"
                  style={{ display: "none" }}
                >
                  Failed to load image
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">
                No preview available
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input
              id={`asset-upload-${asset.path}`}
              type="file"
              accept="image/*,.svg"
              className="hidden"
              onChange={(event) =>
                handleFileChange(asset, event.target.files?.[0])
              }
            />
            <Button
              asChild
              className="gap-2 bg-transparent text-muted-foreground hover:bg-muted border border-border"
            >
              <label htmlFor={`asset-upload-${asset.path}`}>
                <Upload className="h-4 w-4" />
                Choose File
              </label>
            </Button>
            <div className="space-y-1">
              {asset.path && (
                <p className="text-xs text-muted-foreground">
                  File: {asset.path.split("/").pop()}
                </p>
              )}
              {asset.sha && (
                <p className="text-xs text-muted-foreground">
                  SHA: {asset.sha.slice(0, 8)}...
                </p>
              )}
              {asset.commitUrl && (
                <a
                  href={asset.commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View commit on GitHub
                </a>
              )}
            </div>
          </div>

          {pendingAsset && (
            <div className="flex gap-2">
              <Button
                onClick={() => handleSave(asset)}
                disabled={isSaving}
                className="gap-2 flex-1"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={() => handleCancel(asset.path)}
                disabled={isSaving}
                className="gap-2 border border-border bg-transparent text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading assets...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Images & Assets</h3>
          <p className="text-sm text-muted-foreground">
            Replace hero imagery, client logos (Trusted By), and before/after visuals stored in GitHub.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAssets}
          disabled={loading || !repoOwnerFromLink || !repoNameFromLink}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm text-red-600">
              <span>{error}</span>
              <Button
                onClick={fetchAssets}
                className="gap-2 bg-transparent px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {(Object.keys(CATEGORY_METADATA) as AssetCategory[]).map((category) => {
          const items = groupedAssets[category] || [];
          const metadata = CATEGORY_METADATA[category];
          const isOpen = openSections[category];

          return (
            <div
              key={category}
              className="rounded-lg border border-border bg-card transition-all"
            >
              <button
                type="button"
                onClick={() => toggleSection(category)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {metadata.title}
                  </span>
                  <span className="text-xs text-muted-foreground/80">
                    {metadata.description}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isOpen ? "rotate-180" : "rotate-0"
                  )}
                />
              </button>
              {isOpen && (
                <div className="border-t border-border px-4 py-4 space-y-4">
                  {category === "client-logo" && (
                    <>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-muted-foreground">
                          Manage logos used in the Trusted By and press sections.
                        </p>
                        <Button
                          variant={showAddLogoForm ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "gap-2 self-start md:self-auto",
                            showAddLogoForm &&
                              "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          )}
                          disabled={creatingLogo}
                          onClick={() =>
                            setShowAddLogoForm((prev) => {
                              if (prev) {
                                clearNewLogoState();
                                return false;
                              }
                              return true;
                            })
                          }
                        >
                          {showAddLogoForm ? (
                            <>
                              <X className="h-4 w-4" />
                              Close Form
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              Add Client Logo
                            </>
                          )}
                        </Button>
                      </div>
                      {showAddLogoForm && renderAddClientLogoForm()}
                    </>
                  )}
                  {items.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        No {metadata.title.toLowerCase()} in this repository yet.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {items.map(renderAssetCard)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

