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
    imageAlt: 'vscode on a laptop',
    description: (
      <>
        Create your own code snippets for your favorite Microsoft code editor: VS Code!
      </>
    ),
  },
  {
    title: 'Share',
    imageSrc: require('@site/static/img/server.png').default,
    imageAlt: '',
    description: (
      <>
        Regularly sync your global snippets or share your snippet gists through GitHub, 
        Microsoft's version control service.
      </>
    ),
  },
  {
    title: 'Collaborate',
    imageSrc: require('@site/static/img/program.png').default,
    imageAlt: 'two characters coding',
    description: (
      <>
        SnippetStudio is made using TypeScript (created by Microsoft). Thanks
        Microsoft! <i>Message not sponsored by Microsoft.</i>
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
