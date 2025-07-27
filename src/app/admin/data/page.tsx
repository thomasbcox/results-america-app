"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock, 
  Database,
  Download,
  Eye,
  Play,
  Settings,
  History
} from "lucide-react";

interface CSVImportTemplate {
  id: number;
  name: string;
  description: string;
  categoryId?: number;
  dataSourceId?: number;
  templateSchema: any;
  validationRules: any;
  sampleData: string;
}

interface ImportHistory {
  id: number;
  name: string;
  filename: string;
  status: string;
  uploadedAt: string;
  validatedAt?: string;
  publishedAt?: string;
  uploadedBy: string;
}

export default function AdminDataPage() {
  const [templates, setTemplates] = useState<CSVImportTemplate[]>([]);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMetadata, setImportMetadata] = useState({
    name: '',
    description: '',
    dataSource: '',
    dataYear: new Date().getFullYear().toString(),
    statisticName: ''
  });
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    fetchTemplates();
    fetchImportHistory();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/csv-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchImportHistory = async () => {
    try {
      const response = await fetch('/api/admin/csv-imports');
      if (response.ok) {
        const data = await response.json();
        setImportHistory(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch import history:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedTemplate) {
      alert('Please select a file and template');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('templateId', selectedTemplate.toString());
      formData.append('metadata', JSON.stringify(importMetadata));

      const response = await fetch('/api/admin/csv-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert(`Upload successful! ${result.message}`);
        setActiveTab('history');
        fetchImportHistory();
        // Reset form
        setSelectedFile(null);
        setSelectedTemplate(null);
        setImportMetadata({
          name: '',
          description: '',
          dataSource: '',
          dataYear: new Date().getFullYear().toString(),
          statisticName: ''
        });
      } else {
        alert(`Upload failed: ${result.message}`);
      }
    } catch (error) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleValidate = async (importId: number) => {
    try {
      const response = await fetch(`/api/admin/csv-imports/${importId}/validate`, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        alert(`Validation completed: ${result.message}`);
        fetchImportHistory();
      } else {
        alert(`Validation failed: ${result.message}`);
      }
    } catch (error) {
      alert('Validation failed');
    }
  };

  const handlePublish = async (importId: number) => {
    if (!confirm('Are you sure you want to publish this data? This will make it available to users.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/csv-imports/${importId}/publish`, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        alert(`Publishing successful: ${result.message}`);
        fetchImportHistory();
      } else {
        alert(`Publishing failed: ${result.message}`);
      }
    } catch (error) {
      alert('Publishing failed');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'validating':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'validated':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'staged':
        return <Database className="h-4 w-4 text-purple-500" />;
      case 'publishing':
        return <Play className="h-4 w-4 text-orange-500" />;
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      uploaded: "outline",
      validating: "secondary",
      validated: "default",
      staged: "default",
      publishing: "secondary",
      published: "default",
      failed: "destructive"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Data Management</h1>
          <p className="mt-2 text-gray-600">
            Upload, validate, and publish CSV data with full metadata tracking
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 sm:px-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload Data</TabsTrigger>
            <TabsTrigger value="history">Import History</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload CSV File
                </CardTitle>
                <CardDescription>
                  Select a template and upload your CSV file for validation and publishing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Template Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Template</label>
                  <Select value={selectedTemplate?.toString() || ''} onValueChange={(value) => setSelectedTemplate(Number(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTemplate && (
                    <p className="text-sm text-gray-600">
                      {templates.find(t => t.id === selectedTemplate)?.description}
                    </p>
                  )}
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">CSV File</label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Import Name</label>
                    <Input
                      value={importMetadata.name}
                      onChange={(e) => setImportMetadata({...importMetadata, name: e.target.value})}
                      placeholder="e.g., 2023 GDP Data Import"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Year</label>
                    <Input
                      type="number"
                      value={importMetadata.dataYear}
                      onChange={(e) => setImportMetadata({...importMetadata, dataYear: e.target.value})}
                      placeholder="2023"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Source</label>
                    <Input
                      value={importMetadata.dataSource}
                      onChange={(e) => setImportMetadata({...importMetadata, dataSource: e.target.value})}
                      placeholder="e.g., Bureau of Economic Analysis"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Statistic Name</label>
                    <Input
                      value={importMetadata.statisticName}
                      onChange={(e) => setImportMetadata({...importMetadata, statisticName: e.target.value})}
                      placeholder="e.g., Real GDP"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={importMetadata.description}
                    onChange={(e) => setImportMetadata({...importMetadata, description: e.target.value})}
                    placeholder="Describe the data being imported..."
                    rows={3}
                  />
                </div>

                {/* Upload Button */}
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || !selectedTemplate || uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload and Stage Data
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Import History
                </CardTitle>
                <CardDescription>
                  Track all CSV imports and their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {importHistory.map((import_) => (
                    <div key={import_.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(import_.status)}
                          <div>
                            <h3 className="font-medium">{import_.name}</h3>
                            <p className="text-sm text-gray-600">{import_.filename}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded by {import_.uploadedBy} on {new Date(import_.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(import_.status)}
                          <div className="flex gap-1">
                            {import_.status === 'staged' && (
                              <Button size="sm" onClick={() => handleValidate(import_.id)}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Validate
                              </Button>
                            )}
                            {import_.status === 'validated' && (
                              <Button size="sm" onClick={() => handlePublish(import_.id)}>
                                <Play className="h-4 w-4 mr-1" />
                                Publish
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {importHistory.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No imports found</p>
                      <p className="text-sm">Upload your first CSV file to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Import Templates
                </CardTitle>
                <CardDescription>
                  Predefined templates for different data sources and formats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium">Expected Columns:</span>
                            <p className="text-gray-600 mt-1">
                              {template.templateSchema.expectedHeaders.join(', ')}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="w-full">
                            <Download className="h-4 w-4 mr-1" />
                            Download Sample
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {templates.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No templates available</p>
                      <p className="text-sm">Contact an administrator to create templates</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 