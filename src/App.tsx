import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import Dashboard from './pages/Dashboard';
import RecordMemo from './pages/RecordMemo';
import ViewMemos from './pages/ViewMemos';
import PatientReports from './pages/PatientReports';
import DoctorReports from './pages/DoctorReports';
import AIReportGenerator from './pages/AIReportGenerator';
import Layout from './components/Layout';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="record" element={<RecordMemo />} />
          <Route path="memos" element={<ViewMemos />} />
          <Route path="patient-reports" element={<PatientReports />} />
          <Route path="doctor-reports" element={<DoctorReports />} />
          <Route path="ai-reports" element={<AIReportGenerator />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;