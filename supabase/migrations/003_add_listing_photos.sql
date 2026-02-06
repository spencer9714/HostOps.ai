-- Add photo_url to listings table
ALTER TABLE listings ADD COLUMN photo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN listings.photo_url IS 'URL of the property photo (can be from Airbnb or uploaded to storage)';
