import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import {
  Download,
  QrCode,
  Copy,
  Check,
  X,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  SURVEY_QUESTIONS,
  getSatisfactionLevel,
} from '../constants/survey';

interface SurveyResponseDoc {
  id: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  comment?: string;
  createdAt: Timestamp | null;
}

interface DashboardPageProps {
  onSwitchToSurvey: () => void;
}

export default function DashboardPage({ onSwitchToSurvey }: DashboardPageProps) {
  const [responses, setResponses] = useState<SurveyResponseDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const surveyUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/?view=survey`;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'responses'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: SurveyResponseDoc[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            q1: Number(data.q1) || 0,
            q2: Number(data.q2) || 0,
            q3: Number(data.q3) || 0,
            q4: Number(data.q4) || 0,
            q5: Number(data.q5) || 0,
            comment: typeof data.comment === 'string' ? data.comment : undefined,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
          };
        });
        setResponses(items);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'responses');
      }
    );

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const total = responses.length;
    if (total === 0) {
      return {
        total: 0,
        overallAvg: 0,
        questionAverages: SURVEY_QUESTIONS.map((q) => ({ ...q, avg: 0 })),
        comments: [] as SurveyResponseDoc[],
      };
    }

    const sums = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 };
    for (const r of responses) {
      sums.q1 += r.q1;
      sums.q2 += r.q2;
      sums.q3 += r.q3;
      sums.q4 += r.q4;
      sums.q5 += r.q5;
    }

    const questionAverages = SURVEY_QUESTIONS.map((q) => ({
      ...q,
      avg: sums[q.id] / total,
    }));

    const overallAvg =
      questionAverages.reduce((acc, item) => acc + item.avg, 0) /
      questionAverages.length;

    const comments = responses.filter((r) => r.comment && r.comment.trim().length > 0);

    return {
      total,
      overallAvg,
      questionAverages,
      comments,
    };
  }, [responses]);

  const overallLevel = getSatisfactionLevel(stats.overallAvg);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored
    }
  };

  const handleDownloadCsv = () => {
    if (responses.length === 0) return;

    const headers = [
      'ลำดับ',
      'เวลาที่ส่ง',
      'ข้อ 1 เนื้อหา',
      'ข้อ 2 วิทยากร',
      'ข้อ 3 สื่อและอุปกรณ์',
      'ข้อ 4 ระยะเวลา',
      'ข้อ 5 ภาพรวม',
      'ข้อเสนอแนะ',
    ];

    const rows = responses.map((r, index) => {
      const dateStr = r.createdAt
        ? r.createdAt.toDate().toLocaleString('th-TH')
        : '-';
      const escapedComment = (r.comment || '').replace(/"/g, '""');
      return [
        responses.length - index,
        `"${dateStr}"`,
        r.q1,
        r.q2,
        r.q3,
        r.q4,
        r.q5,
        `"${escapedComment}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `training-satisfaction-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 zones */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          <div className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            TrainingPulse
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              QR Code แบบสอบถาม
            </button>
            <button
              type="button"
              onClick={onSwitchToSurvey}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              เปิดหน้าแบบสอบถาม
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="md:hidden inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={responses.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด CSV</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Row: Projector-friendly large tabular numbers */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <p className="text-sm font-medium text-slate-500">
              จำนวนผู้ตอบแบบสอบถาม
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono-num text-5xl font-bold text-slate-900">
                {loading ? '—' : stats.total}
              </span>
              <span className="text-base font-medium text-slate-500">คน</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <p className="text-sm font-medium text-slate-500">
              คะแนนเฉลี่ยรวมทุกด้าน
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono-num text-5xl font-bold text-slate-900">
                {loading || stats.total === 0
                  ? '0.00'
                  : stats.overallAvg.toFixed(2)}
              </span>
              <span className="font-mono-num text-lg font-medium text-slate-400">
                / 5.00
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <p className="text-sm font-medium text-slate-500">
              ระดับความพึงพอใจ (เกณฑ์ 5 ระดับ)
            </p>
            <div className="mt-2 flex items-baseline gap-3">
              <span
                className={`text-4xl font-bold ${
                  stats.total === 0 ? 'text-slate-400' : overallLevel.colorClass
                }`}
              >
                {stats.total === 0 ? 'รอข้อมูล' : overallLevel.label}
              </span>
            </div>
          </div>
        </section>

        {/* Main Content Grid: Bar Chart + Latest Comments */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Bar Chart: Question Averages */}
          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  คะแนนเฉลี่ยรายข้อ
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  อัปเดตอัตโนมัติทันทีที่มีผู้ส่งคำตอบ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <QrCode className="w-4 h-4" />
                <span>แสดง QR Code</span>
              </button>
            </div>

            {stats.total === 0 && !loading ? (
              <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl">
                <p className="text-slate-600 font-medium mb-3">
                  ยังไม่มีผู้ตอบแบบสอบถามในขณะนี้
                </p>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  <span>เปิด QR Code ให้ผู้เข้าร่วมสแกน</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {stats.questionAverages.map((item) => {
                  const pct = Math.min(100, Math.max(0, (item.avg / 5) * 100));
                  const level = getSatisfactionLevel(item.avg);
                  return (
                    <div key={item.id}>
                      <div className="flex items-baseline justify-between gap-4 mb-2">
                        <span className="text-base font-semibold text-slate-800">
                          {item.number}. {item.shortLabel}
                        </span>
                        <div className="flex items-baseline gap-2 shrink-0">
                          <span className="font-mono-num text-xl font-bold text-slate-900">
                            {item.avg.toFixed(2)}
                          </span>
                          <span
                            className={`text-sm font-medium ${level.colorClass}`}
                          >
                            ({level.label})
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${level.barColorClass}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Latest Comments */}
          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  ข้อเสนอแนะล่าสุด
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  ความคิดเห็นจากผู้เข้าร่วมอบรม ({stats.comments.length} รายการ)
                </p>
              </div>
            </div>

            {stats.comments.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">
                  ยังไม่มีข้อเสนอแนะเพิ่มเติม
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {stats.comments.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/80"
                  >
                    <p className="text-base text-slate-800 leading-relaxed">
                      {item.comment}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono-num font-semibold text-slate-700">
                        คะแนนเฉลี่ย{' '}
                        {((item.q1 + item.q2 + item.q3 + item.q4 + item.q5) / 5).toFixed(1)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {item.createdAt
                          ? item.createdAt.toDate().toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'เมื่อสักครู่'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* QR Code Modal for Projector */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="QR Code สำหรับตอบแบบสอบถาม"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 md:p-8 relative">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              aria-label="ปิดหน้าต่าง"
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
              สแกนเพื่อประเมินความพึงพอใจ
            </h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              ใช้กล้องมือถือสแกน QR Code ด้านล่างเพื่อเข้าสู่หน้าแบบสอบถาม
            </p>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-center mb-6">
              <QRCodeSVG value={surveyUrl} size={220} level="M" />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={surveyUrl}
                className="flex-1 text-xs font-mono-num bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>คัดลอกลิงก์</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowQrModal(false);
                onSwitchToSurvey();
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>เปิดหน้าแบบสอบถามบนเครื่องนี้</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
