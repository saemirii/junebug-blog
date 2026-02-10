// Configuration file for Junebug Poetry Blog
// IMPORTANT: Add this file to .gitignore to keep credentials secure

const CONFIG = {
    // Your Supabase project URL
    // Get this from: Project Settings > API > Project URL
    supabaseUrl: 'https://xwphlcpjyrijmftnraht.supabase.co',
    
    // Your Supabase anonymous key
    // Get this from: Project Settings > API > Project API keys > anon public
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3cGhsY3BqeXJpam1mdG5yYWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MTU0MDAsImV4cCI6MjA4Mjk5MTQwMH0.Nz3PPM0TvouVyNngBj7q9HIfTz3hZB16TziNvB0jWi8',
    
    // Admin password for submitting poems
    // Change this to a secure password
    adminPassword: 'admin123'
};

// Example with actual values (replace with your own):
// const CONFIG = {
//     supabaseUrl: 'https://xyzcompany.supabase.co',
//     supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
//     adminPassword: 'MySecurePassword123!'
// };