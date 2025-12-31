import { ReactNode } from 'react';
import { Rnd } from 'react-rnd';
import { useWindowManager } from '../../contexts/WindowContext';
import type { WindowState } from '../../types';
import { WINDOW_DEFAULTS } from '../../types';

interface WindowProps {
  window: WindowState;
  children: ReactNode;
  canClose?: boolean;
}

export function Window({ window, children, canClose = true }: WindowProps) {
  const { closeWindow, minimizeWindow, maximizeWindow, restoreWindow, focusWindow, updateWindowPosition, updateWindowSize } = useWindowManager();

  if (window.isMinimized) {
    return null;
  }

  const config = WINDOW_DEFAULTS[window.type];

  const handleMaximizeToggle = () => {
    if (window.isMaximized) {
      restoreWindow(window.id);
    } else {
      maximizeWindow(window.id);
    }
  };

  return (
    <Rnd
      size={{ width: window.size.width, height: window.size.height }}
      position={{ x: window.position.x, y: window.position.y }}
      onDragStop={(_e, d) => {
        if (!window.isMaximized) {
          updateWindowPosition(window.id, d.x, d.y);
        }
      }}
      onResizeStop={(_e, _direction, ref, _delta, position) => {
        if (!window.isMaximized) {
          updateWindowSize(window.id, ref.offsetWidth, ref.offsetHeight);
          updateWindowPosition(window.id, position.x, position.y);
        }
      }}
      minWidth={config.minWidth}
      minHeight={config.minHeight}
      bounds="parent"
      dragHandleClassName="title-bar"
      style={{ zIndex: window.zIndex, transition: 'all 0.2s ease-in-out' }}
      onMouseDown={() => focusWindow(window.id)}
      disableDragging={window.isMaximized}
      enableResizing={!window.isMaximized}
    >
      <div className="window w-full h-full bg-win95-gray border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex flex-col">
        {/* Title Bar */}
        <div className="title-bar">
          <div className="title-bar-text">
            <span>{window.title}</span>
          </div>
          <div className="title-bar-controls">
            <button
              className="bg-win95-gray border border-white text-black text-xs px-1"
              onClick={() => minimizeWindow(window.id)}
              title="Minimize"
            >
              _
            </button>
            <button
              className="bg-win95-gray border border-white text-black text-xs px-1"
              onClick={handleMaximizeToggle}
              title={window.isMaximized ? 'Restore' : 'Maximize'}
            >
              {window.isMaximized ? '❐' : '□'}
            </button>
            {canClose && (
              <button
                className="bg-win95-gray border border-white text-black text-xs px-1"
                onClick={() => closeWindow(window.id)}
                title="Close"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Window Body */}
        <div className="window-body flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </Rnd>
  );
}
