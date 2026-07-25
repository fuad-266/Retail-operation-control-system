import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

export default function UnauthorizedPage() {
    return (
        <div className="unauthorized-page" id="unauthorized-page">
            <div className="unauthorized-card">
                <ShieldOff size={64} />
                <h1>Access Denied</h1>
                <p>You don't have permission to view this page.</p>
                <Link to="/login" className="btn btn-primary">Back to Login</Link>
            </div>
        </div>
    );
}
