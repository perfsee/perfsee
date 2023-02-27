# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.3.0](https://github.com/perfsee/perfsee/compare/v1.2.0...v1.3.0) (2023-02-27)

### Bug Fixes

- add baseline on webhook ([d243069](https://github.com/perfsee/perfsee/commit/d2430693091736f8ba6ad33d9c06216f991f6706))
- **platform-server:** artifact link use public path ([d4add46](https://github.com/perfsee/perfsee/commit/d4add4638276c2cb48ae04579b93b93291d0c78f))
- **platform-server:** correct dataloader return type ([2c0e00d](https://github.com/perfsee/perfsee/commit/2c0e00dbacaf5ba20b842b5f8078ea053c5e6953))
- **platform-server:** delete relevant files in storage when property is deleted ([e30b9b5](https://github.com/perfsee/perfsee/commit/e30b9b5904b03806c9b1a90a6810c4ba1622e96b))
- **schema:** convert schema to commonjs ([a306643](https://github.com/perfsee/perfsee/commit/a3066438dc251bfb2d16ab64be9aa8e0852222e3))

### Features

- organization ([4aab6fc](https://github.com/perfsee/perfsee/commit/4aab6fce6b082571c1983851ba8b177457de044b))
- **platform,platform-server:** allow anonymous users visit public project ([bf32d38](https://github.com/perfsee/perfsee/commit/bf32d3865f55d56be1e71d4d0c2a2ac6141dd0c4))
- **platform,platform-server:** show commit message ([b3ea2fd](https://github.com/perfsee/perfsee/commit/b3ea2fd65f67b8fec22369e69b07dfc0ec47d2ff))
- **platform,platform-server:** webhook ([061c081](https://github.com/perfsee/perfsee/commit/061c081bfdcfc7125828eae948193f673092cd0d))
- **platform:** install app page ([9f3a089](https://github.com/perfsee/perfsee/commit/9f3a0899ffa01b431deb778e1f78b691f3c60aaf))

# [1.2.0](https://github.com/perfsee/perfsee/compare/v1.1.1...v1.2.0) (2022-12-19)

### Features

- **platform-server:** usage packs and project usage limitation ([2277911](https://github.com/perfsee/perfsee/commit/2277911471a0d21092b19959b161787ebff393d3))
- **platform:** add project usage information ([cf92ebf](https://github.com/perfsee/perfsee/commit/cf92ebfe3cf5dae5299f6c738e9060f0acf15a58))
- **platform:** usage pack management page ([a167f02](https://github.com/perfsee/perfsee/commit/a167f02555f4e3e8a51e8049ccd9ca5d2b183f1b))

# [1.1.0](https://github.com/perfsee/perfsee/compare/v1.0.0...v1.1.0) (2022-11-04)

### Bug Fixes

- **platform:** update environment with same site ([45b164c](https://github.com/perfsee/perfsee/commit/45b164c059445bf5374dede3397ed91247214a71))

### Features

- **platform-server,job-runner,bundle-analyzer:** optimize source analyzer ([7ffd788](https://github.com/perfsee/perfsee/commit/7ffd7882d96daf9b716d2e81fbd2d78a2f3c4b9d))
- **platform-server:** impl application config and settings ([87432b5](https://github.com/perfsee/perfsee/commit/87432b584f967b75d4858b4c105a5b796ebf478d))
- **platform,platform-server:** allow project to add read permission users ([6410428](https://github.com/perfsee/perfsee/commit/64104286ca114f7f96097f8bb643439dccf58e1b))
- **platform:** adapt frontend with application settings ([233a8f2](https://github.com/perfsee/perfsee/commit/233a8f2fb09ef50534428fdb3a66dfd9fbb5cc01))
- **platform:** merge owners and viewer into one table ([7fe13bd](https://github.com/perfsee/perfsee/commit/7fe13bd12a7e0fa9030bcc46041080ce7f39f841))

# [1.0.0](https://github.com/perfsee/perfsee/compare/v1.0.0-alpha.4...v1.0.0) (2022-10-18)

**Note:** Version bump only for package @perfsee/schema

# [1.0.0-alpha.4](https://github.com/perfsee/perfsee/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2022-09-29)

### Features

- **platform-server:** graphql api filter artifacts by hash ([033a31f](https://github.com/perfsee/perfsee/commit/033a31fa65109917b4d9f2da841799dae5b2f975))

# [1.0.0-alpha.3](https://github.com/perfsee/perfsee/compare/v1.0.0-alpha.2...v1.0.0-alpha.3) (2022-09-19)

**Note:** Version bump only for package @perfsee/schema

# [1.0.0-alpha.2](https://github.com/perfsee/perfsee/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2022-09-19)

### Bug Fixes

- **platform-server:** make environment field concrete types instead of JSON ([4b26e22](https://github.com/perfsee/perfsee/commit/4b26e224fb0c4b885d0914f4db8f9f9ac2fc1992))
- **platform-server:** make timer field concrete types ([34339e5](https://github.com/perfsee/perfsee/commit/34339e55a1c4138ff1ef5d02d2f9acf2db84996d))

### Features

- **platform,platform-server:** make project public to anyone ([8fc893b](https://github.com/perfsee/perfsee/commit/8fc893bceffc42575b95726949ea37543682a588))

# 1.0.0-alpha.1 (2022-09-15)

### Features

- env localstorage ([15fb8f7](https://github.com/perfsee/perfsee/commit/15fb8f7b9b178a148d18701b200cb73b462f9073))
- initial sdk package ([7e3c546](https://github.com/perfsee/perfsee/commit/7e3c5460c72aada593e6020f87590f3059f28cb0))
- optimize github import ([2b34b85](https://github.com/perfsee/perfsee/commit/2b34b85403aa931e3aa3c6f3ed9572382422070e))
- **platform,platform-server:** delete project ([4104f53](https://github.com/perfsee/perfsee/commit/4104f53364841c55dc36e2a65f4d47bc3fff0821))
- **platform:** clearer github account selection ([5058812](https://github.com/perfsee/perfsee/commit/50588122d50d279b0241f2d3b03828095b2f247c))
