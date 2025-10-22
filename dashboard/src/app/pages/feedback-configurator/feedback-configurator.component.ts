import {Component, inject, type OnInit, signal, computed, ChangeDetectionStrategy} from "@angular/core"
import {
  FormControl,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  NonNullableFormBuilder
} from "@angular/forms"
import {CdkDrag, type CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray} from "@angular/cdk/drag-drop"
import {FeedbackService} from "../../feedback.service";

export type FeedbackQuestion = {
  id?: number
  question: string
  type: "text" | "choice" | "rating"
  required: boolean
  placeholder?: string
  options?: string[]
  minRating?: number
  maxRating?: number
  ratingLabels?: string
  order: number
}

@Component({
  selector: "app-admin-dashboard",
  templateUrl: "./feedback-configurator.component.html",
  styleUrls: ["./feedback-configurator.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CdkDropList,
    CdkDragHandle,
    CdkDrag
  ]
})
export class FeedbackConfiguratorComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder)
  private readonly feedbackService = inject(FeedbackService)

  // State signals
  readonly questions = signal<FeedbackQuestion[]>([])
  readonly showQuestionEditor = signal(false)
  readonly editingIndex = signal(-1)
  readonly isPreviewMode = signal(false)

  // Form configuration signals
  readonly formTitle = signal("Willkommen am")
  readonly formSubtitle = signal("Tag der offenen Tür!")

  // Preview mode signals
  readonly previewQuestionIndex = signal(0)
  readonly previewAnswers = signal<Record<number, string>>({})

  // Reactive forms
  readonly configForm = this.fb.group({
    title: ['Willkommen am'],
    subtitle: ['Tag der offenen Tür!']
  })

  questionForm = this.createQuestionForm()

  // Computed values
  readonly currentPreviewQuestion = computed(() => {
    const qs = this.questions()
    const index = this.previewQuestionIndex()
    return qs.length > 0 && index < qs.length ? qs[index] : undefined
  })

  readonly currentPreviewAnswer = computed(() =>
    this.previewAnswers()[this.previewQuestionIndex()] || ""
  )

  readonly previewProgressPercentage = computed(() => {
    const total = this.questions().length
    return total > 0 ? Math.round((this.previewQuestionIndex() / total) * 100) : 0
  })

  get optionsArray(): FormArray<FormControl<string>> {
    return this.questionForm.get("options") as FormArray<FormControl<string>>
  }

  async ngOnInit(): Promise<void> {
    await this.loadQuestions()
  }

  createQuestionForm(): FormGroup<{
    question: FormControl<string>
    type: FormControl<"text" | "choice" | "rating">
    required: FormControl<boolean>
    placeholder: FormControl<string>
    options: FormArray<FormControl<string>>
    minRating: FormControl<number>
    maxRating: FormControl<number>
    ratingLabels: FormControl<string>
  }> {
    return this.fb.group({
      question: ['', Validators.required],
      type: this.fb.control<"text" | "choice" | "rating">('text'),
      required: [true],
      placeholder: ['Enter your answer'],
      options: this.fb.array<FormControl<string>>([]),
      minRating: [0],
      maxRating: [5],
      ratingLabels: ['Poor, Average, Excellent'],
    })
  }

  async loadQuestions(): Promise<void> {
    const fetchedQuestions = await this.feedbackService.getAllFeedbackQuestions()
    this.questions.set(fetchedQuestions)
  }

  addNewQuestion(): void {
    this.editingIndex.set(-1)
    this.questionForm = this.createQuestionForm()
    this.showQuestionEditor.set(true)
  }

  editQuestion(index: number): void {
    const question = this.questions()[index]
    this.editingIndex.set(index)
    this.optionsArray.clear()

    this.questionForm.patchValue({
      question: question.question,
      type: question.type,
      required: question.required,
      placeholder: question.placeholder || "Enter your answer",
      minRating: question.minRating ?? 0,
      maxRating: question.maxRating ?? 5,
      ratingLabels: question.ratingLabels || "Poor, Average, Excellent",
    })

    // Add options for choice type
    if (question.type === 'choice') {
      const options = question.options?.length ? question.options : ['Option 1', 'Option 2']
      options.forEach(option => this.optionsArray.push(this.fb.control(option)))
    }

    this.showQuestionEditor.set(true)
  }

  saveQuestion(): void {
    if (this.questionForm.invalid) return

    const formValue = this.questionForm.getRawValue()
    const currentQuestions = this.questions()
    const currentEditingIndex = this.editingIndex()

    const question: FeedbackQuestion = {
      question: formValue.question,
      type: formValue.type,
      required: formValue.required,
      placeholder: formValue.placeholder,
      order: currentEditingIndex >= 0
        ? currentQuestions[currentEditingIndex].order
        : currentQuestions.length
    }

    // Include ID if editing
    if (currentEditingIndex >= 0 && currentQuestions[currentEditingIndex].id !== undefined) {
      question.id = currentQuestions[currentEditingIndex].id
    }

    // Add type-specific properties
    if (formValue.type === "choice") {
      question.options = formValue.options.filter(opt => opt.trim() !== '')
    } else if (formValue.type === "rating") {
      question.minRating = formValue.minRating
      question.maxRating = formValue.maxRating
      question.ratingLabels = formValue.ratingLabels
    }

    this.questions.update(questions => {
      const updated = [...questions]
      if (currentEditingIndex >= 0) {
        updated[currentEditingIndex] = question
      } else {
        updated.push(question)
      }
      return updated
    })

    this.closeQuestionEditor()
  }

  closeQuestionEditor(): void {
    this.showQuestionEditor.set(false)
    this.editingIndex.set(-1)
  }

  deleteQuestion(index: number): void {
    if (!confirm("Are you sure you want to delete this question?")) return

    this.questions.update(questions =>
      questions
        .filter((_, i) => i !== index)
        .map((q, idx) => ({ ...q, order: idx }))
    )

    // Reset preview if needed
    const currentQuestions = this.questions()
    const currentIndex = this.previewQuestionIndex()

    if (currentQuestions.length === 0) {
      this.previewQuestionIndex.set(0)
    } else if (currentIndex >= currentQuestions.length) {
      this.previewQuestionIndex.set(currentQuestions.length - 1)
    }
  }

  addOption(): void {
    let counter = this.optionsArray.length + 1
    let uniqueValue = `Option ${counter}`

    while (this.optionsArray.controls.some(control => control.value.trim() === uniqueValue)) {
      counter++
      uniqueValue = `Option ${counter}`
    }

    this.optionsArray.push(this.fb.control(uniqueValue))
  }

  removeOption(index: number): void {
    if (this.optionsArray.length > 1) {
      this.optionsArray.removeAt(index)
    }
  }

  hasDuplicateOption(index: number): boolean {
    const currentValue = this.optionsArray.at(index).value.trim()
    if (!currentValue) return false

    return this.optionsArray.controls.some((control, i) =>
      i !== index && control.value.trim() === currentValue
    )
  }

  hasDuplicateOptions(): boolean {
    if (this.questionForm.get('type')?.value !== 'choice') return false

    const options = this.optionsArray.controls.map(c => c.value.trim()).filter(Boolean)
    return options.length !== new Set(options).size
  }

  drop(event: CdkDragDrop<string[]>): void {
    this.questions.update(questions => {
      const updated = [...questions]
      moveItemInArray(updated, event.previousIndex, event.currentIndex)
      return updated.map((q, idx) => ({ ...q, order: idx }))
    })
  }

  togglePreview(): void {
    this.isPreviewMode.update(mode => !mode)

    if (this.isPreviewMode()) {
      this.previewQuestionIndex.set(0)
      this.previewAnswers.set({})
    }
  }

  async saveQuestions(): Promise<void> {
    const { title, subtitle } = this.configForm.getRawValue()
    if (title) this.formTitle.set(title)
    if (subtitle) this.formSubtitle.set(subtitle)

    await this.feedbackService.saveFeedbackQuestions(this.questions())
    alert("Changes saved successfully!")
  }

  nextPreviewQuestion(): void {
    const currentIndex = this.previewQuestionIndex()
    const currentQuestions = this.questions()

    this.previewAnswers.update(answers => ({
      ...answers,
      [currentIndex]: this.currentPreviewAnswer()
    }))

    if (currentIndex < currentQuestions.length - 1) {
      this.previewQuestionIndex.set(currentIndex + 1)
    } else {
      alert("Form preview completed! In the real form, this would submit the answers.")
      this.previewQuestionIndex.set(0)
      this.previewAnswers.set({})
    }
  }

  previousPreviewQuestion(): void {
    const currentIndex = this.previewQuestionIndex()

    if (currentIndex > 0) {
      this.previewAnswers.update(answers => ({
        ...answers,
        [currentIndex]: this.currentPreviewAnswer()
      }))

      this.previewQuestionIndex.set(currentIndex - 1)
    }
  }

  selectPreviewOption(option: string): void {
    this.previewAnswers.update(answers => ({
      ...answers,
      [this.previewQuestionIndex()]: option
    }))
  }

  selectPreviewRating(rating: number): void {
    this.previewAnswers.update(answers => ({
      ...answers,
      [this.previewQuestionIndex()]: rating.toString()
    }))
  }

  getPreviewRatingRange(): number[] {
    const question = this.currentPreviewQuestion()
    if (!question) return [1, 2, 3, 4, 5]

    const min = question.minRating ?? 1
    const max = question.maxRating ?? 5
    return Array.from({ length: max - min + 1 }, (_, i) => min + i)
  }

  getPreviewRatingLabel(rating: number): string {
    const question = this.currentPreviewQuestion()
    if (!question?.ratingLabels) return rating.toString()

    const labels = question.ratingLabels.split(",").map(label => label.trim())
    const min = question.minRating ?? 1
    const index = rating - min

    return (index >= 0 && index < labels.length) ? labels[index] : rating.toString()
  }

  updatePreviewAnswer(value: string): void {
    this.previewAnswers.update(answers => ({
      ...answers,
      [this.previewQuestionIndex()]: value
    }))
  }
}
