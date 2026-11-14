import DashboardLayout from '../../components/dashboard/DashboardLayout'
import SmoothScroll from '../../components/ui/SmoothScroll'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <DashboardLayout>{children}</DashboardLayout>
    </SmoothScroll>
  )
}
