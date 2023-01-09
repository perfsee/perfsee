/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {
  CloseOutlined,
  InfoCircleOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  LeftOutlined,
  DoubleRightOutlined,
  DoubleLeftOutlined,
  RightOutlined,
  TagOutlined,
  RedoOutlined,
  DownOutlined,
  StarFilled,
  StarOutlined,
  SearchOutlined,
  CheckOutlined,
  PlusOutlined,
  DeleteOutlined,
  CalendarOutlined,
  MoreOutlined,
  EditOutlined,
  FieldTimeOutlined,
  BlockOutlined,
  DotChartOutlined,
  FireOutlined,
  HomeOutlined,
  PieChartOutlined,
  SettingOutlined,
  BellOutlined,
  BellFilled,
  ContactsOutlined,
  SwapOutlined,
  LeftSquareOutlined,
  RightSquareOutlined,
  SaveOutlined,
  UserOutlined,
  KeyOutlined,
  CreditCardOutlined,
  DesktopOutlined,
  ApiOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import { registerIcons } from '@fluentui/react'
import { PlugConnectedIcon, PlugDisconnectedIcon, HideIcon, RedEyeIcon } from '@fluentui/react-icons-mdl2'

import { FlameIcon } from '@perfsee/components'

registerIcons({
  icons: {
    loading: <LoadingOutlined />,
    back: <LeftOutlined />,
    clear: <CloseOutlined />,
    errorBadge: <CloseCircleOutlined />,
    info: <InfoCircleOutlined />,
    blocked2: <StopOutlined />,
    warning: <ExclamationCircleOutlined />,
    completed: <CheckCircleOutlined />,
    sortdown: <ArrowDownOutlined />,
    sortup: <ArrowUpOutlined />,
    LeftOutlined: <LeftOutlined />,
    DoubleLeftOutlined: <DoubleLeftOutlined />,
    RightOutlined: <RightOutlined />,
    DoubleRightOutlined: <DoubleRightOutlined />,
    RedoOutlined: <RedoOutlined />,
    ChevronRightMed: <RightOutlined />,
    Tag: <TagOutlined />,
    ChevronLeft: <LeftOutlined />,
    ChevronRight: <RightOutlined />,
    chevrondown: <DownOutlined />,
    StarFilled: <StarFilled />,
    StarOutlined: <StarOutlined />,
    search: <SearchOutlined />,
    cancel: <CloseOutlined />,
    checkmark: <CheckOutlined />,
    plus: <PlusOutlined />,
    delete: <DeleteOutlined />,
    up: <ArrowUpOutlined />,
    down: <ArrowDownOutlined />,
    calendar: <CalendarOutlined />,
    Calories: <FlameIcon />,
    circlering: <CheckCircleOutlined />,
    statuscirclecheckmark: <CheckCircleOutlined style={{ opacity: 0 }} />,
    more: <MoreOutlined />,
    edit: <EditOutlined />,
    benchmark: <FieldTimeOutlined />,
    home: <HomeOutlined />,
    bundle: <PieChartOutlined />,
    lab: <DotChartOutlined />,
    source: <FireOutlined />,
    competitor: <BlockOutlined />,
    settings: <SettingOutlined />,
    subscribe: <BellOutlined />,
    unsubscribe: <BellFilled />,
    PlugConnected: <PlugConnectedIcon />,
    PlugDisconnected: <PlugDisconnectedIcon />,
    contact: <ContactsOutlined />,
    swap: <SwapOutlined />,
    squareLeft: <LeftSquareOutlined />,
    squareRight: <RightSquareOutlined />,
    save: <SaveOutlined />,
    user: <UserOutlined />,
    key: <KeyOutlined />,
    creditCard: <CreditCardOutlined />,
    desktop: <DesktopOutlined />,
    ping: <ApiOutlined />,
    global: <GlobalOutlined />,

    // for password text field
    Hide: <HideIcon />,
    RedEye: <RedEyeIcon />,
  },
})
