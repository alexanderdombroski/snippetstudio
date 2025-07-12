---
title: Sync Flow
sidebar_label: Sync Flow
sidebar_position: 2
sidebar_class_name: mermaid
---

# Sync Flow

Sync Global Snippets uses the following logic to ensure your snippets can make it to GitHub and back.

## Local Git

```mermaid
graph TD
    A[Start Sync] --> A1{is git repo?};
    A1 -- No --> B(git init);
    B -- success --> B1(git remote add);
    A1 -- Yes --> C{git status};
    B1 -- failed --> B_FAIL([End: Init failed]);
    B -- failed --> B_FAIL;
    B1 -- success --> C;
    C --> C1(has changes?);
    C1 -- Yes --> D[git commit];
    C1 -- No --> E;
    D --> E{Repo on GitHub?};
```

If yes, jump to [Repo Exists](#repo-exists)

## Repo Doesn't exist

```mermaid
graph TD
    F{Repo on GitHub?} -- No --> G{user is owner?};
    G -- No --> G_NO([End: Tell owner to create]);
    G -- Yes --> H{git remote -v};
    H --> H1{user wanted to change remote?};
    H1 -- Yes --> I{git remote set-url};
    I -- failed --> I_FAIL([End: set-url failed]);
    I -- success --> J{{Promise.all}};
    H1 -- No --> J;
    J --> J1[Create repo on GitHub];
    J --> J2[Create .gitignore];
    J --> J3[Create readme.md];
    J1 --> K[git commit];
    J2 --> K;
    J3 --> K;
    K --> L{push};
    L -- success --> L_OK([End: Success]);
    L -- failed --> L_FAIL([End: Push failed]);
```

## Repo Exists

```mermaid
graph TD
    F{Repo on GitHub?} -- Yes --> M{git remote -v};
    M --> M1{user wanted to change remote?};
    M1 -- No --> N{commited earlier?};
    N -- No --> O{pull};
    O -- success --> O_OK([End: Success, pulled]);
    O -- failed --> O_FAIL([End: Pull failed]);

    N -- Yes --> P{pull};
    P -- success --> Q{push};
    Q -- success --> Q_OK([End: Success, synced]);
    Q -- failed --> R([End: Merge Conflict]);
    P -- failed --> R;

    M1 -- Yes --> S{git remote set-url};
    S -- failed --> S_FAIL([End: set-url failed]);
    S -- success --> T([End: Merge Conflict]);
```

### Resolving Conflicts

If there is a merge conflict these final steps are taken to resolve them: 

1. The [collaborate flow](/docs/github-integration/truly-global/collaborate-flow.md) of the Merge Snippet Repo command
2. `git commit`
3. `git push`

Because snippet files are just JavaScript objects, its much easier to perform a *collision-resolving union* of two JS objects instead of come up with a fancy way to resolve git conflicts and run `git merge`. Your commit history will be linear because there is never any branching, rebasing, cherry-picking, or merging (except pull). It really is just committing and pushing
