import { Outlet } from 'react-router-dom'

export default function PlainLayout() {
  return (
    <div data-layout="plain">
      <Outlet />
    </div>
  )
}
