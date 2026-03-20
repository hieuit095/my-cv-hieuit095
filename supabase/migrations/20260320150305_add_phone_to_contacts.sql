/*
  # Add phone column to contacts table

  ## Changes
  - `contacts` table: adds `phone` (text, optional) column to store the sender's phone number

  ## Notes
  - Column is nullable; existing rows will have NULL for phone
  - Max 30 characters, consistent with the profile phone field
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'phone'
  ) THEN
    ALTER TABLE contacts ADD COLUMN phone text CHECK (char_length(phone) <= 30);
  END IF;
END $$;
