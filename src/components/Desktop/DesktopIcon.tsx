import { useState, useEffect } from 'react';

interface DesktopIconProps {
  icon: string;
  label: string;
  onDoubleClick: () => void;
}

export function DesktopIcon({ icon, label, onDoubleClick }: DesktopIconProps) {
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (clickCount === 1) {
      const timer = setTimeout(() => setClickCount(0), 300);
      return () => clearTimeout(timer);
    } else if (clickCount === 2) {
      onDoubleClick();
      setClickCount(0);
    }
  }, [clickCount, onDoubleClick]);

  const handleClick = () => {
    setClickCount((prev) => prev + 1);
  };

  return (
    <div className="desktop-icon" onClick={handleClick}>
      <div className="text-4xl">{icon}</div>
      <div className="desktop-icon-text">{label}</div>
    </div>
  );
}
