import { useEffect } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Reports() {
  useEffect(() => {
    document.title = 'Reports - EventSphere';
  }, []);

  const reportTypes = [
    {
      title: 'Incident Reports',
      description: 'Detailed reports of all incidents and responses',
      icon: FileText,
    },
    {
      title: 'Event Summaries',
      description: 'Comprehensive summaries of past events',
      icon: Calendar,
    },
    {
      title: 'Team Performance',
      description: 'Performance metrics and analytics for teams',
      icon: FileText,
    },
    {
      title: 'Compliance Reports',
      description: 'Regulatory compliance and audit documentation',
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and download comprehensive reports</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reportTypes.map((report) => (
          <Card key={report.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <report.icon className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Excel
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
          <CardDescription>Create custom reports with specific data and filters</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Advanced report builder with customizable templates, filters, and export options coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
