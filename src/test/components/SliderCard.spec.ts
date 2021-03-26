import SliderCard from '../../components/cards/SliderCard'
import { render } from '@testing-library/react'
import { NewsType } from '../../types/NewsType';
import { TEST_NEWS } from '../../utils/constant';

describe('SliderCard', () => {
  let expectedProps: { news: NewsType };
  const testNews: NewsType = TEST_NEWS
  beforeEach(() => {
    expectedProps = {
      news: testNews
    }
  })
  test('should render caption', () => {
    const { getByText } = render(SliderCard({ ...expectedProps.news }))
    const caption = getByText(expectedProps.news.caption)
    expect(caption).toBeVisible();
  })
})