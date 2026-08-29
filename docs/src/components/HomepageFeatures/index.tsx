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

const CreateFeature: FeatureItem = {
  title: 'Create',
  imageSrc: require('@site/static/img/vscode.png').default,
  imageAlt: 'VS Code editor with the SnippetStudio view open',
  description: (
    <>
      Author snippets in a structured editor — no hand-writing JSON.
    </>
  ),
};

type ReasonItem = {
  icon: string;
  text: ReactNode;
};

const Reasons: ReasonItem[] = [
  {
    icon: 'codicon-law',
    text: (
      <>
        <strong>Open source &amp; MIT licensed</strong> — free to use, fork,
        and contribute to.
      </>
    ),
  },
  {
    icon: 'codicon-sparkle',
    text: (
      <>
        <strong>Minimal &amp; offline-first</strong> — no accounts or servers
        required to get started; your snippets live on your machine.
      </>
    ),
  },
  {
    icon: 'codicon-layout',
    text: (
      <>
        <strong>VS Code-native layout</strong> — built with the native tree
        views and command palette, not heavy webviews.
      </>
    ),
  },
  {
    icon: 'codicon-archive',
    text: (
      <>
        <strong>Portable &amp; backed up</strong> — import and export to
        <code>.code-snippets</code> so your collection travels with you.
      </>
    ),
  },
  {
    icon: 'codicon-extensions',
    text: (
      <>
        <strong>Works everywhere</strong> — runs on VS Code, VSCodium, Cursor,
        Windsurf, and other compatible editors.
      </>
    ),
  },
];

function CreateFeatureCard({title, imageSrc, imageAlt, description}: FeatureItem) {
  return (
    <div className={styles.createRow}>
      <img
        src={imageSrc}
        alt={imageAlt}
        className={styles.createImage}
        role="img"
      />
      <div className={styles.createText}>
        <Heading as="h2">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

function Reason({icon, text}: ReasonItem) {
  return (
    <li className={styles.reasonItem}>
      <i className={clsx('codicon', icon, styles.reasonIcon)} aria-hidden="true" />
      <span className={styles.reasonText}>{text}</span>
    </li>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.createBlock}>
          <CreateFeatureCard {...CreateFeature} />
        </div>
        <div className={styles.reasonsBlock}>
          <Heading as="h2" className={styles.reasonsTitle}>
            Why SnippetStudio
          </Heading>
          <ul className={styles.reasonList}>
            {Reasons.map((props, idx) => (
              <Reason key={idx} {...props} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
