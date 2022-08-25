// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const darkCodeTheme = require('prism-react-renderer/themes/dracula')
const lightCodeTheme = require('prism-react-renderer/themes/github')

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Perfsee',
  tagline: 'Perfsee the frontend performance analysis platform',
  url: 'https://perfsee.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: '/favicon.ico',
  organizationName: 'perfsee',
  projectName: 'perfsee',
  staticDirectories: ['assets'],

  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        theme: {
          customCss: [require.resolve('./src/css/custom.css')],
        },
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/perfsee/perfsee/tree/main/docs/',
          routeBasePath: '/',
        },
        blog: false,
      },
    ],
  ],

  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        docsRouteBasePath: '/',
        hashed: true,
        language: ['en', 'zh'],
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    {
      navbar: {
        hideOnScroll: true,
        title: 'Perfsee',
        logo: {
          alt: 'Logo',
          src: '/logo.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'documentsSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            type: 'docSidebar',
            position: 'left',
            label: 'API',
            sidebarId: 'apiSidebar',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/perfsee/perfsee',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Products',
            items: [
              {
                label: 'Perfsee',
                href: 'https://perfsee.com',
              },
            ],
          },
          {
            title: 'Docs',
            items: [
              {
                label: 'Documents',
                to: '/',
              },
              {
                label: 'API',
                to: '/api',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/perfsee/perfsee',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Perfsee. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    },

  i18n: {
    defaultLocale: 'en',
    locales: ['cn', 'en'],
    localeConfigs: {
      en: {
        label: 'English',
        htmlLang: 'en-GB',
      },
      cn: {
        label: '简体中文',
        htmlLang: 'zh-CN',
      },
    },
  },
}

module.exports = config
