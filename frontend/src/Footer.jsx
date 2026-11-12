import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import "./Footer.css";

export default function Footer({ linkedinUrl, onAbout }) {
    const year = new Date().getFullYear();

    return (
        <footer className="app-footer">
            <p className="footer-credit">
                © {year} Mayuree Reunsati
            </p>

            <p className="footer-message">
                Made with care, one step at a time.
            </p>

            <nav className="footer-links" aria-label="Footer navigation">
                <button
                    className="footer-about-button"
                    type="button"
                    onClick={onAbout}
                >
                    About Tulenkki
                </button>
                <a
                    href="https://github.com/mareerray"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Mayuree on GitHub (opens in a new tab)"
                >
                    <FaGithub aria-hidden="true" />
                    <span>GitHub</span>
                </a>

                {linkedinUrl && (
                    <a
                        href={linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Mayuree on LinkedIn (opens in a new tab)"
                    >
                        <FaLinkedinIn aria-hidden="true" />
                        <span>LinkedIn</span>
                    </a>
                )}
            </nav>
        </footer>
    );
}