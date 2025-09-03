import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Send, Package, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
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
  from_user: {
    company_name: string;
    full_name: string;
  } | null;
  to_user: {
    company_name: string;
    full_name: string;
  };
}

interface Batch {
  id: string;
  batch_number: string;
  current_quantity: number;
  medicines: {
    name: string;
  };
}

interface User {
  id: string;
  full_name: string;
  company_name: string;
  role: string;
}

export default function ManufacturerTransactions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [distributors, setDistributors] = useState<User[]>([]);
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

    // Fetch transactions
    const { data: transactionsData, error } = await supabase
      .from('supply_chain_transactions')
      .select(`
        *,
        batches (
          batch_number,
          medicines (
            name
          )
        ),
        from_user:profiles!supply_chain_transactions_from_user_id_fkey (
          company_name,
          full_name
        ),
        to_user:profiles!supply_chain_transactions_to_user_id_fkey (
          company_name,
          full_name
        )
      `)
      .eq('from_user_id', user.id)
      .order('transaction_date', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive"
      });
    } else {
      setTransactions(transactionsData || []);
    }

    // Fetch available batches
    const { data: batchesData } = await supabase
      .from('batches')
      .select(`
        id,
        batch_number,
        current_quantity,
        medicines (
          name
        )
      `)
      .eq('manufacturer_id', user.id)
      .gt('current_quantity', 0);

    setBatches(batchesData || []);

    // Fetch distributors and retailers
    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, full_name, company_name, role')
      .in('role', ['distributor', 'retailer']);

    setDistributors(usersData || []);
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
      const selectedBatch = batches.find(b => b.id === formData.batch_id);
      if (!selectedBatch || selectedBatch.current_quantity < formData.quantity) {
        toast({
          title: "Insufficient Stock",
          description: "Not enough quantity available in this batch",
          variant: "destructive"
        });
        return;
      }

      // Create transaction
      const { error: transactionError } = await supabase
        .from('supply_chain_transactions')
        .insert({
          batch_id: formData.batch_id,
          from_user_id: user.id,
          to_user_id: formData.to_user_id,
          quantity: formData.quantity,
          transaction_type: 'transfer',
          notes: formData.notes
        });

      if (transactionError) throw transactionError;

      // Update batch quantity and owner
      const { error: batchError } = await supabase
        .from('batches')
        .update({
          current_quantity: selectedBatch.current_quantity - formData.quantity,
          current_owner_id: formData.to_user_id,
          status: 'distributed'
        })
        .eq('id', formData.batch_id);

      if (batchError) throw batchError;

      toast({
        title: "Success",
        description: "Transaction created successfully"
      });

      setIsDialogOpen(false);
      resetForm();
      fetchData();

    } catch (error) {
      console.error('Transaction error:', error);
      toast({
        title: "Error",
        description: "Failed to create transaction",
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
      case 'transfer':
        return 'bg-blue-100 text-blue-800';
      case 'sale':
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
              <h1 className="text-3xl font-bold">Transaction History</h1>
              <p className="text-muted-foreground">Track medicine distribution and transfers</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Transfer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Transfer</DialogTitle>
                  <DialogDescription>
                    Transfer medicine batches to distributors or retailers
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
                        {batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.medicines.name} - {batch.batch_number} (Stock: {batch.current_quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="to_user_id">Recipient *</Label>
                    <Select 
                      value={formData.to_user_id} 
                      onValueChange={(value) => setFormData({ ...formData, to_user_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        {distributors.map((distributor) => (
                          <SelectItem key={distributor.id} value={distributor.id}>
                            {distributor.company_name} ({distributor.role})
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
                      max={batches.find(b => b.id === formData.batch_id)?.current_quantity || 999999}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Optional transfer notes"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Transfer</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6">
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by creating your first transfer to a distributor or retailer
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Transfer
                </Button>
              </CardContent>
            </Card>
          ) : (
            transactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        {transaction.batches.medicines.name}
                        <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
                          {transaction.transaction_type.toUpperCase()}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Batch: {transaction.batches.batch_number}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.transaction_date).toLocaleDateString()}
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
                        {transaction.to_user.company_name}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Quantity</h4>
                      <p className="text-sm text-muted-foreground">
                        {transaction.quantity} units
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Date
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Type</h4>
                      <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
                        {transaction.transaction_type}
                      </Badge>
                    </div>
                  </div>
                  {transaction.notes && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-1">Notes</h4>
                      <p className="text-sm text-muted-foreground">
                        {transaction.notes}
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