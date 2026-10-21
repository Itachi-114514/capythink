import { LIKERT_ITEMS, PRACTICAL_QUESTIONS } from '@data/questions';
import { DIMS, DIM_META } from '@/lib/types';
import { QuizRunner } from '@/components/QuizRunner';

export default function QuizPage() {
  const items = LIKERT_ITEMS.map((item) => ({
    id: item.id,
    text: item.text,
    dimName: DIM_META[item.dim].name,
    dimIndex: DIMS.indexOf(item.dim),
  }));

  const practicals = PRACTICAL_QUESTIONS.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    hint: question.hint,
    options: question.options.map((option) => ({ text: option.text })),
  }));

  return (
    <div className="wrap page">
      <div className="quiz">
        <QuizRunner items={items} practicals={practicals} />
      </div>
    </div>
  );
}
