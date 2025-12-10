"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSelectedOrganization } from "@/lib/hooks/use-selected-organization";
import { useOrganizationStore } from "@/lib/stores/organization-store";
import { WebsiteText, Template, Organization } from "@/lib/types/database";
import { ChevronRight, ChevronDown, RefreshCw, RotateCcw, Plus, Trash2, Upload, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TabProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function Tabs({ tabs, activeTab, onTabChange }: TabProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>
    </div>
  );
}

interface SidebarProps {
  subsections: string[];
  activeSubsection: string;
  onSubsectionChange: (subsection: string) => void;
}

interface JsonEditorProps {
  data: any;
  path: string;
  onChange: (path: string, value: any) => void;
  level?: number;
  iconRegistry?: Record<string, string>;
  repoOwner?: string;
  repoName?: string;
  repoBranch?: string;
  onIconRegistryUpdate?: (newRegistry: Record<string, string>) => void;
}

// HIDDEN_CONTENT_PATHS removed - no longer needed

// Helper functions for field detection
const isColorField = (key: string): boolean => {
  return key.toLowerCase().endsWith('color') || key.toLowerCase() === 'color';
};

const isIconTypeField = (key: string): boolean => {
  return key === 'iconType' || key === 'icon_type';
};

const isIconObject = (value: any): boolean => {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value.hasOwnProperty('type') || value.hasOwnProperty('src')) &&
    (value.hasOwnProperty('color') || value.hasOwnProperty('iconColor') || value.hasOwnProperty('alt'))
  );
};

const isHeightObject = (value: any): boolean => {
  if (typeof value !== 'object' || value === null) return false;
  
  // Check if it has at least one of the common height properties
  const hasMobile = value.hasOwnProperty('mobile') && typeof value.mobile === 'string';
  const hasTablet = value.hasOwnProperty('tablet') && typeof value.tablet === 'string';
  const hasDesktop = value.hasOwnProperty('desktop') && typeof value.desktop === 'string';
  
  // It's a height object if it has at least mobile or desktop (common pattern)
  // and all properties that exist are strings
  return (hasMobile || hasDesktop || hasTablet) && 
         Object.values(value).every(v => typeof v === 'string');
};

const isValidHex = (value: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
};

// Helper function to convert relative paths to GitHub raw URLs
function buildIconUrl(
  iconPath: string,
  repoOwner?: string,
  repoName?: string,
  repoBranch: string = "main"
): string {
  if (!iconPath) return "";
  
  // If it's already a full URL, return as-is
  if (iconPath.startsWith("http://") || iconPath.startsWith("https://")) {
    return iconPath;
  }
  
  // If we have repo info, convert to GitHub raw URL
  if (repoOwner && repoName) {
    // Remove leading slash if present
    const cleanPath = iconPath.startsWith("/") ? iconPath.slice(1) : iconPath;
    // Ensure it starts with "public/" if it's an asset path
    const repoPath = cleanPath.startsWith("public/") ? cleanPath : `public/${cleanPath}`;
    return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${repoBranch}/${repoPath}`;
  }
  
  // Fallback: return as-is (might work if it's a public asset)
  return iconPath;
}

// Icon Preview Component
function IconPreview({ 
  iconPath, 
  color, 
  className,
  repoOwner,
  repoName,
  repoBranch = "main"
}: { 
  iconPath: string; 
  color?: string; 
  className?: string;
  repoOwner?: string;
  repoName?: string;
  repoBranch?: string;
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!iconPath) {
    return (
      <div className={cn("flex items-center justify-center bg-gray-100 rounded", className)}>
        <span className="text-xs text-gray-400">?</span>
      </div>
    );
  }

  // Convert relative path to GitHub raw URL if we have repo info
  const resolvedPath = buildIconUrl(iconPath, repoOwner, repoName, repoBranch);
  const isSvg = iconPath.toLowerCase().endsWith('.svg');
  
  // Debug logging
  useEffect(() => {
    if (iconPath && !resolvedPath.startsWith('http')) {
      console.warn('IconPreview: Missing repo info for icon:', {
        iconPath,
        resolvedPath,
        repoOwner,
        repoName,
        repoBranch
      });
    }
  }, [iconPath, resolvedPath, repoOwner, repoName, repoBranch]);
  
  return (
    <div className={cn("flex items-center justify-center relative", className)}>
      <img
        src={resolvedPath}
        alt="Icon preview"
        className="w-full h-full object-contain"
        onLoad={() => {
          setLoaded(true);
          setError(false);
        }}
        onError={() => {
          setError(true);
          console.error('Failed to load icon:', {
            resolvedPath: resolvedPath || 'undefined',
            originalPath: iconPath || 'undefined',
            repoOwner: repoOwner || 'undefined',
            repoName: repoName || 'undefined',
            repoBranch: repoBranch || 'undefined'
          });
        }}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
          <span className="text-xs text-gray-400">?</span>
        </div>
      )}
    </div>
  );
}

// Add Item Modal Component
function AddItemModal({
  open,
  onOpenChange,
  context,
  onConfirm,
  repoOwner,
  repoName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: { key: string; currentPath: string; arrayValue: any[] } | null;
  onConfirm: (item: any) => void;
  repoOwner?: string;
  repoName?: string;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filename, setFilename] = useState("");
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const isClientLogo = context?.key === 'logos';
  const isJourneyStep = context?.key === 'steps';
  const isBulletPoint = context?.key === 'bulletPoints' || context?.key === 'features';

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setFilename("");
      setAltText("");
      setPreview(null);
      setError(null);
    }
  }, [open]);

  // Generate preview when file is selected
  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, [selectedFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-generate filename from file name if not set
      if (!filename) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setFilename(nameWithoutExt.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
      }
    }
  };

  const handleConfirm = async () => {
    if (isClientLogo) {
      // For client logos, we need file and filename
      if (!selectedFile || !filename) {
        setError("Please select a logo file and enter a filename");
        return;
      }
      if (!repoOwner || !repoName) {
        setError("Repository information is missing. Please configure organization settings.");
        return;
      }

      setUploading(true);
      setError(null);

      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix
            const base64Data = result.split(",")[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        // Determine file extension
        const extension = selectedFile.name.split(".").pop()?.toLowerCase() || "png";
        const repoPath = `public/assets/images/clients/${filename}.${extension}`;

        // Upload to repository
        // Use relative URLs in browser to avoid CORS issues
        const apiUrl = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001");
        const url = `${apiUrl}/api/product-images?owner=${encodeURIComponent(repoOwner)}&repo=${encodeURIComponent(repoName)}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: repoPath,
            contentBase64: base64,
            commitMessage: `CMS: Add client logo ${filename}`,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to upload logo");
        }

        const result = await response.json();
        const logoPath = `/assets/images/clients/${filename}.${extension}`;

        // Create new logo item
        const newItem = {
          src: logoPath,
          alt: altText || filename,
        };

        onConfirm(newItem);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload logo");
      } finally {
        setUploading(false);
      }
    } else {
      // For other types, just create default item
      let defaultItem: any = {};
      if (isJourneyStep) {
        defaultItem = { title: "", subtext: [""], icon: { src: "", type: "", color: "#000000" } };
      } else if (isBulletPoint) {
        defaultItem = { text: "", iconType: "", iconColor: "#000000" };
      }
      onConfirm(defaultItem);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold mb-4">
            Add New {isClientLogo ? 'Client Logo' : isJourneyStep ? 'Journey Step' : isBulletPoint ? 'Bullet Point' : 'Feature'}
          </Dialog.Title>
          
          {isClientLogo ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a client logo file. It will be saved to the clients directory.
              </p>
              <div className="space-y-4">
                <div>
                  <Label>Logo File *</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="mt-1"
                    disabled={uploading}
                  />
                  {preview && (
                    <div className="mt-2 p-2 border rounded">
                      <img src={preview} alt="Preview" className="max-h-20 max-w-full object-contain" />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Filename (without extension) *</Label>
                  <Input
                    value={filename}
                    onChange={(e) => setFilename(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    placeholder="e.g., company-name"
                    className="mt-1"
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    File will be saved as: <code>public/assets/images/clients/{filename || "filename"}.{selectedFile?.name.split(".").pop() || "png"}</code>
                  </p>
                </div>
                <div>
                  <Label>Alt Text</Label>
                  <Input
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="e.g., Company Name Logo"
                    className="mt-1"
                    disabled={uploading}
                  />
                </div>
                {error && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={uploading || !selectedFile || !filename}
                  >
                    {uploading ? "Uploading..." : "Upload & Add"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {isJourneyStep 
                  ? "Upload an icon file and fill in the step details. The icon will be added to the icon registry."
                  : "Upload an icon file (optional) and fill in the details."}
              </p>
              <div className="space-y-4">
                <div>
                  <Label>Icon File (SVG)</Label>
                  <Input
                    type="file"
                    accept=".svg"
                    onChange={handleFileSelect}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Icon will be saved to: /assets/images/[icon-name].svg
                  </p>
                </div>
                <div>
                  <Label>Icon Type Name</Label>
                  <Input
                    placeholder="e.g., new-step-icon"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will be the key in iconRegistry
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleConfirm}>
                    Add Item
                  </Button>
                </div>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function JsonEditor({ data, path, onChange, level = 0, iconRegistry = {}, repoOwner, repoName, repoBranch = "main", onIconRegistryUpdate }: JsonEditorProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [colorInputs, setColorInputs] = useState<Record<string, string>>({});
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [addItemContext, setAddItemContext] = useState<{key: string, currentPath: string, arrayValue: any[]} | null>(null);

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleValueChange = (key: string, value: any) => {
    const newPath = path ? `${path}.${key}` : key;
    onChange(newPath, value);
  };

  const handleArrayItemAdd = (key: string, currentPath: string, arrayValue: any[]) => {
    // For journey steps, bullet points, features, and client logos, open modal
    if (key === 'steps' || key === 'bulletPoints' || key === 'features' || key === 'logos') {
      setAddItemContext({ key, currentPath, arrayValue });
      setAddItemModalOpen(true);
    } else {
      // For simple arrays, just add a default item
      let defaultItem: any = {};
      if (arrayValue.length > 0) {
        defaultItem = JSON.parse(JSON.stringify(arrayValue[0]));
        if (defaultItem.id) delete defaultItem.id;
        if (defaultItem.name) defaultItem.name = "";
        if (defaultItem.text) defaultItem.text = "";
        if (defaultItem.title) defaultItem.title = "";
        if (defaultItem.src) defaultItem.src = "";
      } else {
        defaultItem = {};
      }
      const newArray = [...arrayValue, defaultItem];
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      onChange(newPath, newArray);
    }
  };

  const handleArrayItemDelete = (key: string, currentPath: string, arrayValue: any[], index: number) => {
    const newArray = arrayValue.filter((_, i) => i !== index);
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    onChange(newPath, newArray);
  };

  const renderColorField = (key: string, value: string, currentPath: string) => {
    const colorValue = colorInputs[`${currentPath}.${key}`] ?? value;
    
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium capitalize">
          {key.replace(/_/g, " ")}
        </Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={value || "#000000"}
            onChange={(e) => {
              const newPath = currentPath ? `${currentPath}.${key}` : key;
              const newColor = e.target.value;
              onChange(newPath, newColor);
              setColorInputs((prev) => ({ ...prev, [`${currentPath}.${key}`]: newColor }));
            }}
            className="h-10 w-12 cursor-pointer p-1"
          />
          <Input
            value={colorValue || ""}
            onChange={(e) => {
              setColorInputs((prev) => ({ ...prev, [`${currentPath}.${key}`]: e.target.value }));
            }}
            onBlur={(e) => {
              const inputValue = e.target.value.trim();
              const withHash = inputValue.startsWith("#") ? inputValue : `#${inputValue}`;
              if (isValidHex(withHash) || inputValue === "") {
                const newPath = currentPath ? `${currentPath}.${key}` : key;
                onChange(newPath, inputValue === "" ? "" : withHash.toUpperCase());
              } else {
                // Reset to original value on invalid input
                setColorInputs((prev) => ({ ...prev, [`${currentPath}.${key}`]: value }));
              }
            }}
            placeholder="#000000"
            className="flex-1"
          />
        </div>
      </div>
    );
  };

  const renderIconTypeField = (key: string, value: string, currentPath: string) => {
    const iconOptions = Object.keys(iconRegistry);
    const iconPath = value && iconRegistry[value] ? iconRegistry[value] : null;

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium capitalize">
          {key.replace(/_/g, " ")}
        </Label>
        <div className="flex gap-3 items-center">
          {/* Show selected icon preview outside dropdown */}
          {value && iconPath && (
            <div className="flex-shrink-0 border border-gray-200 rounded p-2 bg-gray-50">
              <IconPreview 
                iconPath={iconPath} 
                className="w-8 h-8" 
                repoOwner={repoOwner} 
                repoName={repoName} 
                repoBranch={repoBranch} 
              />
            </div>
          )}
          <Select
            value={value || ""}
            onValueChange={(newValue) => {
              const newPath = currentPath ? `${currentPath}.${key}` : key;
              onChange(newPath, newValue);
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select icon type">
                {value ? (
                  <span>{value}</span>
                ) : (
                  <span className="text-muted-foreground">Select icon type</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {iconOptions.length > 0 ? (
                iconOptions.map((iconType) => (
                  <SelectItem key={iconType} value={iconType}>
                    <div className="flex items-center gap-2">
                      <IconPreview 
                        iconPath={iconRegistry[iconType]} 
                        className="w-4 h-4" 
                        repoOwner={repoOwner}
                        repoName={repoName}
                        repoBranch={repoBranch}
                      />
                      <span>{iconType}</span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No icons available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const renderIconObject = (key: string, value: any, currentPath: string) => {
    // Try to find icon type from iconRegistry by matching src
    const iconSrc = value?.src || "";
    const existingType = value?.type || "";
    let iconType = existingType;
    
    // If no type but we have src, try to find matching type in iconRegistry
    if (!iconType && iconSrc) {
      const matchingType = Object.keys(iconRegistry).find(
        type => iconRegistry[type] === iconSrc
      );
      if (matchingType) {
        iconType = matchingType;
      }
    }
    
    // Get src from type if available, otherwise use provided src
    const resolvedSrc = (iconType && iconRegistry[iconType]) || iconSrc || "";
    const iconColor = value?.color || value?.iconColor || "#000000";
    const iconAlt = value?.alt || "";

    return (
      <div className="space-y-3 p-3 border border-gray-200 rounded-md">
        <Label className="text-sm font-medium capitalize">
          {key.replace(/_/g, " ")}
        </Label>
        
        {/* Icon Preview - Show prominently */}
        {resolvedSrc && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Icon Preview</Label>
            <div className="flex items-center justify-center p-4 border border-gray-200 rounded-md bg-gray-50">
              <IconPreview iconPath={resolvedSrc} color={iconColor} className="w-16 h-16" repoOwner={repoOwner} repoName={repoName} repoBranch={repoBranch} />
            </div>
          </div>
        )}
        
        {/* Icon Type Selector */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Icon Type</Label>
          <Select
            value={iconType || ""}
            onValueChange={(newType) => {
              // Update type
              const typePath = currentPath ? `${currentPath}.${key}.type` : `${key}.type`;
              onChange(typePath, newType);
              // Update src if icon registry has this type
              if (iconRegistry[newType]) {
                const srcPath = currentPath ? `${currentPath}.${key}.src` : `${key}.src`;
                onChange(srcPath, iconRegistry[newType]);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select icon type">
                {iconType ? (
                  <div className="flex items-center gap-2">
                    {resolvedSrc && (
                      <IconPreview iconPath={resolvedSrc} color={iconColor} className="w-4 h-4" repoOwner={repoOwner} repoName={repoName} repoBranch={repoBranch} />
                    )}
                    <span>{iconType}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Select icon type</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.keys(iconRegistry).length > 0 ? (
                Object.keys(iconRegistry).map((type) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <IconPreview iconPath={iconRegistry[type]} color={iconColor} className="w-4 h-4" repoOwner={repoOwner} repoName={repoName} repoBranch={repoBranch} />
                      <span>{type}</span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No icons available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Icon Color - Always show */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Icon Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={iconColor || "#000000"}
              onChange={(e) => {
                const newPath = currentPath ? `${currentPath}.${key}.color` : `${key}.color`;
                onChange(newPath, e.target.value);
              }}
              className="h-10 w-12 cursor-pointer p-1"
            />
            <Input
              value={iconColor || ""}
              onChange={(e) => {
                const inputValue = e.target.value.trim();
                const withHash = inputValue.startsWith("#") ? inputValue : `#${inputValue}`;
                if (isValidHex(withHash) || inputValue === "") {
                  const newPath = currentPath ? `${currentPath}.${key}.color` : `${key}.color`;
                  onChange(newPath, inputValue === "" ? "#000000" : withHash.toUpperCase());
                }
              }}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>

        {/* Alt Text - Always show if alt property exists in object */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Alt Text</Label>
          <Input
            value={iconAlt}
            onChange={(e) => {
              const newPath = currentPath ? `${currentPath}.${key}.alt` : `${key}.alt`;
              onChange(newPath, e.target.value);
            }}
            placeholder="Icon description"
          />
        </div>
      </div>
    );
  };

  const renderHeightObject = (key: string, value: any, currentPath: string) => {
    const hasMobile = value?.hasOwnProperty('mobile');
    const hasTablet = value?.hasOwnProperty('tablet');
    const hasDesktop = value?.hasOwnProperty('desktop');
    
    // Determine grid columns based on available fields
    const columns = [hasMobile, hasTablet, hasDesktop].filter(Boolean).length;
    const gridCols = columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-2' : 'grid-cols-3';
    
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium capitalize">
          {key.replace(/_/g, " ")}
        </Label>
        <div className={`grid ${gridCols} gap-2`}>
          {hasMobile && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Mobile</Label>
              <Input
                value={value?.mobile || ""}
                onChange={(e) => {
                  const newPath = currentPath ? `${currentPath}.${key}.mobile` : `${key}.mobile`;
                  onChange(newPath, e.target.value);
                }}
                placeholder="e.g., 222px"
              />
            </div>
          )}
          {hasTablet && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tablet</Label>
              <Input
                value={value?.tablet || ""}
                onChange={(e) => {
                  const newPath = currentPath ? `${currentPath}.${key}.tablet` : `${key}.tablet`;
                  onChange(newPath, e.target.value);
                }}
                placeholder="e.g., 480px"
              />
            </div>
          )}
          {hasDesktop && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Desktop</Label>
              <Input
                value={value?.desktop || ""}
                onChange={(e) => {
                  const newPath = currentPath ? `${currentPath}.${key}.desktop` : `${key}.desktop`;
                  onChange(newPath, e.target.value);
                }}
                placeholder="e.g., 600px"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderValue = (key: string, value: any, currentPath: string) => {
    // Filter out contact show and title fields (from any subsection)
    // Check if we're in the contact section (either at root level or in any subsection)
    const isInContactSection = currentPath.toLowerCase().includes('contact') || 
                                (currentPath === '' && key === 'contact') ||
                                currentPath.startsWith('contact.');
    
    if (isInContactSection && (key === 'show' || key === 'title')) {
      return null;
    }

    // Filter out logo path controls from trustedBy section
    if (currentPath.includes('trustedBy') && (key === 'path' || key === 'src')) {
      return null;
    }

    // Check for special field types first
    if (typeof value === "string" && isColorField(key)) {
      return renderColorField(key, value, currentPath);
    }

    if (typeof value === "string" && isIconTypeField(key)) {
      return renderIconTypeField(key, value, currentPath);
    }

    if (isIconObject(value)) {
      return renderIconObject(key, value, currentPath);
    }

    if (isHeightObject(value)) {
      return renderHeightObject(key, value, currentPath);
    }

    if (typeof value === "string") {
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium capitalize">
            {key.replace(/_/g, " ")}
          </Label>
          <Textarea
            value={value}
            onChange={(e) => {
              const newPath = currentPath ? `${currentPath}.${key}` : key;
              onChange(newPath, e.target.value);
            }}
            rows={Math.min(Math.max(value.split("\n").length, 2), 8)}
            className="resize-none"
            style={{
              minHeight: "40px",
              maxHeight: "160px",
            }}
          />
        </div>
      );
    } else if (typeof value === "number") {
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium capitalize">
            {key.replace(/_/g, " ")}
          </Label>
          <Input
            type="number"
            value={value.toString()}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value) || 0;
              const newPath = currentPath ? `${currentPath}.${key}` : key;
              onChange(newPath, newValue);
            }}
            className="bg-white"
          />
        </div>
      );
    } else if (typeof value === "boolean") {
      return (
        <div className="flex items-center justify-between space-y-0">
          <Label className="text-sm font-medium capitalize">
            {key.replace(/_/g, " ")}
          </Label>
          <div className="flex items-center space-x-2">
            <Switch
              checked={value}
              onCheckedChange={(checked) => {
                const newPath = currentPath ? `${currentPath}.${key}` : key;
                onChange(newPath, checked);
              }}
            />
            <span className="text-sm text-muted-foreground">
              {value ? "On" : "Off"}
            </span>
          </div>
        </div>
      );
    } else if (Array.isArray(value)) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleExpanded(key)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {expanded[key] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              <Label className="text-sm font-medium capitalize">
                {key.replace(/_/g, " ")} ({value.length} items)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleArrayItemAdd(key, currentPath, value)}
                className="h-7 px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
          </div>
          {expanded[key] && (
            <div className="ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
              {value.length === 0 ? (
                <p className="text-xs text-muted-foreground">No items. Click "Add" to create one.</p>
              ) : (
                value.map((item, index) => {
                  // Check if this is a bullet point item (has iconType, iconColor/color, and text)
                  const isBulletPoint = item && typeof item === 'object' && 
                    (item.hasOwnProperty('iconType') || item.hasOwnProperty('icon_type')) &&
                    (item.hasOwnProperty('iconColor') || item.hasOwnProperty('color')) &&
                    (item.hasOwnProperty('text') || item.hasOwnProperty('review') || item.hasOwnProperty('question') || item.hasOwnProperty('answer') || item.hasOwnProperty('title') || item.hasOwnProperty('description') || item.hasOwnProperty('value'));
                  
                  if (isBulletPoint && (key === 'bulletPoints' || key === 'features' || key === 'list' || key === 'cards' || key === 'steps' || key === 'questions')) {
                    // Compact bullet point rendering
                    const iconType = item.iconType || item.icon_type || '';
                    const iconColor = item.iconColor || item.color || '#000000';
                    const text = item.text || item.review || item.question || item.answer || item.title || item.description || item.value || '';
                    const iconPath = iconType && iconRegistry[iconType] ? iconRegistry[iconType] : null;
                    const itemPath = currentPath ? `${currentPath}.${key}.${index}` : `${key}.${index}`;
                    const textKey = item.hasOwnProperty('text') ? 'text' : 
                                   item.hasOwnProperty('review') ? 'review' :
                                   item.hasOwnProperty('question') ? 'question' :
                                   item.hasOwnProperty('answer') ? 'answer' :
                                   item.hasOwnProperty('title') ? 'title' :
                                   item.hasOwnProperty('description') ? 'description' :
                                   item.hasOwnProperty('value') ? 'value' : 'text';
                    const colorKey = item.hasOwnProperty('iconColor') ? 'iconColor' : 'color';
                    const iconTypeKey = item.hasOwnProperty('iconType') ? 'iconType' : 'icon_type';

                    return (
                      <div key={index} className="flex items-center gap-3 p-2 border border-gray-200 rounded-md bg-white">
                        {/* Icon Type */}
                        <div className="flex-shrink-0 w-32">
                          <Select
                            value={iconType || ""}
                            onValueChange={(newType) => {
                              onChange(`${itemPath}.${iconTypeKey}`, newType);
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Icon" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(iconRegistry).length > 0 ? (
                                Object.keys(iconRegistry).map((type) => (
                                  <SelectItem key={type} value={type}>
                                    <div className="flex items-center gap-2">
                                      <IconPreview iconPath={iconRegistry[type]} color={iconColor} className="w-4 h-4" repoOwner={repoOwner} repoName={repoName} repoBranch={repoBranch} />
                                      <span>{type}</span>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>No icons</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Icon Color */}
                        <div className="flex-shrink-0 w-24">
                          <div className="flex gap-1 items-center">
                            <Input
                              type="color"
                              value={iconColor || "#000000"}
                              onChange={(e) => {
                                onChange(`${itemPath}.${colorKey}`, e.target.value);
                              }}
                              className="h-8 w-10 cursor-pointer p-1"
                            />
                            <Input
                              value={iconColor || ""}
                              onChange={(e) => {
                                const inputValue = e.target.value.trim();
                                const withHash = inputValue.startsWith("#") ? inputValue : `#${inputValue}`;
                                if (isValidHex(withHash) || inputValue === "") {
                                  onChange(`${itemPath}.${colorKey}`, inputValue === "" ? "#000000" : withHash.toUpperCase());
                                }
                              }}
                              placeholder="#000"
                              className="h-8 text-xs flex-1"
                            />
                          </div>
                        </div>

                        {/* Text */}
                        <div className="flex-1">
                          <Input
                            value={text}
                            onChange={(e) => {
                              onChange(`${itemPath}.${textKey}`, e.target.value);
                            }}
                            placeholder="Text content"
                            className="h-8"
                          />
                        </div>

                        {/* Delete Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArrayItemDelete(key, currentPath, value, index)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  }
                  
                  // Regular array item rendering
                  return (
                    <div key={index} className="space-y-2 p-3 border border-gray-200 rounded-md bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs font-medium text-gray-700">
                          Item {index + 1}
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArrayItemDelete(key, currentPath, value, index)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <JsonEditor
                        data={item}
                        path={
                          currentPath
                            ? `${currentPath}.${key}.${index}`
                            : `${key}.${index}`
                        }
                        onChange={onChange}
                        level={level + 1}
                        iconRegistry={iconRegistry}
                        repoOwner={repoOwner}
                        repoName={repoName}
                        repoBranch={repoBranch}
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      );
    } else if (typeof value === "object" && value !== null) {
      // Check if it's a nested color field
      if (value.hasOwnProperty('color') && Object.keys(value).length <= 3) {
        // Might be a simple color object, but let's check if it's actually an icon or height object first
        if (!isIconObject(value) && !isHeightObject(value)) {
          // Check if it's just a color string in an object
          if (typeof value.color === 'string') {
            return renderColorField(key, value.color, currentPath);
          }
        }
      }
      
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleExpanded(key)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {expanded[key] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            <Label className="text-sm font-medium capitalize">
              {key.replace(/_/g, " ")}
            </Label>
          </div>
          {expanded[key] && (
            <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
              <JsonEditor
                data={value}
                path={currentPath ? `${currentPath}.${key}` : key}
                onChange={onChange}
                level={level + 1}
                iconRegistry={iconRegistry}
              />
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (typeof data !== "object" || data === null) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key}>{renderValue(key, value, path)}</div>
        ))}
      </div>
      
      {/* Add Item Modal */}
      <AddItemModal
        open={addItemModalOpen}
        onOpenChange={setAddItemModalOpen}
        context={addItemContext}
        onConfirm={(newItem) => {
          if (addItemContext) {
            const { key, currentPath, arrayValue } = addItemContext;
            const newArray = [...arrayValue, newItem];
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            onChange(newPath, newArray);
          }
          setAddItemModalOpen(false);
          setAddItemContext(null);
        }}
        repoOwner={repoOwner}
        repoName={repoName}
      />
    </>
  );
}

function Sidebar({
  subsections,
  activeSubsection,
  onSubsectionChange,
}: SidebarProps) {
  return (
    <div className="w-64 min-w-64 bg-gray-50 border-r flex flex-col">
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium text-gray-900">Subsections</h3>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          {subsections.map((subsection) => (
            <button
              key={subsection}
              onClick={() => onSubsectionChange(subsection)}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                activeSubsection === subsection
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {subsection}
            </button>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}

export function ContentManagementSection() {
  const { selectedOrganization } = useSelectedOrganization();
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore();

  // Dummy organization for testing API calls without real organization data
  // Memoize to prevent recreation on every render
  const dummyOrganization: Organization = useMemo(
    () => ({
      id: "dummy-org-id",
      created_at: new Date().toISOString(),
      name: "Test Organization",
      template_id: "dummy-template-id",
      api_key: "dummy-api-key",
      logo_url: "",
      logo_alt_url: "",
      brand_colors: {},
      website_text: {},
    }),
    []
  );

  // Use dummy organization if no real one is selected (for testing)
  // Memoize to prevent recreation unless selectedOrganization changes
  const org = useMemo(
    () => selectedOrganization || dummyOrganization,
    [selectedOrganization, dummyOrganization]
  );

  const [activeTab, setActiveTab] = useState<string>("");
  const [activeSubsection, setActiveSubsection] = useState<string>("");
  const [websiteText, setWebsiteText] = useState<WebsiteText | null>(null);
  const [editedContent, setEditedContent] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [sha, setSha] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract main sections from website_text
  // Filter out iconRegistry (only needed for dropdowns) and pages (controlled elsewhere)
  const mainSections = websiteText
    ? Object.keys(websiteText).filter((key) => {
        const lowerKey = key.toLowerCase();
        return key !== "common" && 
               lowerKey !== "iconregistry" && 
               key !== "iconRegistry" && 
               key !== "pages";
      })
    : [];

  // Get subsections for the active tab
  const getSubsections = (section: string): string[] => {
    if (!websiteText || !websiteText[section as keyof WebsiteText]) return [];
    const sectionData = websiteText[section as keyof WebsiteText];
    return Object.keys(sectionData);
  };

  // Get content for the active subsection
  const getSubsectionContent = (section: string, subsection: string) => {
    if (!websiteText || !websiteText[section as keyof WebsiteText]) return {};
    const sectionData = websiteText[section as keyof WebsiteText];
    return sectionData[subsection] || {};
  };

  // Fetch content from backend API
  const fetchContentFromBackend = useCallback(async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const owner = repoOwnerFromLink || "";
    const repo = repoNameFromLink || "";
    if (!owner || !repo) {
      setError("Repository owner/name missing. Configure via organization settings.");
      setIsLoading(false);
      return;
    }

    const url = `${apiUrl}/api/content?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err.error || `Failed to fetch content: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.content) {
        setWebsiteText(data.content);
        setSha(data.sha);

        // Set initial active tab to first available section
        // Filter out iconRegistry and pages here too
        const sections = Object.keys(data.content).filter(
          (key) => {
            const lowerKey = key.toLowerCase();
            return key !== "common" && 
                   lowerKey !== "iconregistry" && 
                   key !== "iconRegistry" && 
                   key !== "pages";
          }
        );
        if (sections.length > 0) {
          setActiveTab(sections[0]);
          const subsections = Object.keys(data.content[sections[0]] || {});
          if (subsections.length > 0) {
            setActiveSubsection(subsections[0]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching content from backend:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch content"
      );
    } finally {
      setIsLoading(false);
    }
  }, [repoOwnerFromLink, repoNameFromLink]);

  // Reload content when repo changes
  useEffect(() => {
    if (repoOwnerFromLink && repoNameFromLink) {
      fetchContentFromBackend();
    }
  }, [repoOwnerFromLink, repoNameFromLink, fetchContentFromBackend]);

  // Fetch template data
  const fetchTemplate = async (templateId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (error) {
        console.error("Error fetching template:", error);
        return null;
      }

      return data as Template;
    } catch (error) {
      console.error("Error fetching template:", error);
      return null;
    }
  };

  // Update edited content when active subsection changes
  useEffect(() => {
    if (activeTab && activeSubsection) {
      const content = getSubsectionContent(activeTab, activeSubsection);
      setEditedContent(JSON.parse(JSON.stringify(content))); // Deep clone
      setHasChanges(false);
    }
  }, [activeTab, activeSubsection, websiteText]);

  // Fetch template data when organization changes (skip for dummy org)
  useEffect(() => {
    if ((org as any).template_id && org.id !== "dummy-org-id") {
      fetchTemplate((org as any).template_id).then((templateData) => {
        if (templateData) {
          setTemplate(templateData);
        }
      });
    }
    // Only run once on mount to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const subsections = getSubsections(tab);
    if (subsections.length > 0) {
      setActiveSubsection(subsections[0]);
    } else {
      setActiveSubsection("");
    }
  };

  const handleSubsectionChange = (subsection: string) => {
    setActiveSubsection(subsection);
  };

  const handleContentChange = (path: string, value: any) => {
    if (!editedContent) return;

    // Update the nested value using the path
    const keys = path.split(".");
    const newContent = JSON.parse(JSON.stringify(editedContent)); // Deep clone

    let current = newContent;
    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] === undefined) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setEditedContent(newContent);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!editedContent || !org || !websiteText || !sha) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      // Create updated website_text by merging the edited subsection
      const updatedWebsiteText = {
        ...websiteText,
        [activeTab]: {
          ...websiteText[activeTab as keyof WebsiteText],
          [activeSubsection]: editedContent,
        },
      };

      // Send update to backend API
      const owner = repoOwnerFromLink || "";
      const repo = repoNameFromLink || "";
      const url = `${apiUrl}/api/content/update?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newContent: updatedWebsiteText,
          sha: sha,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to save content: ${response.status}`
        );
      }

      const result = await response.json();

      // Update local state with new SHA from response
      if (result.newSha) {
        setSha(result.newSha);
      }

      // Update local state
      setWebsiteText(updatedWebsiteText);
      setHasChanges(false);

    } catch (error) {
      console.error("Error saving content:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save content"
      );
    }
  };

  const handleReset = () => {
    if (activeTab && activeSubsection) {
      const content = getSubsectionContent(activeTab, activeSubsection);
      setEditedContent(JSON.parse(JSON.stringify(content)));
      setHasChanges(false);
    }
  };

  const handleRestoreDefaults = async () => {
    if (!template?.default_site_text || !org) return;

    setIsRestoring(true);
    try {
      // Skip Supabase update for dummy organization
      if (org.id === "dummy-org-id") {
        // Just update local state for dummy org
        setWebsiteText(template.default_site_text);
        setEditedContent(null);
        setHasChanges(false);
        setShowRestoreConfirm(false);

        // Reset to first section
        const sections = Object.keys(template.default_site_text).filter(
          (key) => key !== "common"
        );
        if (sections.length > 0) {
          setActiveTab(sections[0]);
          const subsections = Object.keys(
            template.default_site_text[sections[0]] || {}
          );
          if (subsections.length > 0) {
            setActiveSubsection(subsections[0]);
          }
        }
        setIsRestoring(false);
        return;
      }

      const supabase = createClient();
      const { error } = await supabase
        .from("organizations")
        .update({ website_text: template.default_site_text })
        .eq("id", org.id);

      if (error) {
        console.error("Error restoring defaults:", error);
        return;
      }

      // Update local state
      setWebsiteText(template.default_site_text);
      setEditedContent(null);
      setHasChanges(false);
      setShowRestoreConfirm(false);

      // Reset to first section
      const sections = Object.keys(template.default_site_text).filter(
        (key) => key !== "common"
      );
      if (sections.length > 0) {
        setActiveTab(sections[0]);
        const subsections = Object.keys(
          template.default_site_text[sections[0]] || {}
        );
        if (subsections.length > 0) {
          setActiveSubsection(subsections[0]);
        }
      }
    } catch (error) {
      console.error("Error restoring defaults:", error);
    } finally {
      setIsRestoring(false);
    }
  };

  // Note: Using dummy organization for testing, so we always proceed
  // The component will work with the dummy org if no real one is selected

  if (isLoading) {
    return (
      <div className="h-full flex flex-col space-y-4">
        <div className="flex-shrink-0 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Content Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage text content for different sections of your website
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchContentFromBackend}
            disabled={isLoading || !repoOwnerFromLink || !repoNameFromLink}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Loading content...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col space-y-4">
        <div className="flex-shrink-0 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Content Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage text content for different sections of your website
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchContentFromBackend}
            disabled={isLoading || !repoOwnerFromLink || !repoNameFromLink}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <p className="text-center text-red-600 mb-4">Error: {error}</p>
              <Button onClick={fetchContentFromBackend} className="w-full">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!websiteText || mainSections.length === 0) {
    return (
      <div className="h-full flex flex-col space-y-4">
        <div className="flex-shrink-0 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Content Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage text content for different sections of your website
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchContentFromBackend}
            disabled={isLoading || !repoOwnerFromLink || !repoNameFromLink}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                No content data available for this organization.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentSubsections = getSubsections(activeTab);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Content Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage text content for different sections of your website
            </p>
          </div>
          <Button
            className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1 text-xs"
            onClick={() => setShowRestoreConfirm(true)}
            disabled={isRestoring || !template}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            {isRestoring ? "Restoring..." : "Restore Defaults"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0">
        <Tabs
          tabs={mainSections}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          subsections={currentSubsections}
          activeSubsection={activeSubsection}
          onSubsectionChange={handleSubsectionChange}
        />

        {/* Content Display */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-6 max-w-full">
              {activeSubsection ? (
                <div className="space-y-4">
                  <div className="flex-shrink-0 flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium capitalize">
                        {activeTab} → {activeSubsection}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Edit content for this subsection
                      </p>
                    </div>
                    {hasChanges && (
                      <div className="flex items-center space-x-2">
                        <Button
                          className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 text-xs"
                          onClick={handleReset}
                        >
                          Reset
                        </Button>
                        <Button
                          className="px-3 py-1 text-xs"
                          onClick={handleSave}
                        >
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>

                  <Card>
                    <CardContent className="p-6">
                      {editedContent &&
                      Object.keys(editedContent).length > 0 ? (
                        <JsonEditor
                          data={editedContent}
                          path=""
                          onChange={handleContentChange}
                          iconRegistry={(websiteText as any)?.iconRegistry || {}}
                          repoOwner={repoOwnerFromLink || undefined}
                          repoName={repoNameFromLink || undefined}
                          repoBranch="main"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-32">
                          <p className="text-center text-muted-foreground">
                            No content available for this subsection.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">
                    Select a subsection to view content
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Restore Confirmation Dialog */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-lg">Restore Defaults</CardTitle>
              <CardDescription>
                This will restore all content to the template's default values.
                This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> All current content changes will be
                  lost and replaced with the template defaults.
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                  onClick={() => setShowRestoreConfirm(false)}
                  disabled={isRestoring}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={handleRestoreDefaults}
                  disabled={isRestoring}
                >
                  {isRestoring ? "Restoring..." : "Restore Defaults"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
