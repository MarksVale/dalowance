CREATE TABLE spend_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  amount numeric NOT NULL,
  note text,
  logged_at timestamptz DEFAULT now()
);
ALTER TABLE spend_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner" ON spend_logs
  FOR ALL USING (auth.uid() = user_id);
