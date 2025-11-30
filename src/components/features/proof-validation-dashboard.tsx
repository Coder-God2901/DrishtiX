/**
 * DrishtiX - Proof Validation Dashboard Component
 *
 * Organizer interface for reviewing AI-validated incident proofs.
 * Allows approve/reject actions with automated alert generation.
 */

import React, { useState, useEffect } from 'react';
import { collection, query, where, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { MapPin, Check, X, Eye, AlertTriangle, Image as ImageIcon, Video } from 'lucide-react';
import { locationBasedAlertService } from '../../services/location-based-alert.service';

interface ProofValidationItem {
  reportId: string;
  reporterPhone: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location?: {
    lat: number;
    lng: number;
    description: string;
  };
  mediaUrls: string[];
  timestamp: number;
  status: string;
  proofValidation?: {
    validated: boolean;
    confidence: number;
    validatedAt: number;
    validationMethod: string;
    anomalies: string[];
    detectedObjects?: Array<{ name: string; confidence: number; relevance: string }>;
    extractedText?: string[];
    sceneLabels?: Array<{ label: string; confidence: number }>;
  };
  aiSummary: string;
  priority: number;
}

export const ProofValidationDashboard: React.FC = () => {
  const [pendingReports, setPendingReports] = useState<ProofValidationItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ProofValidationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high-confidence' | 'flagged' | 'critical'>('all');
  const [processing, setProcessing] = useState(false);

  const firestore = getFirestore();

  // Load pending proof validations
  useEffect(() => {
    const reportsRef = collection(firestore, 'incident_reports');
    const q = query(reportsRef, where('status', 'in', ['proof_validation', 'pending', 'validated']));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reports: ProofValidationItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        reports.push({
          reportId: doc.id,
          ...data,
        } as ProofValidationItem);
      });

      // Sort by priority and timestamp
      reports.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return b.timestamp - a.timestamp;
      });

      setPendingReports(reports);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  // Filter reports
  const filteredReports = pendingReports.filter((report) => {
    if (filter === 'high-confidence') {
      return report.proofValidation?.confidence && report.proofValidation.confidence >= 0.75;
    } else if (filter === 'flagged') {
      return report.proofValidation?.anomalies && report.proofValidation.anomalies.length > 0;
    } else if (filter === 'critical') {
      return report.severity === 'critical';
    }
    return true;
  });

  // Approve proof and generate alert
  const handleApprove = async (report: ProofValidationItem) => {
    setProcessing(true);
    try {
      // Update report status
      const reportRef = doc(firestore, 'incident_reports', report.reportId);
      await updateDoc(reportRef, {
        status: 'validated',
        validatedBy: 'organizer',
        validatedAt: Date.now(),
      });

      // Generate location-based alert for critical/high severity
      if (report.severity === 'critical' || report.severity === 'high') {
        if (report.location && (report.location.lat || report.location.lng)) {
          await locationBasedAlertService.generateAlert({
            reportId: report.reportId,
            eventId: 'current-event', // Replace with actual event ID
            incidentCategory: report.category,
            incidentLocation: report.location,
            severity: report.severity,
            title: `VALIDATED: ${report.category.toUpperCase()}`,
            message: `${report.description}\n\nProof validated by event organizers. Please stay alert and follow safety instructions.`,
            channels: ['fcm', 'whatsapp'],
          });
        }
      }

      setSelectedReport(null);
      alert('✅ Proof approved and alert generated!');
    } catch (error) {
      console.error('Failed to approve proof:', error);
      alert('❌ Failed to approve proof');
    } finally {
      setProcessing(false);
    }
  };

  // Reject proof
  const handleReject = async (report: ProofValidationItem, reason: string) => {
    setProcessing(true);
    try {
      const reportRef = doc(firestore, 'incident_reports', report.reportId);
      await updateDoc(reportRef, {
        status: 'rejected',
        rejectedBy: 'organizer',
        rejectedAt: Date.now(),
        rejectionReason: reason,
      });

      // Optionally notify reporter
      alert('❌ Proof rejected');
      setSelectedReport(null);
    } catch (error) {
      console.error('Failed to reject proof:', error);
      alert('❌ Failed to reject proof');
    } finally {
      setProcessing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'text-green-600';
    if (confidence >= 0.75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading proof validations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Proof Validation Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Review AI-validated incident proofs and generate alerts for verified incidents
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Pending</div>
            <div className="text-2xl font-bold">{pendingReports.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">High Confidence</div>
            <div className="text-2xl font-bold text-green-600">
              {
                pendingReports.filter((r) => r.proofValidation?.confidence && r.proofValidation.confidence >= 0.75)
                  .length
              }
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Flagged</div>
            <div className="text-2xl font-bold text-orange-600">
              {
                pendingReports.filter((r) => r.proofValidation?.anomalies && r.proofValidation.anomalies.length > 0)
                  .length
              }
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Critical</div>
            <div className="text-2xl font-bold text-red-600">
              {pendingReports.filter((r) => r.severity === 'critical').length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            All ({pendingReports.length})
          </button>
          <button
            onClick={() => setFilter('high-confidence')}
            className={`px-4 py-2 rounded ${
              filter === 'high-confidence' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            High Confidence
          </button>
          <button
            onClick={() => setFilter('flagged')}
            className={`px-4 py-2 rounded ${
              filter === 'flagged' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Flagged
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-4 py-2 rounded ${
              filter === 'critical' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Critical
          </button>
        </div>

        {/* Reports List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* List View */}
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.reportId}
                onClick={() => setSelectedReport(report)}
                className={`bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition ${
                  selectedReport?.reportId === report.reportId ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold border ${getSeverityColor(report.severity)}`}
                    >
                      {report.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{report.category}</span>
                  </div>
                  {report.proofValidation && (
                    <div className={`text-sm font-semibold ${getConfidenceColor(report.proofValidation.confidence)}`}>
                      {(report.proofValidation.confidence * 100).toFixed(0)}% confidence
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{report.aiSummary}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{report.description}</p>

                {report.location && (
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <MapPin className="w-3 h-3 mr-1" />
                    {report.location.description || `${report.location.lat}, ${report.location.lng}`}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {report.mediaUrls.map((url, idx) => (
                    <div key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                      {url.includes('video') ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                      Proof {idx + 1}
                    </div>
                  ))}
                </div>

                {report.proofValidation?.anomalies && report.proofValidation.anomalies.length > 0 && (
                  <div className="mt-2 flex items-start gap-1 text-xs text-orange-600">
                    <AlertTriangle className="w-3 h-3 mt-0.5" />
                    <span>{report.proofValidation.anomalies[0]}</span>
                  </div>
                )}
              </div>
            ))}

            {filteredReports.length === 0 && (
              <div className="text-center py-12 text-gray-500">No reports to review in this category</div>
            )}
          </div>

          {/* Detail View */}
          <div className="sticky top-6">
            {selectedReport ? (
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Proof Details</h2>
                  <button onClick={() => setSelectedReport(null)} className="text-gray-500 hover:text-gray-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Proof Media */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Submitted Proofs</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedReport.mediaUrls.map((url, idx) => (
                      <div key={idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        {url.includes('video') ? (
                          <video src={url} controls className="w-full h-full object-cover" />
                        ) : (
                          <img src={url} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Validation Results */}
                {selectedReport.proofValidation && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">AI Validation Results</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Confidence:</span>
                        <span
                          className={`font-semibold ${getConfidenceColor(selectedReport.proofValidation.confidence)}`}
                        >
                          {(selectedReport.proofValidation.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Method:</span>
                        <span className="font-semibold">{selectedReport.proofValidation.validationMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={selectedReport.proofValidation.validated ? 'text-green-600' : 'text-red-600'}>
                          {selectedReport.proofValidation.validated ? '✓ Valid' : '✗ Flagged'}
                        </span>
                      </div>
                    </div>

                    {selectedReport.proofValidation.detectedObjects &&
                      selectedReport.proofValidation.detectedObjects.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-semibold mb-1">Detected Objects:</div>
                          <div className="flex flex-wrap gap-1">
                            {selectedReport.proofValidation.detectedObjects.slice(0, 5).map((obj, idx) => (
                              <span
                                key={idx}
                                className={`text-xs px-2 py-1 rounded ${
                                  obj.relevance === 'high'
                                    ? 'bg-green-100 text-green-700'
                                    : obj.relevance === 'medium'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {obj.name} ({(obj.confidence * 100).toFixed(0)}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {selectedReport.proofValidation.extractedText &&
                      selectedReport.proofValidation.extractedText.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-semibold mb-1">Extracted Text:</div>
                          <div className="text-xs bg-white p-2 rounded max-h-24 overflow-y-auto">
                            {selectedReport.proofValidation.extractedText.join(', ')}
                          </div>
                        </div>
                      )}

                    {selectedReport.proofValidation.anomalies &&
                      selectedReport.proofValidation.anomalies.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-semibold mb-1 text-orange-600">⚠️ Anomalies Detected:</div>
                          <ul className="text-xs space-y-1">
                            {selectedReport.proofValidation.anomalies.map((anomaly, idx) => (
                              <li key={idx} className="text-orange-700">
                                • {anomaly}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )}

                {/* Incident Details */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Incident Details</h3>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="text-gray-600">Category:</span>{' '}
                      <span className="font-semibold">{selectedReport.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Severity:</span>{' '}
                      <span className={`font-semibold ${getSeverityColor(selectedReport.severity)}`}>
                        {selectedReport.severity.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Description:</span>
                      <p className="mt-1">{selectedReport.description}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">AI Summary:</span>
                      <p className="mt-1">{selectedReport.aiSummary}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(selectedReport)}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Approve & Alert
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for rejection:');
                      if (reason) handleReject(selectedReport, reason);
                    }}
                    disabled={processing}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-lg shadow text-center text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a report to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
