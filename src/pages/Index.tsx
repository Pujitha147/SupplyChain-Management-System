import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Shield, Users, Package, Truck, CheckCircle } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <QrCode className="h-8 w-8 text-primary mr-2" />
              <span className="font-bold text-xl">MediChain</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link to="/verify">Verify Medicine</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Secure Medicine Supply Chain
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            MediChain ensures medicine authenticity through blockchain-powered tracking. 
            Verify genuine medicines, track supply chain, and report counterfeit products.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/verify">
                <QrCode className="mr-2 h-5 w-5" />
                Verify Medicine Now
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">Join the Network</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader className="text-center">
              <QrCode className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>QR Code Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                Instantly verify medicine authenticity by scanning QR codes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Package className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Supply Chain Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                Track medicines from manufacturer to customer
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Counterfeit Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                Report and track counterfeit medicines in real-time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Multi-Role Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                Different interfaces for manufacturers, distributors, retailers
              </p>
            </CardContent>
          </Card>
        </div>


        {/* CTA Section */}
        <div className="text-center bg-muted/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Ready to Secure Your Supply Chain?</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of healthcare professionals using MediChain to fight counterfeit medicines
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/auth">Get Started Today</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/verify">Try Verification</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
