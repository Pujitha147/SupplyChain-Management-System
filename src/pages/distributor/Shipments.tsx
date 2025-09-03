import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Truck, Package, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Shipment {
  id: string;
  transaction_type: string;
  quantity: number;
  transaction_date: string;
  notes: string;
  batches: {
    batch_number: string;
    medicines: {
      name: string;
    };
  };
  to_user: {
    company_name: string;
    address: string;
  };
}

interface InventoryItem {
  id: string;
  batch_number: string;
  current_quantity: number;
  medicines: {
    name: string;
  };
}

interface Retailer {
  id: string;
  full_name: string;
  company_name: string;
  address: string;
}

export default function DistributorShipments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    batch_id: '',
    to_user_id: '',
    quantity: 0,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch shipments (outgoing transactions)
    const { data: shipmentsData, error } = await supabase
      .from('supply_chain_transactions')
      .select(`
        *,
        batches (
          batch_number,
          medicines (
            name
          )
        ),
        to_user:profiles!supply_chain_transactions_to_user_id_fkey (
          company_name,
          address
        )
      `)
      .eq('from_user_id', user.id)
      .order('transaction_date', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch shipments",
        variant: "destructive"
      });
    } else {
      setShipments(shipmentsData || []);
    }

    // Fetch available inventory
    const { data: inventoryData } = await supabase
      .from('batches')
      .select(`
        id,
        batch_number,
        current_quantity,
        medicines (
          name
        )
      `)
      .eq('current_owner_id', user.id)
      .gt('current_quantity', 0);

    setInventory(inventoryData || []);

    // Fetch retailers
    const { data: retailersData } = await supabase
      .from('profiles')
      .select('id, full_name, company_name, address')
      .eq('role', 'retailer');

    setRetailers(retailersData || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.batch_id || !formData.to_user_id || formData.quantity <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get batch info
      const selectedBatch = inventory.find(b => b.id === formData.batch_id);
      if (!selectedBatch || selectedBatch.current_quantity < formData.quantity) {
        toast({
          title: "Insufficient Stock",
          description: "Not enough quantity available in this batch",
          variant: "destructive"
        });
        return;
      }

      // Create shipment transaction
      const { error: transactionError } = await supabase
        .from('supply_chain_transactions')
        .insert({
          batch_id: formData.batch_id,
          from_user_id: user.id,
          to_user_id: formData.to_user_id,
          quantity: formData.quantity,
          transaction_type: 'shipment',
          notes: formData.notes
        });

      if (transactionError) throw transactionError;

      // Update batch quantity and owner
      const { error: batchError } = await supabase
        .from('batches')
        .update({
          current_quantity: selectedBatch.current_quantity - formData.quantity,
          current_owner_id: formData.to_user_id,
          status: 'delivered'
        })
        .eq('id', formData.batch_id);

      if (batchError) throw batchError;

      toast({
        title: "Success",
        description: "Shipment created successfully"
      });

      setIsDialogOpen(false);
      resetForm();
      fetchData();

    } catch (error) {
      console.error('Shipment error:', error);
      toast({
        title: "Error",
        description: "Failed to create shipment",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      batch_id: '',
      to_user_id: '',
      quantity: 0,
      notes: ''
    });
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'shipment':
        return 'bg-blue-100 text-blue-800';
      case 'delivery':
        return 'bg-green-100 text-green-800';
      case 'return':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
              <h1 className="text-3xl font-bold">Shipment Management</h1>
              <p className="text-muted-foreground">Send medicines to retailers</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Shipment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Shipment</DialogTitle>
                  <DialogDescription>
                    Ship medicine batches to retailers
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch_id">Batch *</Label>
                    <Select 
                      value={formData.batch_id} 
                      onValueChange={(value) => setFormData({ ...formData, batch_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.medicines.name} - {batch.batch_number} (Stock: {batch.current_quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="to_user_id">Retailer *</Label>
                    <Select 
                      value={formData.to_user_id} 
                      onValueChange={(value) => setFormData({ ...formData, to_user_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select retailer" />
                      </SelectTrigger>
                      <SelectContent>
                        {retailers.map((retailer) => (
                          <SelectItem key={retailer.id} value={retailer.id}>
                            {retailer.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      min="1"
                      max={inventory.find(b => b.id === formData.batch_id)?.current_quantity || 999999}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Optional shipment notes"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Shipment</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6">
          {shipments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No shipments yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by creating your first shipment to a retailer
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Shipment
                </Button>
              </CardContent>
            </Card>
          ) : (
            shipments.map((shipment) => (
              <Card key={shipment.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        {shipment.batches.medicines.name}
                        <Badge className={getTransactionTypeColor(shipment.transaction_type)}>
                          {shipment.transaction_type.toUpperCase()}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Batch: {shipment.batches.batch_number}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(shipment.transaction_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        To
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {shipment.to_user.company_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {shipment.to_user.address || 'No address'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Quantity</h4>
                      <p className="text-sm text-muted-foreground">
                        {shipment.quantity} units
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Shipped
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(shipment.transaction_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Status</h4>
                      <Badge className={getTransactionTypeColor(shipment.transaction_type)}>
                        {shipment.transaction_type}
                      </Badge>
                    </div>
                  </div>
                  {shipment.notes && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-1">Notes</h4>
                      <p className="text-sm text-muted-foreground">
                        {shipment.notes}
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