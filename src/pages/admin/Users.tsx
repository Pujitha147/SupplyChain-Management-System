import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, Factory, Truck, Store, User, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  company_name?: string;
  phone?: string;
  license_number?: string;
  created_at: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
  }, [profile, navigate]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'manufacturer' | 'distributor' | 'retailer' | 'customer') => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "User role updated successfully"
      });
      fetchUsers();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'manufacturer':
        return <Factory className="h-4 w-4" />;
      case 'distributor':
        return <Truck className="h-4 w-4" />;
      case 'retailer':
        return <Store className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500';
      case 'manufacturer':
        return 'bg-blue-500';
      case 'distributor':
        return 'bg-yellow-500';
      case 'retailer':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredUsers = users.filter(u => filter === 'all' || u.role === filter);

  const roleStats = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    manufacturer: users.filter(u => u.role === 'manufacturer').length,
    distributor: users.filter(u => u.role === 'distributor').length,
    retailer: users.filter(u => u.role === 'retailer').length,
    customer: users.filter(u => u.role === 'customer').length
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
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <p className="text-muted-foreground">View and manage all system users</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{roleStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">{roleStats.admin}</div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Factory className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{roleStats.manufacturer}</div>
              <div className="text-sm text-muted-foreground">Manufacturers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Truck className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{roleStats.distributor}</div>
              <div className="text-sm text-muted-foreground">Distributors</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Store className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{roleStats.retailer}</div>
              <div className="text-sm text-muted-foreground">Retailers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <User className="h-8 w-8 mx-auto mb-2 text-gray-500" />
              <div className="text-2xl font-bold">{roleStats.customer}</div>
              <div className="text-sm text-muted-foreground">Customers</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all registered users</CardDescription>
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="manufacturer">Manufacturers</SelectItem>
                  <SelectItem value="distributor">Distributors</SelectItem>
                  <SelectItem value="retailer">Retailers</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{u.full_name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{u.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getRoleColor(u.role)} text-white`}>
                        <span className="flex items-center gap-1">
                          {getRoleIcon(u.role)}
                          {u.role.toUpperCase()}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.company_name || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {u.phone && <div>📞 {u.phone}</div>}
                        {u.license_number && <div>🆔 {u.license_number}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(newRole: 'admin' | 'manufacturer' | 'distributor' | 'retailer' | 'customer') => updateUserRole(u.id, newRole)}
                        disabled={u.id === user?.id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="retailer">Retailer</SelectItem>
                          <SelectItem value="distributor">Distributor</SelectItem>
                          <SelectItem value="manufacturer">Manufacturer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}