"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Tabs, TabList, TabTrigger, TabPanel } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { Dialog } from "@/components/ui/dialog";
import { Divider } from "@/components/ui/divider";
import { Pagination } from "@/components/ui/pagination";
import { StatsCard } from "@/components/ui/stats-card";
import { DropdownMenu, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchSelect } from "@/components/ui/search-select";
import { SaveIndicator } from "@/components/ui/save-indicator";
import { FormSection } from "@/components/ui/form-section";
import { DateRangePicker } from "@/components/ui/date-range-picker";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
      {children}
    </h2>
  );
}

function SectionWrapper({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

export default function ComponentGalleryPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paginationPage, setPaginationPage] = useState(1);
  const [switchChecked, setSwitchChecked] = useState(false);
  const [currencyValue, setCurrencyValue] = useState<number | null>(1500);
  const [searchSelectValue, setSearchSelectValue] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Component Gallery
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          This page is only available in development mode.
        </p>
      </div>
    );
  }

  const searchOptions = [
    { value: "personnel", label: "Personnel" },
    { value: "fringe", label: "Fringe Benefits" },
    { value: "travel", label: "Travel" },
    { value: "equipment", label: "Equipment" },
    { value: "supplies", label: "Supplies" },
  ];

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Component Gallery
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Living style guide showcasing all UI components. Development only.
        </p>
      </div>

      {/* Button */}
      <SectionWrapper>
        <SectionHeading>Button</SectionHeading>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" loading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </SectionWrapper>

      {/* Input / Select / CurrencyInput */}
      <SectionWrapper>
        <SectionHeading>Input / Select / CurrencyInput</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Default Input" id="demo-input" placeholder="Enter text..." />
          <Input label="With Error" id="demo-input-err" error="This field is required" />
          <Input label="With Success" id="demo-input-ok" success defaultValue="Valid input" />
          <Input label="With Prefix" id="demo-prefix" prefix="@" placeholder="username" />
          <Input label="With Hint" id="demo-hint" hint="optional" placeholder="Optional field" />
          <Select
            label="Select"
            id="demo-select"
            options={[
              { value: "a", label: "Option A" },
              { value: "b", label: "Option B" },
              { value: "c", label: "Option C" },
            ]}
            placeholder="Choose one"
          />
          <CurrencyInput
            label="Currency"
            id="demo-currency"
            value={currencyValue}
            onChange={setCurrencyValue}
          />
        </div>
      </SectionWrapper>

      {/* Badge */}
      <SectionWrapper>
        <SectionHeading>Badge</SectionHeading>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </SectionWrapper>

      {/* Card */}
      <SectionWrapper>
        <SectionHeading>Card</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card padding="sm">
            <CardHeader>
              <CardTitle>Small Padding</CardTitle>
              <CardDescription>Card with sm padding</CardDescription>
            </CardHeader>
            <p className="text-sm text-slate-600 dark:text-slate-400">Card content here.</p>
          </Card>
          <Card padding="md" hover>
            <CardHeader>
              <CardTitle>Hoverable</CardTitle>
              <CardDescription>Hover to see effect</CardDescription>
            </CardHeader>
            <p className="text-sm text-slate-600 dark:text-slate-400">Card content here.</p>
          </Card>
          <Card padding="lg">
            <CardHeader>
              <CardTitle>Large Padding</CardTitle>
              <CardDescription>Card with lg padding</CardDescription>
            </CardHeader>
            <p className="text-sm text-slate-600 dark:text-slate-400">Card content here.</p>
          </Card>
        </div>
      </SectionWrapper>

      {/* Alert */}
      <SectionWrapper>
        <SectionHeading>Alert</SectionHeading>
        <div className="space-y-3">
          <Alert variant="info" title="Information">This is an informational alert.</Alert>
          <Alert variant="success" title="Success">Operation completed successfully.</Alert>
          <Alert variant="warning" title="Warning">Please review before proceeding.</Alert>
          <Alert variant="danger" title="Error">Something went wrong.</Alert>
          <Alert variant="info" dismissible>This alert can be dismissed.</Alert>
        </div>
      </SectionWrapper>

      {/* Tabs */}
      <SectionWrapper>
        <SectionHeading>Tabs</SectionHeading>
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Underline</p>
            <Tabs defaultValue="tab1" variant="underline">
              <TabList>
                <TabTrigger value="tab1">Overview</TabTrigger>
                <TabTrigger value="tab2">Expenses</TabTrigger>
                <TabTrigger value="tab3" disabled>Disabled</TabTrigger>
              </TabList>
              <TabPanel value="tab1"><p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Overview content</p></TabPanel>
              <TabPanel value="tab2"><p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Expenses content</p></TabPanel>
              <TabPanel value="tab3"><p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Disabled content</p></TabPanel>
            </Tabs>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Pills</p>
            <Tabs defaultValue="tab1" variant="pills">
              <TabList>
                <TabTrigger value="tab1">Overview</TabTrigger>
                <TabTrigger value="tab2">Expenses</TabTrigger>
              </TabList>
              <TabPanel value="tab1"><p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Overview content</p></TabPanel>
              <TabPanel value="tab2"><p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Expenses content</p></TabPanel>
            </Tabs>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Enclosed</p>
            <Tabs defaultValue="tab1" variant="enclosed">
              <TabList>
                <TabTrigger value="tab1">Overview</TabTrigger>
                <TabTrigger value="tab2">Expenses</TabTrigger>
              </TabList>
              <TabPanel value="tab1"><p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Overview content</p></TabPanel>
              <TabPanel value="tab2"><p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Expenses content</p></TabPanel>
            </Tabs>
          </div>
        </div>
      </SectionWrapper>

      {/* Switch */}
      <SectionWrapper>
        <SectionHeading>Switch</SectionHeading>
        <div className="flex flex-col gap-4">
          <Switch size="sm" label="Small switch" />
          <Switch
            size="md"
            label="Medium switch"
            description="With description text"
            checked={switchChecked}
            onChange={() => setSwitchChecked(!switchChecked)}
          />
          <Switch size="lg" label="Large switch" />
          <Switch size="md" label="Disabled" disabled />
        </div>
      </SectionWrapper>

      {/* Avatar */}
      <SectionWrapper>
        <SectionHeading>Avatar</SectionHeading>
        <div className="flex flex-wrap items-end gap-4">
          <Avatar name="Jane Smith" size="xs" />
          <Avatar name="Jane Smith" size="sm" />
          <Avatar name="Jane Smith" size="md" />
          <Avatar name="Jane Smith" size="lg" />
          <Avatar name="Jane Smith" size="xl" />
          <Avatar name="Bob Jones" size="md" status="online" />
          <Avatar name="Alice Wong" size="md" status="busy" />
          <Avatar name="Chris Lee" size="md" status="away" />
        </div>
      </SectionWrapper>

      {/* Progress */}
      <SectionWrapper>
        <SectionHeading>Progress Bar / Ring</SectionHeading>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <ProgressBar value={25} size="sm" label="Small" showValue />
            <ProgressBar value={50} size="md" color="success" label="Medium Success" showValue />
            <ProgressBar value={75} size="lg" color="warning" label="Large Warning" showValue />
            <ProgressBar value={95} color="danger" label="Danger" showValue />
          </div>
          <div className="flex items-center gap-6">
            <ProgressRing value={25} size="sm" />
            <ProgressRing value={50} size="md" color="success" />
            <ProgressRing value={75} size="lg" color="warning" />
          </div>
        </div>
      </SectionWrapper>

      {/* Chip / ChipGroup */}
      <SectionWrapper>
        <SectionHeading>Chip / ChipGroup</SectionHeading>
        <ChipGroup>
          <Chip variant="default">Default</Chip>
          <Chip variant="success">Success</Chip>
          <Chip variant="warning">Warning</Chip>
          <Chip variant="danger">Danger</Chip>
          <Chip variant="info">Info</Chip>
          <Chip variant="default" removable onRemove={() => {}}>Removable</Chip>
        </ChipGroup>
      </SectionWrapper>

      {/* Dialog */}
      <SectionWrapper>
        <SectionHeading>Dialog</SectionHeading>
        <Button onClick={() => setDialogOpen(true)}>Open Dialog</Button>
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Example Dialog">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This is a dialog example with some content inside.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setDialogOpen(false)}>Confirm</Button>
          </div>
        </Dialog>
      </SectionWrapper>

      {/* Divider */}
      <SectionWrapper>
        <SectionHeading>Divider</SectionHeading>
        <div className="space-y-4">
          <Divider />
          <Divider label="Or continue with" />
          <div className="flex items-center h-8 gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">Left</span>
            <Divider orientation="vertical" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Right</span>
          </div>
        </div>
      </SectionWrapper>

      {/* Pagination */}
      <SectionWrapper>
        <SectionHeading>Pagination</SectionHeading>
        <Pagination
          page={paginationPage}
          totalPages={10}
          total={100}
          pageSize={10}
          onPageChange={setPaginationPage}
        />
      </SectionWrapper>

      {/* StatsCard */}
      <SectionWrapper>
        <SectionHeading>StatsCard</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard title="Total Expenses" value="$45,230" />
          <StatsCard
            title="Budget Used"
            value="67%"
            trend={{ value: 12, direction: "up", label: "vs last month" }}
          />
          <StatsCard
            title="Pending Review"
            value="23"
            trend={{ value: 5, direction: "down", label: "from yesterday" }}
          />
        </div>
      </SectionWrapper>

      {/* DropdownMenu */}
      <SectionWrapper>
        <SectionHeading>DropdownMenu</SectionHeading>
        <DropdownMenu>
          <DropdownTrigger className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
            Actions
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </DropdownTrigger>
          <DropdownContent>
            <DropdownItem onSelect={() => {}}>Edit</DropdownItem>
            <DropdownItem onSelect={() => {}}>Duplicate</DropdownItem>
            <DropdownSeparator />
            <DropdownItem onSelect={() => {}} danger>Delete</DropdownItem>
          </DropdownContent>
        </DropdownMenu>
      </SectionWrapper>

      {/* Tooltip */}
      <SectionWrapper>
        <SectionHeading>Tooltip</SectionHeading>
        <div className="flex flex-wrap gap-6">
          <Tooltip content="Tooltip on top" position="top">
            <Button variant="secondary" size="sm">Top</Button>
          </Tooltip>
          <Tooltip content="Tooltip on bottom" position="bottom">
            <Button variant="secondary" size="sm">Bottom</Button>
          </Tooltip>
          <Tooltip content="Tooltip on left" position="left">
            <Button variant="secondary" size="sm">Left</Button>
          </Tooltip>
          <Tooltip content="Tooltip on right" position="right">
            <Button variant="secondary" size="sm">Right</Button>
          </Tooltip>
        </div>
      </SectionWrapper>

      {/* EmptyState */}
      <SectionWrapper>
        <SectionHeading>EmptyState</SectionHeading>
        <EmptyState
          title="No expenses yet"
          description="Import expenses from your accounting system or upload a CSV file."
          action={<Button size="sm">Import Expenses</Button>}
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
      </SectionWrapper>

      {/* SearchSelect */}
      <SectionWrapper>
        <SectionHeading>SearchSelect</SectionHeading>
        <div className="max-w-sm">
          <SearchSelect
            options={searchOptions}
            value={searchSelectValue}
            onChange={setSearchSelectValue}
            label="SF-424A Category"
            placeholder="Select a category..."
            id="demo-search-select"
          />
        </div>
      </SectionWrapper>

      {/* SaveIndicator */}
      <SectionWrapper>
        <SectionHeading>SaveIndicator</SectionHeading>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSaveStatus("saving");
              setTimeout(() => setSaveStatus("saved"), 1500);
            }}
          >
            Simulate Save
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSaveStatus("saving");
              setTimeout(() => setSaveStatus("error"), 1500);
            }}
          >
            Simulate Error
          </Button>
          <SaveIndicator status={saveStatus} />
        </div>
      </SectionWrapper>

      {/* FormSection */}
      <SectionWrapper>
        <SectionHeading>FormSection</SectionHeading>
        <FormSection title="Grant Details" description="Basic information about the grant.">
          <Input label="Grant Name" id="demo-grant-name" placeholder="Enter grant name" />
          <Input label="CFDA Number" id="demo-cfda" placeholder="e.g. 93.778" />
        </FormSection>
        <FormSection title="Collapsible Section" description="Click to toggle." collapsible defaultOpen={false}>
          <Input label="Hidden Field" id="demo-hidden" placeholder="Now you see me" />
        </FormSection>
      </SectionWrapper>

      {/* DateRangePicker */}
      <SectionWrapper>
        <SectionHeading>DateRangePicker</SectionHeading>
        <div className="max-w-lg">
          <DateRangePicker
            label="Grant Period"
            id="demo-date-range"
          />
        </div>
      </SectionWrapper>
    </div>
  );
}
