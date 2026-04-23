import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import './Dashboard.css';

export default function Dashboard() {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch notifications
                const notifRes = await api.get('/notifications');
                setNotifications(notifRes.data);

                if (user.role === 'admin' || user.role === 'organizer') {
                    const statsRes = await api.get('/dashboard-stats');
                    setStats(statsRes.data);
                    
                    const eventsRes = await api.get('/event-list');
                    setEvents(eventsRes.data.events.filter(e => e.organizerId?._id === user.id || user.role === 'admin'));
                } else {
                    const userRes = await api.get(`/check-user/${user.username}`);
                    setEvents(userRes.data.bookedEvents || []);
                }
            } catch (err) {
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user]);

    const markNotificationsRead = async () => {
        try {
            await api.put('/notifications/mark-read');
            setNotifications(prev => prev.map(n => ({...n, readStatus: true})));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="loading-grid"><div className="skeleton-card"></div></div>;

    return (
        <div className="dashboard-container">
            <h1 style={{marginBottom: '2rem'}}>Welcome, {user.username}</h1>
            
            {(user.role === 'admin' || user.role === 'organizer') && stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Events</h3>
                        <p className="stat-value">{stats.totalEvents}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Active Events</h3>
                        <p className="stat-value">{stats.activeEvents}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Total Registrations</h3>
                        <p className="stat-value">{stats.totalRegistrations}</p>
                    </div>
                </div>
            )}

            <div className="dashboard-section" style={{marginBottom: '2rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h2>Notifications</h2>
                    {notifications.some(n => !n.readStatus) && (
                        <button className="btn btn-secondary" onClick={markNotificationsRead}>Mark All Read</button>
                    )}
                </div>
                <div style={{marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    {notifications.map(notif => (
                        <div key={notif._id} style={{padding: '1rem', background: notif.readStatus ? 'transparent' : 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius)'}}>
                            <p style={{fontWeight: notif.readStatus ? '400' : '600'}}>{notif.message}</p>
                            <span className="text-muted" style={{fontSize: '0.75rem'}}>{new Date(notif.createdAt).toLocaleString()}</span>
                        </div>
                    ))}
                    {notifications.length === 0 && <p className="text-muted">No new notifications.</p>}
                </div>
            </div>

            <div className="dashboard-section">
                <h2>{(!user.role || user.role === 'attendee') ? 'My Tickets' : 'Manage Events'}</h2>
                <div className="events-grid" style={{marginTop: '1.5rem'}}>
                    {events.map(event => (
                        <div key={event._id} className="card dashboard-event-card">
                            <div style={{padding: '1.5rem'}}>
                                <h3>{event.name}</h3>
                                <p className="text-muted">{new Date(event.date).toLocaleDateString()}</p>
                                <div style={{marginTop: '1rem'}}>
                                    {(!user.role || user.role === 'attendee') ? (
                                        <button className="btn btn-primary" onClick={() => setSelectedTicket(event)}>
                                            View Ticket (QR)
                                        </button>
                                    ) : (
                                        <span className={`badge badge-${event.status}`}>{event.status}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && <p className="text-muted">No events found.</p>}
                </div>
            </div>

            {selectedTicket && (
                <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
                    <div className="modal-content" style={{textAlign: 'center', padding: '2rem'}} onClick={e => e.stopPropagation()}>
                        <h2>{selectedTicket.name} - Ticket</h2>
                        <p className="text-muted" style={{marginBottom: '2rem'}}>Scan at the entrance</p>
                        <div style={{background: 'white', padding: '1rem', display: 'inline-block', borderRadius: '0.5rem', marginBottom: '2rem'}}>
                            <QRCodeSVG value={JSON.stringify({eventId: selectedTicket._id, userId: user.id})} size={200} />
                        </div>
                        <button className="btn btn-secondary" style={{width: '100%'}} onClick={() => setSelectedTicket(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
