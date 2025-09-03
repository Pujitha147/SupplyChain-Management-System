import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, AlertTriangle, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CounterfeitReport {
  id: string;
  qr_code: string;
  report_type: string;
  description: string;
  location: string;
  status: string;
  admin_notes: string;
  created_at: string;
  batch_id: string;
  reporter_id: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  batches?: {
    batch_number: string;
    medicines: {
      name: string;
    };
  };
}

export default function AdminReports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<CounterfeitReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<CounterfeitReport | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    let query = supabase
      .from('counterfeit_reports')
      .select(`
        *,
        profiles:reporter_id (
          full_name,
          email
        ),
        batches:batch_id (
          batch_number,
          medicines (
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch reports",
        variant: "destructive"
      });
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const updateReportStatus = async () => {
    if (!selectedReport || !newStatus) return;

    const { error } = await supabase
      .from('counterfeit_reports')
      .update({
        status: newStatus,
        admin_notes: adminNotes
      })
      .eq('id', selectedReport.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update report",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Report updated successfully"
      });
      setSelectedReport(null);
      setAdminNotes('');
      setNewStatus('');
      fetchReports();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'investigating':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'investigating':
        return <AlertTriangle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Counterfeit Reports</h1>
              <p className="text-muted-foreground">Review and investigate reported issues</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                <p className="text-muted-foreground">
                  {statusFilter === 'all' ? 'No counterfeit reports have been submitted yet.' : `No ${statusFilter} reports found.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(report.status)}
                        Report #{report.id.slice(0, 8)}
                        <Badge className={getStatusColor(report.status)}>
                          {report.status.toUpperCase()}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Type: {report.report_type} • {new Date(report.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setNewStatus(report.status);
                            setAdminNotes(report.admin_notes || '');
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Report Details</DialogTitle>
                          <DialogDescription>
                            Review and manage this counterfeit report
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-1">Reporter</h4>
                              <p className="text-sm text-muted-foreground">
                                {report.profiles?.full_name || 'Anonymous'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {report.profiles?.email || 'No email'}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-1">Medicine</h4>
                              <p className="text-sm text-muted-foreground">
                                {report.batches?.medicines?.name || 'Unknown'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Batch: {report.batches?.batch_number || 'Unknown'}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-1">QR Code</h4>
                              <p className="text-sm text-muted-foreground font-mono">
                                {report.qr_code}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-1">Location</h4>
                              <p className="text-sm text-muted-foreground">
                                {report.location || 'Not specified'}
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-1">Description</h4>
                            <p className="text-sm text-muted-foreground">
                              {report.description}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-semibold">Update Status</h4>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="investigating">Investigating</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-semibold">Admin Notes</h4>
                            <Textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Add investigation notes..."
                              rows={3}
                            />
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setSelectedReport(null)}>
                              Cancel
                            </Button>
                            <Button onClick={updateReportStatus}>
                              Update Report
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <h4 className="font-semibold mb-1">Type</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {report.report_type.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Location</h4>
                      <p className="text-sm text-muted-foreground">
                        {report.location || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Medicine</h4>
                      <p className="text-sm text-muted-foreground">
                        {report.batches?.medicines?.name || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Reporter</h4>
                      <p className="text-sm text-muted-foreground">
                        {report.profiles?.full_name || 'Anonymous'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-semibold mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                  </div>
                  {report.admin_notes && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-1">Admin Notes</h4>
                      <p className="text-sm text-muted-foreground">
                        {report.admin_notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}