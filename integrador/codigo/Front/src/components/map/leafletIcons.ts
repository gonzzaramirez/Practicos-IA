import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export const createUserIcon = () =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background: #3b82f6;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

export const createParkingIcon = (rank: number) =>
  L.divIcon({
    className: "parking-marker",
    html: `<div style="
      background: ${rank === 1 ? "#10b981" : rank === 2 ? "#6b7280" : "#4b5563"};
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: white;
      font-size: 13px;
      font-family: system-ui, -apple-system, sans-serif;
    ">${rank}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

export const createAllParkingIcon = () =>
  L.divIcon({
    className: "all-parking-marker",
    html: `<div style="
      background: #8b5cf6;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

