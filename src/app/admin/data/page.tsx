"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useSafeContextValue } from "@/lib/utils/hydrationUtils";
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
  X,
  Copy
} from "lucide-react";

interface CSVImportTemplate {
  id: number;
  name: string;
  description: string;
  type: string;
  categoryId?: number;
  dataSourceId?: number;
  templateSchema: {
    columns: {
      name: string;
      type: 'string' | 'number' | 'date' | 'boolean';
      required: boolean;
      mapping?: string;
      validation?: any;
    }[];
    expectedHeaders: string[];
    flexibleColumns?: boolean;
    multiYearSupport?: boolean;
  };
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
  duplicateOf?: number;
  originalImportName?: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface Measure {
  id: number;
  name: string;
  categoryId: number;
  description?: string;
}

export default function AdminDataPage() {
  const { addToast } = useToast();
  const { confirm } = useConfirmDialog();
  const [templates, setTemplates] = useState<CSVImportTemplate[]>([]);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [measures, setMeasures] = useState<Measure[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedMeasure, setSelectedMeasure] = useState<number | null>(null);
  
  // Use safe context values to prevent hydration mismatches
  const safeSelectedCategory = useSafeContextValue(selectedCategory);
  const safeSelectedMeasure = useSafeContextValue(selectedMeasure);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMetadata, setImportMetadata] = useState({
    name: '',
    description: '',
    dataSource: '',
    statisticName: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    stage: 'uploading' | 'processing' | 'validating' | 'complete' | 'error';
    message: string;
    current?: number;
    total?: number;
    percentage?: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [pastedData, setPastedData] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'paste'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const [validatingImports, setValidatingImports] = useState<Set<number>>(new Set());
  const [validationProgress, setValidationProgress] = useState<{[key: number]: {current: number, total: number}}>({});

  // Helper function to check if selected template is multi-year-export
  const isMultiYearExportTemplate = () => {
    if (!selectedTemplate) return false;
    const template = templates.find(t => t.id === selectedTemplate);
    return template?.type === 'multi-year-export';
  };

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
    fetchCategories();
  }, []);

  // Reset measure selection when category changes
  useEffect(() => {
    if (safeSelectedCategory) {
      fetchMeasures(safeSelectedCategory);
      setSelectedMeasure(null);
    } else {
      setMeasures([]);
      setSelectedMeasure(null);
    }
  }, [safeSelectedCategory]);

  // Poll validation progress for imports being validated
  useEffect(() => {
    if (validatingImports.size === 0) return;

    const pollProgress = async () => {
      for (const importId of validatingImports) {
        try {
          const response = await fetch(`/api/admin/csv-imports/${importId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              const importData = result.data;
              // If validation is complete, remove from validating set
              if (importData.status !== 'staged') {
                setValidatingImports(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(importId);
                  return newSet;
                });
                setValidationProgress(prev => {
                  const newProgress = { ...prev };
                  delete newProgress[importId];
                  return newProgress;
                });
                // Refresh history to get updated status
                fetchImportHistory();
              }
            }
          }
        } catch (error) {
          console.error('Error polling validation progress:', error);
        }
      }
    };

    const interval = setInterval(pollProgress, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [validatingImports]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/csv-templates');
      const result = await response.json();
      if (result.success && result.data) {
        setTemplates(result.data);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setTemplates([]);
    }
  };

  const fetchImportHistory = async () => {
    try {
      console.log('Fetching import history...');
      const response = await fetch('/api/admin/csv-imports');
      const result = await response.json();
      console.log('Import history response:', result);
      
      if (result.success && result.data) {
        console.log('Import history set:', result.data.length, 'items');
        // Add debugging for status values
        result.data.forEach((import_: ImportHistory) => {
          console.log(`Import ${import_.id} (${import_.name}): status = ${import_.status}`);
        });
        setImportHistory(result.data);
      } else {
        console.error('Failed to fetch import history:', result.error);
        setImportHistory([]); // Ensure we always have an array
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to fetch import history'
        });
      }
    } catch (error) {
      console.error('Error fetching import history:', error);
      setImportHistory([]); // Ensure we always have an array
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch import history'
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.success && result.data) {
        setCategories(result.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const fetchMeasures = async (categoryId: number) => {
    try {
      const response = await fetch(`/api/statistics?categoryId=${categoryId}`);
      const result = await response.json();
      if (result.success && result.data) {
        setMeasures(result.data);
      } else {
        setMeasures([]);
      }
    } catch (error) {
      console.error('Failed to fetch measures:', error);
      setMeasures([]);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    setUploadProgress({
      stage: 'uploading',
      message: 'Starting upload...',
      percentage: 0
    });
    
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
      
      // Get selected category and measure names
      const selectedCategoryName = categories.find(c => c.id === safeSelectedCategory)?.name || '';
      const selectedMeasureName = measures.find(m => m.id === safeSelectedMeasure)?.name || '';
      
      // Check if this is a Multi Year Export template
      const isMultiYearExport = isMultiYearExportTemplate();
      
      // Create enhanced metadata with category and measure info
      const enhancedMetadata = {
        ...importMetadata,
        categoryId: isMultiYearExport ? null : safeSelectedCategory,
        categoryName: isMultiYearExport ? null : selectedCategoryName,
        measureId: isMultiYearExport ? null : safeSelectedMeasure,
        measureName: isMultiYearExport ? null : selectedMeasureName
      };
      
      formData.append('metadata', JSON.stringify(enhancedMetadata));

      setUploadProgress({
        stage: 'uploading',
        message: 'Uploading file to server...',
        percentage: 25
      });

      // Simulate progress for large files
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev && prev.percentage && prev.percentage < 90) {
            return {
              ...prev,
              percentage: Math.min(prev.percentage + 5, 90)
            };
          }
          return prev;
        });
      }, 1000);

      const response = await fetch('/api/admin/csv-upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (response.ok) {
        const result = await response.json();
        console.log('Upload success response:', result);
        
        if (result.success === false) {
          // Handle case where API returns 200 but success is false
          setUploadProgress({
            stage: 'error',
            message: result.message || 'Upload failed',
            percentage: 100
          });
          return;
        }
        
        setUploadProgress({
          stage: 'complete',
          message: `Upload successful! ${result.stats?.validRows || 0} rows processed.`,
          percentage: 100
        });
        
        // Wait a moment for the database to be updated, then refresh history
        console.log('Scheduling history refresh in 500ms...');
        setTimeout(() => {
          console.log('Executing history refresh...');
          fetchImportHistory();
        }, 500);
      } else {
        const error = await response.json();
        
        // Build detailed error message
        let detailedMessage = error.message || 'Upload failed - unknown error';
        
        if (error.stats) {
          detailedMessage += `\n\n📊 Import Statistics:`;
          detailedMessage += `\n• Total rows: ${error.stats.totalRows}`;
          detailedMessage += `\n• Valid rows: ${error.stats.validRows}`;
          detailedMessage += `\n• Error rows: ${error.stats.errorRows}`;
        }
        
        if (error.summary && error.summary.failureBreakdown) {
          detailedMessage += `\n\n❌ Error Breakdown:`;
          Object.entries(error.summary.failureBreakdown).forEach(([category, count]) => {
            const categoryName = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            detailedMessage += `\n• ${categoryName}: ${count} errors`;
          });
        }
        
        if (error.error && error.error.type) {
          detailedMessage += `\n\n🔍 Error Type: ${error.error.type}`;
        }
        
        console.error('Upload failed with details:', error);
        
        setUploadProgress({
          stage: 'error',
          message: detailedMessage,
          percentage: 100
        });
        // Don't reset form on failure - keep all data for retry
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Upload failed due to a network error';
      if (error instanceof Error) {
        errorMessage = `Upload failed: ${error.message}`;
        if (error.message.includes('fetch')) {
          errorMessage = 'Upload failed: Network connection error. Please check your internet connection and try again.';
        }
      }
      
      setUploadProgress({
        stage: 'error',
        message: errorMessage,
        percentage: 100
      });
    } finally {
      setUploading(false);
    }
  };

  const handleValidate = async (importId: number) => {
    // Add to validating set
    setValidatingImports(prev => new Set(prev).add(importId));
    
    try {
      const response = await fetch(`/api/admin/csv-imports/${importId}/validate`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          addToast({
            type: 'success',
            title: 'Validation Successful',
            message: 'Import validated successfully!'
          });
        } else {
          addToast({
            type: 'error',
            title: 'Validation Failed',
            message: result.message || 'Validation failed'
          });
        }
        
        // Refresh history to get updated status
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
    } finally {
      // Remove from validating set
      setValidatingImports(prev => {
        const newSet = new Set(prev);
        newSet.delete(importId);
        return newSet;
      });
      
      // Clear progress for this import
      setValidationProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[importId];
        return newProgress;
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
        const result = await response.json();
        if (result.success && result.data) {
          const importData = result.data;
          addToast({
            type: 'info',
            title: 'Import Details',
            message: `Import ID: ${importId}, Status: ${importData.status || 'unknown'}`
          });
        } else {
          addToast({
            type: 'error',
            title: 'View Failed',
            message: 'Failed to load import details'
          });
        }
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
      const response = await fetch(`/api/admin/csv-imports/${importId}/details`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.import) {
          // Build detailed error information
          let errorDetails = `Import: ${data.import.name}\n`;
          errorDetails += `Status: ${data.import.status}\n`;
          errorDetails += `File: ${data.import.filename}\n`;
          errorDetails += `Uploaded: ${new Date(data.import.uploadedAt).toLocaleString()}\n\n`;
          
          if (data.logs && data.logs.length > 0) {
            errorDetails += `📋 Processing Logs:\n`;
            data.logs.forEach((log: any) => {
              const timestamp = new Date(log.createdAt).toLocaleTimeString();
              errorDetails += `[${timestamp}] ${log.level}: ${log.message}\n`;
            });
          }
          
          if (data.summary) {
            errorDetails += `\n📊 Summary:\n`;
            errorDetails += `• Total rows: ${data.summary.totalRows || 0}\n`;
            errorDetails += `• Valid rows: ${data.summary.validRows || 0}\n`;
            errorDetails += `• Error rows: ${data.summary.errorRows || 0}\n`;
            
            if (data.summary.failureBreakdown) {
              errorDetails += `\n❌ Error Breakdown:\n`;
              Object.entries(data.summary.failureBreakdown).forEach(([category, count]) => {
                const categoryName = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                errorDetails += `• ${categoryName}: ${count} errors\n`;
              });
            }
          }
          
          // Show details in a modal or alert
          const title = data.import.status === 'failed' ? 'Error Details' : 'Import Details';
          alert(`${title} for Import ${importId}:\n\n${errorDetails}`);
        } else {
          addToast({
            type: 'error',
            title: 'Error Details Failed',
            message: 'Failed to load import details'
          });
        }
      } else {
        const errorData = await response.json();
        addToast({
          type: 'error',
          title: 'Error Details Failed',
          message: errorData.message || 'Failed to load error details'
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
      case 'imported':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'importing':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'error':
      case 'failed':
      case 'validation_failed':
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
      error: 'destructive',
      failed: 'destructive',
      validation_failed: 'destructive',
      imported: 'default',
      importing: 'secondary'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                      {templates && templates.map((template) => (
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
                              {template.templateSchema?.flexibleColumns && (
                                <p className="text-xs text-blue-600 mt-2">
                                  💡 This template supports additional columns beyond the required ones.
                                </p>
                              )}
                              {template.templateSchema?.multiYearSupport && (
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

                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Category
                    </label>
                    <select
                      value={safeSelectedCategory || ''}
                      onChange={(e) => setSelectedCategory(Number(e.target.value) || null)}
                      disabled={isMultiYearExportTemplate()}
                      className={`w-full p-2 border border-gray-300 rounded-md ${isMultiYearExportTemplate() ? 'bg-gray-100 text-gray-500' : ''}`}
                    >
                      <option value="">Choose a category...</option>
                      {categories && categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {isMultiYearExportTemplate() && (
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Category is determined from your CSV data for Multi Year Export format
                      </p>
                    )}
                  </div>

                  {/* Measure Selection */}
                  {safeSelectedCategory && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Measure
                      </label>
                      <select
                        value={safeSelectedMeasure || ''}
                        onChange={(e) => setSelectedMeasure(Number(e.target.value) || null)}
                        disabled={isMultiYearExportTemplate()}
                        className={`w-full p-2 border border-gray-300 rounded-md ${isMultiYearExportTemplate() ? 'bg-gray-100 text-gray-500' : ''}`}
                      >
                        <option value="">Choose a measure...</option>
                        {measures && measures.map((measure) => (
                          <option key={measure.id} value={measure.id}>
                            {measure.name}
                          </option>
                        ))}
                      </select>
                      {isMultiYearExportTemplate() && (
                        <p className="text-xs text-gray-500 mt-1">
                          💡 Measure is determined from your CSV data for Multi Year Export format
                        </p>
                      )}
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
                        ref={fileInputRef}
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

                  {/* Progress Indicator */}
                  {uploadProgress && (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {uploadProgress.stage === 'uploading' && '📤 Uploading...'}
                          {uploadProgress.stage === 'processing' && '⚙️ Processing...'}
                          {uploadProgress.stage === 'validating' && '✅ Validating...'}
                          {uploadProgress.stage === 'complete' && '🎉 Complete!'}
                          {uploadProgress.stage === 'error' && '❌ Error'}
                        </span>
                        {uploadProgress.percentage !== undefined && (
                          <span className="text-sm text-gray-500">
                            {uploadProgress.percentage}%
                          </span>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            uploadProgress.stage === 'error' ? 'bg-red-500' :
                            uploadProgress.stage === 'complete' ? 'bg-green-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${uploadProgress.percentage || 0}%` }}
                        />
                      </div>
                      
                      {/* Status Message */}
                      <div className="text-sm text-gray-600 whitespace-pre-line">
                        {uploadProgress.message}
                      </div>
                      
                      {/* Action Buttons */}
                      {uploadProgress.stage === 'complete' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setUploadProgress(null);
                              setSelectedFile(null);
                              clearFileInput();
                              setSelectedTemplate(null);
                              setSelectedCategory(null);
                              setSelectedMeasure(null);
                              setPastedData('');
                              setImportMetadata({
                                name: '',
                                description: '',
                                dataSource: '',
                                statisticName: ''
                              });
                            }}
                            className="flex-1"
                          >
                            Upload Another File
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setUploadProgress(null)}
                            className="flex-1"
                          >
                            Close
                          </Button>
                        </div>
                      )}
                      
                      {uploadProgress.stage === 'error' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setUploadProgress(null)}
                            className="flex-1"
                          >
                            Try Again
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setUploadProgress(null)}
                            className="flex-1"
                          >
                            Close
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload Button */}
                  {!uploadProgress && (
                    <Button
                      onClick={handleUpload}
                      disabled={
                        !selectedTemplate || 
                        (selectedTemplate && templates.find(t => t.id === selectedTemplate)?.type !== 'multi-year-export' && !safeSelectedCategory) ||
                        (selectedTemplate && templates.find(t => t.id === selectedTemplate)?.type !== 'multi-year-export' && !safeSelectedMeasure) ||
                        uploading || 
                        (uploadMethod === 'file' && !selectedFile) ||
                        (uploadMethod === 'paste' && !pastedData.trim())
                      }
                      className="w-full"
                    >
                      {uploading ? 'Uploading...' : `Upload ${uploadMethod === 'file' ? 'File' : 'Data'}`}
                    </Button>
                  )}
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
                  {importHistory && importHistory.map((import_) => (
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
                            {import_.duplicateOf && import_.originalImportName && (
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  <Copy className="h-3 w-3 mr-1" />
                                  Duplicate of "{import_.originalImportName}"
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(import_.status)}
                          {validatingImports.has(import_.id) && validationProgress[import_.id] && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4 animate-spin" />
                              <span>
                                Validating row {validationProgress[import_.id].current}/{validationProgress[import_.id].total}
                              </span>
                            </div>
                          )}
                          <div className="flex gap-1">
                            {import_.status === 'staged' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleValidate(import_.id)}
                                disabled={validatingImports.has(import_.id)}
                              >
                                {validatingImports.has(import_.id) ? (
                                  <>
                                    <Clock className="h-4 w-4 mr-1 animate-spin" />
                                    Validating...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Validate
                                  </>
                                )}
                              </Button>
                            )}
                            {import_.status === 'validated' && (
                              <Button 
                                size="sm" 
                                onClick={() => handlePublish(import_.id)}
                                disabled={validatingImports.has(import_.id)}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Publish
                              </Button>
                            )}
                            {import_.status === 'failed' && (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleViewErrorDetails(import_.id)}
                                disabled={validatingImports.has(import_.id)}
                              >
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Error Details
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleViewImport(import_.id)}
                              disabled={validatingImports.has(import_.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleViewErrorDetails(import_.id)}
                              disabled={validatingImports.has(import_.id)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Details
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
                  {templates && templates.map((template) => (
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
                              {template.templateSchema?.expectedHeaders?.join(', ') || 'No headers defined'}
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
                  {errorDetails.errors && errorDetails.errors.map((error, index) => (
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
                  {errorDetails.warnings && errorDetails.warnings.map((warning, index) => (
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