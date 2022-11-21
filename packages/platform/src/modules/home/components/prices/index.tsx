import { CheckOutlined } from '@ant-design/icons'
import { TooltipHost } from '@fluentui/react'
import { Link } from 'react-router-dom'

import { staticPath } from '@perfsee/shared/routes'

import { PrimaryButton } from '../button'

import {
  BorderedButton,
  ButtonWrap,
  CardsContainer,
  Container,
  PriceCard,
  PriceCardDescription,
  PriceCardHead,
  PriceContent,
  PriceContentItem,
  PriceContentItemIcon,
} from './style'

export const HomePrices = () => {
  return (
    <Container>
      <h1>Prices</h1>
      <CardsContainer>
        <PriceCard>
          <PriceCardHead>
            <span>Free</span>
            <span>$0</span>
          </PriceCardHead>
          <PriceCardDescription>
            Default plan for all projects. You can take a free trial with limited usages.
          </PriceCardDescription>
          <PriceContent>
            <PriceContentItem>
              <PriceContentItemIcon>
                <CheckOutlined />
              </PriceContentItemIcon>
              <span>
                <b>500</b> times job per month
              </span>
            </PriceContentItem>
            <PriceContentItem>
              <PriceContentItemIcon>
                <CheckOutlined />
              </PriceContentItemIcon>
              <span>
                <b>2000</b> minutes job running time per month
              </span>
            </PriceContentItem>
            <PriceContentItem>
              <PriceContentItemIcon>
                <CheckOutlined />
              </PriceContentItemIcon>
              <span>
                <b>1GB</b> storage totally
              </span>
            </PriceContentItem>
          </PriceContent>

          <ButtonWrap>
            <Link to={staticPath.projects}>
              <PrimaryButton>Try now</PrimaryButton>
            </Link>
          </ButtonWrap>
        </PriceCard>

        <PriceCard>
          <PriceCardHead>
            <span>Premium</span>
            <span>Coming soon</span>
          </PriceCardHead>
          <PriceCardDescription>
            For users who has heavily usage with Perfsee. You will have no usage limit during all period.
          </PriceCardDescription>
          <PriceContent>
            <PriceContentItem>
              <PriceContentItemIcon>
                <CheckOutlined />
              </PriceContentItemIcon>
              <span>
                <b>Unlimited</b> times job per month
              </span>
            </PriceContentItem>
            <PriceContentItem>
              <PriceContentItemIcon>
                <CheckOutlined />
              </PriceContentItemIcon>
              <span>
                <b>Unlimited</b> minutes job running time per month
              </span>
            </PriceContentItem>
            <PriceContentItem>
              <PriceContentItemIcon>
                <CheckOutlined />
              </PriceContentItemIcon>
              <span>
                <b>Unlimited</b> storage totally
              </span>
            </PriceContentItem>
          </PriceContent>
          <ButtonWrap>
            <TooltipHost content="Issue on github.">
              <BorderedButton>Contact us</BorderedButton>
            </TooltipHost>
          </ButtonWrap>
        </PriceCard>
      </CardsContainer>
    </Container>
  )
}
