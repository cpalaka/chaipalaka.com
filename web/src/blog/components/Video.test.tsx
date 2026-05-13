import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Video } from './Video'

describe('Video', () => {
    test('renders <figure><video src controls></figure>', () => {
        const { container } = render(<Video src="/clip.mp4" />)
        const figure = container.querySelector('figure')
        const video = figure?.querySelector('video')
        expect(figure).toBeTruthy()
        expect(video).toBeTruthy()
        expect(video?.getAttribute('src')).toBe('/clip.mp4')
        expect(video?.hasAttribute('controls')).toBe(true)
    })

    test('caption provided renders <figcaption> after the video', () => {
        const { container } = render(
            <Video src="/clip.mp4" caption="a sea otter" />,
        )
        const caption = container.querySelector('figcaption')
        expect(caption).toBeTruthy()
        expect(caption?.textContent).toBe('a sea otter')
    })

    test('caption absent renders no <figcaption>', () => {
        const { container } = render(<Video src="/clip.mp4" />)
        expect(container.querySelector('figcaption')).toBeNull()
    })

    test('<video> has inline style width: 100%', () => {
        const { container } = render(<Video src="/clip.mp4" />)
        const video = container.querySelector('video') as HTMLVideoElement
        expect(video.style.width).toBe('100%')
    })
})
