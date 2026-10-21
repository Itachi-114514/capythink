'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Capybara } from '@/components/Capybara';
import { computeQuiz } from '@/lib/scoring';
import { recommendBooks } from '@/lib/recommend';
import { addAttempt, getExcludedBookIds } from '@/lib/archive';
import { DRAFT_STORAGE_KEY, RESULT_STORAGE_KEY } from '@/lib/storage';

const SCALE = [
  { label: '不同意', value: -1 },
  { label: '有点不同意', value: -0.33 },
  { label: '有点同意', value: 0.33 },
  { label: '同意', value: 1 },
];

export interface QuizItemView {
  id: string;
  text: string;
  dimName: string;
  dimIndex: number;
}

export interface QuizPracticalView {
  id: string;
  prompt: string;
  hint?: string;
  options: { text: string }[];
}

interface Props {
  items: QuizItemView[];
  practicals: QuizPracticalView[];
}

interface Draft {
  answers: Record<string, number | null>;
  index: number;
  phase: 'items' | 'practical';
}

export function QuizRunner({ items, practicals }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [phase, setPhase] = useState<'items' | 'practical'>('items');
  const [index, setIndex] = useState(0);
  const [restored, setRestored] = useState(false);
  const [ready, setReady] = useState(false);

  // 草稿只存在浏览器里，不上传
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Draft;
        if (draft && typeof draft === 'object') {
          setAnswers(draft.answers ?? {});
          setIndex(Math.min(Math.max(draft.index ?? 0, 0), items.length - 1));
          setPhase(draft.phase === 'practical' ? 'practical' : 'items');
          setRestored(true);
        }
      }
    } catch {
      // 坏数据直接忽略
    }
    setReady(true);
  }, [items.length]);

  const item = items[index];
  const isLastItem = index === items.length - 1;
  const currentAnswer = answers[item.id];

  const persist = useCallback(
    (next: Record<string, number | null>, nextIndex: number, nextPhase: 'items' | 'practical') => {
      try {
        window.localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({ answers: next, index: nextIndex, phase: nextPhase }),
        );
      } catch {
        // 隐私模式或配额满了，忽略
      }
    },
    [],
  );

  const choose = useCallback(
    (value: number) => {
      const next = { ...answers, [item.id]: value };
      setAnswers(next);
      persist(next, index, phase);
    },
    [answers, item.id, index, phase, persist],
  );

  const advance = useCallback(() => {
    if (index < items.length - 1) {
      setIndex(index + 1);
    } else {
      setPhase('practical');
    }
  }, [index, items.length]);

  const skip = useCallback(() => {
    const next = { ...answers, [item.id]: null };
    setAnswers(next);
    persist(next, Math.min(index + 1, items.length), index === items.length - 1 ? 'practical' : 'items');
    advance();
  }, [answers, item.id, index, items.length, persist, advance]);

  const next = useCallback(() => {
    advance();
  }, [advance]);

  const back = useCallback(() => {
    if (phase === 'practical') {
      setPhase('items');
      setIndex(items.length - 1);
      return;
    }
    if (index > 0) setIndex(index - 1);
  }, [phase, index, items.length]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (phase !== 'items') return;
      const number = Number(event.key);
      if (number >= 1 && number <= 4) {
        event.preventDefault();
        choose(SCALE[number - 1].value);
        return;
      }
      if (event.key === 'Enter' && answers[item.id] !== undefined) {
        event.preventDefault();
        next();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, choose, next, answers, item.id]);

  const allItemsAnswered = useMemo(
    () => items.every((entry) => entry.id in answers),
    [items, answers],
  );
  const practicalsAnswered = useMemo(
    () => practicals.every((entry) => typeof answers[entry.id] === 'number'),
    [practicals, answers],
  );

  function submit() {
    const result = computeQuiz(answers);
    const savedAt = new Date().toISOString();
    // 正在读 / 已经读完的书不再进入这次推荐
    const recommendations = recommendBooks(
      result.scores,
      result.readingLevel,
      result.weeklyHours,
      result.undetermined,
      getExcludedBookIds(),
    );

    try {
      window.localStorage.setItem(
        RESULT_STORAGE_KEY,
        JSON.stringify({ result, recommendations, savedAt }),
      );
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // 存不进去就在结果页提示重新做一次
    }

    addAttempt({ savedAt, result, recommendations });
    router.push('/result');
  }

  function saveAndExit() {
    persist(answers, phase === 'practical' ? items.length : index, phase);
    router.push('/');
  }

  if (!ready) {
    return <p className="muted">正在读你上次的进度…</p>;
  }

  const progress = phase === 'practical' ? 100 : Math.round(((index + 1) / items.length) * 100);

  return (
    <div>
      <div className="quiz-top">
        <div className="quiz-progress">
          <span className="quiz-step">
            {phase === 'practical' ? '最后两问' : `第 ${index + 1} / ${items.length} 题`}
          </span>
          <span className="quiz-track">
            <span className="quiz-fill" style={{ width: `${progress}%` }} />
          </span>
          <span>{progress}%</span>
        </div>
        <button type="button" className="save-exit" onClick={saveAndExit}>
          保存并退出
        </button>
      </div>

      {restored ? (
        <p className="notice mb-3">
          上次做到第 {Math.min(index + 1, items.length)} 题，已经帮你接着放好了。进度只存在这台设备上。
        </p>
      ) : null}

      <div className="quiz-stage">
        <div className="quiz-main">
          {phase === 'items' ? (
            <>
              <div className="kicker">
                维度 {String(item.dimIndex + 1).padStart(2, '0')} · {item.dimName}
              </div>
              <h1 className="quiz-q">{item.text}</h1>
              <p className="quiz-hint">按第一反应选。没有正确答案，也没有「更好」的立场。</p>

              <div className="scale scale-4" role="group" aria-label={item.text}>
                {SCALE.map((option, optionIndex) => (
                  <button
                    key={option.label}
                    type="button"
                    className={`scale-btn ${currentAnswer === option.value ? 'selected' : ''}`}
                    onClick={() => choose(option.value)}
                    aria-pressed={currentAnswer === option.value}
                  >
                    <span className="scale-key">{optionIndex + 1}</span>
                    {option.label}
                  </button>
                ))}
              </div>

              <button type="button" className="skip-link" onClick={skip}>
                这题太难了，水豚跳过 🦦
              </button>

              <div className="quiz-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={back}
                  disabled={index === 0}
                >
                  上一题
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={next}
                  disabled={currentAnswer === undefined}
                >
                  {isLastItem ? '答完了，去阅读习惯' : '下一题'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="kicker">最后两问 · 阅读习惯</div>
              <h1 className="quiz-q">这一周，你能拿出多少时间？</h1>
              <p className="quiz-hint">这两题不影响你的哲学状态，只影响书单难度。</p>

              <div className="quiz-options">
                {practicals.map((question) => (
                  <div className="practical-block" key={question.id}>
                    <div className="likert-text">{question.prompt}</div>
                    {question.hint ? <p className="hint">{question.hint}</p> : null}
                    <div className="practical-options">
                      {question.options.map((option, optionIndex) => (
                        <button
                          key={option.text}
                          type="button"
                          className={`option ${answers[question.id] === optionIndex ? 'selected' : ''}`}
                          onClick={() => {
                            const nextAnswers = { ...answers, [question.id]: optionIndex };
                            setAnswers(nextAnswers);
                            persist(nextAnswers, items.length, 'practical');
                          }}
                        >
                          <span className="option-key">{String.fromCharCode(65 + optionIndex)}</span>
                          <span>{option.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="quiz-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={back}>
                  上一题
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={submit}
                  disabled={!allItemsAnswered || !practicalsAnswered}
                >
                  {!allItemsAnswered
                    ? '还有题没答'
                    : !practicalsAnswered
                      ? '还有两问没选'
                      : '看结果'}
                </button>
              </div>
            </>
          )}
        </div>

        <aside className="quiz-capy">
          <Capybara />
        </aside>
      </div>
    </div>
  );
}
