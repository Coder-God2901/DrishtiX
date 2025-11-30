import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { AlertTriangle, CheckCircle, Clock, MapPin, Image, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import { apiService } from '@/services/api.service';
import { firebaseService } from '@/services/firebase.service';
import { toast } from 'sonner';

interface AttendeeReport {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'VALIDATING' | 'CONFIRMED' | 'REJECTED' | 'CONVERTED';
  reporterName: string;
  description: string;
  location: { lat: number; lon: number; zone?: string };
  imageUrls: string[];
  createdAt: Date;
  validationCount: number;
  validationThreshold: number;
  confirmRate: number;
  nearbyCount: number;
  isAutoConfirmed: boolean;
}

interface ValidationRecord {
  id: string;
  reportId: string;
  validatorName: string;
  validatorType: string;
  decision: 'CONFIRM' | 'REJECT' | 'UNSURE';
  confidence: number;
  timestamp: Date;
  distance: number;
}

export function AttendeeReportsPanel({ eventId = 'evt_101' }: { eventId?: string }) {
  const [reports, setReports] = useState<AttendeeReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<AttendeeReport | null>(null);
  const [validations, setValidations] = useState<ValidationRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

  // Real-time Firebase subscription for reports
  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToAttendeeReports((data: any[]) => {
      const mapped: AttendeeReport[] = data.map((report) => ({
        id: report.id,
        type: report.type,
        severity: report.severity,
        status: report.status,
        reporterName: report.reporterName || 'Anonymous',
        description: report.description,
        location: report.location,
        imageUrls: report.imageUrls || [],
        createdAt: new Date(report.createdAt?.toMillis() || Date.now()),
        validationCount: report.validationCount || 0,
        validationThreshold: report.validationThreshold || 0.3,
        confirmRate: report.confirmRate || 0,
        nearbyCount: report.nearbyCount || 0,
        isAutoConfirmed: report.isAutoConfirmed || false,
      }));
      setReports(mapped);
    });

    return () => unsubscribe();
  }, []);

  // Fetch initial reports from API
  useEffect(() => {
    fetchReports();
  }, [filter]);

  // Socket.IO for real-time report updates
  useEffect(() => {
    const socket = (window as any).socket;
    if (!socket) return;

    socket.on('report:new', (data: any) => {
      toast.info(`New ${data.severity} report: ${data.type}`, {
        description: data.location?.zone || 'Unknown location',
      });
      fetchReports();
    });

    socket.on('report:validated', (data: any) => {
      setReports((prev) =>
        prev.map((r) =>
          r.id === data.reportId
            ? {
                ...r,
                validationCount: data.validationCount,
                confirmRate: data.confirmRate,
                status: data.status,
              }
            : r
        )
      );
    });

    socket.emit('subscribe:reports', eventId);

    return () => {
      socket.off('report:new');
      socket.off('report:validated');
    };
  }, [eventId]);

  const fetchReports = async () => {
    try {
      const response = await apiService.attendeeReports.getByEvent(eventId);
      if (response.data && Array.isArray(response.data)) {
        const mapped: AttendeeReport[] = response.data.map((report: any) => ({
          id: report.id,
          type: report.type,
          severity: report.severity,
          status: report.status,
          reporterName: report.reporterName || 'Anonymous',
          description: report.description,
          location: report.location,
          imageUrls: report.imageUrls || [],
          createdAt: new Date(report.createdAt),
          validationCount: report.validationCount || 0,
          validationThreshold: report.validationThreshold || 0.3,
          confirmRate: report.confirmRate || 0,
          nearbyCount: report.nearbyCount || 0,
          isAutoConfirmed: report.isAutoConfirmed || false,
        }));
        setReports(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to load reports');
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filter === 'pending') return r.status === 'PENDING' || r.status === 'VALIDATING';
    if (filter === 'confirmed') return r.status === 'CONFIRMED';
    return true;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-gray-100 text-gray-800';
      case 'VALIDATING':
        return 'bg-blue-100 text-blue-800';
      case 'CONVERTED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleValidate = async (reportId: string, decision: 'CONFIRM' | 'REJECT') => {
    try {
      await apiService.attendeeReports.validate(reportId, {
        decision,
        validatorId: 'current-user-id',
        timestamp: new Date().toISOString(),
      });
      toast.success(`Report ${decision.toLowerCase()}ed successfully`);
      fetchReports();
    } catch (error) {
      console.error('Failed to validate report:', error);
      toast.error('Failed to validate report');
    }
  };

  const handleViewReport = async (report: AttendeeReport) => {
    setSelectedReport(report);
    try {
      const response = await apiService.attendeeReports.getValidations(report.id);
      if (response.data && Array.isArray(response.data)) {
        const mapped: ValidationRecord[] = response.data.map((v: any) => ({
          id: v.id,
          reportId: v.reportId,
          validatorName: v.validatorName,
          validatorType: v.validatorType,
          decision: v.decision,
          confidence: v.confidence,
          timestamp: new Date(v.timestamp),
          distance: v.distance,
        }));
        setValidations(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch validations:', error);
      setValidations([]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Reports List */}
      <div className="lg:col-span-2">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Attendee Reports</h2>
            <div className="flex gap-2">
              <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
                All
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={filter === 'confirmed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('confirmed')}
              >
                Confirmed
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <Card
                  key={report.id}
                  className={`p-4 cursor-pointer hover:shadow-lg transition-shadow ${
                    selectedReport?.id === report.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleViewReport(report)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(report.severity)}>{report.severity}</Badge>
                        <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                        {report.isAutoConfirmed && (
                          <Badge variant="outline" className="text-xs">
                            Auto-Confirmed
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{report.type.replace(/_/g, ' ')}</h3>
                      <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {report.location.zone || 'Unknown Zone'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.floor((Date.now() - report.createdAt.getTime()) / 60000)}m ago
                        </span>
                        {report.imageUrls.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Image className="h-3 w-3" />
                            {report.imageUrls.length} images
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Validation Progress */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">
                        Validation: {report.validationCount} responses ({Math.round(report.confirmRate * 100)}% confirm)
                      </span>
                      <span className="text-gray-600">{report.nearbyCount} nearby</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          report.confirmRate >= report.validationThreshold ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min((report.confirmRate / report.validationThreshold) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Threshold: {Math.round(report.validationThreshold * 100)}%
                    </p>
                  </div>

                  {/* Validation Actions */}
                  {report.status === 'PENDING' || report.status === 'VALIDATING' ? (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={(e: { stopPropagation: () => void; }) => {
                          e.stopPropagation();
                          handleValidate(report.id, 'CONFIRM');
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e: { stopPropagation: () => void }) => {
                          e.stopPropagation();
                          handleValidate(report.id, 'REJECT');
                        }}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Report Details & Validations */}
      <div>
        <Card className="p-6">
          {selectedReport ? (
            <>
              <h3 className="text-xl font-bold mb-4">Report Details</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Reported by</p>
                  <p className="font-semibold">{selectedReport.reporterName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold">{selectedReport.location.zone || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">
                    {selectedReport.location.lat.toFixed(4)}, {selectedReport.location.lon.toFixed(4)}
                  </p>
                </div>

                {selectedReport.imageUrls.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Images</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedReport.imageUrls.map((_url, idx) => (
                        <div
                          key={idx}
                          className="aspect-square bg-gray-100 rounded border flex items-center justify-center"
                        >
                          <Image className="h-8 w-8 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Validations ({validations.length})</h4>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {validations.map((validation) => (
                        <div key={validation.id} className="p-3 bg-gray-50 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">{validation.validatorName}</p>
                            <Badge variant="outline" className="text-xs">
                              {validation.validatorType}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            {validation.decision === 'CONFIRM' ? (
                              <ThumbsUp className="h-4 w-4 text-green-600" />
                            ) : validation.decision === 'REJECT' ? (
                              <ThumbsDown className="h-4 w-4 text-red-600" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-600" />
                            )}
                            <span className="text-sm font-semibold">{validation.decision}</span>
                            <span className="text-xs text-gray-500">
                              ({Math.round(validation.confidence * 100)}% confidence)
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{Math.floor((Date.now() - validation.timestamp.getTime()) / 60000)}m ago</span>
                            <span>{validation.distance}m away</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3" />
              <p>Select a report to view details</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
