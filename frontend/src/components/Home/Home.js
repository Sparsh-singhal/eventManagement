import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import './Home.css';

export default function Home() {
    return (
        <div className="home-container">
            <section className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">
                        ‘ Simplify ’ your <span className="highlight">Events</span>
                    </h1>
                    <p className="hero-subtitle">
                        Explore the magic of EVENTIFY. A go-to solution for managing amazing events effortlessly. From easy sign-ups to managing event schedules, our platform has everything you need.
                    </p>
                    <div className="hero-actions">
                        <Link to="/events" className="btn btn-primary btn-lg">
                            Explore Events <FaArrowRight />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
