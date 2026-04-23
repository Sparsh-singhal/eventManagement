import { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import EventCard from './EventCard';
import './Events.css';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/event-list', { params: { search, category, page, limit: 9 } });
      setEvents(res.data.events || res.data); // Fallback for old API just in case
      if (res.data.totalPages) setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, category]);

  return (
    <div className="event-list-container">
      <div className="event-filters">
        <input 
          type="text" 
          placeholder="Search events..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="category-select">
          <option value="All">All Categories</option>
          <option value="Tech">Tech</option>
          <option value="Music">Music</option>
          <option value="Art">Art</option>
          <option value="Business">Business</option>
          <option value="General">General</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-grid">
          {[1,2,3,4,5,6].map(n => <div key={n} className="card skeleton-card"></div>)}
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">No events found. Try adjusting your filters.</div>
      ) : (
        <>
          <div className="events-grid">
            {events.map((event) => (
              <EventCard key={event._id} obj={event} onUpdate={fetchEvents} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination-controls" style={{display:'flex', justifyContent:'center', gap:'1rem', marginTop:'2rem'}}>
              <button 
                className="btn btn-secondary" 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}>
                  Previous
              </button>
              <span style={{alignSelf:'center', fontWeight:500}}>Page {page} of {totalPages}</span>
              <button 
                className="btn btn-secondary" 
                disabled={page === totalPages} 
                onClick={() => setPage(p => p + 1)}>
                  Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventList;
