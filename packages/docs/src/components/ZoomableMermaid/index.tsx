import Mermaid from '@theme/Mermaid';
import BrowserOnly from '@docusaurus/BrowserOnly';

type ZoomableMermaidProps = {
  children: string;
  height?: string;
};

export default function ZoomableMermaid({ children, height }: ZoomableMermaidProps) {
  const chart = typeof children === 'string' ? children.trim() : '';
  return (
    <BrowserOnly fallback={<div>Loading...</div>}>
      {() => {
        const ZoomWrapper = require('./ZoomWrapper').default
        return (
          <ZoomWrapper height={height}>
            <Mermaid value={chart} />
          </ZoomWrapper>
        );
      }}
    </BrowserOnly>
  );
}
