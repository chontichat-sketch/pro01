import React, { useState, useEffect, Component, ReactNode } from 'react';
import SurveyPage from './pages/SurveyPage';
import DashboardPage from './pages/DashboardPage';

type ViewMode = 'dashboard' | 'survey';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-6 text-center">
            <h2 className="text-lg font-bold text-rose-700 mb-2">เกิดข้อผิดพลาดในการโหลดหน้าเว็บ</h2>
            <p className="text-sm text-slate-600 mb-4 break-words">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              โหลดหน้าใหม่
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function getInitialView(): ViewMode {
  if (typeof window === 'undefined') return 'dashboard';
  const params = new URLSearchParams(window.location.search);
  return params.get('view') === 'survey' ? 'survey' : 'dashboard';
}

export default function App() {
  const [view, setView] = useState<ViewMode>(getInitialView);

  useEffect(() => {
    const handlePopState = () => {
      setView(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (nextView: ViewMode) => {
    setView(nextView);
    const url = new URL(window.location.href);
    if (nextView === 'survey') {
      url.searchParams.set('view', 'survey');
    } else {
      url.searchParams.delete('view');
    }
    window.history.pushState({}, '', url.toString());
  };

  return (
    <ErrorBoundary>
      {view === 'survey' ? (
        <SurveyPage onSwitchToDashboard={() => navigateTo('dashboard')} />
      ) : (
        <DashboardPage onSwitchToSurvey={() => navigateTo('survey')} />
      )}
    </ErrorBoundary>
  );
}
