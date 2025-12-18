-- Create a table for storing about company content
CREATE TABLE public.about_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;

-- Anyone can view the about content
CREATE POLICY "Anyone can view about content" 
ON public.about_content 
FOR SELECT 
USING (true);

-- Only admins can update about content
CREATE POLICY "Admins can update about content" 
ON public.about_content 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert about content
CREATE POLICY "Admins can insert about content" 
ON public.about_content 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial empty content
INSERT INTO public.about_content (content) VALUES ('Welcome to XSUS Electronics! We are a trusted platform for device investments.');