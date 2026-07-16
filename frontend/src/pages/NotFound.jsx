import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="notfound-container">
      <div className="notfound-card">
        <h1>404</h1>
        <h2>Route Not Found</h2>
        <p>The page you are trying to access doesn't exist or has been moved.</p>
        <Link to="/" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
