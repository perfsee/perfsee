/* eslint-disable import/first */
import 'dotenv/config'
import { getDefaultPerfseeConfig } from './config/default'

process.env.NODE_ENV ||= 'production'
globalThis.perfsee = getDefaultPerfseeConfig()

import './perfsee.config'
import './perfsee.env'
import './config/env'
