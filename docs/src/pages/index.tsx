import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import HeroSlider from '../components/HomepageFeatures/HeroSlider';

import styles from './index.module.css';

function HomepageHero() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <>
      <section className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <p className={styles.heroTagline}>
            VS Code's Missing Snippet Editor
          </p>
          <Heading as="h1" className="hero__title">
            SnippetStudio
          </Heading>
          <p className="hero__subtitle">Create your own autocomplete</p>
          <div className={styles.buttons}>
            <Link
              className="button button--secondary button--lg"
              to="/docs/getting-started/installation"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
      <HeroSlider />
    </>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} — VS Code's Missing Snippet Editor`}
      description="SnippetStudio is a VS Code extension for creating, editing, and managing code snippets without the JSON friction."
    >
      <HomepageHero />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
