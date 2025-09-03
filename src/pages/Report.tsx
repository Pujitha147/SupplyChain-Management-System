import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Layout/Navbar';
import { QRCodeScanner } from '@/components/QRCodeScanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function Report() {
  const [reportData, setReportData] = useState({
    qrCode: '',
    reportType: '',
    description: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleQRScan = (result: string) => {
    setReportData(prev => ({ ...prev, qrCode: result }));
    toast({
      title: "QR Code Scanned",
      description: "QR code has been added to the report",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportData.qrCode || !reportData.reportType || !reportData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if QR code exists in our database
      const { data: batch } = await supabase
        .from('batches')
        .select('id')
        .eq('qr_code', reportData.qrCode)
        .single();

      // Submit the report
      const { error } = await supabase
        .from('counterfeit_reports')
        .insert({
          batch_id: batch?.id || null,
          qr_code: reportData.qrCode,
          reporter_id: user?.id || null,
          report_type: reportData.reportType,
          description: reportData.description,
          location: reportData.location,
          status: 'pending'
        });

      if (error) {
        throw error;
      }

      setSubmitted(true);
      toast({
        title: "Report Submitted",
        description: "Thank you for reporting. We will investigate this issue.",
      });

      // Reset form
      setReportData({
        qrCode: '',
        reportType: '',
        description: '',
        location: ''
      });

    } catch (error) {
      console.error('Report submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit report. Please try again.",
        variant: "destructive"
      });
    }

    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="py-8">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Report Submitted Successfully</h1>
                <p className="text-muted-foreground mb-6">
                  Thank you for helping us maintain the integrity of the supply chain. 
                  Your report has been submitted and will be reviewed by our team.
                </p>
                <div className="space-x-4">
                  <Button onClick={() => setSubmitted(false)}>
                    Submit Another Report
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Report Counterfeit Medicine</h1>
            <p className="text-muted-foreground">
              Help us keep the supply chain safe by reporting suspicious or counterfeit medicines
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Scan QR Code</CardTitle>
                <CardDescription>
                  Scan the QR code from the suspicious medicine package
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QRCodeScanner 
                  onScan={handleQRScan}
                  onError={(error) => {
                    toast({
                      title: "Scan Error",
                      description: error,
                      variant: "destructive"
                    });
                  }}
                />
                {reportData.qrCode && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>QR Code Captured:</strong> {reportData.qrCode}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Report Details</span>
                </CardTitle>
                <CardDescription>
                  Provide details about the suspicious medicine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="qr-code-manual">QR Code (if not scanned)</Label>
                    <Input
                      id="qr-code-manual"
                      value={reportData.qrCode}
                      onChange={(e) => setReportData(prev => ({ ...prev, qrCode: e.target.value }))}
                      placeholder="Enter QR code manually if scanning failed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="report-type">Report Type *</Label>
                    <Select value={reportData.reportType} onValueChange={(value) => setReportData(prev => ({ ...prev, reportType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="counterfeit">Counterfeit Medicine</SelectItem>
                        <SelectItem value="suspicious">Suspicious Packaging</SelectItem>
                        <SelectItem value="damaged">Damaged Product</SelectItem>
                        <SelectItem value="expired">Expired Medicine</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={reportData.description}
                      onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the issue in detail. What made you suspicious about this medicine?"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={reportData.location}
                      onChange={(e) => setReportData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Where did you encounter this medicine? (e.g., pharmacy name, city)"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || !reportData.qrCode || !reportData.reportType || !reportData.description}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Submitting Report...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Submit Report
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    * Required fields. Your report will be reviewed by our security team.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}