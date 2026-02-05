"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import type { LegalPage } from "@/lib/types/legal";
import { generateLegalPageSlug } from "@/lib/types/legal";
import dynamic from "next/dynamic";

// Dynamic import for TipTap editor to reduce initial bundle size
const RichTextEditor = dynamic(
  () =>
    import("./rich-text-editor").then((mod) => ({
      default: mod.RichTextEditor,
    })),
  {
    loading: () => (
      <div className="border rounded-lg p-4 min-h-[300px] flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading editor...
      </div>
    ),
    ssr: false,
  }
);

interface LegalPageEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: LegalPage | null;
  isNew: boolean;
  onSave: (page: LegalPage) => void;
}

export function LegalPageEditorModal({
  open,
  onOpenChange,
  page,
  isNew,
  onSave,
}: LegalPageEditorModalProps) {
  const [formData, setFormData] = useState<LegalPage>({
    id: "",
    slug: "",
    title: "",
    footerLabel: "",
    lastUpdated: new Date().toISOString().split("T")[0],
    showInFooter: true,
    order: 0,
    content: "",
    seo: {
      title: "",
      description: "",
    },
  });

  const [autoSlug, setAutoSlug] = useState(true);

  // Reset form when page changes
  useEffect(() => {
    if (page) {
      setFormData(page);
      setAutoSlug(false);
    } else {
      setFormData({
        id: "",
        slug: "",
        title: "",
        footerLabel: "",
        lastUpdated: new Date().toISOString().split("T")[0],
        showInFooter: true,
        order: 0,
        content: "",
        seo: {
          title: "",
          description: "",
        },
      });
      setAutoSlug(true);
    }
  }, [page, open]);

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      footerLabel: prev.footerLabel || title,
      id: isNew && autoSlug ? generateLegalPageSlug(title) : prev.id,
      slug: autoSlug ? generateLegalPageSlug(title) : prev.slug,
    }));
  };

  const handleSlugChange = (slug: string) => {
    setAutoSlug(false);
    setFormData((prev) => ({
      ...prev,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      id: isNew ? slug.toLowerCase().replace(/[^a-z0-9-]/g, "-") : prev.id,
    }));
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      alert("Please enter a title");
      return;
    }
    if (!formData.slug.trim()) {
      alert("Please enter a URL slug");
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>
            {isNew ? "Create Legal Page" : `Edit: ${page?.title}`}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)]">
          <div className="px-6 py-4 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Page Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g., Privacy Policy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/legal/</span>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="privacy-policy"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Footer Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="footerLabel">Footer Link Text</Label>
                <Input
                  id="footerLabel"
                  value={formData.footerLabel}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      footerLabel: e.target.value,
                    }))
                  }
                  placeholder="Privacy Policy"
                />
              </div>
              <div className="space-y-2">
                <Label>Show in Footer</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={formData.showInFooter}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, showInFooter: checked }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.showInFooter
                      ? "Visible in footer"
                      : "Hidden from footer"}
                  </span>
                </div>
              </div>
            </div>

            {/* SEO Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">SEO Settings (Optional)</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    value={formData.seo?.title || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, title: e.target.value },
                      }))
                    }
                    placeholder="Custom title for search engines"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoDescription">SEO Description</Label>
                  <Textarea
                    id="seoDescription"
                    value={formData.seo?.description || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, description: e.target.value },
                      }))
                    }
                    placeholder="Brief description for search results"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <Label>Page Content</Label>
              <RichTextEditor
                content={formData.content}
                onChange={(html) =>
                  setFormData((prev) => ({ ...prev, content: html }))
                }
                placeholder="Write your legal content here..."
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isNew ? "Create Page" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
