'use client'

import React, { useState, useEffect } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Tabs from '../../../components/ui/Tabs'
import ChannelIcon from '../../../components/ui/ChannelIcon'
import {
  MessageCircle,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Zap,
  Sliders,
  FileText,
  UserCheck,
  Building,
  Globe,
  Sparkles,
  ExternalLink,
  Plus,
} from 'lucide-react'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [pairingCode, setPairingCode] = useState<string | null>('4821-9903')
  const [isConnected, setIsConnected] = useState(true)

  // Templates list
  const templates = [
    {
      id: 'tpl-1',
      name: 'order_status_update',
      category: 'Utility',
      status: 'APPROVED',
      language: 'Arabic & English',
      preview: 'Hello {{customer_name}}, your order #{{order_id}} has been shipped and is on its way.',
    },
    {
      id: 'tpl-2',
      name: 'abandoned_cart_reminder',
      category: 'Marketing',
      status: 'APPROVED',
      language: 'Arabic',
      preview: 'مرحباً {{customer_name}}، لاحظنا أنك تركت بعض المنتجات في سلتك. استخدم كود NAZ10 لخصم 10%.',
    },
    {
      id: 'tpl-3',
      name: 'appointment_confirmation',
      category: 'Utility',
      status: 'APPROVED',
      language: 'Arabic & English',
      preview: 'Your scheduled consultation is confirmed for {{date}} at {{time}} AST.',
    },
  ]

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title="WhatsApp Business Hub"
        description="Official WhatsApp Cloud API & automated conversational management. Manage connected numbers, templates, and AI auto-replies."
        breadcrumbs={[
          { label: 'NazBiz', href: '/dashboard' },
          { label: 'WhatsApp Hub' },
        ]}
        primaryAction={
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => setActiveTab('templates')}
          >
            New Template
          </Button>
        }
        secondaryActions={
          <Badge variant="success" dot size="md">
            Cloud API: Healthy (High Tier)
          </Badge>
        }
      />

      {/* ─── KPI Metrics ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active WhatsApp Number"
          value="+966 50 123 4567"
          subValue="Verified Business"
          icon={<MessageCircle size={18} />}
        />
        <MetricCard
          label="Quality Rating"
          value="GREEN"
          subValue="High tier tier (100k msgs/day)"
          icon={<ShieldCheck size={18} />}
          variant="default"
        />
        <MetricCard
          label="WhatsApp Messages"
          value="6,420"
          subValue="Sent & received this week"
          trend={{ value: 18.2, isPositive: true }}
          icon={<Send size={18} />}
        />
        <MetricCard
          label="AI Autonomy on WhatsApp"
          value="84.2%"
          subValue="5,405 AI resolved replies"
          trend={{ value: 6.4, isPositive: true }}
          variant="ai"
          icon={<Sparkles size={18} />}
        />
      </div>

      {/* ─── Segmented Tabs ──────────────────────────────────────────────── */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Connection & Health', icon: <QrCode size={14} /> },
          { id: 'templates', label: 'Approved Templates', icon: <FileText size={14} />, count: templates.length },
          { id: 'automation', label: 'AI & Automation Rules', icon: <Zap size={14} /> },
          { id: 'profile', label: 'Business Profile', icon: <Building size={14} /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ─── Tab 1: Overview & Connection ─────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Connected Phone Numbers</CardTitle>
              <CardDescription>
                Live WhatsApp instances synced with the NazBiz inbox and AI routing engine.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-surface-elevated border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-success/10 border border-success/20 text-success flex items-center justify-center p-2.5">
                    <MessageCircle size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-text-primary">
                        NazBiz Official VIP Support
                      </h4>
                      <Badge variant="success" dot size="xs">
                        Connected
                      </Badge>
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5 font-mono">
                      +966 50 123 4567
                    </div>
                    <div className="text-[11px] text-text-tertiary mt-1">
                      Instance ID: wa_inst_99482 • Meta Cloud API v20.0
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setActiveTab('automation')}
                  >
                    AI Settings
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs"
                    onClick={() => alert('Disconnect number dialog')}
                  >
                    Unlink
                  </Button>
                </div>
              </div>

              {/* API Health Diagnostic */}
              <div className="p-4 rounded-xl bg-surface-elevated/40 border border-border/80 space-y-2.5">
                <div className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-success" />
                  <span>Meta Webhook & Cloud Health</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>
                    <span className="text-text-tertiary">Webhook Status</span>
                    <div className="font-semibold text-text-primary mt-0.5">Active (0 dropped)</div>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Daily Limit</span>
                    <div className="font-semibold text-text-primary mt-0.5">100,000 / day</div>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Avg Delivery Latency</span>
                    <div className="font-semibold text-text-primary mt-0.5">420 ms</div>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Assigned Bot</span>
                    <div className="font-semibold text-brand mt-0.5">OmniSales v2</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Connect Pairing Box */}
          <Card>
            <CardHeader>
              <CardTitle>Pair New Number</CardTitle>
              <CardDescription>
                Connect a secondary support line or backup business phone
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-surface-elevated text-center space-y-3 border border-border">
                <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center mx-auto">
                  <QrCode size={24} />
                </div>
                <div className="text-xs text-text-secondary leading-relaxed">
                  Open WhatsApp on your device &gt; Linked Devices &gt; Link with phone number:
                </div>
                <div className="p-3 bg-surface-card rounded-lg font-mono text-base font-bold text-brand tracking-widest border border-border">
                  {pairingCode}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setPairingCode('9102-7714')}
              >
                Regenerate Pairing Code
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Tab 2: WhatsApp Templates ────────────────────────────────────── */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Meta Pre-Approved Message Templates
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Templates are required to initiate outbound conversations outside the 24-hour service window.
              </p>
            </div>
            <Button variant="primary" size="sm">
              + Submit New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <Card key={tpl.id} className="flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-2.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="neutral" size="xs">
                        {tpl.category}
                      </Badge>
                      <Badge variant="success" size="xs">
                        {tpl.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-xs font-mono font-bold mt-2 truncate">
                      {tpl.name}
                    </CardTitle>
                    <span className="text-[10px] text-text-tertiary">
                      {tpl.language}
                    </span>
                  </CardHeader>

                  <CardContent className="pt-2">
                    <div className="p-3 rounded-lg bg-surface-elevated text-xs font-medium text-text-secondary leading-relaxed border border-border/60">
                      "{tpl.preview}"
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-text-tertiary">Ready to broadcast</span>
                  <Button variant="ghost" size="xs">
                    Test Send
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── Tab 3: Automation & AI Rules ─────────────────────────────────── */}
      {activeTab === 'automation' && (
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp AI Automation Settings</CardTitle>
            <CardDescription>
              Configure how the AI agent responds to incoming WhatsApp inquiries
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Assigned AI Agent"
                defaultValue="omnisales"
                options={[
                  { value: 'omnisales', label: 'OmniSales Agent v2 (Active)' },
                  { value: 'support', label: '24/7 Care & Triage Copilot' },
                  { value: 'lead', label: 'Lead Qualification Bot' },
                ]}
              />

              <Select
                label="Voice Note Processing"
                defaultValue="transcribe-reply"
                options={[
                  { value: 'transcribe-reply', label: 'Transcribe & Reply with AI (Multimodal)' },
                  { value: 'transcribe-only', label: 'Transcribe only (Human review)' },
                  { value: 'ignore', label: 'Ask customer for text' },
                ]}
                helperText="AI listens to customer WhatsApp voice notes automatically"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Auto-Reply Window"
                defaultValue="always"
                options={[
                  { value: 'always', label: '24/7 Always Active' },
                  { value: 'after-hours', label: 'After-Hours Only' },
                  { value: 'business-hours', label: 'Business Hours Only' },
                ]}
              />

              <Input
                label="Human Escalation Keyword"
                defaultValue="human, agent, speak with person, موظف"
                helperText="Comma-separated trigger words that immediately notify staff"
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button variant="primary" size="md">
              Save Automation Rules
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ─── Tab 4: Business Profile ──────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Official Business Profile</CardTitle>
            <CardDescription>
              Public customer-facing profile details displayed inside the WhatsApp app
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Business Display Name" defaultValue="NazBiz Global Official" />
              <Input label="Category" defaultValue="Customer Support & Software" />
            </div>

            <Input
              label="Business Description"
              defaultValue="Official WhatsApp channel for NazBiz customer inquiries, automated order tracking, and billing support."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Website" defaultValue="https://nazbiz.io" />
              <Input label="Customer Support Email" defaultValue="support@nazbiz.io" />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button variant="primary" size="md">
              Sync Profile with Meta
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
