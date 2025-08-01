import { useRef, useEffect, useState } from 'react';
import styles from './HeroSlider.module.css';

type imageArray = { src: string, alt: string }[]

const initialGifs: imageArray = [
  { src: require('@site/static/img/home/gifs/ejs.gif').default, alt: 'ejs' },
  { src: require('@site/static/img/home/gifs/express.gif').default, alt: 'express' },
  { src: require('@site/static/img/home/gifs/html.gif').default, alt: 'html' },
  { src: require('@site/static/img/home/gifs/css.gif').default, alt: 'css' },
  { src: require('@site/static/img/home/gifs/jsx.gif').default, alt: 'jsx' },
  { src: require('@site/static/img/home/gifs/md.gif').default, alt: 'md' },
  { src: require('@site/static/img/home/gifs/python.gif').default, alt: 'python' },
  { src: require('@site/static/img/home/gifs/cs.gif').default, alt: 'csharp' },
];

function HeroSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [gifList, setGifList] = useState<imageArray>(initialGifs);

  useEffect(() => {
    const container = containerRef.current;
    let frameId: number;

    const autoScroll = () => {
      if (!container || isGrabbing) {
        frameId = requestAnimationFrame(autoScroll);
        return;
      }

      container.scrollLeft += 2;

      const firstImage = container.querySelector('img');
      if (firstImage) {
        const firstRect = firstImage.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        if (firstRect.right < containerRect.left - (firstRect.width * 2)) {
          // First image is out of view, move it to the end
          setGifList((prev) => {
            const [first, second, third, ...rest] = prev;
            return [...rest, first, second, third];
          });

          // Reset scroll to compensate for image shift
          container.scrollLeft = 0;
        }
      }

      frameId = requestAnimationFrame(autoScroll);
    };

    frameId = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(frameId);
  }, [isGrabbing]);

  const handleMouseDown = () => setIsGrabbing(true);
  const handleMouseUp = () => setIsGrabbing(false);
  const handleMouseLeave = () => setIsGrabbing(false);

  return (
    <div
      className={styles.slider}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {gifList.map(({src, alt}, i) => (
        <img key={alt} src={src} alt={`snippet in a ${alt} file`} className={styles.gif} draggable={false} />
      ))}
    </div>
  );
}

export default HeroSlider;
