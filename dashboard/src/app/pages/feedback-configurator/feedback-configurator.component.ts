import {Component, inject, type OnInit, signal, computed, effect} from "@angular/core"
import {
  FormBuilder,
  type FormGroup,
  type FormArray,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from "@angular/forms"
import {CdkDrag, type CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray} from "@angular/cdk/drag-drop"
import {NgForOf, NgIf} from "@angular/common";
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
  ratingLabels?: string,
  order: number
}

@Component({
  selector: "app-admin-dashboard",
  templateUrl: "./feedback-configurator.component.html",
  styleUrls: ["./feedback-configurator.component.css"],
  imports: [
    FormsModule,
    CdkDropList,
    ReactiveFormsModule,
    CdkDragHandle,
    NgIf,
    NgForOf,
    CdkDrag
  ]
})
export class FeedbackConfiguratorComponent implements OnInit {
  questions = signal<FeedbackQuestion[]>([])
  questionForm!: FormGroup
  showQuestionEditor = signal<boolean>(false)
  editingIndex = signal<number>(-1)
  isPreviewMode = signal<boolean>(false)
  formTitle = signal<string>("Willkommen am")
  formSubtitle = signal<string>("Tag der offenen Tür!")

  // Preview mode properties
  previewQuestionIndex = signal<number>(0)
  previewAnswer = signal<string>("")
  previewAnswers = signal<Record<number, string>>({})

  private fb: FormBuilder = inject(FormBuilder)
  private feedbackService = inject(FeedbackService)

  constructor() {
    this.questionForm = this.createQuestionForm()
  }

  async ngOnInit(): Promise<void> {
    await this.loadQuestions()
  }

  get optionsArray(): FormArray {
    return this.questionForm.get("options") as FormArray
  }

  currentPreviewQuestion = computed(() => {
    return this.questions().length > 0 ? this.questions()[this.previewQuestionIndex()] : undefined
  })

  previewProgressPercentage = computed(() => {
    return this.questions().length > 0 ? Math.round((this.previewQuestionIndex() / this.questions().length) * 100) : 0
  })

  createQuestionForm(): FormGroup {
    return this.fb.group({
      question: ["", Validators.required],
      type: ["text"],
      required: [true],
      placeholder: ["Enter your answer"],
      options: this.fb.array([this.fb.control("Option 1"), this.fb.control("Option 2")]),
      minRating: [0],
      maxRating: [5],
      ratingLabels: ["Poor, Average, Excellent"],
    })
  }

  async loadQuestions(): Promise<void> {
    const fetchedQuestions = await this.feedbackService.getAllFeedbackQuestions();
    this.questions.set(fetchedQuestions);
  }

  addNewQuestion(): void {
    this.editingIndex.set(-1)
    this.questionForm = this.createQuestionForm()
    this.showQuestionEditor.set(true)
  }

  editQuestion(index: number): void {
    this.editingIndex.set(index)
    const question = this.questions()[index]

    // Clear the option's array
    while (this.optionsArray.length) {
      this.optionsArray.removeAt(0)
    }

    // Add current options if they exist
    if (question.options && question.options.length > 0) {
      question.options.forEach((option) => {
        this.optionsArray.push(this.fb.control(option))
      })
    } else {
      // Add default options if none exist
      this.optionsArray.push(this.fb.control("Option 1"))
      this.optionsArray.push(this.fb.control("Option 2"))
    }

    this.questionForm.patchValue({
      question: question.question,
      type: question.type,
      required: question.required,
      placeholder: question.placeholder || "Enter your answer",
      minRating: question.minRating || 0,
      maxRating: question.maxRating || 5,
      ratingLabels: question.ratingLabels || "Poor, Average, Excellent",
    })

    this.showQuestionEditor.set(true)
  }

  saveQuestion(): void {
    if (this.questionForm.invalid) return;

    const formValue = this.questionForm.value;
    const currentQuestions = this.questions();
    const currentEditingIndex = this.editingIndex();

    const question: FeedbackQuestion = {
      question: formValue.question,
      type: formValue.type,
      required: formValue.required,
      placeholder: formValue.placeholder,
      order: currentEditingIndex >= 0 ?
        currentQuestions[currentEditingIndex].order :
        currentQuestions.length
    }

    // Only include ID if we're editing an existing question
    if (currentEditingIndex >= 0) {
      question.id = currentQuestions[currentEditingIndex].id;
    }

    // Add type-specific properties
    if (formValue.type === "choice") {
      question.options = this.optionsArray.controls.map((control) => control.value)
    } else if (formValue.type === "rating") {
      question.minRating = formValue.minRating
      question.maxRating = formValue.maxRating
      question.ratingLabels = formValue.ratingLabels
    }

    if (currentEditingIndex >= 0) {
      // Update existing question
      this.questions.update(questions => {
        const updatedQuestions = [...questions];
        updatedQuestions[currentEditingIndex] = question;
        return updatedQuestions;
      });
    } else {
      // Add a new question
      this.questions.update(questions => [...questions, question]);
    }

    this.closeQuestionEditor()
    this.updateQuestionOrder()
  }

  closeQuestionEditor(): void {
    this.showQuestionEditor.set(false)
    this.editingIndex.set(-1)
  }

  deleteQuestion(index: number): void {
    if (confirm("Are you sure you want to delete this question?")) {
      this.questions.update(questions => {
        const updatedQuestions = [...questions];
        updatedQuestions.splice(index, 1);
        return updatedQuestions;
      });

      // Reset preview if we're deleting the current preview question
      const currentQuestions = this.questions();
      if (this.previewQuestionIndex() >= currentQuestions.length) {
        this.previewQuestionIndex.set(Math.max(0, currentQuestions.length - 1));
      }
    }
  }

  addOption(): void {
    this.optionsArray.push(this.fb.control(`Option ${this.optionsArray.length + 1}`))
  }

  removeOption(index: number): void {
    this.optionsArray.removeAt(index)
  }

  drop(event: CdkDragDrop<string[]>): void {
    this.questions.update(questions => {
      const updatedQuestions = [...questions];
      moveItemInArray(updatedQuestions, event.previousIndex, event.currentIndex);
      return updatedQuestions;
    });
    this.updateQuestionOrder();
  }

  togglePreview(): void {
    this.isPreviewMode.update(mode => !mode);

    if (this.isPreviewMode()) {
      // Reset preview state when entering preview mode
      this.previewQuestionIndex.set(0);
      this.previewAnswer.set(this.previewAnswers()[0] || "");
    }
  }

  async saveQuestions(): Promise<void> {
    await this.feedbackService.saveFeedbackQuestions(this.questions());

    alert("Changes saved successfully!")
  }

  // Preview mode methods
  nextPreviewQuestion(): void {
    // Save the current answer
    const currentIndex = this.previewQuestionIndex();
    const currentAnswer = this.previewAnswer();

    this.previewAnswers.update(answers => {
      const updatedAnswers = {...answers};
      updatedAnswers[currentIndex] = currentAnswer;
      return updatedAnswers;
    });

    const currentQuestions = this.questions();
    if (currentIndex < currentQuestions.length - 1) {
      // Move to the next question
      const nextIndex = currentIndex + 1;
      this.previewQuestionIndex.set(nextIndex);
      // Load saved answer if exists
      this.previewAnswer.set(this.previewAnswers()[nextIndex] || "");
    } else {
      // Show a completion message for preview
      alert("Form preview completed! In the real form, this would submit the answers.");
      // Reset preview
      this.previewQuestionIndex.set(0);
      this.previewAnswer.set(this.previewAnswers()[0] || "");
    }
  }

  previousPreviewQuestion(): void {
    const currentIndex = this.previewQuestionIndex();
    if (currentIndex > 0) {
      // Save the current answer
      const currentAnswer = this.previewAnswer();

      this.previewAnswers.update(answers => {
        const updatedAnswers = {...answers};
        updatedAnswers[currentIndex] = currentAnswer;
        return updatedAnswers;
      });

      // Go to the previous question
      const prevIndex = currentIndex - 1;
      this.previewQuestionIndex.set(prevIndex);
      // Load saved answer
      this.previewAnswer.set(this.previewAnswers()[prevIndex] || "");
    }
  }

  selectPreviewOption(option: string): void {
    this.previewAnswer.set(option);
  }

  selectPreviewRating(rating: number): void {
    this.previewAnswer.set(rating.toString());
  }

  getPreviewRatingRange(): number[] {
    const question = this.currentPreviewQuestion()
    if (!question) return [1, 2, 3, 4, 5]

    const min = question.minRating || 1
    const max = question.maxRating || 5
    return Array.from({ length: max - min + 1 }, (_, i) => min + i)
  }

  getPreviewRatingLabel(rating: number): string {
    const question = this.currentPreviewQuestion()
    if (!question || !question.ratingLabels) return rating.toString()

    const labels = question.ratingLabels.split(",").map((label) => label.trim())
    const min = question.minRating || 1
    const index = rating - min

    if (index >= 0 && index < labels.length) {
      return labels[index]
    }

    return rating.toString()
  }

  updateQuestionOrder(): void {
    this.questions.update(questions => {
      return questions.map((question, index) => ({
        ...question,
        order: index
      }));
    });
  }
}
