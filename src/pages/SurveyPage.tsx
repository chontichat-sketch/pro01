import React, { useState, useEffect } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { CheckCircle2, Send, BarChart3 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SURVEY_QUESTIONS, RATING_LABELS } from '../constants/survey';

const STORAGE_KEY = 'training_survey_submitted_v1';

interface SurveyPageProps {
  onSwitchToDashboard: () => void;
}

export default function SurveyPage({ onSwitchToDashboard }: SurveyPageProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'true') {
        setSubmitted(true);
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const answeredCount = Object.keys(ratings).length;
  const allAnswered = answeredCount === SURVEY_QUESTIONS.length;

  const handleSelectRating = (questionId: string, score: number) => {
    setRatings((prev) => ({ ...prev, [questionId]: score }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: Record<string, unknown> = {
        q1: ratings.q1,
        q2: ratings.q2,
        q3: ratings.q3,
        q4: ratings.q4,
        q5: ratings.q5,
        createdAt: serverTimestamp(),
      };

      const trimmedComment = comment.trim().slice(0, 1000);
      if (trimmedComment.length > 0) {
        payload.comment = trimmedComment;
      }

      await addDoc(collection(db, 'responses'), payload);

      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // Ignore storage errors
      }
      setSubmitted(true);
    } catch (err) {
      setErrorMsg('ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      handleFirestoreError(err, OperationType.CREATE, 'responses');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            ขอบคุณสำหรับความคิดเห็น
          </h1>
          <p className="text-slate-600 text-base leading-relaxed mb-8">
            ระบบได้บันทึกผลการประเมินความพึงพอใจของคุณเรียบร้อยแล้ว
            (จำกัดการตอบ 1 ครั้งต่ออุปกรณ์)
          </p>
          <button
            type="button"
            onClick={onSwitchToDashboard}
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>ดูผลสรุปบน Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Compact Mobile-First Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate">
            แบบประเมินความพึงพอใจ
          </h1>
          <span className="font-mono-num text-sm font-semibold text-slate-600 shrink-0">
            {answeredCount}/{SURVEY_QUESTIONS.length} ข้อ
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6">
        <div className="mb-6">
          <p className="text-slate-600 text-sm leading-relaxed">
            กรุณาให้คะแนนความพึงพอใจในแต่ละด้าน (1 = น้อยที่สุด, 5 = มากที่สุด)
            ข้อมูลจะไม่ระบุตัวตนและแสดงผลบน Dashboard ทันที
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {SURVEY_QUESTIONS.map((q) => {
            const selected = ratings[q.id];
            return (
              <section
                key={q.id}
                className="bg-white border border-slate-200 rounded-2xl p-5"
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-slate-500">
                    ข้อที่ {q.number}
                  </span>
                  <h2 className="text-base font-semibold text-slate-900 mt-1 leading-snug">
                    {q.title}
                  </h2>
                </div>

                {/* Large Mobile Touch Targets: 1 to 5 */}
                <div
                  className="grid grid-cols-5 gap-2"
                  role="radiogroup"
                  aria-label={q.title}
                >
                  {[1, 2, 3, 4, 5].map((score) => {
                    const isSelected = selected === score;
                    return (
                      <button
                        key={score}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => handleSelectRating(q.id, score)}
                        className={`min-h-[54px] flex flex-col items-center justify-center rounded-xl border text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                          isSelected
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                        }`}
                      >
                        <span className="font-mono-num text-lg leading-none">
                          {score}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5 px-0.5">
                  <span>1 = น้อยที่สุด</span>
                  {selected ? (
                    <span className="font-semibold text-slate-900">
                      เลือก: {selected} ({RATING_LABELS[selected]})
                    </span>
                  ) : (
                    <span>5 = มากที่สุด</span>
                  )}
                </div>
              </section>
            );
          })}

          {/* Optional Comment */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5">
            <label
              htmlFor="survey-comment"
              className="block text-base font-semibold text-slate-900 mb-1"
            >
              ข้อเสนอแนะเพิ่มเติม (ไม่บังคับ)
            </label>
            <p className="text-xs text-slate-500 mb-3">
              สิ่งที่ประทับใจ หรือข้อเสนอแนะเพื่อการพัฒนาในครั้งถัดไป
            </p>
            <textarea
              id="survey-comment"
              rows={3}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="พิมพ์ข้อเสนอแนะของคุณที่นี่..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
            />
          </section>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={!allAnswered || submitting}
            className={`w-full min-h-[56px] rounded-xl font-semibold text-base inline-flex items-center justify-center gap-2 transition-colors ${
              allAnswered && !submitting
                ? 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
            <span>
              {submitting
                ? 'กำลังส่งข้อมูล...'
                : allAnswered
                ? 'ส่งแบบประเมิน'
                : `กรุณาตอบให้ครบ (${answeredCount}/${SURVEY_QUESTIONS.length})`}
            </span>
          </button>
        </form>
      </main>
    </div>
  );
}
