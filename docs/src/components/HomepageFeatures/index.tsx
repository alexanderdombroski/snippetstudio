import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  imageSrc: string;
  imageAlt: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Create',
    imageSrc: require('@site/static/img/vscode.png').default,
    imageAlt: 'VS Code editor with the SnippetStudio view open',
    description: (
      <>
        Author snippets in a structured editor — no hand-writing JSON.
      </>
    ),
  },
  {
    title: 'Share',
    imageSrc: require('@site/static/img/server.png').default,
    imageAlt: 'Syncing snippets to a GitHub gist',
    description: (
      <>
        Sync your global snippets or publish gists through GitHub.
      </>
    ),
  },
  {
    title: 'Open source',
    imageSrc: require('@site/static/img/program.png').default,
    imageAlt: 'SnippetStudio source code',
    description: (
      <>
        SnippetStudio is built in TypeScript and released under the MIT
        license. Contributions are welcome.
      </>
    ),
  },
];

function Feature({title, imageSrc, imageAlt, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <img src={imageSrc} alt={imageAlt} className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
