-- Helper function to check group membership (bypasses RLS recursion using SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_group_member(group_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_uuid AND user_id = user_uuid
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Drop existing SELECT policies that cause recursion
DROP POLICY IF EXISTS "Public groups viewable" ON public.groups;
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;

-- Recreate groups SELECT policy using the helper function
CREATE POLICY "Public groups viewable" ON public.groups FOR SELECT USING (
  is_public = true OR
  owner_id = auth.uid() OR
  public.is_group_member(id, auth.uid())
);

-- Recreate group members SELECT policy using the helper function
CREATE POLICY "Members can view group members" ON public.group_members FOR SELECT USING (
  user_id = auth.uid() OR
  public.is_group_member(group_id, auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.groups g 
    WHERE g.id = group_id AND (g.is_public = true OR g.owner_id = auth.uid())
  )
);
