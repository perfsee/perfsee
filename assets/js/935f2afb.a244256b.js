"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[53],{1109:e=>{e.exports=JSON.parse('{"pluginId":"default","version":"current","label":"Next","banner":null,"badge":false,"noIndex":false,"className":"docs-version-current","isLast":true,"docsSidebars":{"documentsSidebar":[{"type":"link","label":"Introduction","href":"/perfsee/docs/","docId":"docs/intro"},{"type":"link","label":"Get Started","href":"/perfsee/docs/docs/get-started","docId":"docs/get-started"},{"type":"category","label":"Bundle Analysis","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"Get Started","href":"/perfsee/docs/docs/bundle/get-started","docId":"docs/bundle/get-started"},{"type":"link","label":"Bundle Report","href":"/perfsee/docs/docs/bundle/bundle-report","docId":"docs/bundle/bundle-report"},{"type":"link","label":"Bundle Audits","href":"/perfsee/docs/docs/bundle/bundle-audits","docId":"docs/bundle/bundle-audits"},{"type":"link","label":"Plugin Options","href":"/perfsee/docs/docs/bundle/plugin-options","docId":"docs/bundle/plugin-options"}]},{"type":"category","label":"Lab Analysis","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"Get started","href":"/perfsee/docs/docs/lab/get-started","docId":"docs/lab/get-started"},{"type":"link","label":"Snapshot report","href":"/perfsee/docs/docs/lab/report","docId":"docs/lab/report"},{"type":"link","label":"Comparing multiple reports","href":"/perfsee/docs/docs/lab/multi-reports","docId":"docs/lab/multi-reports"},{"type":"link","label":"How to use the competitor analysis","href":"/perfsee/docs/docs/lab/competitor","docId":"docs/lab/competitor"},{"type":"link","label":"Setting commit hash","href":"/perfsee/docs/docs/lab/set-commit","docId":"docs/lab/set-commit"},{"type":"link","label":"How to use e2e test","href":"/perfsee/docs/docs/lab/e2e","docId":"docs/lab/e2e"},{"type":"link","label":"Metrics gallery","href":"/perfsee/docs/docs/lab/metrics-gallery","docId":"docs/lab/metrics-gallery"}]},{"type":"category","label":"Source Analysis","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"Get started","href":"/perfsee/docs/docs/source/get-started","docId":"docs/source/get-started"},{"type":"link","label":"Source Report","href":"/perfsee/docs/docs/source/source-report","docId":"docs/source/source-report"},{"type":"link","label":"VSCode Extensions","href":"/perfsee/docs/docs/source/vscode-extensions","docId":"docs/source/vscode-extensions"},{"type":"link","label":"How to read flame chart","href":"/perfsee/docs/docs/source/flamechart","docId":"docs/source/flamechart"}]},{"type":"category","label":"Project Settings","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"Basic Setting","href":"/perfsee/docs/docs/settings/basic-setting","docId":"docs/settings/basic-setting"},{"type":"link","label":"Page Settings","href":"/perfsee/docs/docs/settings/page-setting","docId":"docs/settings/page-setting"},{"type":"link","label":"Profile Setting","href":"/perfsee/docs/docs/settings/profile-setting","docId":"docs/settings/profile-setting"},{"type":"link","label":"Environment Setting","href":"/perfsee/docs/docs/settings/environment-setting","docId":"docs/settings/environment-setting"},{"type":"link","label":"Schedule Setting","href":"/perfsee/docs/docs/settings/schedule-setting","docId":"docs/settings/schedule-setting"}]},{"type":"link","label":"FAQ","href":"/perfsee/docs/docs/FAQ","docId":"docs/FAQ"}],"apiSidebar":[{"type":"link","label":"API","href":"/perfsee/docs/api/","docId":"api/api"}]},"docs":{"api/api":{"id":"api/api","title":"API","description":"Introduction","sidebar":"apiSidebar"},"docs/bundle/bundle-audits":{"id":"docs/bundle/bundle-audits","title":"Bundle Audits","description":"Introduction","sidebar":"documentsSidebar"},"docs/bundle/bundle-report":{"id":"docs/bundle/bundle-report","title":"Bundle Report","description":"overview","sidebar":"documentsSidebar"},"docs/bundle/get-started":{"id":"docs/bundle/get-started","title":"Get Started","description":"Bundle analysis plugin requires node --version >= v12","sidebar":"documentsSidebar"},"docs/bundle/plugin-options":{"id":"docs/bundle/plugin-options","title":"Plugin Options","description":"Plugin Options","sidebar":"documentsSidebar"},"docs/FAQ":{"id":"docs/FAQ","title":"FAQ","description":"Common","sidebar":"documentsSidebar"},"docs/get-started":{"id":"docs/get-started","title":"Get Started","description":"All features of the Perfsee platform need to be used within a project, and a project corresponds to a code repository, so the first step is to have a project. This can be done manually or by bringing in a project from Github.","sidebar":"documentsSidebar"},"docs/intro":{"id":"docs/intro","title":"Introduction","description":"Perfsee is a performance analysis platform for all general web applications. By providing various tools like bundle analysis, page measuring and source code analysis to tell developers where the performance bottleneck might be and so as the way to do better optimization.","sidebar":"documentsSidebar"},"docs/lab/competitor":{"id":"docs/lab/competitor","title":"How to use the competitor analysis","description":"By comparing site performance with competitor performance, you can understand the performance bottlenecks of your site compared with competitor products.","sidebar":"documentsSidebar"},"docs/lab/e2e":{"id":"docs/lab/e2e","title":"How to use e2e test","description":"This feature is still in experimental stage!","sidebar":"documentsSidebar"},"docs/lab/get-started":{"id":"docs/lab/get-started","title":"Get started","description":"Step 1: Add required environments","sidebar":"documentsSidebar"},"docs/lab/metrics-gallery":{"id":"docs/lab/metrics-gallery","title":"Metrics gallery","description":"The doc introduces all the performance metrics that lab module analysis will produce.","sidebar":"documentsSidebar"},"docs/lab/multi-reports":{"id":"docs/lab/multi-reports","title":"Comparing multiple reports","description":"When you want to compare the critical metrics changes on the same page over several time periods, you can select 2 to 5 reports on the list page of Lab and click Compare to generate the comparison report.","sidebar":"documentsSidebar"},"docs/lab/report":{"id":"docs/lab/report","title":"Snapshot report","description":"We call the result of the Lab performance analysis job Snapshot. Every snapshot contains all reports of URL picked with given env & profile. For instance, in a project configured with 5 pages and each page is related to 2 profiles, there will be 10 (5x2) reports for each snapshot.","sidebar":"documentsSidebar"},"docs/lab/set-commit":{"id":"docs/lab/set-commit","title":"Setting commit hash","description":"The Treemap and Flamechart features in Lab require linking the data analyzed by Lab with the data analyzed by the Bundle product in order to use them. The platform uses git commit hash to associate Lab with Bundle. each Snapshot can have a commit hash set.","sidebar":"documentsSidebar"},"docs/settings/basic-setting":{"id":"docs/settings/basic-setting","title":"Basic Setting","description":"Only project owner has permission to modify settings","sidebar":"documentsSidebar"},"docs/settings/environment-setting":{"id":"docs/settings/environment-setting","title":"Environment Setting","description":"Configure environment information, and if you need to test login status, you need to configure the cookie or header.","sidebar":"documentsSidebar"},"docs/settings/page-setting":{"id":"docs/settings/page-setting","title":"Page Settings","description":"When analyze website performance, we need to manage the entrance of website. The minimum dimension of website is page. So the lab related settings are based on Page.","sidebar":"documentsSidebar"},"docs/settings/profile-setting":{"id":"docs/settings/profile-setting","title":"Profile Setting","description":"Configure the conditions of the test website. Platform can emulate popular devices (such as iPhone, iPad and Nexus phone), limit the network connection.","sidebar":"documentsSidebar"},"docs/settings/schedule-setting":{"id":"docs/settings/schedule-setting","title":"Schedule Setting","description":"We provide Lab schedule analysis function, you need to enable it at Settings > Schedule, it is closed by default. The report generated by schedule analysis can be viewed in Lab, and the score trend charts can be viewed in project homepage.","sidebar":"documentsSidebar"},"docs/source/flamechart":{"id":"docs/source/flamechart","title":"How to read flame chart","description":"What is flame graph?","sidebar":"documentsSidebar"},"docs/source/get-started":{"id":"docs/source/get-started","title":"Get started","description":"The Source feature is automatically enabled when both the Bundle and Lab modules are enabled, no additional action is required.","sidebar":"documentsSidebar"},"docs/source/source-report":{"id":"docs/source/source-report","title":"Source Report","description":"Source Issues List","sidebar":"documentsSidebar"},"docs/source/vscode-extensions":{"id":"docs/source/vscode-extensions","title":"VSCode Extensions","description":"Install","sidebar":"documentsSidebar"}}}')}}]);