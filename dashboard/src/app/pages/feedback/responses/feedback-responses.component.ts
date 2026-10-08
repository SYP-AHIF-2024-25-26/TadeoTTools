import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FeedbackService } from '@/core/services/feedback.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { downloadFile } from '@/shared/utils/utils';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
import {
  FeedbackQuestion,
  FeedbackQuestionSummary,
  FeedbackResponses,
} from '@/shared/models/types';

type Bar = { label: string; count: number; share: number; other?: boolean };

@Component({
  selector: 'app-feedback-responses',
  templateUrl: './feedback-responses.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, DeletePopupComponent],
})
export class FeedbackResponsesComponent {
  private feedbackService = inject(FeedbackService);
  private toast = inject(ToastService);

  responses = input<FeedbackResponses | null>(null);
  // The saved questions, for the rating labels.
  questions = input<FeedbackQuestion[]>([]);
  loading = input<boolean>(false);
  failed = input<boolean>(false);

  reload = output<void>();
  showQuestions = output<void>();

  confirmingDelete = signal(false);
  deleting = signal(false);
  downloading = signal(false);

  protected readonly word = word;

  // Each question with its bars worked out once per load.
  blocks = computed(() =>
    (this.responses()?.questions ?? []).map((summary) => ({
      summary,
      bars: this.bars(summary),
    }))
  );

  typeLabel(summary: FeedbackQuestionSummary): string {
    switch (summary.type) {
      case 'Rating':
        return 'Rating';
      case 'SingleChoice':
        return 'Single choice';
      case 'MultipleChoice':
        return 'Multiple choice';
      default:
        return 'Text';
    }
  }

  private bars(summary: FeedbackQuestionSummary): Bar[] {
    const total = summary.answeredCount;
    const share = (count: number) => (total > 0 ? count / total : 0);
    const labels = this.ratingLabels(summary);

    const bars: Bar[] = summary.counts.map((c, i) => ({
      label:
        summary.type === 'Rating' && labels[i]
          ? `${c.value} · ${labels[i]}`
          : c.value,
      count: c.count,
      share: share(c.count),
    }));
    if (summary.otherCount > 0) {
      bars.push({
        label:
          summary.type === 'Rating'
            ? 'Other values'
            : 'Other / earlier options',
        count: summary.otherCount,
        share: share(summary.otherCount),
        other: true,
      });
    }
    return bars;
  }

  private ratingLabels(summary: FeedbackQuestionSummary): string[] {
    const question = this.questions().find((q) => q.id === summary.questionId);
    if (!question?.ratingLabels?.trim()) return [];
    // Same mapping as the visitor app: the n-th label belongs to min + n.
    return question.ratingLabels.split(',').map((l) => l.trim());
  }

  async downloadCsv(): Promise<void> {
    if (this.downloading()) return;
    this.downloading.set(true);
    try {
      const blob = await this.feedbackService.getFeedbackQuestionAnswersFile();
      downloadFile(blob, 'feedback_answers.csv');
    } catch (error) {
      console.error('Failed to download file:', error);
      this.toast.error(
        errorText(error, 'The feedback answers could not be downloaded.')
      );
    } finally {
      this.downloading.set(false);
    }
  }

  deleteMessage(): string {
    const r = this.responses();
    if (!r) return '';
    const n = r.questions.length;
    return (
      'This removes every submitted feedback form, so the next open day starts at zero. ' +
      `The ${n} ${word(n, 'question stays', 'questions stay')} as ${word(n, 'it is', 'they are')}. ` +
      "This can't be undone, so download the CSV first if you want to keep the answers."
    );
  }

  async deleteAll(): Promise<void> {
    if (this.deleting()) return;
    this.deleting.set(true);
    try {
      await this.feedbackService.deleteFeedbackResponses();
      this.confirmingDelete.set(false);
      this.toast.success('All feedback responses deleted.');
      this.reload.emit();
    } catch (error) {
      console.error('Failed to delete feedback responses', error);
      this.toast.error(
        errorText(error, 'The feedback responses could not be deleted.')
      );
    } finally {
      this.deleting.set(false);
    }
  }
}

function word(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}
