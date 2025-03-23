import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useDatabase, Report } from '../utils/db';
import { AnalysisReport } from '../utils/openai';

interface ReportsContextType {
  reports: Report[];
  loading: boolean;
  error: string | null;
  saveReport: (report: Omit<Report, 'id'>) => Promise<string>;
  deleteReport: (id: string) => Promise<void>;
  getReport: (id: string) => Promise<Report | null>;
  refreshReports: () => Promise<void>;
  getParsedReport: (reportContent: string) => AnalysisReport | null;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export const ReportsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const db = useDatabase();
  
  // Load all reports from the database
  const loadReports = async () => {
    try {
      const allReports = await db.getAllReports();
      setReports(allReports);
      return allReports;
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports');
      return [];
    }
  };
  
  // Initialize the database and load data
  useEffect(() => {
    const initDb = async () => {
      try {
        setLoading(true);
        await loadReports();
      } catch (err) {
        console.error('Failed to initialize reports database:', err);
        setError('Failed to load reports. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };
    
    initDb();
  }, []);
  
  // Save a new report
  const saveReport = async (report: Omit<Report, 'id'>): Promise<string> => {
    try {
      const id = await db.saveReport(report);
      
      // Refresh reports after adding
      await loadReports();
      
      return id;
    } catch (err) {
      console.error('Error saving report:', err);
      throw new Error('Failed to save report');
    }
  };
  
  // Delete a report
  const deleteReport = async (id: string): Promise<void> => {
    try {
      await db.deleteReport(id);
      
      // Refresh reports after deletion
      await loadReports();
    } catch (err) {
      console.error('Error deleting report:', err);
      throw new Error('Failed to delete report');
    }
  };
  
  // Get a single report
  const getReport = async (id: string): Promise<Report | null> => {
    try {
      return await db.getReport(id);
    } catch (err) {
      console.error('Error getting report:', err);
      throw new Error('Failed to get report');
    }
  };
  
  // Function to refresh reports
  const refreshReports = async (): Promise<void> => {
    try {
      await loadReports();
    } catch (err) {
      console.error('Error refreshing reports:', err);
    }
  };
  
  // Parse a report's content from JSON string to object
  const getParsedReport = (reportContent: string): AnalysisReport | null => {
    try {
      return JSON.parse(reportContent) as AnalysisReport;
    } catch (err) {
      console.error('Error parsing report content:', err);
      return null;
    }
  };
  
  return (
    <ReportsContext.Provider value={{
      reports,
      loading,
      error,
      saveReport,
      deleteReport,
      getReport,
      refreshReports,
      getParsedReport
    }}>
      {children}
    </ReportsContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportsContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};