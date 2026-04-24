import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

import Navbar from './components/Navbar/Navbar';
import Home from './components/Home/Home';
import EventList from './components/Event/EventList';
import Dashboard from './components/Dashboard/Dashboard';
import CreateEvent from './components/Event/CreateEvent';
import UpdateEvent from './components/Event/UpdateEvent';

import './App.css'; // Keep if any old styles remain, else we will delete it

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="loading-skeleton">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const { loading } = useContext(AuthContext);

  if (loading) return null; // Or a global spinner

  return (
    <div className="app-container">
      <HashRouter>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/create-event" element={
              <ProtectedRoute roles={['admin', 'organizer']}>
                <CreateEvent />
              </ProtectedRoute>
            } />
            <Route path="/update-event/:id" element={
              <ProtectedRoute roles={['admin', 'organizer']}>
                <UpdateEvent />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </HashRouter>
    </div>
  );
}

export default App;
