import { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import EventCard from './EventCard';
import './Events.css';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/event-list', { params: { search, category } });
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div className="events-grid">
          {events.map((event) => (
            <EventCard key={event._id} obj={event} onUpdate={fetchEvents} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;
