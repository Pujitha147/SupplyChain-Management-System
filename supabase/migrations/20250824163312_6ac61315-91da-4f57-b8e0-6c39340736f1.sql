-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('admin', 'manufacturer', 'distributor', 'retailer', 'customer');

-- Create medicine status enum
CREATE TYPE public.medicine_status AS ENUM ('manufactured', 'distributed', 'delivered', 'sold', 'expired', 'recalled');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  company_name TEXT,
  address TEXT,
  phone TEXT,
  license_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medicines table
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  manufacturer_id UUID NOT NULL REFERENCES public.profiles(id),
  drug_code TEXT NOT NULL,
  composition TEXT,
  dosage TEXT,
  side_effects TEXT,
  expiry_months INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create batches table
CREATE TABLE public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id UUID NOT NULL REFERENCES public.medicines(id),
  batch_number TEXT NOT NULL UNIQUE,
  qr_code TEXT NOT NULL UNIQUE,
  manufacture_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  current_quantity INTEGER NOT NULL,
  status medicine_status NOT NULL DEFAULT 'manufactured',
  manufacturer_id UUID NOT NULL REFERENCES public.profiles(id),
  current_owner_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supply chain transactions table
CREATE TABLE public.supply_chain_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id),
  from_user_id UUID REFERENCES public.profiles(id),
  to_user_id UUID NOT NULL REFERENCES public.profiles(id),
  transaction_type TEXT NOT NULL, -- 'manufacture', 'distribute', 'deliver', 'sell'
  quantity INTEGER NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reports table for counterfeit detection
CREATE TABLE public.counterfeit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id),
  qr_code TEXT NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id),
  report_type TEXT NOT NULL, -- 'counterfeit', 'suspicious', 'damaged'
  description TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'investigating', 'resolved', 'false_alarm'
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create verification logs table
CREATE TABLE public.verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id),
  qr_code TEXT NOT NULL,
  verifier_id UUID REFERENCES public.profiles(id),
  verification_result TEXT NOT NULL, -- 'authentic', 'counterfeit', 'not_found'
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_chain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counterfeit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Anyone can view company profiles"
  ON public.profiles FOR SELECT
  USING (role IN ('manufacturer', 'distributor', 'retailer'));

-- RLS Policies for medicines
CREATE POLICY "Anyone can view medicines"
  ON public.medicines FOR SELECT
  USING (true);

CREATE POLICY "Manufacturers can create medicines"
  ON public.medicines FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'manufacturer' 
    AND manufacturer_id = auth.uid()
  );

CREATE POLICY "Manufacturers can update their medicines"
  ON public.medicines FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'manufacturer' 
    AND manufacturer_id = auth.uid()
  );

-- RLS Policies for batches
CREATE POLICY "Anyone can view batches"
  ON public.batches FOR SELECT
  USING (true);

CREATE POLICY "Manufacturers can create batches"
  ON public.batches FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'manufacturer' 
    AND manufacturer_id = auth.uid()
  );

CREATE POLICY "Supply chain participants can update batches"
  ON public.batches FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) IN ('manufacturer', 'distributor', 'retailer', 'admin')
    AND (
      manufacturer_id = auth.uid() 
      OR current_owner_id = auth.uid()
      OR public.get_user_role(auth.uid()) = 'admin'
    )
  );

-- RLS Policies for transactions
CREATE POLICY "Supply chain participants can view relevant transactions"
  ON public.supply_chain_transactions FOR SELECT
  USING (
    from_user_id = auth.uid() 
    OR to_user_id = auth.uid()
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Supply chain participants can create transactions"
  ON public.supply_chain_transactions FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('manufacturer', 'distributor', 'retailer')
    AND (from_user_id = auth.uid() OR to_user_id = auth.uid())
  );

-- RLS Policies for counterfeit reports
CREATE POLICY "Anyone can view counterfeit reports"
  ON public.counterfeit_reports FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create counterfeit reports"
  ON public.counterfeit_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update counterfeit reports"
  ON public.counterfeit_reports FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for verification logs
CREATE POLICY "Anyone can view verification logs"
  ON public.verification_logs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create verification logs"
  ON public.verification_logs FOR INSERT
  WITH CHECK (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at
  BEFORE UPDATE ON public.medicines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_counterfeit_reports_updated_at
  BEFORE UPDATE ON public.counterfeit_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();