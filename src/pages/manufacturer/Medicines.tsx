import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Medicine {
  id: string;
  name: string;
  description: string;
  drug_code: string;
  composition: string;
  dosage: string;
  side_effects: string;
  expiry_months: number;
  created_at: string;
}

export default function ManufacturerMedicines() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    drug_code: '',
    composition: '',
    dosage: '',
    side_effects: '',
    expiry_months: 24
  });

  useEffect(() => {
    fetchMedicines();
  }, [user]);

  const fetchMedicines = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('manufacturer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch medicines",
        variant: "destructive"
      });
    } else {
      setMedicines(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const medicineData = {
      ...formData,
      manufacturer_id: user.id
    };

    let error;
    if (editingMedicine) {
      const { error: updateError } = await supabase
        .from('medicines')
        .update(medicineData)
        .eq('id', editingMedicine.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('medicines')
        .insert([medicineData]);
      error = insertError;
    }

    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingMedicine ? 'update' : 'create'} medicine`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `Medicine ${editingMedicine ? 'updated' : 'created'} successfully`
      });
      setIsDialogOpen(false);
      resetForm();
      fetchMedicines();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      drug_code: '',
      composition: '',
      dosage: '',
      side_effects: '',
      expiry_months: 24
    });
    setEditingMedicine(null);
  };

  const openEditDialog = (medicine: Medicine) => {
    setFormData({
      name: medicine.name,
      description: medicine.description || '',
      drug_code: medicine.drug_code,
      composition: medicine.composition || '',
      dosage: medicine.dosage || '',
      side_effects: medicine.side_effects || '',
      expiry_months: medicine.expiry_months
    });
    setEditingMedicine(medicine);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
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
              <h1 className="text-3xl font-bold">Manage Medicines</h1>
              <p className="text-muted-foreground">Register and manage your medicines</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Medicine
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingMedicine ? 'Update medicine information' : 'Enter medicine details to register it in the system'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Medicine Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="drug_code">Drug Code *</Label>
                      <Input
                        id="drug_code"
                        value={formData.drug_code}
                        onChange={(e) => setFormData({ ...formData, drug_code: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="composition">Composition</Label>
                    <Textarea
                      id="composition"
                      value={formData.composition}
                      onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dosage">Dosage</Label>
                      <Input
                        id="dosage"
                        value={formData.dosage}
                        onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                        placeholder="e.g., 500mg twice daily"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiry_months">Shelf Life (months)</Label>
                      <Input
                        id="expiry_months"
                        type="number"
                        value={formData.expiry_months}
                        onChange={(e) => setFormData({ ...formData, expiry_months: parseInt(e.target.value) })}
                        min="1"
                        max="120"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="side_effects">Side Effects</Label>
                    <Textarea
                      id="side_effects"
                      value={formData.side_effects}
                      onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingMedicine ? 'Update' : 'Create'} Medicine
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6">
          {medicines.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No medicines registered</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding your first medicine to the system
                </p>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Medicine
                </Button>
              </CardContent>
            </Card>
          ) : (
            medicines.map((medicine) => (
              <Card key={medicine.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {medicine.name}
                        <Badge variant="outline">{medicine.drug_code}</Badge>
                      </CardTitle>
                      <CardDescription>{medicine.description}</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(medicine)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-1">Composition</h4>
                      <p className="text-sm text-muted-foreground">
                        {medicine.composition || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Dosage</h4>
                      <p className="text-sm text-muted-foreground">
                        {medicine.dosage || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Shelf Life</h4>
                      <p className="text-sm text-muted-foreground">
                        {medicine.expiry_months} months
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Registered</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(medicine.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {medicine.side_effects && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-1">Side Effects</h4>
                      <p className="text-sm text-muted-foreground">
                        {medicine.side_effects}
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