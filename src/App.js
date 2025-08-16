
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import LinkList from './pages/LinkList';
import AddLink from './pages/AddLink';
import EditLink from './pages/EditLink';
import { supabase } from './supabaseClient';

import { ExportProvider } from './contexts/ExportContext';

function App() {
  const navigate = useNavigate();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      // Check for localStorage data for migration
      const savedLinks = localStorage.getItem('links');
      const migrationComplete = localStorage.getItem('supabaseMigrationComplete');

      if (savedLinks && !migrationComplete) {
        // Migrate data from localStorage to Supabase
        const parsedLinks = JSON.parse(savedLinks);
        if (parsedLinks.length > 0) {
          const { error: insertError } = await supabase
            .from('links')
            .insert(parsedLinks);

          if (insertError) {
            console.error('Error migrating data:', insertError);
            // Even if migration fails, try to fetch from Supabase
          } else {
            localStorage.setItem('supabaseMigrationComplete', 'true');
            console.log('Data migrated from localStorage to Supabase.');
            // Optionally clear localStorage after successful migration
            // localStorage.removeItem('links');
          }
        }
      }

      // Fetch data from Supabase
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('id', { ascending: false }); // Order by id (timestamp) descending

      if (error) {
        console.error('Error fetching links:', error);
      } else {
        setLinks(data);
      }
    } catch (error) {
      console.error('Unexpected error during data fetch/migration:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []); // Empty dependency array means this runs once on mount

  const handleAddLink = async (link) => {
    const newLink = { ...link, id: Date.now() }; // Use Date.now() for id
    const { data, error } = await supabase
      .from('links')
      .insert([newLink])
      .select(); // Select the inserted data to get the actual ID from DB if needed

    if (error) {
      console.error('Error adding link:', error);
    } else if (data && data.length > 0) {
      setLinks((prevLinks) => [data[0], ...prevLinks]); // Add new link to the top
      navigate('/');
    }
  };

  const handleDeleteLink = async (id) => {
    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', id); // Delete by id

    if (error) {
      console.error('Error deleting link:', error);
    }
  };

  const handleUpdateLink = async (updatedLink) => {
    const { data, error } = await supabase
      .from('links')
      .update(updatedLink)
      .eq('id', updatedLink.id)
      .select(); // Select the updated data

    if (error) {
      console.error('Error updating link:', error);
    }
  };

  return (
    <div>
      <ExportProvider> {/* ExportProvider starts here, wrapping Header */}
        <Header />
        <div className="container-fluid">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Routes>
              <Route 
                path="/" 
                element={<LinkList links={links} onDelete={handleDeleteLink} onLinksUpdated={fetchLinks} />} 
              />
              <Route 
                path="/add" 
                element={<AddLink onAdd={handleAddLink} />} 
              />
              <Route 
                path="/edit/:id" 
                element={<EditLink links={links} onUpdate={handleUpdateLink} />} 
              />
            </Routes>
          )}
        </div>
      </ExportProvider> {/* Close ExportProvider */}
    </div>
  );
}

export default App;
