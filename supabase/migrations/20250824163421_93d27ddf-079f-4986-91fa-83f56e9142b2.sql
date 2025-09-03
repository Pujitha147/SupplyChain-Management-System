-- Recreate the function with proper search_path by dropping and recreating
DROP FUNCTION IF EXISTS public.get_user_role(UUID) CASCADE;

-- Recreate function with proper search_path
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Recreate all the policies that were dropped
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

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

CREATE POLICY "Admins can update counterfeit reports"
  ON public.counterfeit_reports FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin');