import { compile, PathFunctionOptions } from 'path-to-regexp'

type PathMaker<Params, Required extends boolean> = Required extends true
  ? (paramsMap: Params, options?: PathFunctionOptions) => string
  : (paramsMap?: Params, options?: PathFunctionOptions) => string

type Params<K extends string, V = string> = { [key in K]: V }
type FactoryParams<T> = { [key in keyof T]: T[key] | number }

function makePathsFrom<Params = void>(path: string) {
  // https://github.com/pillarjs/path-to-regexp#compile-reverse-path-to-regexp
  return compile(path) as PathMaker<Params, Params extends void ? false : true>
}

function makeTitlesFrom(title: string, data: Record<string, any>) {
  return title.replace(/\{(.*?)\}/g, (match, key) => data[key] ?? match)
}

export interface RouteTypes {
  home: void
  docs: { home: void; api: void }
  features: { home: void; bundle: void; lab: void; source: void }
  projects: void
  notFound: void
  status: void
  license: void
  applications: void
  editPassword: void
  resetPassword: void
  me: { home: void; connectedAccounts: void; billing: void; accessToken: void }
  login: void
  importGithub: void
  register: void
  project: {
    home: Params<'projectId'>
    feature: Params<'projectId'> & Partial<Params<'feature'>>
    statistics: { home: Params<'projectId'>; artifacts: Params<'projectId'>; snapshots: Params<'projectId'> }
    bundle: {
      home: Params<'projectId'>
      detail: Params<'projectId' | 'bundleId'>
      jobBundleContent: Params<'projectId' | 'bundleId'>
    }
    lab: { home: Params<'projectId'>; report: Params<'projectId' | 'reportId'> & Partial<Params<'tabName'>> }
    competitor: { home: Params<'projectId'>; report: Params<'projectId' | 'tabName'> }
    source: Params<'projectId'>
    report: Params<'projectId'>
    settings: Params<'projectId'> & Partial<Params<'settingName'>>
    jobTrace: Params<'projectId' | 'type' | 'entityId'>
  }
}

export const staticPath = {
  home: '/',
  docs: { home: '/docs', api: '/docs/api' },
  features: { home: '/features', bundle: '/features/bundle', lab: '/features/lab', source: '/features/source' },
  projects: '/projects',
  notFound: '/404',
  status: '/status',
  license: '/license',
  applications: '/applications',
  editPassword: '/edit-password',
  resetPassword: '/reset-password',
  me: {
    home: '/me',
    connectedAccounts: '/me/connected-accounts',
    billing: '/me/billing',
    accessToken: '/me/access-token',
  },
  login: '/login',
  importGithub: '/import/github',
  register: '/register',
  project: {
    home: '/projects/:projectId/home',
    feature: '/projects/:projectId/:feature?',
    statistics: {
      home: '/projects/:projectId/statistics',
      artifacts: '/projects/:projectId/statistics/artifacts',
      snapshots: '/projects/:projectId/statistics/snapshots',
    },
    bundle: {
      home: '/projects/:projectId/bundle',
      detail: '/projects/:projectId/bundle/:bundleId',
      jobBundleContent: '/projects/:projectId/bundle/:bundleId/bundle-content',
    },
    lab: { home: '/projects/:projectId/lab', report: '/projects/:projectId/lab/reports/:reportId/:tabName?' },
    competitor: { home: '/projects/:projectId/competitor', report: '/projects/:projectId/competitor/reports/:tabName' },
    source: '/projects/:projectId/source',
    report: '/projects/:projectId/report',
    settings: '/projects/:projectId/settings/:settingName?',
    jobTrace: '/projects/:projectId/jobs/:type/:entityId',
  },
}

export const pathFactory = {
  home: makePathsFrom<FactoryParams<RouteTypes['home']>>('/'),
  docs: {
    home: makePathsFrom<FactoryParams<RouteTypes['docs']['home']>>('/docs'),
    api: makePathsFrom<FactoryParams<RouteTypes['docs']['api']>>('/docs/api'),
  },
  features: {
    home: makePathsFrom<FactoryParams<RouteTypes['features']['home']>>('/features'),
    bundle: makePathsFrom<FactoryParams<RouteTypes['features']['bundle']>>('/features/bundle'),
    lab: makePathsFrom<FactoryParams<RouteTypes['features']['lab']>>('/features/lab'),
    source: makePathsFrom<FactoryParams<RouteTypes['features']['source']>>('/features/source'),
  },
  projects: makePathsFrom<FactoryParams<RouteTypes['projects']>>('/projects'),
  notFound: makePathsFrom<FactoryParams<RouteTypes['notFound']>>('/404'),
  status: makePathsFrom<FactoryParams<RouteTypes['status']>>('/status'),
  license: makePathsFrom<FactoryParams<RouteTypes['license']>>('/license'),
  applications: makePathsFrom<FactoryParams<RouteTypes['applications']>>('/applications'),
  editPassword: makePathsFrom<FactoryParams<RouteTypes['editPassword']>>('/edit-password'),
  resetPassword: makePathsFrom<FactoryParams<RouteTypes['resetPassword']>>('/reset-password'),
  me: {
    home: makePathsFrom<FactoryParams<RouteTypes['me']['home']>>('/me'),
    connectedAccounts: makePathsFrom<FactoryParams<RouteTypes['me']['connectedAccounts']>>('/me/connected-accounts'),
    billing: makePathsFrom<FactoryParams<RouteTypes['me']['billing']>>('/me/billing'),
    accessToken: makePathsFrom<FactoryParams<RouteTypes['me']['accessToken']>>('/me/access-token'),
  },
  login: makePathsFrom<FactoryParams<RouteTypes['login']>>('/login'),
  importGithub: makePathsFrom<FactoryParams<RouteTypes['importGithub']>>('/import/github'),
  register: makePathsFrom<FactoryParams<RouteTypes['register']>>('/register'),
  project: {
    home: makePathsFrom<FactoryParams<RouteTypes['project']['home']>>('/projects/:projectId/home'),
    feature: makePathsFrom<FactoryParams<RouteTypes['project']['feature']>>('/projects/:projectId/:feature?'),
    statistics: {
      home: makePathsFrom<FactoryParams<RouteTypes['project']['statistics']['home']>>(
        '/projects/:projectId/statistics',
      ),
      artifacts: makePathsFrom<FactoryParams<RouteTypes['project']['statistics']['artifacts']>>(
        '/projects/:projectId/statistics/artifacts',
      ),
      snapshots: makePathsFrom<FactoryParams<RouteTypes['project']['statistics']['snapshots']>>(
        '/projects/:projectId/statistics/snapshots',
      ),
    },
    bundle: {
      home: makePathsFrom<FactoryParams<RouteTypes['project']['bundle']['home']>>('/projects/:projectId/bundle'),
      detail: makePathsFrom<FactoryParams<RouteTypes['project']['bundle']['detail']>>(
        '/projects/:projectId/bundle/:bundleId',
      ),
      jobBundleContent: makePathsFrom<FactoryParams<RouteTypes['project']['bundle']['jobBundleContent']>>(
        '/projects/:projectId/bundle/:bundleId/bundle-content',
      ),
    },
    lab: {
      home: makePathsFrom<FactoryParams<RouteTypes['project']['lab']['home']>>('/projects/:projectId/lab'),
      report: makePathsFrom<FactoryParams<RouteTypes['project']['lab']['report']>>(
        '/projects/:projectId/lab/reports/:reportId/:tabName?',
      ),
    },
    competitor: {
      home: makePathsFrom<FactoryParams<RouteTypes['project']['competitor']['home']>>(
        '/projects/:projectId/competitor',
      ),
      report: makePathsFrom<FactoryParams<RouteTypes['project']['competitor']['report']>>(
        '/projects/:projectId/competitor/reports/:tabName',
      ),
    },
    source: makePathsFrom<FactoryParams<RouteTypes['project']['source']>>('/projects/:projectId/source'),
    report: makePathsFrom<FactoryParams<RouteTypes['project']['report']>>('/projects/:projectId/report'),
    settings: makePathsFrom<FactoryParams<RouteTypes['project']['settings']>>(
      '/projects/:projectId/settings/:settingName?',
    ),
    jobTrace: makePathsFrom<FactoryParams<RouteTypes['project']['jobTrace']>>(
      '/projects/:projectId/jobs/:type/:entityId',
    ),
  },
}

export const titleFactory = {
  '/': (data: Record<string, any>) => makeTitlesFrom('Perfsee', data),
  '/docs': (data: Record<string, any>) => makeTitlesFrom('Perfsee', data),
  '/docs/api': (data: Record<string, any>) => makeTitlesFrom('Perfsee', data),
  '/features': (data: Record<string, any>) => makeTitlesFrom('Perfsee', data),
  '/features/bundle': (data: Record<string, any>) => makeTitlesFrom('Perfsee', data),
  '/features/lab': (data: Record<string, any>) => makeTitlesFrom('Perfsee', data),
  '/features/source': (data: Record<string, any>) => makeTitlesFrom('Perfsee', data),
  '/projects': (data: Record<string, any>) => makeTitlesFrom('Projects | Perfsee', data),
  '/404': (data: Record<string, any>) => makeTitlesFrom('Not found | Perfsee', data),
  '/status': (data: Record<string, any>) => makeTitlesFrom('Status | Perfsee', data),
  '/license': (data: Record<string, any>) => makeTitlesFrom('License | Perfsee', data),
  '/applications': (data: Record<string, any>) => makeTitlesFrom('Perfsee', data),
  '/edit-password': (data: Record<string, any>) => makeTitlesFrom('Edit password | Perfsee', data),
  '/reset-password': (data: Record<string, any>) => makeTitlesFrom('Reset password | Perfsee', data),
  '/me': (data: Record<string, any>) => makeTitlesFrom('Me | Perfsee', data),
  '/me/connected-accounts': (data: Record<string, any>) => makeTitlesFrom('Connected Accounts | Me | Perfsee', data),
  '/me/billing': (data: Record<string, any>) => makeTitlesFrom('Billing | Me | Perfsee', data),
  '/me/access-token': (data: Record<string, any>) => makeTitlesFrom('Access token | Me | Perfsee', data),
  '/login': (data: Record<string, any>) => makeTitlesFrom('Login | Perfsee', data),
  '/import/github': (data: Record<string, any>) => makeTitlesFrom('Import github | Perfsee', data),
  '/register': (data: Record<string, any>) => makeTitlesFrom('Register | Perfsee', data),
  '/projects/:projectId': (data: Record<string, any>) => makeTitlesFrom('{projectId} | Perfsee', data),
  '/projects/:projectId/:feature?': (data: Record<string, any>) =>
    makeTitlesFrom('{feature} | {projectId} | Perfsee', data),
  '/projects/:projectId/home': (data: Record<string, any>) => makeTitlesFrom('Home | {projectId} | Perfsee', data),
  '/projects/:projectId/statistics': (data: Record<string, any>) =>
    makeTitlesFrom('Statistics | {projectId} | Perfsee', data),
  '/projects/:projectId/statistics/artifacts': (data: Record<string, any>) =>
    makeTitlesFrom('Artifacts | Statistics | {projectId} | Perfsee', data),
  '/projects/:projectId/statistics/snapshots': (data: Record<string, any>) =>
    makeTitlesFrom('Snapshots | Statistics | {projectId} | Perfsee', data),
  '/projects/:projectId/bundle': (data: Record<string, any>) => makeTitlesFrom('Bundle | {projectId} | Perfsee', data),
  '/projects/:projectId/bundle/:bundleId': (data: Record<string, any>) =>
    makeTitlesFrom('Bundle #{bundleId} | Bundle | {projectId} | Perfsee', data),
  '/projects/:projectId/bundle/:bundleId/bundle-content': (data: Record<string, any>) =>
    makeTitlesFrom('Bundle content #{bundleId} | Bundle | {projectId} | Perfsee', data),
  '/projects/:projectId/lab': (data: Record<string, any>) => makeTitlesFrom('Lab | {projectId} | Perfsee', data),
  '/projects/:projectId/lab/reports/:reportId/:tabName?': (data: Record<string, any>) =>
    makeTitlesFrom('Report #{reportId} | Lab | {projectId} | Perfsee', data),
  '/projects/:projectId/competitor': (data: Record<string, any>) =>
    makeTitlesFrom('Competitor | {projectId} | Perfsee', data),
  '/projects/:projectId/competitor/reports/:tabName': (data: Record<string, any>) =>
    makeTitlesFrom('Competitor Report | Competitor | {projectId} | Perfsee', data),
  '/projects/:projectId/source': (data: Record<string, any>) => makeTitlesFrom('Source | {projectId} | Perfsee', data),
  '/projects/:projectId/report': (data: Record<string, any>) => makeTitlesFrom('Report | {projectId} | Perfsee', data),
  '/projects/:projectId/settings/:settingName?': (data: Record<string, any>) =>
    makeTitlesFrom('Setting {settingName} | {projectId} | Perfsee', data),
  '/projects/:projectId/jobs/:type/:entityId': (data: Record<string, any>) =>
    makeTitlesFrom('{type} job #{entityId} | {projectId} | Perfsee', data),
}
