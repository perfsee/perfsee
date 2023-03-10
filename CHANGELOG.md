# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.4.0](https://github.com/perfsee/perfsee/compare/v1.3.0...v1.4.0) (2023-03-10)

### Bug Fixes

- assets with vite ([bcb4253](https://github.com/perfsee/perfsee/commit/bcb4253ea066be57446d86874e0bae89fca5b32d))
- docker compose ([9e3104d](https://github.com/perfsee/perfsee/commit/9e3104d66d41b1e88b0524cc2bfb153e112db085))
- **platform-server:** complete the snapshot when reports are all completed ([e9c360e](https://github.com/perfsee/perfsee/commit/e9c360e3eb484e7d7307cd639a78fee3c587115f))
- **platform-server:** wrong way to fetch project ([f53e272](https://github.com/perfsee/perfsee/commit/f53e27236b3c7eba31f55039f6dfdc52db92d598))
- **platform:** the interaction of bundle report ([a76ee6e](https://github.com/perfsee/perfsee/commit/a76ee6e346f7e8abeda8a45070aaaae50e745a79))

### Features

- **platform-server:** allow artifact upload with author ([be267c7](https://github.com/perfsee/perfsee/commit/be267c756bdda9d9407ef3a7f2762337acf049b2))
- **sdk:** webhook type ([bb721b3](https://github.com/perfsee/perfsee/commit/bb721b30821326923189162bcc5b3bd49ce39de2))

# [1.3.0](https://github.com/perfsee/perfsee/compare/v1.2.0...v1.3.0) (2023-02-27)

### Bug Fixes

- add baseline on webhook ([d243069](https://github.com/perfsee/perfsee/commit/d2430693091736f8ba6ad33d9c06216f991f6706))
- add options to specify platform by plugin options ([6fc85da](https://github.com/perfsee/perfsee/commit/6fc85da6ed791c3421fc8f48cabac388d04e7177))
- **bundle-analyzer:** missing module path ([6324071](https://github.com/perfsee/perfsee/commit/6324071f03ca769d50839c933e876086e8c3181c))
- **bundle-report:** adjust build history style ([9fe51f5](https://github.com/perfsee/perfsee/commit/9fe51f5702b0c418ba53a6fa3611b5e09d703142))
- move image build phase to prepare service ([c42d0ce](https://github.com/perfsee/perfsee/commit/c42d0ceeb8cd824495237963694af9204b5cef05))
- **ori:** apply clippy suggestions ([a5893a4](https://github.com/perfsee/perfsee/commit/a5893a4a1d123627bd3c6ca98f5374d9ed91b611))
- **ori:** check rust error ([d93f4a1](https://github.com/perfsee/perfsee/commit/d93f4a1295b4f01c9a79297d892cd657b797c064))
- **platform-server:** adapt nest throttler v4 ([5114ad9](https://github.com/perfsee/perfsee/commit/5114ad9f634ea8ba11079ac2ea14db73ba860c44))
- **platform-server:** artifact link use public path ([d4add46](https://github.com/perfsee/perfsee/commit/d4add4638276c2cb48ae04579b93b93291d0c78f))
- **platform-server:** correct dataloader return type ([2c0e00d](https://github.com/perfsee/perfsee/commit/2c0e00dbacaf5ba20b842b5f8078ea053c5e6953))
- **platform-server:** delete relevant files in storage when property is deleted ([e30b9b5](https://github.com/perfsee/perfsee/commit/e30b9b5904b03806c9b1a90a6810c4ba1622e96b))
- **platform-server:** patch unsigned user project accessing behavior ([a37954b](https://github.com/perfsee/perfsee/commit/a37954bcc1325443d85b9a75f859338e3c742707))
- **platform-server:** try to complete the snapshot when all reports are completed ([2d7ca5d](https://github.com/perfsee/perfsee/commit/2d7ca5dc76279442c01a97c0067254549bf953ee))
- **platform:** adjust commit message style ([fd1de4c](https://github.com/perfsee/perfsee/commit/fd1de4c15da7f4aaf8f1ef8022859aa8d2ac41ad))
- **platform:** cast possible numeric query value to string ([397b1dc](https://github.com/perfsee/perfsee/commit/397b1dc532a3f9db614deba9afa24155b98f7fa0))
- **platform:** dedupe sigi di which causes unresolved injections ([0aac1e5](https://github.com/perfsee/perfsee/commit/0aac1e5929c6a13169266425cf9b13a9a53d12a4))
- **platform:** fix page setting style ([b01a3d0](https://github.com/perfsee/perfsee/commit/b01a3d031ef60905deab06fa75b253e23beb5941))
- **platform:** optimize the interaction of bundle packages ([5c06ee1](https://github.com/perfsee/perfsee/commit/5c06ee1cf8db20f578a31c2e8fafc7a5c72e2c99))
- **plugin-utils:** missing commit message ([1acc033](https://github.com/perfsee/perfsee/commit/1acc0335018a62de122648a97da28b2e501b1cef))
- **schema:** convert schema to commonjs ([a306643](https://github.com/perfsee/perfsee/commit/a3066438dc251bfb2d16ab64be9aa8e0852222e3))
- typeorm cli need to always know migrations ([fd1a4b8](https://github.com/perfsee/perfsee/commit/fd1a4b83ceb1ff9d943d6bd394d675aba60b57b4))
- Update runner files ([6ed1e46](https://github.com/perfsee/perfsee/commit/6ed1e469ce4744f085155d1708c10a099f82329b))

### Features

- organization ([4aab6fc](https://github.com/perfsee/perfsee/commit/4aab6fce6b082571c1983851ba8b177457de044b))
- **platform-server:** auto add job available zone if new runner registered ([b1f205e](https://github.com/perfsee/perfsee/commit/b1f205e498658691a1a98788b81d367d16505f6e))
- **platform,platform-server:** allow anonymous users visit public project ([bf32d38](https://github.com/perfsee/perfsee/commit/bf32d3865f55d56be1e71d4d0c2a2ac6141dd0c4))
- **platform,platform-server:** show commit message ([b3ea2fd](https://github.com/perfsee/perfsee/commit/b3ea2fd65f67b8fec22369e69b07dfc0ec47d2ff))
- **platform,platform-server:** webhook ([061c081](https://github.com/perfsee/perfsee/commit/061c081bfdcfc7125828eae948193f673092cd0d))
- **platform:** install app page ([9f3a089](https://github.com/perfsee/perfsee/commit/9f3a0899ffa01b431deb778e1f78b691f3c60aaf))
- **platform:** only show online runners by default ([2762bd5](https://github.com/perfsee/perfsee/commit/2762bd5c45eca448f66f4b00040fb455542fc3b8))
- **platform:** remember projects page tab choice ([b3686ad](https://github.com/perfsee/perfsee/commit/b3686ad888bc8ba7fae194f22822e796f937622b))
- **platform:** show scores in audits detail ([af93167](https://github.com/perfsee/perfsee/commit/af93167f1927c06aeb5cfb4a2f20c436e6df385d))
- **platform:** webhook show last delivery time ([8eb57df](https://github.com/perfsee/perfsee/commit/8eb57df134b2d8cc7c013c2306ba267bcfcdbcf5))
- **plugin-utils:** support dynamic `artifactName` by bundle results ([fe4fe35](https://github.com/perfsee/perfsee/commit/fe4fe35f26e2f8d25b4377ceaf58b7adf7c40d22))

# [1.2.0](https://github.com/perfsee/perfsee/compare/v1.1.1...v1.2.0) (2022-12-19)

### Bug Fixes

- **bundle-analyzer:** fix stream decode error ([71023a2](https://github.com/perfsee/perfsee/commit/71023a21903e8d2f78b2b25ec9a5cd7e2ae46cd7))
- **platform:** adjust layout detail ([a9177d6](https://github.com/perfsee/perfsee/commit/a9177d6758bb535de2af34f50ef8e18892e9204e))
- **platform:** fix style issues ([e609267](https://github.com/perfsee/perfsee/commit/e609267a5e19a6de15e1cfaffa3c3c7894b8c881))

### Features

- **platform-server:** usage packs and project usage limitation ([2277911](https://github.com/perfsee/perfsee/commit/2277911471a0d21092b19959b161787ebff393d3))
- **platform:** add project usage information ([cf92ebf](https://github.com/perfsee/perfsee/commit/cf92ebfe3cf5dae5299f6c738e9060f0acf15a58))
- **platform:** provide view of assets grouped by domain in lab reports ([dcf521f](https://github.com/perfsee/perfsee/commit/dcf521f577729fe795be8056850af04750ab24c1))
- **platform:** reorganize page layout ([09c4a0d](https://github.com/perfsee/perfsee/commit/09c4a0d3ae26aa52a7dc5934058fdada75e67e4e))
- **platform:** usage pack management page ([a167f02](https://github.com/perfsee/perfsee/commit/a167f02555f4e3e8a51e8049ccd9ca5d2b183f1b))
- **plugins, bundle-analyzer:** stream serialize ([3055b96](https://github.com/perfsee/perfsee/commit/3055b96efd2141ad461cb23f5ff4402162a0cfa3))

# [1.1.0](https://github.com/perfsee/perfsee/compare/v1.0.0...v1.1.0) (2022-11-04)

### Bug Fixes

- broken doc links ([631be09](https://github.com/perfsee/perfsee/commit/631be095cb66aab9e3616f771b3374dfe35fa652))
- **components:** fix donut chart style ([900aec9](https://github.com/perfsee/perfsee/commit/900aec903905f41bff53e239f44e1f9f0d9f660e))
- **job-runner-bundle:** job update too big ([34f3f98](https://github.com/perfsee/perfsee/commit/34f3f98fc4e6abdfe86afb70efff6144153b105e))
- missing coverage if run integration test in container ([5fcd833](https://github.com/perfsee/perfsee/commit/5fcd8333cabec9d818cd336327c7c2df933ba376))
- **platform-server:** fix docs path redirect ([03bd0b3](https://github.com/perfsee/perfsee/commit/03bd0b34dc25c8ce9eec58732269b3f3558317c7))
- **platform-server:** github comment to wrong issues ([b731ed6](https://github.com/perfsee/perfsee/commit/b731ed660914218f2d11e99eee1411e8717138ef))
- **platform-server:** mysql username env and job timeout env ([5a23a16](https://github.com/perfsee/perfsee/commit/5a23a16faa7be98320430d15084ebf2b2d411284))
- **platform-server:** static assets path ([ec2804a](https://github.com/perfsee/perfsee/commit/ec2804a67bb115cb0387c6a82cb29593f44e19cf))
- **platform:** update environment with same site ([45b164c](https://github.com/perfsee/perfsee/commit/45b164c059445bf5374dede3397ed91247214a71))
- **plugin-utils:** avoid plugin crashing if no git env found ([a252282](https://github.com/perfsee/perfsee/commit/a252282a4d4ecfa78b00b8396239bf9b0a7e0b4f))
- typo ([0859717](https://github.com/perfsee/perfsee/commit/0859717762271d484c03b94f522cdcbfbf41807f))

### Features

- **job-runner-lab:** lab console logger ([1b1d13d](https://github.com/perfsee/perfsee/commit/1b1d13ddb4a72356d810c2756dfb4134ff2c7e91))
- **platform-server,job-runner,bundle-analyzer:** optimize source analyzer ([7ffd788](https://github.com/perfsee/perfsee/commit/7ffd7882d96daf9b716d2e81fbd2d78a2f3c4b9d))
- **platform-server:** impl application config and settings ([87432b5](https://github.com/perfsee/perfsee/commit/87432b584f967b75d4858b4c105a5b796ebf478d))
- **platform-server:** take snapshot restful api ([b4c5a48](https://github.com/perfsee/perfsee/commit/b4c5a48aba4e66f597f618acb611303938d17046))
- **platform,platform-server:** allow project to add read permission users ([6410428](https://github.com/perfsee/perfsee/commit/64104286ca114f7f96097f8bb643439dccf58e1b))
- **platform:** adapt frontend with application settings ([233a8f2](https://github.com/perfsee/perfsee/commit/233a8f2fb09ef50534428fdb3a66dfd9fbb5cc01))
- **platform:** add descriptions and titles to each route ([067fec6](https://github.com/perfsee/perfsee/commit/067fec610146e8fb5194402c01e1884084791e41))
- **platform:** add same site attribute for cookie ([1ae7ece](https://github.com/perfsee/perfsee/commit/1ae7ecee50f8376ab5c525bf8d34de77c4163c63))
- **platform:** merge owners and viewer into one table ([7fe13bd](https://github.com/perfsee/perfsee/commit/7fe13bd12a7e0fa9030bcc46041080ce7f39f841))
- **platform:** user info ([c131f14](https://github.com/perfsee/perfsee/commit/c131f14153d3a21e6c203ef8719d5294a51d0e37))

# [1.0.0](https://github.com/perfsee/perfsee/compare/v1.0.0-alpha.4...v1.0.0) (2022-10-18)

### Bug Fixes

- **platform:** remove localstorage item crash ([fa22161](https://github.com/perfsee/perfsee/commit/fa22161495156b37023840678b9f96f0a19bb785))
- **plugin-utils:** options typo ([4bbeb95](https://github.com/perfsee/perfsee/commit/4bbeb953aaba38792c1b8161acd9e141fc7bbf52))
- **treemap:** fix treemap missing files ([d225969](https://github.com/perfsee/perfsee/commit/d22596953f464091af2b868e7f6614f7c79107e1))

### Features

- **platform:** artifact selector name filter ([30662fd](https://github.com/perfsee/perfsee/commit/30662fdcb6d8c60f8386719fba2655e32c032305))

# [1.0.0-alpha.4](https://github.com/perfsee/perfsee/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2022-09-29)

### Bug Fixes

- **platform-server:** fix email sender name ([bfdde9e](https://github.com/perfsee/perfsee/commit/bfdde9ed556ebcadf42d2fd7ee76794398ddea3f))
- **platform-server:** github comment percentile ([da0e51a](https://github.com/perfsee/perfsee/commit/da0e51a7748aaa20f2c8f6deb74d77160583bc18))
- **platform, docs:** move homepage to platform ([f2b01fe](https://github.com/perfsee/perfsee/commit/f2b01fe7ce401a8f5c3e6c44db0cc8d2f314a47a))
- **platform:** correct docs links ([9271f19](https://github.com/perfsee/perfsee/commit/9271f19d609e5a553e4a5b7c5783173dfe62031f))
- **platform:** minimal width & tooltip position in waterfall ([31b609d](https://github.com/perfsee/perfsee/commit/31b609d9742bf4c19a09661c8e29ddf9a2887fa3))
- **platform:** performance metric loading error state ([d8e1b1b](https://github.com/perfsee/perfsee/commit/d8e1b1b87d4b344d5f831df08fc5dc3ab971d32f))
- **platform:** remove dangrous button width limit ([0afbc74](https://github.com/perfsee/perfsee/commit/0afbc74192ebe949c166c2f20127afa97c4760f0))
- **platform:** replace #TODO:LINK with real ones ([1450275](https://github.com/perfsee/perfsee/commit/1450275b914992ab8a60ab64fe866d97be22b4de))
- **platform:** the style of request filter in lab report ([20a6ea7](https://github.com/perfsee/perfsee/commit/20a6ea73846b1c67ccd3956675332b584ef9d598))
- **platform:** wrong pagination in artifacts list ([121866f](https://github.com/perfsee/perfsee/commit/121866fa897a34a0d3c01812df68426d3a8acf0b))
- **plugin-utils:** real ci commit hash ([f8dc4c9](https://github.com/perfsee/perfsee/commit/f8dc4c9cf73c359285d550ec076f978d0a2d6277))
- **plugin-utils:** wrong default platform host ([69d38f5](https://github.com/perfsee/perfsee/commit/69d38f50c88cb1b99ecbb1da70dc2b03017c9eb2))

### Features

- **platform-server:** adjust github bundle comment ([405faec](https://github.com/perfsee/perfsee/commit/405faec06e9dd4aa33abd239b350dc978d164f60))
- **platform-server:** graphql api filter artifacts by hash ([033a31f](https://github.com/perfsee/perfsee/commit/033a31fa65109917b4d9f2da841799dae5b2f975))

# [1.0.0-alpha.3](https://github.com/perfsee/perfsee/compare/v1.0.0-alpha.2...v1.0.0-alpha.3) (2022-09-19)

**Note:** Version bump only for package perfsee

# [1.0.0-alpha.2](https://github.com/perfsee/perfsee/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2022-09-19)

### Bug Fixes

- homepage loading twinkle ([6599ec4](https://github.com/perfsee/perfsee/commit/6599ec420ec3687ed0f659d0828c19fe01909544))
- **platform-server:** delete folders in storage when project is deleted ([d785041](https://github.com/perfsee/perfsee/commit/d78504129dbd611e196bfc269859b0973cc85ca3))
- **platform-server:** make environment field concrete types instead of JSON ([4b26e22](https://github.com/perfsee/perfsee/commit/4b26e224fb0c4b885d0914f4db8f9f9ac2fc1992))
- **platform-server:** make timer field concrete types ([34339e5](https://github.com/perfsee/perfsee/commit/34339e55a1c4138ff1ef5d02d2f9acf2db84996d))

### Features

- **platform,platform-server:** make project public to anyone ([8fc893b](https://github.com/perfsee/perfsee/commit/8fc893bceffc42575b95726949ea37543682a588))

# 1.0.0-alpha.1 (2022-09-15)

### Bug Fixes

- adapt package extractor with yarn 3 ([99bd9ab](https://github.com/perfsee/perfsee/commit/99bd9ab9b53521e948b50bb4b035ed8991cc56ef))
- **bundle-analyzer:** always posix style separator in module parsing ([7ab8d2b](https://github.com/perfsee/perfsee/commit/7ab8d2bb6e8be661ed2be89abe7ae873d7a13c17))
- **bundle-analyzer:** using posix path make missing version info ([3824d80](https://github.com/perfsee/perfsee/commit/3824d80c7e623313578ed14dab1a19188469186a))
- **chrome-finder:** win32 may provide progrem files env with different name ([808c2ef](https://github.com/perfsee/perfsee/commit/808c2ef9a543ece76a55362a2c6b728b9e34cc70))
- dependencies secure alerts ([bee5416](https://github.com/perfsee/perfsee/commit/bee54169b3c147b09febfa2dea3ca38432e39a39))
- **docs:** footer link not correct ([adcb8d5](https://github.com/perfsee/perfsee/commit/adcb8d56c3ea61d2f3b278d38f9b00234d611655))
- **ori:** exported functions name should be identical with previous version ([50d4af9](https://github.com/perfsee/perfsee/commit/50d4af971ae54fb0dbfdd9c6e6bfe7633550d99d))
- **platform-server:** create folder before upload file ([a82ff16](https://github.com/perfsee/perfsee/commit/a82ff16089b239c54ab4e83e823b25fcf682dc18))
- **platform-server:** fix github check runs ([b93226c](https://github.com/perfsee/perfsee/commit/b93226c5aaa979508933e825d7391eea563f705d))
- **platform-server:** fix session cookie behind proxy ([e5605ec](https://github.com/perfsee/perfsee/commit/e5605ece9e1fafd67f71089648be3477f719fcc2))
- **platform-server:** github check runs show wrong percentile ([7ced8a1](https://github.com/perfsee/perfsee/commit/7ced8a124a6543c5c34669be11a3fd64aadfe1ec))
- **platform-server:** github no email error ([b477eee](https://github.com/perfsee/perfsee/commit/b477eeed5e909bc09f786ddab8d3699d2ea812d3))
- **platform-server:** github redirect uri base on host ([c05ea11](https://github.com/perfsee/perfsee/commit/c05ea11394137952d8498b9a34257880a9adc5e5))
- **platform-server:** put builds under project folder ([2f34d88](https://github.com/perfsee/perfsee/commit/2f34d8856ee6b184ce3dcb3ed730ef78dc039d4e))
- **platform-server:** the special config of timed task ([4841d2c](https://github.com/perfsee/perfsee/commit/4841d2c0c700852013bd310c1a7e41952be44102))
- **platform:** color map of request type ([2332749](https://github.com/perfsee/perfsee/commit/2332749ac60bb2db2c4d5154546828e00b941a78))
- **platform:** environment zone ([1cb8883](https://github.com/perfsee/perfsee/commit/1cb8883da9be85de9d80f349cc82e3ef579e1587))
- **platform:** the style of snapshot report tab on firefox ([a82e30f](https://github.com/perfsee/perfsee/commit/a82e30fe9328748c9c3dad66ebb29c10f0a76bd0))
- **sdk:** remove unused references ([d4636bb](https://github.com/perfsee/perfsee/commit/d4636bbdbfbc848e03fbab9ce7b7f7113e69038d))

### Features

- **dls:** update default font family ([865d1c2](https://github.com/perfsee/perfsee/commit/865d1c2b6a801cc572d0f73bccc7b1db78704f8e))
- env localstorage ([15fb8f7](https://github.com/perfsee/perfsee/commit/15fb8f7b9b178a148d18701b200cb73b462f9073))
- initial sdk package ([7e3c546](https://github.com/perfsee/perfsee/commit/7e3c5460c72aada593e6020f87590f3059f28cb0))
- **job-runner:** save job artifacts by project id ([b905be7](https://github.com/perfsee/perfsee/commit/b905be7def97198a60d7d6fa09da40d69c9e2e2e))
- optimize github import ([2b34b85](https://github.com/perfsee/perfsee/commit/2b34b85403aa931e3aa3c6f3ed9572382422070e))
- **platform,platform-server:** delete project ([4104f53](https://github.com/perfsee/perfsee/commit/4104f53364841c55dc36e2a65f4d47bc3fff0821))
- **platform:** clearer github account selection ([5058812](https://github.com/perfsee/perfsee/commit/50588122d50d279b0241f2d3b03828095b2f247c))
- **platform:** environment settings ([4b491b2](https://github.com/perfsee/perfsee/commit/4b491b272449b3f4c0fbc74bf20479297b11c7cc))
- **platform:** project homepage should start with loading ([291a746](https://github.com/perfsee/perfsee/commit/291a746206a61759d3127847dafa3c7bfb170e60))
- website ([59a4c01](https://github.com/perfsee/perfsee/commit/59a4c01def5b3e594b6cf924a3d1a73db5ede097))

# 1.0.0-alpha.0 (2022-09-15)

### Bug Fixes

- adapt package extractor with yarn 3 ([99bd9ab](https://github.com/perfsee/perfsee/commit/99bd9ab9b53521e948b50bb4b035ed8991cc56ef))
- **bundle-analyzer:** always posix style separator in module parsing ([7ab8d2b](https://github.com/perfsee/perfsee/commit/7ab8d2bb6e8be661ed2be89abe7ae873d7a13c17))
- **bundle-analyzer:** using posix path make missing version info ([3824d80](https://github.com/perfsee/perfsee/commit/3824d80c7e623313578ed14dab1a19188469186a))
- **chrome-finder:** win32 may provide progrem files env with different name ([808c2ef](https://github.com/perfsee/perfsee/commit/808c2ef9a543ece76a55362a2c6b728b9e34cc70))
- dependencies secure alerts ([bee5416](https://github.com/perfsee/perfsee/commit/bee54169b3c147b09febfa2dea3ca38432e39a39))
- **docs:** footer link not correct ([adcb8d5](https://github.com/perfsee/perfsee/commit/adcb8d56c3ea61d2f3b278d38f9b00234d611655))
- **ori:** exported functions name should be identical with previous version ([50d4af9](https://github.com/perfsee/perfsee/commit/50d4af971ae54fb0dbfdd9c6e6bfe7633550d99d))
- **platform-server:** create folder before upload file ([a82ff16](https://github.com/perfsee/perfsee/commit/a82ff16089b239c54ab4e83e823b25fcf682dc18))
- **platform-server:** fix github check runs ([b93226c](https://github.com/perfsee/perfsee/commit/b93226c5aaa979508933e825d7391eea563f705d))
- **platform-server:** fix session cookie behind proxy ([e5605ec](https://github.com/perfsee/perfsee/commit/e5605ece9e1fafd67f71089648be3477f719fcc2))
- **platform-server:** github check runs show wrong percentile ([7ced8a1](https://github.com/perfsee/perfsee/commit/7ced8a124a6543c5c34669be11a3fd64aadfe1ec))
- **platform-server:** github no email error ([b477eee](https://github.com/perfsee/perfsee/commit/b477eeed5e909bc09f786ddab8d3699d2ea812d3))
- **platform-server:** github redirect uri base on host ([c05ea11](https://github.com/perfsee/perfsee/commit/c05ea11394137952d8498b9a34257880a9adc5e5))
- **platform-server:** put builds under project folder ([2f34d88](https://github.com/perfsee/perfsee/commit/2f34d8856ee6b184ce3dcb3ed730ef78dc039d4e))
- **platform-server:** the special config of timed task ([4841d2c](https://github.com/perfsee/perfsee/commit/4841d2c0c700852013bd310c1a7e41952be44102))
- **platform:** color map of request type ([2332749](https://github.com/perfsee/perfsee/commit/2332749ac60bb2db2c4d5154546828e00b941a78))
- **platform:** environment zone ([1cb8883](https://github.com/perfsee/perfsee/commit/1cb8883da9be85de9d80f349cc82e3ef579e1587))
- **platform:** the style of snapshot report tab on firefox ([a82e30f](https://github.com/perfsee/perfsee/commit/a82e30fe9328748c9c3dad66ebb29c10f0a76bd0))
- **sdk:** remove unused references ([d4636bb](https://github.com/perfsee/perfsee/commit/d4636bbdbfbc848e03fbab9ce7b7f7113e69038d))

### Features

- **dls:** update default font family ([865d1c2](https://github.com/perfsee/perfsee/commit/865d1c2b6a801cc572d0f73bccc7b1db78704f8e))
- env localstorage ([15fb8f7](https://github.com/perfsee/perfsee/commit/15fb8f7b9b178a148d18701b200cb73b462f9073))
- initial sdk package ([7e3c546](https://github.com/perfsee/perfsee/commit/7e3c5460c72aada593e6020f87590f3059f28cb0))
- **job-runner:** save job artifacts by project id ([b905be7](https://github.com/perfsee/perfsee/commit/b905be7def97198a60d7d6fa09da40d69c9e2e2e))
- optimize github import ([2b34b85](https://github.com/perfsee/perfsee/commit/2b34b85403aa931e3aa3c6f3ed9572382422070e))
- **platform,platform-server:** delete project ([4104f53](https://github.com/perfsee/perfsee/commit/4104f53364841c55dc36e2a65f4d47bc3fff0821))
- **platform:** clearer github account selection ([5058812](https://github.com/perfsee/perfsee/commit/50588122d50d279b0241f2d3b03828095b2f247c))
- **platform:** environment settings ([4b491b2](https://github.com/perfsee/perfsee/commit/4b491b272449b3f4c0fbc74bf20479297b11c7cc))
- **platform:** project homepage should start with loading ([291a746](https://github.com/perfsee/perfsee/commit/291a746206a61759d3127847dafa3c7bfb170e60))
- website ([59a4c01](https://github.com/perfsee/perfsee/commit/59a4c01def5b3e594b6cf924a3d1a73db5ede097))
