-- Create question_sets table to store quiz collections
CREATE TABLE IF NOT EXISTS question_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'unlisted')),
  cover_image TEXT,
  question_count INTEGER DEFAULT 0,
  copy_count INTEGER DEFAULT 0,
  copied_from UUID REFERENCES question_sets(id) ON DELETE SET NULL,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table to store individual questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_set_id UUID NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  topic TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- =====================
-- Question Sets Policies
-- =====================

-- Policy: Everyone can view public and unlisted question sets
CREATE POLICY "Anyone can view public question sets" ON question_sets
  FOR SELECT USING (
    visibility IN ('public', 'unlisted') 
    OR is_system = TRUE
    OR owner_id = auth.uid()
  );

-- Policy: Authenticated users can create question sets
CREATE POLICY "Users can create question sets" ON question_sets
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND owner_id = auth.uid()
  );

-- Policy: Users can update their own question sets
CREATE POLICY "Users can update own question sets" ON question_sets
  FOR UPDATE USING (owner_id = auth.uid());

-- Policy: Users can delete their own question sets (except system sets)
CREATE POLICY "Users can delete own question sets" ON question_sets
  FOR DELETE USING (owner_id = auth.uid() AND is_system = FALSE);

-- =====================
-- Questions Policies
-- =====================

-- Policy: Anyone can view questions from accessible question sets
CREATE POLICY "Anyone can view questions from accessible sets" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM question_sets qs 
      WHERE qs.id = questions.question_set_id
      AND (
        qs.visibility IN ('public', 'unlisted')
        OR qs.is_system = TRUE
        OR qs.owner_id = auth.uid()
      )
    )
  );

-- Policy: Users can insert questions into their own question sets
CREATE POLICY "Users can insert questions into own sets" ON questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM question_sets qs 
      WHERE qs.id = questions.question_set_id 
      AND qs.owner_id = auth.uid()
    )
  );

-- Policy: Users can update questions in their own question sets
CREATE POLICY "Users can update questions in own sets" ON questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM question_sets qs 
      WHERE qs.id = questions.question_set_id 
      AND qs.owner_id = auth.uid()
    )
  );

-- Policy: Users can delete questions from their own question sets
CREATE POLICY "Users can delete questions from own sets" ON questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM question_sets qs 
      WHERE qs.id = questions.question_set_id 
      AND qs.owner_id = auth.uid()
    )
  );

-- =====================
-- Indexes
-- =====================

CREATE INDEX IF NOT EXISTS idx_question_sets_owner_id ON question_sets(owner_id);
CREATE INDEX IF NOT EXISTS idx_question_sets_visibility ON question_sets(visibility);
CREATE INDEX IF NOT EXISTS idx_question_sets_is_system ON question_sets(is_system);
CREATE INDEX IF NOT EXISTS idx_questions_question_set_id ON questions(question_set_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);

-- =====================
-- Triggers
-- =====================

-- Create trigger to auto-update updated_at for question_sets
CREATE TRIGGER update_question_sets_updated_at
  BEFORE UPDATE ON question_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update question_count when questions are added/removed
CREATE OR REPLACE FUNCTION update_question_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE question_sets 
    SET question_count = question_count + 1 
    WHERE id = NEW.question_set_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE question_sets 
    SET question_count = question_count - 1 
    WHERE id = OLD.question_set_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for question count
CREATE TRIGGER update_question_count_on_insert
  AFTER INSERT ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_question_count();

CREATE TRIGGER update_question_count_on_delete
  AFTER DELETE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_question_count();

