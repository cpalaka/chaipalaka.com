export function PlainMinimalFrameMock() {
    return (
        <div className="plain-frame-mock-panel" role="complementary" aria-label="PlainLayout minimal frame mock">
            <div className="plain-frame-mock-panel__title">PlainLayout frame (mock)</div>
            <div className="plain-frame-bar">
                <div className="plain-frame-bar__site-name">chaipalaka</div>
                <div className="plain-frame-bar__section">/blog/my-post/read</div>
                <button className="plain-frame-bar__back-link">
                    ← back to canvas
                </button>
            </div>
            <p style={{ marginTop: 10, fontSize: 10, color: 'var(--color-fg-muted)', lineHeight: 1.5 }}>
                Minimal variant: site name + section + back link. No card strip, no controls.
            </p>
        </div>
    )
}
