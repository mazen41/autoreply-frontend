// Inbox needs full viewport height with no padding override from DashboardLayout
export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: 'calc(100vh - 60px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  )
}
