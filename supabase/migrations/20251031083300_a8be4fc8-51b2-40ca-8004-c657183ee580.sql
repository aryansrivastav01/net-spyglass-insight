-- Create storage bucket for PCAP files
INSERT INTO storage.buckets (id, name, public)
VALUES ('pcap-files', 'pcap-files', false);

-- Create RLS policies for PCAP file uploads
CREATE POLICY "Anyone can upload PCAP files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'pcap-files');

CREATE POLICY "Anyone can read PCAP files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pcap-files');