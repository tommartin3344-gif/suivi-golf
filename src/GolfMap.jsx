import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.2)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const homeIcon = makeIcon('#d9622b');
const tournoiIcon = makeIcon('#0d2340');

export default function GolfMap({ home, tournois }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = [];
    const points = [];

    if (home && home.lat && home.lng) {
      const m = L.marker([home.lat, home.lng], { icon: homeIcon }).addTo(map);
      m.bindPopup('Mon domicile');
      markers.push(m);
      points.push([home.lat, home.lng]);
    }

    tournois.forEach((t) => {
      if (t.lat && t.lng) {
        const m = L.marker([t.lat, t.lng], { icon: tournoiIcon }).addTo(map);
        m.bindPopup(`<strong>${t.nom}</strong>${t.club ? `<br/>${t.club}` : ''}`);
        markers.push(m);
        points.push([t.lat, t.lng]);
      }
    });

    if (points.length > 0) {
      map.fitBounds(points, { padding: [30, 30], maxZoom: 12 });
    } else {
      map.setView([46.6, 2.2], 5); // centre France par défaut
    }

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [home, tournois]);

  return <div ref={containerRef} style={{ width: '100%', height: '360px', borderRadius: '12px' }} />;
}
