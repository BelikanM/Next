// src/components/FootNav.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaHome,
  FaInfoCircle,
  FaEnvelope,
  FaCog,
  FaFolderOpen,
  FaFilm,
} from 'react-icons/fa';

const navItems = [
  {
    name: "Home",
    to: "/",
    icon: <FaHome />,
    color: "#4ade80", // vert clair
  },
  {
    name: "About",
    to: "/about",
    icon: <FaInfoCircle />,
    color: "#60a5fa", // bleu
  },
  {
    name: "Contact",
    to: "/contact",
    icon: <FaEnvelope />,
    color: "#f87171", // rouge clair
  },
  {
    name: "Services",
    to: "/services",
    icon: <FaCog />,
    color: "#fbbf24", // jaune
  },
  {
    name: "Portfolio",
    to: "/portfolio",
    icon: <FaFolderOpen />,
    color: "#a78bfa", // violet clair
  },
  {
    name: "Movies",
    to: "/moviedetail",
    icon: <FaFilm />,
    color: "#f472b6", // rose clair
  },
];

const FootNav = () => {
  return (
    <>
      <nav className="footnav">
        {navItems.map(({ name, to, icon, color }) => (
          <NavLink
            key={name}
            to={to}
            className="footnav-link"
            style={({ isActive }) => ({
              color: isActive ? color : "#ccc",
            })}
            end={to === "/"} // pour ne pas activer sur sous-chemins
            title={name}
          >
            <span
              className="footnav-icon"
              style={{ color }}
              aria-hidden="true"
            >
              {icon}
            </span>
            <span className="footnav-text">{name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Styles */}
      <style>{`
        /* Reset */
        .footnav * {
          box-sizing: border-box;
        }

        .footnav {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          background: #111827; /* gris très foncé */
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 0.5rem 0;
          border-top: 2px solid #1f2937;
          z-index: 1000;
          box-shadow: 0 -2px 5px rgba(0,0,0,0.5);
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          user-select: none;
        }

        /* Liens */
        .footnav-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          font-size: 0.75rem;
          color: #ccc;
          transition: color 0.3s ease;
          padding: 0.25rem 0.5rem;
          flex: 1;
          max-width: 80px;
        }

        .footnav-link:hover {
          color: white;
        }

        .footnav-link:focus-visible {
          outline: 2px solid #60a5fa;
          outline-offset: 2px;
        }

        .footnav-icon {
          font-size: 1.8rem;
          transition: transform 0.3s ease;
        }

        .footnav-link:hover .footnav-icon {
          transform: scale(1.2) rotate(5deg);
        }

        .footnav-text {
          margin-top: 0.3rem;
          white-space: nowrap;
          user-select: none;
        }

        /* Responsive */

        /* Mobile & tablette : texte caché, icônes visibles */
        @media (max-width: 768px) {
          .footnav {
            bottom: 0;
            flex-direction: row;
            padding: 0.4rem 0;
          }

          .footnav-text {
            display: none;
          }
        }

        /* Desktop : nav vertical à gauche, texte visible */
        @media (min-width: 1024px) {
          .footnav {
            position: fixed;
            bottom: unset;
            top: 0;
            left: 0;
            height: 100vh;
            width: 90px;
            padding-top: 1rem;
            flex-direction: column;
            border-top: none;
            border-right: 2px solid #1f2937;
            box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);
          }

          .footnav-link {
            flex-direction: row;
            justify-content: flex-start;
            max-width: 100%;
            padding: 0.75rem 1rem;
            font-size: 1rem;
          }

          .footnav-icon {
            font-size: 1.5rem;
            margin-right: 0.75rem;
          }

          .footnav-text {
            display: inline;
          }

          .footnav-link:hover .footnav-icon {
            transform: scale(1.25) rotate(8deg);
          }
        }

      `}</style>
    </>
  );
};

export default FootNav;
