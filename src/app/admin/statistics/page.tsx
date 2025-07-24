'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  RefreshCw, 
  Search,
  Filter,
  Edit,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Statistic {
  id: number;
  raNumber: string;
  name: string;
  description: string;
  unit: string;
  dataQuality: 'mock' | 'real';
  provenance: string | null;
  category: { name: string };
  dataSource: { name: string } | null;
  isActive: boolean;
}

interface EditModalProps {
  statistic: Statistic | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (statistic: Statistic) => void;
}

function EditModal({ statistic, isOpen, onClose, onSave }: EditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: '',
    dataQuality: 'mock' as 'mock' | 'real',
    provenance: ''
  });

  useEffect(() => {
    if (statistic) {
      setFormData({
        name: statistic.name,
        description: statistic.description || '',
        unit: statistic.unit,
        dataQuality: statistic.dataQuality,
        provenance: statistic.provenance || ''
      });
    }
  }, [statistic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statistic) return;

    try {
      const response = await fetch(`/api/admin/statistics/${statistic.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        onSave(data.statistic);
        onClose();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating statistic:', error);
      alert('Failed to update statistic');
    }
  };

  if (!isOpen || !statistic) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Edit Statistic</h2>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Quality
            </label>
            <select
              value={formData.dataQuality}
              onChange={(e) => setFormData({ ...formData, dataQuality: e.target.value as 'mock' | 'real' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="mock">Mock Data</option>
              <option value="real">Real Data</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provenance
            </label>
            <textarea
              value={formData.provenance}
              onChange={(e) => setFormData({ ...formData, provenance: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Describe the data source, methodology, and any relevant details about how this data was collected and processed..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StatisticsManagement() {
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedQuality, setSelectedQuality] = useState('all');
  const [editModal, setEditModal] = useState<{ isOpen: boolean; statistic: Statistic | null }>({
    isOpen: false,
    statistic: null
  });

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/statistics');
      const data = await response.json();
      setStatistics(data.statistics || []);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const filteredStatistics = statistics.filter(stat => {
    const matchesSearch = stat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stat.raNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || stat.category.name === selectedCategory;
    const matchesQuality = selectedQuality === 'all' || stat.dataQuality === selectedQuality;
    
    return matchesSearch && matchesCategory && matchesQuality;
  });

  const categories = [...new Set(statistics.map(stat => stat.category.name))];

  const getQualityBadge = (quality: string) => {
    if (quality === 'real') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Real Data</Badge>;
    } else {
      return <Badge variant="secondary">Mock Data</Badge>;
    }
  };

  const getQualityIcon = (quality: string) => {
    if (quality === 'real') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading statistics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistics Management</h1>
          <p className="text-gray-600 mt-2">Manage statistics and data quality indicators</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search statistics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Quality
              </label>
              <select
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Data</option>
                <option value="real">Real Data</option>
                <option value="mock">Mock Data</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedQuality('all');
                }}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
          <CardDescription>
            {filteredStatistics.length} statistics found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statistic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Quality
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStatistics.map((stat) => (
                  <tr key={stat.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {stat.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {stat.raNumber}
                        </div>
                        {stat.description && (
                          <div className="text-xs text-gray-400 mt-1">
                            {stat.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary">
                        {stat.category.name}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getQualityIcon(stat.dataQuality)}
                        {getQualityBadge(stat.dataQuality)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setEditModal({ isOpen: true, statistic: stat })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {stat.provenance && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => alert(`Provenance: ${stat.provenance}`)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EditModal
        statistic={editModal.statistic}
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, statistic: null })}
        onSave={(updatedStatistic) => {
          setStatistics(prev => prev.map(stat => 
            stat.id === updatedStatistic.id ? updatedStatistic : stat
          ));
        }}
      />
    </div>
  );
} 