import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';

// Loader component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
  </div>
);

// Lazy-loaded pages to improve initial load performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RecordMemo = lazy(() => import('./pages/RecordMemo'));
const ViewMemos = lazy(() => import('./pages/ViewMemos'));
const AIReportGenerator = lazy(() => import('./pages/AIReportGenerator'));

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorBoundary>
        <Toaster position="top-center" />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="record" element={
              <Suspense fallback={<PageLoader />}>
                <RecordMemo />
              </Suspense>
            } />
            <Route path="memos" element={
              <Suspense fallback={<PageLoader />}>
                <ViewMemos />
              </Suspense>
            } />
            <Route path="reports" element={
              <Suspense fallback={<PageLoader />}>
                <AIReportGenerator />
              </Suspense>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;