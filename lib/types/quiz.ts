/**
 * =================================================================================
 * TYPE DEFINITIONS FOR QUIZ/FORM BUILDER
 * 
 * These types define the structure for quizzes, forms, steps, and questions
 * stored in GitHub repository JSON files.
 * =================================================================================
 */

// =================================================================================
// BASE TYPES
// =================================================================================

export type UUID = string

/**
 * Allowed question types for form fields
 */
export const QuestionTypes = [
  'SINGLESELECT',
  'MULTISELECT',
  'DROPDOWN',
  'TEXT',
  'NUMBER',
  'EMAIL',
  'TEL',
  'TEXTAREA',
  'FILE_INPUT',
  'CHECKBOX',
  'PERFECT',
  'MARKETING',
  'BEFORE_AFTER',
] as const

export type QuestionType = (typeof QuestionTypes)[number]

/**
 * Validation rule types for questions
 */
export type ValidationRuleType = 'required' | 'email' | 'phone' | 'phonePrefix' | 'pattern'

/**
 * Validation rule interface
 */
export interface ValidationRule {
  type: ValidationRuleType
  value?: string  // For pattern (regex) or phonePrefix (default prefix)
  message?: string // Custom error message
}

/**
 * Legacy validation rule type for backward compatibility
 * @deprecated Use ValidationRule interface instead
 */
export type ValidationRuleLegacy = 'required' | 'email' | 'phone'

/**
 * Conditional rendering operators
 */
export type ConditionOperator = 'equals' | 'notEquals' | 'greaterThan' | 'lessThan'

/**
 * Logical operators for combining conditions
 */
export type LogicalOperator = 'AND' | 'OR'

// =================================================================================
// QUESTION TYPES
// =================================================================================

/**
 * Represents a selectable option for a question
 */
export interface QuestionOption {
  id: UUID
  question_id: UUID
  value: string
  label: string | null
  option_order: number
}

/**
 * Represents a single question within a form step
 */
export interface Question {
  id: UUID
  form_step_id: UUID
  slug: string
  type: QuestionType
  question: string
  display_question: string | null
  placeholder: string | null
  is_required?: boolean // Deprecated: Use validation array instead. Kept for backward compatibility
  question_order: number
  validation: ValidationRule[] | null
  api_type: string | null
  // Marketing question fields
  image?: string | null
  before_image?: string | null
  after_image?: string | null
  quote?: string | null
  // Template flag - derived from parent step's is_template_step
  is_template?: boolean
  // Optional options array
  options?: QuestionOption[]
}

// =================================================================================
// FORM STEP TYPES
// =================================================================================

/**
 * Conditional rendering condition
 */
export interface RenderCondition {
  conditions: {
    field: string
    operator: ConditionOperator
    value: string | string[] // Support both single and multi-select values
  }[]
  logicalOperator: LogicalOperator
}

/**
 * Represents a reusable form step or screen
 */
export interface FormStep {
  id: UUID
  slug: string
  title: string
  heading1: string | null
  subtext: string | null
  config: {
    template?: string // e.g., "BMI: {{value}}"
  } | null
  // Template flag to identify reusable steps
  is_template_step: boolean
  // Conditional rendering rules
  render_condition: RenderCondition | null
  // Optional questions array
  questions?: Question[]
}

/**
 * Represents a form step as it is linked to a specific quiz, including its order
 */
export interface QuizFormStep extends FormStep {
  step_order: number
}

// =================================================================================
// PROGRESS STEP TYPES
// =================================================================================

/**
 * Represents a high-level section of the quiz progress bar
 */
export interface ProgressStep {
  id: UUID
  quiz_id: UUID
  slug: string
  name: string
  description: string | null
  color: string | null
  step_order: number
}

// =================================================================================
// QUIZ TYPES
// =================================================================================

/**
 * Represents the core configuration of a quiz
 */
export interface Quiz {
  id: UUID
  slug: string
  name: string
  description: string | null
  version: string
  metadata: {
    category?: string
    estimatedTime?: string
    targetAudience?: string
    compliance?: string[]
  } | null
  created_at: string
  // Multi-tenancy fields
  organization_id: UUID
  product_bundle_ids: string[]
}

/**
 * Represents the mapping between a quiz and its form steps (the "playlist")
 */
export interface QuizFormStepMapping {
  quiz_id: UUID
  form_step_id: UUID
  step_order: number
}

/**
 * Represents the mapping between a form step and a progress step for a quiz
 */
export interface StepProgressMapping {
  quiz_id: UUID
  form_step_id: UUID
  progress_step_id: UUID
}

/**
 * The definitive, fully-hydrated Quiz object
 * This is the main data structure components will work with
 */
export interface FullQuiz extends Quiz {
  progressSteps: ProgressStep[]
  formSteps: QuizFormStep[]
  quizFormStepMapping: QuizFormStepMapping[]
  stepProgressMapping: StepProgressMapping[]
}

// =================================================================================
// JSON FILE STRUCTURE
// =================================================================================

/**
 * Structure of the quiz.json file stored in the repository
 */
export interface QuizFileStructure {
  quizzes: FullQuiz[]
  templates?: FormStep[] // Optional: reusable template steps
  metadata?: {
    version: string
    lastUpdated: string
  }
}

// =================================================================================
// CHANGE TRACKING TYPES (for local state management)
// =================================================================================

/**
 * Local form step that hasn't been saved yet (has temporary ID)
 */
export interface LocalFormStep extends Omit<QuizFormStep, 'id'> {
  id: string // Temporary ID like "temp-1234567890-abc123"
  progressStepId: string // Track which progress step this belongs to
}

/**
 * Template step that was added to a quiz (cloned from template)
 */
export interface AddedTemplateStep extends QuizFormStep {
  progressStepId: string // Track which progress step this belongs to
}

/**
 * Form step that has been updated locally
 */
export interface UpdatedFormStep {
  id: string
  title: string
  heading1: string | null
  subtext: string | null
  render_condition?: RenderCondition | null
  questions?: Question[]
}

/**
 * Reorder operation for moving a step
 */
export interface ReorderOperation {
  formStepId: string
  newStepOrder: number
  newProgressStepId: string
  oldProgressStepId: string
}

/**
 * Deleted form step tracking
 */
export interface DeletedFormStep {
  id: string
  progressStepId: string
  stepOrder: number
}

// =================================================================================
// API REQUEST/RESPONSE TYPES
// =================================================================================

/**
 * Batch save request payload
 */
export interface BatchSaveRequest {
  newFormSteps: LocalFormStep[]
  addedTemplateSteps: AddedTemplateStep[]
  updatedFormSteps: UpdatedFormStep[]
  reorderOperations: ReorderOperation[]
  deletedFormStepIds: string[]
  // Progress step operations
  newProgressSteps?: (Omit<ProgressStep, 'id' | 'quiz_id'> & { tempId?: string })[]
  updatedProgressSteps?: Partial<ProgressStep> & { id: string }[]
  reorderProgressOperations?: { progressStepId: string; newOrder: number }[]
}

/**
 * Create quiz request payload
 */
export interface CreateQuizRequest {
  name: string
  description?: string
  productBundleIds: string[]
  organizationId: string
}

/**
 * Question form data (for create/edit forms)
 */
export interface QuestionFormData {
  slug: string
  type: QuestionType
  question: string
  display_question: string
  placeholder?: string
  is_required: boolean
  api_type: string
  options: string[]
  validation: string[]
  // Marketing question fields
  image?: string
  before_image?: string
  after_image?: string
  quote?: string
}

/**
 * Form step creation data
 */
export interface FormStepCreationData {
  title: string
  id: string
  heading1?: string | null
  questions?: Question[]
  marketingQuestion?: {
    type: 'MARKETING' | 'BEFORE_AFTER'
  }
  templateStep?: FormStep
}

// =================================================================================
// ERROR TYPES
// =================================================================================

/**
 * Quiz service error types
 */
export type QuizErrorType = 
  | 'repo_not_found' 
  | 'file_not_found' 
  | 'permission_error'
  | 'network_error' 
  | 'conflict_error' 
  | 'validation_error'
  | 'unknown_error'

/**
 * Quiz service error structure
 */
export interface QuizServiceError {
  type: QuizErrorType
  message: string
  statusCode?: number
}

// =================================================================================
// STORE TYPES
// =================================================================================

/**
 * Quiz store feedback type
 */
export interface QuizStoreFeedback {
  type: 'success' | 'error' | null
  message: string | null
}

/**
 * Quiz store state interface
 */
export interface QuizStoreState {
  // Data
  originalData: QuizFileStructure | null
  data: QuizFileStructure | null // Draft state
  currentQuiz: FullQuiz | null
  quizzes: FullQuiz[] // Filtered by organization
  
  // Metadata
  sha: string | null
  isLoading: boolean
  error: QuizServiceError | null
  hasPendingChanges: boolean
  
  // Feedback
  feedback: QuizStoreFeedback
}

// =================================================================================
// UTILITY TYPES
// =================================================================================

/**
 * Type guard to check if a question type requires options
 */
export const OPTION_TYPES: QuestionType[] = [
  'SINGLESELECT',
  'MULTISELECT',
  'DROPDOWN',
  'CHECKBOX'
]

/**
 * Type guard to check if a question is a special type
 */
export const SPECIAL_QUESTION_TYPES: QuestionType[] = [
  'MARKETING',
  'BEFORE_AFTER'
]

/**
 * Helper type for question type configuration
 */
export interface QuestionTypeConfig {
  value: QuestionType
  label: string
  apiType: string
}

/**
 * Available question type configurations
 */
export const QUESTION_TYPE_CONFIGS: QuestionTypeConfig[] = [
  { value: "SINGLESELECT", label: "Single Select", apiType: "SINGLESELECT" },
  { value: "MULTISELECT", label: "Multi Select", apiType: "MULTISELECT" },
  { value: "DROPDOWN", label: "Dropdown", apiType: "TEXT" },
  { value: "TEXT", label: "Text Input", apiType: "TEXT" },
  { value: "NUMBER", label: "Number Input", apiType: "TEXT" },
  { value: "EMAIL", label: "Email Input", apiType: "TEXT" },
  { value: "TEL", label: "Phone Input", apiType: "TEXT" },
  { value: "TEXTAREA", label: "Textarea", apiType: "TEXT" },
  { value: "FILE_INPUT", label: "File Upload", apiType: "FILE" },
  { value: "CHECKBOX", label: "Checkbox", apiType: "SINGLESELECT" },
  { value: "MARKETING", label: "Marketing", apiType: "MARKETING" },
  { value: "BEFORE_AFTER", label: "Before/After", apiType: "BEFORE_AFTER" },
]

/**
 * Validation rule configurations
 */
export const VALIDATION_RULE_CONFIGS = [
  { value: "required", label: "Required" },
  { value: "email", label: "Email Format" },
  { value: "phone", label: "Phone Format" },
  { value: "phonePrefix", label: "Default Phone Prefix" },
  { value: "pattern", label: "Pattern (Regex)" }
] as const

/**
 * Available validation rules by question type
 */
export const VALIDATION_RULES_BY_TYPE: Record<QuestionType, ValidationRuleType[]> = {
  TEXT: ['required', 'pattern'],
  TEXTAREA: ['required', 'pattern'],
  EMAIL: ['required', 'email'],
  TEL: ['required', 'phone', 'phonePrefix'],
  NUMBER: ['required'],
  FILE_INPUT: ['required'],
  MULTISELECT: ['required'],
  SINGLESELECT: ['required'],
  DROPDOWN: ['required'],
  CHECKBOX: ['required'],
  PERFECT: ['required'],
  MARKETING: [],
  BEFORE_AFTER: [],
}




