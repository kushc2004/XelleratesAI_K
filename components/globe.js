'use client';
import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';

const Globe = () => {
  const canvasRef = useRef();

  useEffect(() => {
    let phi = 0;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.1 },
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.01;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <style jsx>{`
        .globe-container {
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: transparent;
          height: 600px;
          margin-top: 4rem;
        }
        canvas {
          width: 600px;
          height: 600px;
        }
      `}</style>
      <div className='globe-container'>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default Globe;
