import { useState } from 'react';
import { Navbar } from '@/components/Layout/Navbar';
import { QRCodeScanner } from '@/components/QRCodeScanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertTriangle, Package, Calendar, MapPin } from 'lucide-react';

interface VerificationResult {
  isValid: boolean;
  batch?: any;
  medicine?: any;
  manufacturer?: any;
  transactions?: any[];
  error?: string;
}

export default function Verify() {
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const verifyQRCode = async (qrCode: string) => {
    setIsLoading(true);
    setVerificationResult(null);

    try {
      // Log verification attempt
      await supabase
        .from('verification_logs')
        .insert({
          qr_code: qrCode,
          verifier_id: (await supabase.auth.getUser()).data.user?.id || null,
          verification_result: 'pending',
          location: 'Web App'
        });

      // Check if QR code exists in batches
      const { data: batch, error: batchError } = await supabase
        .from('batches')
        .select(`
          *,
          medicine:medicines(*),
          manufacturer:profiles!batches_manufacturer_id_fkey(*),
          current_owner:profiles!batches_current_owner_id_fkey(*)
        `)
        .eq('qr_code', qrCode)
        .single();

      if (batchError || !batch) {
        // Update verification log
        await supabase
          .from('verification_logs')
          .update({ verification_result: 'not_found' })
          .eq('qr_code', qrCode)
          .order('created_at', { ascending: false })
          .limit(1);

        setVerificationResult({
          isValid: false,
          error: 'QR Code not found in our database. This medicine may be counterfeit.'
        });
        
        toast({
          title: "Verification Failed",
          description: "QR Code not found in database",
          variant: "destructive"
        });
        
        setIsLoading(false);
        return;
      }

      // Get transaction history
      const { data: transactions } = await supabase
        .from('supply_chain_transactions')
        .select(`
          *,
          from_user:profiles!supply_chain_transactions_from_user_id_fkey(*),
          to_user:profiles!supply_chain_transactions_to_user_id_fkey(*)
        `)
        .eq('batch_id', batch.id)
        .order('transaction_date', { ascending: true });

      // Update verification log with success
      await supabase
        .from('verification_logs')
        .update({ 
          verification_result: 'authentic',
          batch_id: batch.id
        })
        .eq('qr_code', qrCode)
        .order('created_at', { ascending: false })
        .limit(1);

      const result: VerificationResult = {
        isValid: true,
        batch,
        medicine: batch.medicine,
        manufacturer: batch.manufacturer,
        transactions: transactions || []
      };

      setVerificationResult(result);
      
      toast({
        title: "Verification Successful",
        description: "Medicine is authentic and verified",
      });

    } catch (error) {
      console.error('Verification error:', error);
      
      setVerificationResult({
        isValid: false,
        error: 'An error occurred during verification. Please try again.'
      });
      
      toast({
        title: "Verification Error",
        description: "Failed to verify medicine. Please try again.",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'manufactured':
        return 'bg-blue-100 text-blue-800';
      case 'distributed':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-purple-100 text-purple-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'recalled':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Verify Medicine Authenticity</h1>
            <p className="text-muted-foreground">
              Scan the QR code on your medicine packaging to verify its authenticity
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <QRCodeScanner 
                onScan={verifyQRCode}
                onError={(error) => {
                  toast({
                    title: "Scan Error",
                    description: error,
                    variant: "destructive"
                  });
                }}
              />
            </div>

            <div>
              {isLoading && (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p>Verifying medicine...</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {verificationResult && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        {verificationResult.isValid ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600" />
                        )}
                        <CardTitle>
                          {verificationResult.isValid ? 'Authentic Medicine' : 'Verification Failed'}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {verificationResult.isValid ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h3 className="font-semibold text-sm text-muted-foreground">Medicine Name</h3>
                              <p className="font-medium">{verificationResult.medicine?.name}</p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm text-muted-foreground">Batch Number</h3>
                              <p className="font-medium">{verificationResult.batch?.batch_number}</p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm text-muted-foreground">Manufacturer</h3>
                              <p className="font-medium">{verificationResult.manufacturer?.company_name}</p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm text-muted-foreground">Status</h3>
                              <Badge className={getStatusColor(verificationResult.batch?.status)}>
                                {verificationResult.batch?.status}
                              </Badge>
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm text-muted-foreground">Manufacture Date</h3>
                              <p className="font-medium">
                                {new Date(verificationResult.batch?.manufacture_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm text-muted-foreground">Expiry Date</h3>
                              <p className={`font-medium ${isExpired(verificationResult.batch?.expiry_date) ? 'text-red-600' : ''}`}>
                                {new Date(verificationResult.batch?.expiry_date).toLocaleDateString()}
                                {isExpired(verificationResult.batch?.expiry_date) && (
                                  <span className="ml-2 text-red-600 font-bold">(EXPIRED)</span>
                                )}
                              </p>
                            </div>
                          </div>

                          {isExpired(verificationResult.batch?.expiry_date) && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                <p className="text-red-800 font-medium">
                                  ⚠️ WARNING: This medicine has expired and should not be used!
                                </p>
                              </div>
                            </div>
                          )}

                          <div>
                            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Description</h3>
                            <p className="text-sm">{verificationResult.medicine?.description}</p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Composition</h3>
                            <p className="text-sm">{verificationResult.medicine?.composition}</p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Dosage</h3>
                            <p className="text-sm">{verificationResult.medicine?.dosage}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                          <p className="text-red-600">{verificationResult.error}</p>
                          <Button 
                            variant="destructive" 
                            onClick={() => window.open('/report', '_blank')}
                          >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Report Counterfeit
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {verificationResult.isValid && verificationResult.transactions && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Package className="h-5 w-5" />
                          <span>Supply Chain History</span>
                        </CardTitle>
                        <CardDescription>
                          Track this medicine's journey through the supply chain
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {verificationResult.transactions.map((transaction, index) => (
                            <div key={transaction.id} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                                  {index + 1}
                                </div>
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium capitalize">{transaction.transaction_type}</span>
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(transaction.transaction_date).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    {transaction.from_user ? `${transaction.from_user.company_name} → ` : ''}
                                    {transaction.to_user.company_name}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Quantity: {transaction.quantity}
                                </p>
                                {transaction.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Notes: {transaction.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}