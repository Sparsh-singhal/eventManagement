import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import { FaMapMarkerAlt, FaCalendarAlt, FaClock } from 'react-icons/fa';

export default function EventCard({ obj, onUpdate }) {
    const { _id, name, date, place, club, description, slots, startTime, endTime, imageUrl, category, status } = obj;
    const { user } = useContext(AuthContext);
    
    const isRegistered = obj.registeredUsers?.some(u => u.username === user?.username);
    const badgeClass = `badge badge-${status}`;

    const handleRegister = async () => {
        if (!user) {
            toast.error("Please login to register");
            return;
        }
        
        try {
            toast.info("Processing registration...");
            const res = await api.post(`/register-event/${_id}`);
            
            if (res.data.waitlisted) {
                toast.warning(res.data.message); // Yellow toast for waitlist
            } else {
                toast.success(res.data.message);
            }
            if(onUpdate) onUpdate();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to register");
        }
    };

    return (
        <div className="card event-card">
            <div className="event-image" style={{ backgroundImage: `url(${imageUrl})` }}>
                <div className="event-category-badge">{category}</div>
            </div>
            <div className="event-content">
                <div className="badges" style={{marginBottom: '0.5rem'}}>
                    <span className={badgeClass}>{status}</span>
                </div>
                <h3 className="event-title">{name}</h3>
                <p className="event-club">{club}</p>
                <div className="event-details">
                    <span><FaCalendarAlt /> {new Date(date).toLocaleDateString()}</span>
                    <span><FaClock /> {startTime} - {endTime}</span>
                    <span><FaMapMarkerAlt /> {place}</span>
                </div>
                <p className="event-description">{description}</p>
                
                <div className="event-footer">
                    <span className="slots-left">{slots} slots left</span>
                    {(!user || user.role === 'attendee') && (
                        isRegistered ? (
                            <button className="btn btn-secondary" disabled>Registered</button>
                        ) : (
                            <button className="btn btn-primary" onClick={handleRegister} disabled={slots === 0}>
                                {slots === 0 ? 'Full' : 'Book Now'}
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
