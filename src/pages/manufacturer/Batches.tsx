import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, QrCode, Package, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';

interface Medicine {
  id: string;
  name: string;
  drug_code: string;
}

interface Batch {
  id: string;
  batch_number: string;
  medicine_id: string;
  manufacture_date: string;
  expiry_date: string;
  quantity: number;
  current_quantity: number;
  status: string;
  qr_code: string;
  created_at: string;
  medicines?: {
    name: string;
    drug_code: string;
  };
}

export default function ManufacturerBatches() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [formData, setFormData] = useState({
    medicine_id: '',
    batch_number: '',
    manufacture_date: '',
    expiry_date: '',
    quantity: 0
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    // Fetch medicines
    const { data: medicinesData } = await supabase
      .from('medicines')
      .select('id, name, drug_code')
      .eq('manufacturer_id', user.id);

    setMedicines(medicinesData || []);

    // Fetch batches
    const { data: batchesData, error } = await supabase
      .from('batches')
      .select(`
        *,
        medicines (
          name,
          drug_code
        )
      `)
      .eq('manufacturer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch batches",
        variant: "destructive"
      });
    } else {
      setBatches(batchesData || []);
    }
    setLoading(false);
  };

  const generateQRCode = (batch: Batch) => {
    return JSON.stringify({
      type: 'medicine_batch',
      batch_id: batch.id,
      batch_number: batch.batch_number,
      medicine_name: batch.medicines?.name,
      manufacture_date: batch.manufacture_date,
      expiry_date: batch.expiry_date
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const batchData = {
      ...formData,
      manufacturer_id: user.id,
      current_quantity: formData.quantity,
      status: 'manufactured' as 'manufactured' | 'distributed' | 'delivered' | 'sold' | 'expired' | 'recalled',
      qr_code: `BATCH_${formData.batch_number}_${Date.now()}`
    };

    const { error } = await supabase
      .from('batches')
      .insert([batchData]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create batch",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Batch created successfully"
      });
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    }
  };

  const resetForm = () => {
    setFormData({
      medicine_id: '',
      batch_number: '',
      manufacture_date: '',
      expiry_date: '',
      quantity: 0
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'manufactured': return 'bg-blue-500';
      case 'in_transit': return 'bg-yellow-500';
      case 'delivered': return 'bg-green-500';
      case 'recalled': return 'bg-red-500';
      default: return 'bg-gray-500';
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
              <h1 className="text-3xl font-bold">Create Batches</h1>
              <p className="text-muted-foreground">Generate batch QR codes for your medicines</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Batch
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Batch</DialogTitle>
                  <DialogDescription>
                    Enter batch details to create a new medicine batch
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="medicine_id">Medicine *</Label>
                    <Select 
                      value={formData.medicine_id} 
                      onValueChange={(value) => setFormData({ ...formData, medicine_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a medicine" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicines.map((medicine) => (
                          <SelectItem key={medicine.id} value={medicine.id}>
                            {medicine.name} ({medicine.drug_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="batch_number">Batch Number *</Label>
                    <Input
                      id="batch_number"
                      value={formData.batch_number}
                      onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                      placeholder="e.g., BTC001"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manufacture_date">Manufacture Date *</Label>
                      <Input
                        id="manufacture_date"
                        type="date"
                        value={formData.manufacture_date}
                        onChange={(e) => setFormData({ ...formData, manufacture_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiry_date">Expiry Date *</Label>
                      <Input
                        id="expiry_date"
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                      min="1"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Batch</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6">
          {batches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No batches created</h3>
                <p className="text-muted-foreground mb-4">
                  Start by creating your first medicine batch
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Batch
                </Button>
              </CardContent>
            </Card>
          ) : (
            batches.map((batch) => (
              <Card key={batch.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {batch.medicines?.name}
                        <Badge variant="outline">{batch.batch_number}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Drug Code: {batch.medicines?.drug_code}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(batch.status)}>
                        {batch.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBatch(batch)}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Manufactured
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(batch.manufacture_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Expires
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(batch.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Total Quantity</h4>
                      <p className="text-sm text-muted-foreground">
                        {batch.quantity} units
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Current Stock</h4>
                      <p className="text-sm text-muted-foreground">
                        {batch.current_quantity} units
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {selectedBatch && (
          <Dialog open={!!selectedBatch} onOpenChange={() => setSelectedBatch(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Batch QR Code</DialogTitle>
                <DialogDescription>
                  QR Code for batch {selectedBatch.batch_number}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4">
                <QRCodeGenerator value={generateQRCode(selectedBatch)} />
                <div className="text-center">
                  <p className="font-semibold">{selectedBatch.medicines?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Batch: {selectedBatch.batch_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires: {new Date(selectedBatch.expiry_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}