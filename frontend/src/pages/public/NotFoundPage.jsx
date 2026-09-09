import { Code2, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../styles/public/NotFoundPage.css";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="not-found-page">
      <section className="not-found-card" aria-labelledby="not-found-title">
        <div className="not-found-mark" aria-hidden="true">
          <Code2 />
        </div>
        <p className="not-found-kicker">404</p>
        <h1 id="not-found-title">Page Not Found</h1>
        <p className="not-found-copy">
          The page you are looking for does not exist or may have moved.
        </p>
        <button type="button" className="not-found-home" onClick={() => navigate("/")}>
          <Home />
          Back to Home
        </button>
      </section>
    </main>
  );
}
