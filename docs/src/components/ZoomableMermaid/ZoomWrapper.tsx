import React, { useEffect, useRef, type ReactNode } from 'react';
import svgPanZoom from 'svg-pan-zoom';
import styles from './ZoomWrapper.module.css';

type ZoomWrapperProps = {
  children: ReactNode;
  height?: string;
};

export default function ZoomWrapper({ children, height = '40rem' }: ZoomWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let panZoomInstance: SvgPanZoom.Instance;

    const initPanZoom = () => {
      if (panZoomInstance || !containerRef.current) return;
      const svg = containerRef.current.querySelector('svg');
      if (svg) {
        panZoomInstance = svgPanZoom(svg, {
          zoomEnabled: true,
          panEnabled: true,
          controlIconsEnabled: true,
          fit: true,
          center: true,
          minZoom: 0.1,
        });

        resetRef.current = containerRef.current.querySelector('#svg-pan-zoom-reset-pan-zoom');
      }
    };

    const observer = new MutationObserver(initPanZoom);

    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }

    initPanZoom();

    const handleResize = () => {
      if (panZoomInstance) {
        panZoomInstance.resize();
        panZoomInstance.center();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      if (panZoomInstance) {
        panZoomInstance.destroy();
      }
    };
  }, []);

  const handleFullScreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        containerRef.current.classList.remove('full');
        if (resetRef.current) {
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
          });
          resetRef.current.dispatchEvent(clickEvent);
        }
      } else {
        containerRef.current.requestFullscreen();
        containerRef.current.classList.add('full');
      }
    }
  };

  const handleReset = () => {
    if (resetRef.current) {
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      resetRef.current.dispatchEvent(clickEvent);
    }
  };

  return (
    <div ref={containerRef} className={styles.zoomContainer} style={{ height }}>
      <button onClick={handleReset} className={styles.resetButton}>
        <i className="codicon codicon-sync"></i>
      </button>
      <button onClick={handleFullScreen} className={styles.fullscreenButton}>
        <i className="codicon codicon-screen-full"></i>
      </button>
      {children}
    </div>
  );
}