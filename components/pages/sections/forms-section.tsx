"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Save, Plus, Trash2 } from "lucide-react"

interface FormField {
  id: string
  name: string
  type: string
  label: string
  placeholder: string
  required: boolean
}

interface FormConfig {
  id: string
  name: string
  title: string
  description: string
  fields: FormField[]
  submitText: string
  successMessage: string
}

const fieldTypes = [
  { value: "text", label: "Text Input" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Select Dropdown" },
  { value: "checkbox", label: "Checkbox" },
]

export function FormsSection() {
  const [forms, setForms] = useState<FormConfig[]>([
    {
      id: "1",
      name: "contact",
      title: "Contact Form",
      description: "Main contact form for the website",
      fields: [
        { id: "1", name: "name", type: "text", label: "Full Name", placeholder: "Enter your name", required: true },
        { id: "2", name: "email", type: "email", label: "Email", placeholder: "Enter your email", required: true },
      ],
      submitText: "Send Message",
      successMessage: "Thank you for your message!",
    },
  ])

  const [selectedForm, setSelectedForm] = useState<string>("1")
  const [newField, setNewField] = useState({
    name: "",
    type: "text",
    label: "",
    placeholder: "",
    required: false,
  })

  const currentForm = forms.find((form) => form.id === selectedForm)

  const addField = () => {
    if (newField.name && newField.label && currentForm) {
      const field: FormField = {
        id: Date.now().toString(),
        ...newField,
      }

      setForms(forms.map((form) => (form.id === selectedForm ? { ...form, fields: [...form.fields, field] } : form)))

      setNewField({ name: "", type: "text", label: "", placeholder: "", required: false })
    }
  }

  const deleteField = (fieldId: string) => {
    setForms(
      forms.map((form) =>
        form.id === selectedForm ? { ...form, fields: form.fields.filter((field) => field.id !== fieldId) } : form,
      ),
    )
  }

  const updateFormConfig = (field: keyof FormConfig, value: string) => {
    setForms(forms.map((form) => (form.id === selectedForm ? { ...form, [field]: value } : form)))
  }

  const handleSave = () => {
    // TODO: Save to Supabase when integration is added
    console.log("Saving forms data:", forms)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Forms</h3>
        <p className="text-sm text-muted-foreground">Configure forms for your website</p>
      </div>

      {/* Form Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Form Configuration</CardTitle>
          <CardDescription>Select and configure your forms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Form</Label>
            <Select value={selectedForm} onValueChange={setSelectedForm}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {forms.map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentForm && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Form Title</Label>
                <Input value={currentForm.title} onChange={(e) => updateFormConfig("title", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Submit Button Text</Label>
                <Input
                  value={currentForm.submitText}
                  onChange={(e) => updateFormConfig("submitText", e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={currentForm.description}
                  onChange={(e) => updateFormConfig("description", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Success Message</Label>
                <Input
                  value={currentForm.successMessage}
                  onChange={(e) => updateFormConfig("successMessage", e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Field */}
      <Card>
        <CardHeader>
          <CardTitle>Add Form Field</CardTitle>
          <CardDescription>Add new fields to the selected form</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Field Name</Label>
              <Input
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                placeholder="e.g., firstName"
              />
            </div>
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select value={newField.type} onValueChange={(value) => setNewField({ ...newField, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={newField.label}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                placeholder="e.g., First Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Placeholder</Label>
              <Input
                value={newField.placeholder}
                onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                placeholder="e.g., Enter your first name"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={newField.required}
              onCheckedChange={(checked) => setNewField({ ...newField, required: checked })}
            />
            <Label>Required field</Label>
          </div>

          <Button onClick={addField} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Field
          </Button>
        </CardContent>
      </Card>

      {/* Form Fields */}
      {currentForm && (
        <Card>
          <CardHeader>
            <CardTitle>Form Fields</CardTitle>
            <CardDescription>Current fields in {currentForm.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentForm.fields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{field.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {field.name} • {fieldTypes.find((t) => t.value === field.type)?.label}
                      {field.required && " • Required"}
                    </div>
                  </div>
                  <Button
                    onClick={() => deleteField(field.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Forms
        </Button>
      </div>
    </div>
  )
}
