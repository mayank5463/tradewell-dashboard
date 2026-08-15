import { Link } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
  return (
    <div className="notfound">
      <div className="notfound-card">
        <span className="notfound-code">404</span>
        <h1 className="notfound-title">This page took a wrong turn</h1>
        <p className="notfound-text">
          The page you're looking for doesn't exist, moved, or the URL was mistyped.
        </p>
        <Link to="/dashboard" className="notfound-btn">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}