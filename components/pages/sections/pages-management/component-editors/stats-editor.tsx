"use client"

import { GenericEditor } from "./generic-editor"

interface StatsEditorProps {
  componentKey: string
  value: any
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
}

export function StatsEditor(props: StatsEditorProps) {
  return <GenericEditor {...props} />
}

