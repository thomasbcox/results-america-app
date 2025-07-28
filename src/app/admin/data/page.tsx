"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play, 
  Eye, 
  Download, 
  Settings,
  AlertCircle,
  AlertTriangle,
  X
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
  const { addToast } = useToast();
  const { confirm } = useConfirmDialog();
  const [templates, setTemplates] = useState<CSVImportTemplate[]>([]);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMetadata, setImportMetadata] = useState({
    name: '',
    description: '',
    dataSource: '',
    statisticName: ''
  });
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [pastedData, setPastedData] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'paste'>('file');
  const [errorDetails, setErrorDetails] = useState<{
    show: boolean;
    importId: number | null;
    errors: string[];
    warnings: string[];
    stats: any;
  }>({
    show: false,
    importId: null,
    errors: [],
    warnings: [],
    stats: {}
  });

  const handlePasteData = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let data = e.target.value;
    
    // Detect if data contains tabs (Excel/Google Sheets format)
    if (data.includes('\t')) {
      // Convert tab-separated data to comma-separated
      data = data.replace(/\t/g, ',');
    }
    
    // Handle any double commas that might result from empty cells
    data = data.replace(/,,/g, ',');
    
    setPastedData(data);
  };

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
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedTemplate) {
      addToast({
        type: 'error',
        title: 'Missing Template',
        message: 'Please select a template'
      });
      return;
    }

    if (uploadMethod === 'file' && !selectedFile) {
      addToast({
        type: 'error',
        title: 'Missing File',
        message: 'Please select a file'
      });
      return;
    }

    if (uploadMethod === 'paste' && !pastedData.trim()) {
      addToast({
        type: 'error',
        title: 'Missing Data',
        message: 'Please paste your data'
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      
      if (uploadMethod === 'file') {
        formData.append('file', selectedFile!);
      } else {
        // Create a file from pasted data
        const blob = new Blob([pastedData], { type: 'text/csv' });
        const file = new File([blob], 'pasted-data.csv', { type: 'text/csv' });
        formData.append('file', file);
      }
      
      formData.append('templateId', selectedTemplate.toString());
      formData.append('metadata', JSON.stringify(importMetadata));

      const response = await fetch('/api/admin/csv-upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        addToast({
          type: 'success',
          title: 'Upload Successful',
          message: 'Data uploaded successfully!'
        });
        
        // Reset form
        setSelectedFile(null);
        setSelectedTemplate(null);
        setPastedData('');
        setImportMetadata({
          name: '',
          description: '',
          dataSource: '',
          statisticName: ''
        });
        
        // Wait a moment for the database to be updated, then refresh history
        setTimeout(() => {
          fetchImportHistory();
        }, 500);
      } else {
        const error = await response.json();
        addToast({
          type: 'error',
          title: 'Upload Failed',
          message: error.error || 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'Upload failed due to a network error'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleValidate = async (importId: number) => {
    try {
      const response = await fetch(`/api/admin/csv-imports/${importId}/validate`, {
        method: 'POST',
      });
      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Validation Successful',
          message: 'Import validated successfully!'
        });
        fetchImportHistory();
      } else {
        const error = await response.json();
        addToast({
          type: 'error',
          title: 'Validation Failed',
          message: error.error || 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      addToast({
        type: 'error',
        title: 'Validation Failed',
        message: 'Validation failed due to a network error'
      });
    }
  };

  const handlePublish = async (importId: number) => {
    confirm({
      title: 'Confirm Publishing',
      message: 'Are you sure you want to publish this import? This will make the data available to users.',
      confirmText: 'Publish',
      cancelText: 'Cancel',
      variant: 'warning',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/csv-imports/${importId}/publish`, {
            method: 'POST',
          });
          if (response.ok) {
            addToast({
              type: 'success',
              title: 'Publishing Successful',
              message: 'Import published successfully!'
            });
            fetchImportHistory();
          } else {
            const error = await response.json();
            addToast({
              type: 'error',
              title: 'Publishing Failed',
              message: error.error || 'Unknown error'
            });
          }
        } catch (error) {
          console.error('Publishing error:', error);
          addToast({
            type: 'error',
            title: 'Publishing Failed',
            message: 'Publishing failed due to a network error'
          });
        }
      }
    });
  };

  const handleViewImport = async (importId: number) => {
    try {
      const response = await fetch(`/api/admin/csv-imports/${importId}`);
      if (response.ok) {
        const data = await response.json();
        // For now, show the data in a toast. In the future, this could open a modal
        addToast({
          type: 'info',
          title: 'Import Details',
          message: `Import ID: ${importId}, Status: ${data.data?.status || 'unknown'}`
        });
      } else {
        addToast({
          type: 'error',
          title: 'View Failed',
          message: 'Failed to load import details'
        });
      }
    } catch (error) {
      console.error('View import error:', error);
      addToast({
        type: 'error',
        title: 'View Failed',
        message: 'Failed to load import details due to a network error'
      });
    }
  };

  const handleViewErrorDetails = async (importId: number) => {
    try {
      const response = await fetch(`/api/admin/csv-imports/${importId}/validate`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        // If validation succeeds, there are no errors to show
        addToast({
          type: 'info',
          title: 'No Errors',
          message: 'This import has no validation errors'
        });
      } else {
        const errorData = await response.json();
        setErrorDetails({
          show: true,
          importId,
          errors: errorData.data?.errors || [],
          warnings: errorData.data?.warnings || [],
          stats: errorData.data?.stats || {}
        });
      }
    } catch (error) {
      console.error('Error details error:', error);
      addToast({
        type: 'error',
        title: 'Error Details Failed',
        message: 'Failed to load error details due to a network error'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'staged':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'validated':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'published':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      staged: 'secondary',
      validated: 'default',
      published: 'default',
      error: 'destructive'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900">Data Management</h1>
        <p className="mt-2 text-gray-600">
          Upload, validate, and publish CSV data imports
        </p>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
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
                  Select a template and upload your CSV file for processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Template Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Template
                    </label>
                    <select
                      value={selectedTemplate || ''}
                      onChange={(e) => setSelectedTemplate(Number(e.target.value) || null)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Choose a template...</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Template Headers Display */}
                  {selectedTemplate && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Template Headers</h4>
                      {(() => {
                        const template = templates.find(t => t.id === selectedTemplate);
                        if (template?.templateSchema?.expectedHeaders) {
                          return (
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">
                                Your data should have these columns (in any order):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {template.templateSchema.expectedHeaders.map((header: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {header}
                                  </Badge>
                                ))}
                              </div>
                              {template.templateSchema.flexibleColumns && (
                                <p className="text-xs text-blue-600 mt-2">
                                  💡 This template supports additional columns beyond the required ones.
                                </p>
                              )}
                              {template.templateSchema.multiYearSupport && (
                                <p className="text-xs text-green-600 mt-1">
                                  📅 This template supports multiple years of data in a single file.
                                </p>
                              )}
                            </div>
                          );
                        }
                        return <p className="text-sm text-gray-500">Template details not available</p>;
                      })()}
                    </div>
                  )}

                  {/* Upload Method Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Method
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="file"
                          checked={uploadMethod === 'file'}
                          onChange={(e) => setUploadMethod(e.target.value as 'file' | 'paste')}
                          className="mr-2"
                        />
                        File Upload
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="paste"
                          checked={uploadMethod === 'paste'}
                          onChange={(e) => setUploadMethod(e.target.value as 'file' | 'paste')}
                          className="mr-2"
                        />
                        Paste from Excel
                      </label>
                    </div>
                  </div>

                  {/* File Upload */}
                  {uploadMethod === 'file' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select File
                      </label>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  )}

                  {/* Paste Data */}
                  {uploadMethod === 'paste' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paste Excel Data
                      </label>
                      <textarea
                        value={pastedData}
                        onChange={handlePasteData}
                        className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                        rows={10}
                        placeholder={`Paste your data here. Supports both CSV and Excel formats.

CSV Format:
State,Year,Category,Measure,Value
California,2020,Economy,GDP,3500000
Texas,2020,Economy,GDP,2200000

Excel/Google Sheets Format (tab-separated):
State	Year	Category	Measure	Value
California	2020	Economy	GDP	3500000
Texas	2020	Economy	GDP	2200000

Both formats will be automatically converted to CSV.`}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Tip: Copy from Excel, Google Sheets, or any CSV file and paste directly here. Tab-separated data will be automatically converted to CSV format.
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Import Name
                      </label>
                      <input
                        type="text"
                        value={importMetadata.name}
                        onChange={(e) => setImportMetadata({...importMetadata, name: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="e.g., 2023 Economic Data"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Source
                      </label>
                      <input
                        type="text"
                        value={importMetadata.dataSource}
                        onChange={(e) => setImportMetadata({...importMetadata, dataSource: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="e.g., Bureau of Economic Analysis"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Statistic Name
                      </label>
                      <input
                        type="text"
                        value={importMetadata.statisticName}
                        onChange={(e) => setImportMetadata({...importMetadata, statisticName: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="e.g., Real GDP"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={importMetadata.description}
                      onChange={(e) => setImportMetadata({...importMetadata, description: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows={3}
                      placeholder="Brief description of this data import..."
                    />
                  </div>

                  <Button
                    onClick={handleUpload}
                    disabled={
                      !selectedTemplate || 
                      uploading || 
                      (uploadMethod === 'file' && !selectedFile) ||
                      (uploadMethod === 'paste' && !pastedData.trim())
                    }
                    className="w-full"
                  >
                    {uploading ? 'Uploading...' : `Upload ${uploadMethod === 'file' ? 'File' : 'Data'}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Import History
                </CardTitle>
                <CardDescription>
                  View and manage your CSV imports
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
                            {import_.status === 'failed' && (
                              <Button size="sm" variant="destructive" onClick={() => handleViewErrorDetails(import_.id)}>
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Error Details
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleViewImport(import_.id)}>
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

      {/* Error Details Modal */}
      {errorDetails.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Validation Error Details</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setErrorDetails({ ...errorDetails, show: false })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Statistics */}
            {errorDetails.stats && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Validation Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Rows:</span>
                    <span className="ml-2 font-medium">{errorDetails.stats.totalRows}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Valid Rows:</span>
                    <span className="ml-2 font-medium text-green-600">{errorDetails.stats.validRows}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Invalid Rows:</span>
                    <span className="ml-2 font-medium text-red-600">{errorDetails.stats.invalidRows}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Warnings:</span>
                    <span className="ml-2 font-medium text-yellow-600">{errorDetails.stats.warnings}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Errors */}
            {errorDetails.errors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-red-900 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Validation Errors ({errorDetails.errors.length})
                </h3>
                <div className="space-y-2">
                  {errorDetails.errors.map((error, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {errorDetails.warnings.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-yellow-900 mb-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Warnings ({errorDetails.warnings.length})
                </h3>
                <div className="space-y-2">
                  {errorDetails.warnings.map((warning, index) => (
                    <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">{warning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setErrorDetails({ ...errorDetails, show: false })}
              >
                Close
              </Button>
              {errorDetails.errors.length === 0 && (
                <Button
                  onClick={() => {
                    setErrorDetails({ ...errorDetails, show: false });
                    if (errorDetails.importId) {
                      handleValidate(errorDetails.importId);
                    }
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Re-validate
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 