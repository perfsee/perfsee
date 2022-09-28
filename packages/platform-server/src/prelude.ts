/* eslint-disable import/first */
import 'dotenv/config'
import { getDefaultPerfseeConfig } from './config/default'

globalThis.perfsee = getDefaultPerfseeConfig()

import './perfsee.config'
import './perfsee.env'
import './config/env'
