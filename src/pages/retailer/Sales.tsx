import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, DollarSign, Calendar, TrendingUp, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Sale {
  id: string;
  quantity: number;
  transaction_date: string;
  notes: string;
  batches: {
    batch_number: string;
    medicines: {
      name: string;
      drug_code: string;
    };
  };
}

export default function RetailerSales() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [thisMonthSales, setThisMonthSales] = useState(0);

  useEffect(() => {
    fetchSales();
  }, [user]);

  const fetchSales = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('supply_chain_transactions')
      .select(`
        *,
        batches (
          batch_number,
          medicines (
            name,
            drug_code
          )
        )
      `)
      .eq('from_user_id', user.id)
      .eq('transaction_type', 'sale')
      .order('transaction_date', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sales data",
        variant: "destructive"
      });
    } else {
      setSales(data || []);
      
      // Calculate metrics
      const total = data?.reduce((sum, sale) => sum + sale.quantity, 0) || 0;
      setTotalSales(total);
      
      // Today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTotal = data?.filter(sale => {
        const saleDate = new Date(sale.transaction_date);
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === today.getTime();
      }).reduce((sum, sale) => sum + sale.quantity, 0) || 0;
      setTodaySales(todayTotal);
      
      // This month's sales
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const monthTotal = data?.filter(sale => {
        const saleDate = new Date(sale.transaction_date);
        return saleDate >= thisMonth;
      }).reduce((sum, sale) => sum + sale.quantity, 0) || 0;
      setThisMonthSales(monthTotal);
    }
    setLoading(false);
  };

  const getSalesMetrics = () => {
    if (sales.length === 0) return [];

    // Group sales by medicine
    const medicineGroups: { [key: string]: { name: string; total: number; sales: number } } = {};
    
    sales.forEach(sale => {
      const medicineName = sale.batches.medicines.name;
      if (!medicineGroups[medicineName]) {
        medicineGroups[medicineName] = {
          name: medicineName,
          total: 0,
          sales: 0
        };
      }
      medicineGroups[medicineName].total += sale.quantity;
      medicineGroups[medicineName].sales += 1;
    });

    return Object.values(medicineGroups)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const topMedicines = getSalesMetrics();

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
          <h1 className="text-3xl font-bold">Sales Management</h1>
          <p className="text-muted-foreground">Record and track medicine sales</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSales}</div>
              <p className="text-xs text-muted-foreground">
                Units sold (all time)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{todaySales}</div>
              <p className="text-xs text-muted-foreground">
                Units sold today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{thisMonthSales}</div>
              <p className="text-xs text-muted-foreground">
                Units sold this month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Selling Medicines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Top Selling Medicines</span>
              </CardTitle>
              <CardDescription>Best performing medicines by quantity sold</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topMedicines.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No sales data available</p>
                ) : (
                  topMedicines.map((medicine, index) => (
                    <div key={medicine.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{medicine.name}</p>
                          <p className="text-sm text-muted-foreground">{medicine.sales} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{medicine.total}</p>
                        <p className="text-sm text-muted-foreground">units</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your store operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/retailer/inventory')}
              >
                <Package className="mr-2 h-4 w-4" />
                View Inventory
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/verify')}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Verify Medicine
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/report')}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Report Issue
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Recent Sales</span>
            </CardTitle>
            <CardDescription>Latest medicine sales transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sales.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No sales recorded</h3>
                  <p className="text-muted-foreground">
                    Sales will appear here once you start recording them from your inventory.
                  </p>
                </div>
              ) : (
                sales.slice(0, 10).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <ShoppingCart className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{sale.batches.medicines.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Batch: {sale.batches.batch_number} • 
                          Code: {sale.batches.medicines.drug_code}
                        </p>
                        {sale.notes && (
                          <p className="text-sm text-muted-foreground">
                            Notes: {sale.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{sale.quantity} units</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sale.transaction_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}