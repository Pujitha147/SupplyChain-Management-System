import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, AlertTriangle, Calendar, Download, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  batch_number: string;
  current_quantity: number;
  status: string;
  manufacture_date: string;
  expiry_date: string;
  medicines: {
    name: string;
    drug_code: string;
    composition: string;
    dosage: string;
  };
  manufacturer: {
    company_name: string;
  };
}

export default function RetailerInventory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [expiringItems, setExpiringItems] = useState(0);

  useEffect(() => {
    fetchInventory();
  }, [user]);

  const fetchInventory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('batches')
      .select(`
        *,
        medicines (
          name,
          drug_code,
          composition,
          dosage
        ),
        manufacturer:profiles!batches_manufacturer_id_fkey (
          company_name
        )
      `)
      .eq('current_owner_id', user.id)
      .gt('current_quantity', 0)
      .order('expiry_date', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch inventory",
        variant: "destructive"
      });
    } else {
      setInventory(data || []);
      
      // Calculate metrics
      const total = data?.reduce((sum, item) => sum + item.current_quantity, 0) || 0;
      setTotalItems(total);
      
      const lowStockCount = data?.filter(item => item.current_quantity < 5).length || 0;
      setLowStock(lowStockCount);
      
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiringCount = data?.filter(item => new Date(item.expiry_date) <= thirtyDaysFromNow).length || 0;
      setExpiringItems(expiringCount);
    }
    setLoading(false);
  };

  const recordSale = async (batchId: string, quantity: number) => {
    try {
      const selectedBatch = inventory.find(b => b.id === batchId);
      if (!selectedBatch || selectedBatch.current_quantity < quantity) {
        toast({
          title: "Insufficient Stock",
          description: "Not enough quantity available for sale",
          variant: "destructive"
        });
        return;
      }

      // Record sale transaction
      const { error: transactionError } = await supabase
        .from('supply_chain_transactions')
        .insert({
          batch_id: batchId,
          from_user_id: user.id,
          to_user_id: user.id, // Self-transaction for sale
          quantity: quantity,
          transaction_type: 'sale',
          notes: 'Retail sale'
        });

      if (transactionError) throw transactionError;

      // Update batch quantity
      const { error: batchError } = await supabase
        .from('batches')
        .update({
          current_quantity: selectedBatch.current_quantity - quantity,
          status: 'sold'
        })
        .eq('id', batchId);

      if (batchError) throw batchError;

      toast({
        title: "Success",
        description: "Sale recorded successfully"
      });

      fetchInventory();

    } catch (error) {
      console.error('Sale recording error:', error);
      toast({
        title: "Error",
        description: "Failed to record sale",
        variant: "destructive"
      });
    }
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return new Date(expiryDate) <= thirtyDaysFromNow;
  };

  const isLowStock = (quantity: number) => {
    return quantity < 5;
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
              <h1 className="text-3xl font-bold">Store Inventory</h1>
              <p className="text-muted-foreground">Track your store inventory</p>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">
                Units in stock
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStock}</div>
              <p className="text-xs text-muted-foreground">
                Items below 5 units
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{expiringItems}</div>
              <p className="text-xs text-muted-foreground">
                Items expiring in 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          {inventory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No inventory items</h3>
                <p className="text-muted-foreground">
                  Your store inventory is empty. Received medicines will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            inventory.map((item) => (
              <Card key={item.id} className={`${isExpiringSoon(item.expiry_date) ? 'border-red-200' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {item.medicines.name}
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.toUpperCase()}
                        </Badge>
                        {isLowStock(item.current_quantity) && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            LOW STOCK
                          </Badge>
                        )}
                        {isExpiringSoon(item.expiry_date) && (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            EXPIRING SOON
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Batch: {item.batch_number} • Drug Code: {item.medicines.drug_code}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold">{item.current_quantity}</p>
                        <p className="text-sm text-muted-foreground">units</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          const quantity = prompt('Enter quantity to sell:');
                          if (quantity && parseInt(quantity) > 0) {
                            recordSale(item.id, parseInt(quantity));
                          }
                        }}
                        disabled={item.current_quantity === 0}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Sell
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <h4 className="font-semibold mb-1">Manufacturer</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.manufacturer.company_name}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Manufactured
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.manufacture_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Expires
                      </h4>
                      <p className={`text-sm ${isExpiringSoon(item.expiry_date) ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                        {new Date(item.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Dosage</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.medicines.dosage || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-semibold mb-1">Composition</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.medicines.composition || 'Not specified'}
                    </p>
                  </div>

                  {(isLowStock(item.current_quantity) || isExpiringSoon(item.expiry_date)) && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          {isLowStock(item.current_quantity) && (
                            <p className="text-yellow-800 text-sm font-medium">
                              Low stock alert: Only {item.current_quantity} units remaining
                            </p>
                          )}
                          {isExpiringSoon(item.expiry_date) && (
                            <p className="text-yellow-800 text-sm font-medium">
                              Expiring soon: Check expiry date
                            </p>
                          )}
                        </div>
                      </div>
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